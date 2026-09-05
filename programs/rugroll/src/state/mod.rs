use anchor_lang::prelude::*;

/// Status of a game round.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum RoundStatus {
    /// Waiting for the minimum number of players to deposit.
    Waiting,
    /// Round is live — multiplier is climbing in the Ephemeral Rollup.
    /// `start_slot` marks the ER slot when the round was activated.
    Live,
    /// VRF has been requested; waiting for the callback with the crash point.
    Resolving,
    /// Round is over; all payouts have been settled.
    Settled,
}

/// Central game state, delegated to the Ephemeral Rollup for the duration of a round.
/// One `GameRound` PDA per round (keyed by `round_id`).
#[account]
#[derive(Debug)]
pub struct GameRound {
    /// Monotonically increasing round identifier.
    pub round_id: u64,
    /// Total lamports deposited into the pot.
    pub total_pot: u64,
    /// Crash point in basis points (e.g. 185 = 1.85×).
    /// Hidden until the round is Settled; stored on-chain for trustlessness.
    /// Populated by the VRF callback.
    pub crash_point_bps: u64,
    /// Current round status.
    pub status: RoundStatus,
    /// Slot (ER time) when the round went Live; used to compute the on-chain multiplier.
    pub start_slot: u64,
    /// Number of players who have joined.
    pub player_count: u8,
    /// Maximum players allowed per round.
    pub max_players: u8,
    /// The VRF request nonce — lets us match the callback to this round.
    pub vrf_request_nonce: u64,
    /// Authority that opened the round (operator / house).
    pub authority: Pubkey,
    /// Bump for the PDA.
    pub bump: u8,
}

impl GameRound {
    pub const MAX_PLAYERS: u8 = 10;
    pub const MIN_PLAYERS: u8 = 2;
    /// Minimum crash point: 1.01× (101 bps). Game can never rug below this.
    pub const MIN_CRASH_BPS: u64 = 101;
    /// Maximum crash point: 100× (10000 bps).
    pub const MAX_CRASH_BPS: u64 = 10_000;
    /// House edge: 3% of the pot, taken on settlement.
    pub const HOUSE_EDGE_BPS: u64 = 300;
    /// Minimum deposit: 0.01 SOL in lamports.
    pub const MIN_DEPOSIT_LAMPORTS: u64 = 10_000_000;

    pub const SPACE: usize = 8   // discriminator
        + 8                       // round_id
        + 8                       // total_pot
        + 8                       // crash_point_bps
        + 1                       // status (enum tag)
        + 8                       // start_slot
        + 1                       // player_count
        + 1                       // max_players
        + 8                       // vrf_request_nonce
        + 32                      // authority
        + 1;                      // bump
}

/// Per-player position in a round. One PDA per (round_id, player).
#[account]
#[derive(Debug)]
pub struct PlayerPosition {
    /// The round this position belongs to.
    pub round_id: u64,
    /// The player's wallet address.
    pub player: Pubkey,
    /// Lamports deposited by this player.
    pub deposit_lamports: u64,
    /// The multiplier (in bps) at which the player bailed out.
    /// 0 means the player has NOT yet bailed out (or crashed).
    pub bail_multiplier_bps: u64,
    /// Whether the player has already claimed their payout.
    pub claimed: bool,
    /// Bump for the PDA.
    pub bump: u8,
}

impl PlayerPosition {
    pub const SPACE: usize = 8   // discriminator
        + 8                       // round_id
        + 32                      // player
        + 8                       // deposit_lamports
        + 8                       // bail_multiplier_bps
        + 1                       // claimed
        + 1;                      // bump
}
