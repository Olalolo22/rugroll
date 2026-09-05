use anchor_lang::prelude::*;
use crate::state::{GameRound, PlayerPosition, RoundStatus};
use crate::error::RugRollError;

/// A player claims their payout after the round is Settled.
///
/// Payout logic:
/// - If player bailed out BEFORE the crash point → they receive:
///     deposit * (bail_multiplier_bps / 10000) * (1 - house_edge)
///   The house_edge is already baked into the crash distribution, so we
///   pay out 100% of the player's proportional share.
/// - If player did NOT bail out (bail_multiplier_bps == 0) → they lost;
///   their deposit stays in the pot (claimed by the house via `sweep_house`).
///
/// Winner payout formula:
///   payout = floor(deposit_lamports * bail_multiplier_bps / 10000)
///   (capped at the total remaining pot so we never overpay)
#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct ClaimWinnings<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [b"round", round_id.to_le_bytes().as_ref()],
        bump = game_round.bump,
        constraint = game_round.status == RoundStatus::Settled @ RugRollError::RoundNotSettled,
    )]
    pub game_round: Account<'info, GameRound>,

    #[account(
        mut,
        seeds = [b"position", round_id.to_le_bytes().as_ref(), player.key().as_ref()],
        bump = player_position.bump,
        constraint = player_position.player == player.key() @ RugRollError::InvalidPlayer,
        constraint = !player_position.claimed @ RugRollError::AlreadyClaimed,
        // Must have bailed out before the crash to be eligible for payout.
        constraint = player_position.bail_multiplier_bps > 0
            && player_position.bail_multiplier_bps < game_round.crash_point_bps
            @ RugRollError::NotAWinner,
    )]
    pub player_position: Account<'info, PlayerPosition>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ClaimWinnings>, round_id: u64) -> Result<()> {
    let round = &mut ctx.accounts.game_round;
    let pos = &mut ctx.accounts.player_position;

    // Calculate payout: deposit × multiplier.
    let payout = pos
        .deposit_lamports
        .checked_mul(pos.bail_multiplier_bps)
        .unwrap()
        .checked_div(10_000)
        .unwrap();

    // Cap payout at the pot balance (safety guard).
    let available = round.total_pot;
    let actual_payout = payout.min(available);

    round.total_pot = round.total_pot.saturating_sub(actual_payout);
    pos.claimed = true;

    // Transfer lamports from the game_round vault → player.
    // We do a raw lamport transfer since game_round is the vault (not a token account).
    **round.to_account_info().try_borrow_mut_lamports()? -= actual_payout;
    **ctx.accounts.player.to_account_info().try_borrow_mut_lamports()? += actual_payout;

    emit!(WinningsClaimed {
        round_id,
        player: ctx.accounts.player.key(),
        payout_lamports: actual_payout,
        bail_multiplier_bps: pos.bail_multiplier_bps,
    });

    msg!(
        "Player {} claimed {} lamports from round {} ({}bps)",
        ctx.accounts.player.key(),
        actual_payout,
        round_id,
        pos.bail_multiplier_bps
    );
    Ok(())
}

#[event]
pub struct WinningsClaimed {
    pub round_id: u64,
    pub player: Pubkey,
    pub payout_lamports: u64,
    pub bail_multiplier_bps: u64,
}
