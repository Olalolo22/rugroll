use anchor_lang::prelude::*;
use crate::state::{GameRound, PlayerPosition, RoundStatus};
use crate::error::RugRollError;

/// A player joins an open round by depositing SOL.
/// This runs inside the Ephemeral Rollup — the transaction is sent to the ER RPC.
#[derive(Accounts)]
#[instruction(round_id: u64)]
pub struct JoinRound<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    #[account(
        mut,
        seeds = [b"round", round_id.to_le_bytes().as_ref()],
        bump = game_round.bump,
        constraint = game_round.status == RoundStatus::Waiting @ RugRollError::RoundNotWaiting,
        constraint = game_round.player_count < game_round.max_players @ RugRollError::RoundFull,
    )]
    pub game_round: Account<'info, GameRound>,

    #[account(
        init,
        payer = player,
        space = PlayerPosition::SPACE,
        seeds = [b"position", round_id.to_le_bytes().as_ref(), player.key().as_ref()],
        bump,
    )]
    pub player_position: Account<'info, PlayerPosition>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<JoinRound>, round_id: u64, deposit_lamports: u64) -> Result<()> {
    require!(
        deposit_lamports >= GameRound::MIN_DEPOSIT_LAMPORTS,
        RugRollError::DepositTooSmall
    );

    // Transfer lamports from player → game_round pot (SOL, not SPL).
    // The game_round account acts as the escrow vault.
    let cpi_ctx = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.player.to_account_info(),
            to: ctx.accounts.game_round.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_ctx, deposit_lamports)?;

    let round = &mut ctx.accounts.game_round;
    round.total_pot += deposit_lamports;
    round.player_count += 1;

    let pos = &mut ctx.accounts.player_position;
    pos.round_id = round_id;
    pos.player = ctx.accounts.player.key();
    pos.deposit_lamports = deposit_lamports;
    pos.bail_multiplier_bps = 0; // 0 = still in
    pos.claimed = false;
    pos.bump = ctx.bumps.player_position;

    // Auto-start the round once minimum players have joined.
    if round.player_count >= GameRound::MIN_PLAYERS && round.status == RoundStatus::Waiting {
        round.status = RoundStatus::Live;
        round.start_slot = Clock::get()?.slot;
        emit!(RoundStarted {
            round_id,
            start_slot: round.start_slot,
            total_pot: round.total_pot,
        });
    }

    emit!(PlayerJoined {
        round_id,
        player: ctx.accounts.player.key(),
        deposit_lamports,
        player_count: round.player_count,
    });

    msg!(
        "Player {} joined round {} with {} lamports",
        ctx.accounts.player.key(),
        round_id,
        deposit_lamports
    );
    Ok(())
}

#[event]
pub struct PlayerJoined {
    pub round_id: u64,
    pub player: Pubkey,
    pub deposit_lamports: u64,
    pub player_count: u8,
}

#[event]
pub struct RoundStarted {
    pub round_id: u64,
    pub start_slot: u64,
    pub total_pot: u64,
}
