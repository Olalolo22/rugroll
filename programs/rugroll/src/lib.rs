use anchor_lang::prelude::*;

pub mod error;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("DSfJQMFV36ib2Kd4c9bSkV9M9ZWmhhVCjTb7hhtACwyS");

#[program]
pub mod rugroll {
    use super::*;

    /// Open a new game round and delegate it to the Ephemeral Rollup.
    /// Call this on L1 (standard Solana RPC).
    pub fn open_round(ctx: Context<OpenRound>, round_id: u64) -> Result<()> {
        open_round::handler(ctx, round_id)
    }

    /// Player deposits SOL to join the round and registers an ephemeral session key.
    /// Call this on the ER RPC (fast, gasless).
    pub fn join_round(
        ctx: Context<JoinRound>,
        round_id: u64,
        deposit_lamports: u64,
        session_key: Pubkey,
    ) -> Result<()> {
        join_round::handler(ctx, round_id, deposit_lamports, session_key)
    }

    /// Player bails out, locking their multiplier.
    /// Call this on the ER RPC. Ideally signed with a session key (no wallet popup).
    pub fn bail_out(ctx: Context<BailOut>, round_id: u64) -> Result<()> {
        bail_out::handler(ctx, round_id)
    }

    /// Operator requests VRF randomness to determine crash point.
    /// Call this on the ER RPC.
    pub fn request_crash(ctx: Context<RequestCrash>, round_id: u64) -> Result<()> {
        request_crash::handler(ctx, round_id)
    }

    /// VRF oracle callback — sets the crash point and settles the round.
    /// Called automatically by the MagicBlock VRF oracle (not user-facing).
    pub fn resolve_crash(
        ctx: Context<ResolveCrash>,
        round_id: u64,
        random_bytes: [u8; 32],
    ) -> Result<()> {
        resolve_crash::handler(ctx, round_id, random_bytes)
    }

    /// Player claims their winnings after the round is settled.
    /// Call this on L1 after the ER has committed back to Solana.
    pub fn claim_winnings(ctx: Context<ClaimWinnings>, round_id: u64) -> Result<()> {
        claim_winnings::handler(ctx, round_id)
    }
}
