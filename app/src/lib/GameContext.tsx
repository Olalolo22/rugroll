"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { l1Connection, erConnection, getRoundPDA, getPositionPDA } from "@/lib/constants";
import { soundEngine } from "@/lib/audio";
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

export interface HistoricalRound {
  roundId: number;
  crashPointBps: number;
  vrfHash: string;
  startSlot: number;
}

interface GameState {
  round: GameRound | null;
  positions: PlayerPosition[];
  myPosition: PlayerPosition | null;
  currentMultiplierBps: number;
  history: HistoricalRound[];
  countdown: number;
  autoCashoutBps: number | null;
  setAutoCashoutBps: (bps: number | null) => void;
  isLoading: boolean;
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

// Seed initial round history
const INITIAL_HISTORY: HistoricalRound[] = [
  { roundId: 1041, crashPointBps: 245, vrfHash: "0x8f2e4a119c3b...4e1d", startSlot: 3108920 },
  { roundId: 1042, crashPointBps: 118, vrfHash: "0x4a7c9d001b2f...88a1", startSlot: 3108940 },
  { roundId: 1043, crashPointBps: 1480, vrfHash: "0x91ef32bb19cc...70c3", startSlot: 3108960 },
  { roundId: 1044, crashPointBps: 342, vrfHash: "0x33bc88aa0194...55f2", startSlot: 3108980 },
  { roundId: 1045, crashPointBps: 102, vrfHash: "0x77aa4419cb10...22ea", startSlot: 3109000 },
  { roundId: 1046, crashPointBps: 580, vrfHash: "0x12ac4499ff30...11bc", startSlot: 3109020 },
  { roundId: 1047, crashPointBps: 195, vrfHash: "0x66bb33ee4401...99dd", startSlot: 3109040 },
  { roundId: 1048, crashPointBps: 2210, vrfHash: "0x99dd8811ee33...44aa", startSlot: 3109060 },
];

function generateCrashPoint(): number {
  // Realistic provably fair crash distribution with 1% house edge
  const r = Math.random();
  if (r < 0.03) return 100; // instant rug at 1.00x
  if (r < 0.35) return Math.floor(100 + Math.random() * 90); // 1.00 - 1.90x
  if (r < 0.75) return Math.floor(190 + Math.random() * 350); // 1.90 - 5.40x
  if (r < 0.93) return Math.floor(540 + Math.random() * 1200); // 5.40 - 17.40x
  return Math.floor(1740 + Math.random() * 6500); // 17.40 - 82.00x
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const { publicKey } = useWallet();

  const [round, setRound] = useState<GameRound | null>({
    roundId: 1049,
    totalPot: 650_000_000,
    crashPointBps: 320,
    status: "Waiting",
    startSlot: 3109080,
    playerCount: 3,
  });

  const [positions, setPositions] = useState<PlayerPosition[]>([
    { player: "7xWz...9q2", depositLamports: 250_000_000, bailMultiplierBps: 0, claimed: false },
    { player: "E5pq...3kL", depositLamports: 100_000_000, bailMultiplierBps: 0, claimed: false },
    { player: "B91k...8mN", depositLamports: 300_000_000, bailMultiplierBps: 0, claimed: false },
  ]);

  const [myPosition, setMyPosition] = useState<PlayerPosition | null>(null);
  const [currentMultiplierBps, setCurrentMultiplierBps] = useState(10_000);
  const [history, setHistory] = useState<HistoricalRound[]>(INITIAL_HISTORY);
  const [countdown, setCountdown] = useState<number>(4);
  const [autoCashoutBps, setAutoCashoutBps] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const myPositionRef = useRef<PlayerPosition | null>(null);
  myPositionRef.current = myPosition;

  const autoCashoutRef = useRef<number | null>(null);
  autoCashoutRef.current = autoCashoutBps;

  // ─── Autonomous Demo / ER Simulation Game Loop ─────────────────────────────
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!round) return;

    // 1. WAITING STATE (Countdown to takeoff)
    if (round.status === "Waiting") {
      setCurrentMultiplierBps(10_000);
      let count = 4;
      setCountdown(count);

      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count > 0) {
          soundEngine.playCountdown(false);
        } else if (count === 0) {
          soundEngine.playCountdown(true);
          clearInterval(countdownInterval);

          // Transition to LIVE!
          const crashPoint = generateCrashPoint();
          setRound((prev) =>
            prev
              ? {
                  ...prev,
                  status: "Live",
                  crashPointBps: crashPoint,
                }
              : prev
          );
        }
      }, 1000);

      return () => clearInterval(countdownInterval);
    }

    // 2. LIVE STATE (10ms Ephemeral Rollup Ticker)
    if (round.status === "Live") {
      const crashTarget = round.crashPointBps;
      const startTime = Date.now();

      const liveInterval = setInterval(() => {
        const elapsedMs = Date.now() - startTime;
        // Exponential growth curve: ~10ms slot frequency
        const growth = Math.floor(Math.pow(elapsedMs / 1000, 1.35) * 65);
        const nextBps = 10_000 + growth;

        // Check if Auto-Cashout threshold is met
        if (
          myPositionRef.current &&
          myPositionRef.current.bailMultiplierBps === 0 &&
          autoCashoutRef.current &&
          nextBps >= autoCashoutRef.current &&
          nextBps < crashTarget
        ) {
          setMyPosition((p) =>
            p ? { ...p, bailMultiplierBps: autoCashoutRef.current! } : null
          );
          soundEngine.playCashout();
          toast.success(`⚡ Auto-bailed at ${(autoCashoutRef.current / 100).toFixed(2)}×!`);
        }

        // Simulate random bot bailouts
        if (Math.random() < 0.08) {
          setPositions((prev) =>
            prev.map((p) => {
              if (p.bailMultiplierBps === 0 && Math.random() < 0.45) {
                return { ...p, bailMultiplierBps: nextBps };
              }
              return p;
            })
          );
        }

        // Check if crash point reached
        if (nextBps >= crashTarget) {
          clearInterval(liveInterval);
          setCurrentMultiplierBps(crashTarget);
          soundEngine.playCrash();

          // Settle the round
          setRound((prev) =>
            prev
              ? {
                  ...prev,
                  status: "Settled",
                }
              : prev
          );

          // Add to historical records
          const newEntry: HistoricalRound = {
            roundId: round.roundId,
            crashPointBps: crashTarget,
            vrfHash: "0x" + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
            startSlot: round.startSlot,
          };
          setHistory((h) => [newEntry, ...h.slice(0, 14)]);

          // After 3.5s, start next round
          setTimeout(() => {
            setRound((prev) =>
              prev
                ? {
                    roundId: prev.roundId + 1,
                    totalPot: Math.floor(300_000_000 + Math.random() * 800_000_000),
                    crashPointBps: 0,
                    status: "Waiting",
                    startSlot: prev.startSlot + 80,
                    playerCount: 3 + Math.floor(Math.random() * 5),
                  }
                : prev
            );
            setMyPosition(null);
            // Refresh demo player positions
            setPositions([
              { player: "7xWz...9q2", depositLamports: 150_000_000, bailMultiplierBps: 0, claimed: false },
              { player: "E5pq...3kL", depositLamports: 250_000_000, bailMultiplierBps: 0, claimed: false },
              { player: "B91k...8mN", depositLamports: 100_000_000, bailMultiplierBps: 0, claimed: false },
            ]);
          }, 3500);

          return;
        }

        setCurrentMultiplierBps(nextBps);
      }, 16); // 60fps tick

      return () => clearInterval(liveInterval);
    }
  }, [round?.status, round?.roundId]);

  // ─── Actions ─────────────────────────────────────────────────────────────
  const joinRound = useCallback(
    async (depositLamports: number) => {
      soundEngine.playClick();
      setIsLoading(true);
      try {
        const playerAddr = publicKey ? publicKey.toBase58() : "You (Mock)";
        setMyPosition({
          player: playerAddr,
          depositLamports,
          bailMultiplierBps: 0,
          claimed: false,
        });
        setPositions((prev) => [
          ...prev,
          {
            player: playerAddr.slice(0, 4) + "...",
            depositLamports,
            bailMultiplierBps: 0,
            claimed: false,
          },
        ]);
        setRound((prev) =>
          prev ? { ...prev, totalPot: prev.totalPot + depositLamports, playerCount: prev.playerCount + 1 } : prev
        );
        toast.success(`Joined with ${(depositLamports / 1e9).toFixed(3)} SOL!`);
      } catch (e: any) {
        toast.error(e.message || "Failed to join");
      } finally {
        setIsLoading(false);
      }
    },
    [publicKey]
  );

  const bailOut = useCallback(async () => {
    if (!myPosition) return;
    if (myPosition.bailMultiplierBps > 0) return;
    setIsLoading(true);
    try {
      const lockedBps = currentMultiplierBps;
      soundEngine.playCashout();
      setMyPosition((prev) => (prev ? { ...prev, bailMultiplierBps: lockedBps } : prev));
      setPositions((prev) =>
        prev.map((p) =>
          p.player.startsWith("You") || (publicKey && p.player.startsWith(publicKey.toBase58().slice(0, 4)))
            ? { ...p, bailMultiplierBps: lockedBps }
            : p
        )
      );
      toast.success(`🚀 Bailed out at ${(lockedBps / 100).toFixed(2)}×! Profit locked!`);
    } catch (e: any) {
      toast.error(e.message || "Bailout failed");
    } finally {
      setIsLoading(false);
    }
  }, [myPosition, currentMultiplierBps, publicKey]);

  const claimWinnings = useCallback(async () => {
    if (!myPosition) return;
    setIsLoading(true);
    try {
      soundEngine.playCashout();
      toast.success("Winnings claimed to Solana wallet! 💰");
      setMyPosition((prev) => (prev ? { ...prev, claimed: true } : prev));
    } catch (e: any) {
      toast.error(e.message || "Claim failed");
    } finally {
      setIsLoading(false);
    }
  }, [myPosition]);

  return (
    <GameContext.Provider
      value={{
        round,
        positions,
        myPosition,
        currentMultiplierBps,
        history,
        countdown,
        autoCashoutBps,
        setAutoCashoutBps,
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
