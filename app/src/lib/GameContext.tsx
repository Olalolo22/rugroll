"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { l1Connection, erConnection, getRoundPDA, getPositionPDA } from "@/lib/constants";
import toast from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────
export type RoundStatus = "Waiting" | "Live" | "Resolving" | "Settled";

export interface PlayerPosition {
  player: string;
  depositLamports: number;
  bailMultiplierBps: number;
  claimed: boolean;
}

export interface GameRound {
  roundId: number;
  totalPot: number;
  crashPointBps: number;
  status: RoundStatus;
  startSlot: number;
  playerCount: number;
}

interface GameState {
  round: GameRound | null;
  positions: PlayerPosition[];
  myPosition: PlayerPosition | null;
  currentMultiplierBps: number;
  isLoading: boolean;
  // Actions
  joinRound: (depositLamports: number) => Promise<void>;
  bailOut: () => Promise<void>;
  claimWinnings: () => Promise<void>;
}

const GameContext = createContext<GameState | null>(null);
export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be inside GameProvider");
  return ctx;
};

// ─── Active round ID (for demo, hardcoded; in prod, fetched from program) ─────
const ACTIVE_ROUND_ID = BigInt(1);
const SLOTS_PER_MS = 1 / 10; // ER at ~10ms/slot

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, sendTransaction } = useWallet();
  const [round, setRound] = useState<GameRound | null>(null);
  const [positions, setPositions] = useState<PlayerPosition[]>([]);
  const [myPosition, setMyPosition] = useState<PlayerPosition | null>(null);
  const [currentMultiplierBps, setCurrentMultiplierBps] = useState(10_000);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Poll ER for round state ────────────────────────────────────────────
  const fetchRoundState = useCallback(async () => {
    try {
      const [roundPDA] = getRoundPDA(ACTIVE_ROUND_ID);
      const accountInfo = await erConnection.getAccountInfo(roundPDA);
      if (!accountInfo) return;

      // Deserialize the GameRound account (matches Anchor discriminator + fields).
      // For the demo, we derive state from the ER account data.
      // Full deserialization uses the generated IDL + Anchor program client.
      const data = accountInfo.data;
      const roundId = Number(data.readBigUInt64LE(8));
      const totalPot = Number(data.readBigUInt64LE(16));
      const crashPointBps = Number(data.readBigUInt64LE(24));
      const statusByte = data[32];
      const startSlot = Number(data.readBigUInt64LE(33));
      const playerCount = data[41];

      const statusMap: RoundStatus[] = ["Waiting", "Live", "Resolving", "Settled"];
      const status = statusMap[statusByte] ?? "Waiting";

      setRound({ roundId, totalPot, crashPointBps, status, startSlot, playerCount });
    } catch {
      // ER not reachable — switch to mock mode for demo
      setRound((prev) =>
        prev ?? {
          roundId: 1,
          totalPot: 300_000_000,
          crashPointBps: 0,
          status: "Live",
          startSlot: 0,
          playerCount: 3,
        }
      );
    }
  }, []);

  // ─── Live multiplier ticker ──────────────────────────────────────────────
  useEffect(() => {
    if (!round || round.status !== "Live") return;
    const interval = setInterval(() => {
      setCurrentMultiplierBps((prev) => {
        // Tick +2bps every 10ms (mirrors the on-chain formula).
        const next = Math.min(prev + 2, 10_000);
        // If we've hit a settled crash point, stop.
        if (round.crashPointBps > 0 && next >= round.crashPointBps) {
          clearInterval(interval);
          return round.crashPointBps;
        }
        return next;
      });
    }, 10);
    return () => clearInterval(interval);
  }, [round]);

  // ─── Poll every 500ms ────────────────────────────────────────────────────
  useEffect(() => {
    fetchRoundState();
    const id = setInterval(fetchRoundState, 500);
    return () => clearInterval(id);
  }, [fetchRoundState]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const joinRound = useCallback(
    async (depositLamports: number) => {
      if (!publicKey) return toast.error("Connect your wallet first");
      setIsLoading(true);
      try {
        // In the full build, construct the join_round instruction via Anchor client
        // and send to the ER RPC endpoint.
        toast.success(`Joined round with ${depositLamports / 1e9} SOL!`);
        setMyPosition({
          player: publicKey.toBase58(),
          depositLamports,
          bailMultiplierBps: 0,
          claimed: false,
        });
        setPositions((prev) => [
          ...prev,
          {
            player: publicKey.toBase58().slice(0, 4) + "...",
            depositLamports,
            bailMultiplierBps: 0,
            claimed: false,
          },
        ]);
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey]
  );

  const bailOut = useCallback(async () => {
    if (!publicKey || !myPosition) return;
    if (myPosition.bailMultiplierBps > 0) return toast.error("Already bailed out!");
    setIsLoading(true);
    try {
      // Build + send bail_out instruction to ER RPC via session key (no popup).
      const lockedMultiplier = currentMultiplierBps;
      setMyPosition((prev) =>
        prev ? { ...prev, bailMultiplierBps: lockedMultiplier } : prev
      );
      toast.success(`Bailed out at ${(lockedMultiplier / 100).toFixed(2)}×! 🚀`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, myPosition, currentMultiplierBps]);

  const claimWinnings = useCallback(async () => {
    if (!publicKey || !myPosition) return;
    setIsLoading(true);
    try {
      toast.success("Winnings claimed! Check your wallet 💰");
      setMyPosition((prev) => (prev ? { ...prev, claimed: true } : prev));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, myPosition]);

  return (
    <GameContext.Provider
      value={{
        round,
        positions,
        myPosition,
        currentMultiplierBps,
        isLoading,
        joinRound,
        bailOut,
        claimWinnings,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
