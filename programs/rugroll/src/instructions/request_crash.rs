use anchor_lang::prelude::*;
use ephemeral_vrf_sdk::prelude::*;
use crate::state::{GameRound, RoundStatus};
use crate::error::RugRollError;

/// The authority (operator) requests a VRF random value to determine the crash point.
/// This is called once the round is Live (either automatically after N seconds,
/// or manually by the house). The VRF oracle will call back into `resolve_crash`.
///
/// VRF flow: request → oracle fulfills → callback to `resolve_crash::handler`.
#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct RequestCrash<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"round", round_id.to_le_bytes().as_ref()],
        bump = game_round.bump,
        constraint = game_round.authority == authority.key() @ RugRollError::Unauthorized,
        constraint = game_round.status == RoundStatus::Live @ RugRollError::RoundNotLive,
    )]
    pub game_round: Account<'info, GameRound>,

    /// CHECK: MagicBlock VRF program account (verified by SDK).
    pub vrf_program: UncheckedAccount<'info>,

    /// CHECK: VRF request account created by SDK CPI.
    #[account(mut)]
    pub vrf_request: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<RequestCrash>, round_id: u64) -> Result<()> {
    let round = &mut ctx.accounts.game_round;
    round.status = RoundStatus::Resolving;

    // Build the VRF callback: when the oracle fulfills, it will call
    // our program's `resolve_crash` instruction with the random bytes.
    let callback_discriminator = crate::instruction::ResolveCrash::DISCRIMINATOR;

    let nonce = round.vrf_request_nonce;
    round.vrf_request_nonce = nonce.wrapping_add(1);

    // CPI to MagicBlock VRF program to queue the randomness request.
    create_request_randomness_ix(
        &ctx.accounts.authority,
        &ctx.accounts.vrf_request,
        &ctx.accounts.vrf_program,
        &ctx.accounts.system_program,
        &ctx.program_id,
        callback_discriminator,
        // Pass round_id as extra data so the callback knows which round to settle.
        &round_id.to_le_bytes(),
        nonce,
    )?;

    emit!(CrashRequested {
        round_id,
        vrf_nonce: nonce,
    });

    msg!("VRF crash point requested for round {}", round_id);
    Ok(())
}

#[event]
pub struct CrashRequested {
    pub round_id: u64,
    pub vrf_nonce: u64,
}
