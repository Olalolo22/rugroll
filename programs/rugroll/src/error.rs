use anchor_lang::prelude::*;

#[error_code]
pub enum RugRollError {
    #[msg("Round is not in Waiting status")]
    RoundNotWaiting,
    #[msg("Round is not in Live status")]
    RoundNotLive,
    #[msg("Round is not in Resolving status")]
    RoundNotResolving,
    #[msg("Round is not in Settled status")]
    RoundNotSettled,
    #[msg("Round is already full")]
    RoundFull,
    #[msg("Deposit amount is below the minimum")]
    DepositTooSmall,
    #[msg("This player has already bailed out")]
    AlreadyBailedOut,
    #[msg("The round has already crashed past your bail-out time")]
    RoundAlreadyCrashed,
    #[msg("Player account does not match the signer")]
    InvalidPlayer,
    #[msg("Winnings have already been claimed")]
    AlreadyClaimed,
    #[msg("Player did not bail out before the crash")]
    NotAWinner,
    #[msg("Caller is not the round authority")]
    Unauthorized,
    #[msg("Arithmetic overflow")]
    Overflow,
}
