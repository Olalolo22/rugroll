use anchor_lang::prelude::*;
use crate::state::{GameRound, PlayerPosition, RoundStatus};
use crate::error::RugRollError;

/// Multiplier growth function: returns the current multiplier in basis points
/// given the number of ER slots elapsed since round start.
///
/// Formula: M(t) = 100 * e^(k*t) in bps, where k=0.00005 per slot.
/// At 10ms/slot: after 10s (1000 slots) ≈ 1.05×, after 60s ≈ 1.35×, after 5min ≈ 4.5×.
///
/// We use an integer approximation of e^x via the Taylor series:
///   e^x ≈ 1 + x + x²/2! (sufficient for small x per step).
/// For hackathon purposes we use a simpler linear-exponential blend:
///   M_bps(slots) = 100 + slots * 5 / 100   (capped at MAX_CRASH_BPS)
/// This gives ~1.05× at 100 slots, ~2.0× at 2000 slots, which matches the
/// feel of Bustabit/Roobet without requiring floating-point on-chain.
pub fn current_multiplier_bps(start_slot: u64, current_slot: u64) -> u64 {
    let elapsed = current_slot.saturating_sub(start_slot);
    // Exponential approximation: M = 100 * 1.0002^elapsed (bps ×100)
    // In integer: 10000 + elapsed * 2, capped at 10000 bps (100×).
    let m = 10_000u64.saturating_add(elapsed.saturating_mul(2));
    m.min(GameRound::MAX_CRASH_BPS)
}

/// A player bails out of an active round, locking in their current multiplier.
/// Runs inside the Ephemeral Rollup at 10ms sub-block speed.
/// Because this is triggered by a session key, no wallet popup is required.
#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct BailOut<'info> {
    /// The player (or their delegated session key signer).
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [b"round", round_id.to_le_bytes().as_ref()],
        bump = game_round.bump,
        constraint = game_round.status == RoundStatus::Live @ RugRollError::RoundNotLive,
    )]
    pub game_round: Account<'info, GameRound>,

    #[account(
        mut,
        seeds = [b"position", round_id.to_le_bytes().as_ref(), player.key().as_ref()],
        bump = player_position.bump,
        constraint = player_position.player == player.key() @ RugRollError::InvalidPlayer,
        constraint = player_position.bail_multiplier_bps == 0 @ RugRollError::AlreadyBailedOut,
    )]
    pub player_position: Account<'info, PlayerPosition>,
}

pub fn handler(ctx: Context<BailOut>, round_id: u64) -> Result<()> {
    let clock = Clock::get()?;
    let round = &ctx.accounts.game_round;

    // Compute the multiplier at the EXACT ER slot of this transaction.
    let multiplier_bps = current_multiplier_bps(round.start_slot, clock.slot);

    // Ensure multiplier hasn't already passed the hidden crash point.
    // (The crash point is set by VRF; if a bail-out arrives at a slot
    // past the crash, it is rejected so the player is treated as crashed.)
    if round.crash_point_bps > 0 && multiplier_bps >= round.crash_point_bps {
        return err!(RugRollError::RoundAlreadyCrashed);
    }

    let pos = &mut ctx.accounts.player_position;
    pos.bail_multiplier_bps = multiplier_bps;

    emit!(PlayerBailedOut {
        round_id,
        player: ctx.accounts.player.key(),
        multiplier_bps,
        slot: clock.slot,
    });

    msg!(
        "Player {} bailed out of round {} at {}bps multiplier",
        ctx.accounts.player.key(),
        round_id,
        multiplier_bps
    );
    Ok(())
}

#[event]
pub struct PlayerBailedOut {
    pub round_id: u64,
    pub player: Pubkey,
    pub multiplier_bps: u64,
    pub slot: u64,
}
