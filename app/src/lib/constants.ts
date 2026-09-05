import { Connection, PublicKey } from "@solana/web3.js";
import { EphemeralConnection } from "@magicblock-labs/ephemeral-web3.js";

// ─── Endpoints ────────────────────────────────────────────────────────────────
export const L1_RPC = "https://api.devnet.solana.com";
export const ER_RPC = "https://devnet.magicblock.app"; // MagicBlock Ephemeral Rollup RPC

// ─── Program IDs ──────────────────────────────────────────────────────────────
export const RUGROLL_PROGRAM_ID = new PublicKey(
  "RugR11ABC123xyzPLACEHOLDER111111111111111111"
);

// ─── Connections ──────────────────────────────────────────────────────────────
/** Standard Solana devnet connection for L1 instructions (open_round, claim_winnings). */
export const l1Connection = new Connection(L1_RPC, "confirmed");

/** MagicBlock Ephemeral Rollup connection for high-speed in-round actions. */
export const erConnection = new EphemeralConnection(ER_RPC);

// ─── PDA Helpers ──────────────────────────────────────────────────────────────
export function getRoundPDA(roundId: bigint): [PublicKey, number] {
  const roundIdBuf = Buffer.allocUnsafe(8);
  roundIdBuf.writeBigUInt64LE(roundId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("round"), roundIdBuf],
    RUGROLL_PROGRAM_ID
  );
}

export function getPositionPDA(
  roundId: bigint,
  player: PublicKey
): [PublicKey, number] {
  const roundIdBuf = Buffer.allocUnsafe(8);
  roundIdBuf.writeBigUInt64LE(roundId);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), roundIdBuf, player.toBuffer()],
    RUGROLL_PROGRAM_ID
  );
}

// ─── Multiplier Math ──────────────────────────────────────────────────────────
/** Mirror of the on-chain current_multiplier_bps function. */
export function currentMultiplierBps(startSlot: number, currentSlot: number): number {
  const elapsed = Math.max(0, currentSlot - startSlot);
  return Math.min(10_000 + elapsed * 2, 10_000);
}

export function bpsToMultiplier(bps: number): string {
  return (bps / 100).toFixed(2) + "×";
}

export function lamportsToSol(lamports: number): string {
  return (lamports / 1e9).toFixed(4);
}
