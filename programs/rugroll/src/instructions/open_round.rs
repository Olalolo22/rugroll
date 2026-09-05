use anchor_lang::prelude::*;
use ephemeral_rollups_sdk::prelude::*;
use crate::state::{GameRound, RoundStatus};
use crate::error::RugRollError;

/// Opens a new round. The GameRound PDA is created on L1, then immediately
/// delegated to the Ephemeral Rollup so all subsequent voucher traffic
/// (deposits, bail-outs) happens at 10ms sub-block speed.
#[derive(Accounts)]
#[instruction(round_id: u64)]
#[delegate]
pub struct OpenRound<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = GameRound::SPACE,
        seeds = [b"round", round_id.to_le_bytes().as_ref()],
        bump,
    )]
    /// CHECK: delegated below via CPI to ephemeral-rollups-sdk
    #[account(mut, del)]
    pub game_round: Account<'info, GameRound>,

    pub system_program: Program<'info, System>,
    /// CHECK: required by ephemeral-rollups-sdk delegation CPI
    pub delegation_program: UncheckedAccount<'info>,
}

pub fn handler(ctx: Context<OpenRound>, round_id: u64) -> Result<()> {
    let round = &mut ctx.accounts.game_round;
    round.round_id = round_id;
    round.total_pot = 0;
    round.crash_point_bps = 0; // revealed only after Resolving → Settled
    round.status = RoundStatus::Waiting;
    round.start_slot = 0;
    round.player_count = 0;
    round.max_players = GameRound::MAX_PLAYERS;
    round.vrf_request_nonce = 0;
    round.authority = ctx.accounts.authority.key();
    round.bump = ctx.bumps.game_round;

    // Delegate the account to the MagicBlock Ephemeral Rollup.
    // After this CPI, the ER validator owns the account for write-access;
    // all transactions targeting `game_round` must be sent to the ER RPC.
    ctx.accounts.delegate_game_round(
        &ctx.accounts.authority,
        &[b"round", round_id.to_le_bytes().as_ref()],
        DelegateConfig::default(),
    )?;

    emit!(RoundOpened {
        round_id,
        authority: ctx.accounts.authority.key(),
    });

    msg!("Round {} opened and delegated to ER", round_id);
    Ok(())
}

#[event]
pub struct RoundOpened {
    pub round_id: u64,
    pub authority: Pubkey,
}
