import { Connection, PublicKey } from "@solana/web3.js";

// ─── Endpoints ────────────────────────────────────────────────────────────────
export const L1_RPC = "https://api.devnet.solana.com";
/**
 * MagicBlock Ephemeral Rollup RPC.
 * The ER node speaks standard Solana JSON-RPC, so @solana/web3.js Connection
 * works directly — no special client needed for now.
 */
export const ER_RPC = "https://devnet.magicblock.app";


// ─── Program IDs ──────────────────────────────────────────────────────────────
export const RUGROLL_PROGRAM_ID = new PublicKey(
  "RugR11ABC123xyzPLACEHOLDER111111111111111111"
);

// ─── Connections ──────────────────────────────────────────────────────────────
/** Standard Solana devnet connection for L1 instructions (open_round, claim_winnings). */
export const l1Connection = new Connection(L1_RPC, "confirmed");

/** MagicBlock Ephemeral Rollup connection — ER is standard JSON-RPC compatible. */
export const erConnection = new Connection(ER_RPC, "confirmed");

// ─── PDA Helpers ──────────────────────────────────────────────────────────────
function roundIdToBytes(roundId: bigint): Uint8Array {
  const buf = new ArrayBuffer(8);
  new DataView(buf).setBigUint64(0, roundId, true /* little-endian */);
  return new Uint8Array(buf);
}

export function getRoundPDA(roundId: bigint): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [new TextEncoder().encode("round"), roundIdToBytes(roundId)],
    RUGROLL_PROGRAM_ID
  );
}

export function getPositionPDA(
  roundId: bigint,
  player: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      new TextEncoder().encode("position"),
      roundIdToBytes(roundId),
      player.toBytes(),
    ],
    RUGROLL_PROGRAM_ID
  );
}

// ─── Multiplier Math ──────────────────────────────────────────────────────────
/** Mirror of the on-chain current_multiplier_bps function. */
export function currentMultiplierBps(startSlot: number, currentSlot: number): number {
  const elapsed = Math.max(0, currentSlot - startSlot);
  return Math.min(10_000 + elapsed * 2, 1_000_000);
}

export function bpsToMultiplier(bps: number): string {
  return (bps / 100).toFixed(2) + "×";
}

export function lamportsToSol(lamports: number): string {
  return (lamports / 1e9).toFixed(4);
}
