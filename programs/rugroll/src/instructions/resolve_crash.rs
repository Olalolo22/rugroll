use anchor_lang::prelude::*;
use crate::state::{GameRound, RoundStatus};
use crate::error::RugRollError;
use crate::instructions::bail_out::current_multiplier_bps;

/// VRF callback: called by the MagicBlock oracle once it has fulfilled the
/// randomness request. Receives raw random bytes, derives the crash point,
/// and transitions the round to Settled.
///
/// The crash point is derived from the VRF output using a house-edge formula:
///   crash_bps = MAX_CRASH_BPS * (1 - HOUSE_EDGE%) / uniform_random
/// This gives a distribution where:
///   - P(crash > x) = (1 - house_edge) / x
///   - Expected value for players = 1 - house_edge (e.g. 0.97 for 3% edge)
#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct ResolveCrash<'info> {
    /// CHECK: VRF oracle signer, verified by ephemeral-vrf-sdk.
    pub vrf_oracle: Signer<'info>,

    #[account(
        mut,
        seeds = [b"round", round_id.to_le_bytes().as_ref()],
        bump = game_round.bump,
        constraint = game_round.status == RoundStatus::Resolving @ RugRollError::RoundNotResolving,
    )]
    pub game_round: Account<'info, GameRound>,
}

pub fn handler(ctx: Context<ResolveCrash>, round_id: u64, random_bytes: [u8; 32]) -> Result<()> {
    let round = &mut ctx.accounts.game_round;

    // Derive crash point from VRF bytes.
    // Use first 8 bytes as a u64, map to [0, 1) then apply the house formula.
    let raw = u64::from_le_bytes(random_bytes[..8].try_into().unwrap());

    // uniform_fraction ∈ [1, 2^64) normalized to (0, 1]
    // crash_bps = floor( (10000 * 97) / (raw % 10000 + 1) )
    // Ensures minimum crash at MIN_CRASH_BPS and house edge of ~3%.
    let modulo = (raw % 10_000) + 1; // 1..=10000
    let crash_point_bps = ((10_000u64 * (10_000 - GameRound::HOUSE_EDGE_BPS)) / modulo)
        .clamp(GameRound::MIN_CRASH_BPS, GameRound::MAX_CRASH_BPS);

    round.crash_point_bps = crash_point_bps;
    round.status = RoundStatus::Settled;

    // Record the crash slot so the frontend can reconstruct exactly when it happened.
    let crash_slot = round.start_slot + (crash_point_bps - 10_000) / 2;

    emit!(RoundCrashed {
        round_id,
        crash_point_bps,
        crash_slot,
        total_pot: round.total_pot,
    });

    msg!(
        "Round {} crashed at {}bps ({:.2}x). Pot: {} lamports.",
        round_id,
        crash_point_bps,
        crash_point_bps as f64 / 100.0,
        round.total_pot
    );
    Ok(())
}

#[event]
pub struct RoundCrashed {
    pub round_id: u64,
    pub crash_point_bps: u64,
    pub crash_slot: u64,
    pub total_pot: u64,
}
