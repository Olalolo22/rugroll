"use client";

import React, { useState } from "react";
import { useGame } from "@/lib/GameContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

export default function BailoutButton() {
  const { myPosition, bailOut, joinRound, claimWinnings, round, currentMultiplierBps, isLoading } =
    useGame();
  const { connected } = useWallet();
  const [depositSol, setDepositSol] = useState("0.1");

  const hasBailed = (myPosition?.bailMultiplierBps ?? 0) > 0;
  const isSettled = round?.status === "Settled";
  const isLive = round?.status === "Live";
  const canClaim =
    isSettled &&
    myPosition &&
    hasBailed &&
    myPosition.bailMultiplierBps < (round?.crashPointBps ?? 0) &&
    !myPosition.claimed;

  if (!connected) {
    return (
      <div className="connect-wrapper">
        <p className="connect-hint">Connect your wallet to play</p>
        <WalletMultiButton className="wallet-btn" />
      </div>
    );
  }

  if (!myPosition && !isSettled) {
    return (
      <div className="join-panel">
        <label className="deposit-label">Deposit (SOL)</label>
        <div className="deposit-row">
          {["0.05", "0.1", "0.25", "0.5"].map((v) => (
            <button
              key={v}
              className={`preset-btn ${depositSol === v ? "active" : ""}`}
              onClick={() => setDepositSol(v)}
            >
              {v} SOL
            </button>
          ))}
        </div>
        <input
          type="number"
          className="deposit-input"
          value={depositSol}
          min="0.01"
          step="0.01"
          onChange={(e) => setDepositSol(e.target.value)}
        />
        <button
          id="join-round-btn"
          className="action-btn join-btn"
          disabled={isLoading || isSettled}
          onClick={() => joinRound(Math.floor(parseFloat(depositSol) * 1e9))}
        >
          {isLoading ? "⏳ Joining..." : "🚀 JOIN ROUND"}
        </button>
      </div>
    );
  }

  if (canClaim) {
    return (
      <button
        id="claim-btn"
        className="action-btn claim-btn"
        disabled={isLoading}
        onClick={claimWinnings}
      >
        {isLoading ? "⏳ Claiming..." : "💰 CLAIM WINNINGS"}
      </button>
    );
  }

  if (hasBailed) {
    const bps = myPosition!.bailMultiplierBps;
    const survived = !isSettled || bps < (round?.crashPointBps ?? Infinity);
    return (
      <div className={`bailed-status ${survived ? "survived" : "crashed"}`}>
        {survived
          ? `✅ Bailed at ${(bps / 100).toFixed(2)}× — waiting for settlement`
          : `💀 Crashed — you lost this round`}
      </div>
    );
  }

  // Active player — show BAIL OUT button
  return (
    <button
      id="bail-out-btn"
      className="action-btn bailout-btn"
      disabled={isLoading || !isLive}
      onClick={bailOut}
    >
      {isLoading ? (
        "⏳ Locking in..."
      ) : (
        <>
          🛑 BAIL OUT
          <span className="bailout-multiplier">
            {(currentMultiplierBps / 100).toFixed(2)}×
          </span>
        </>
      )}
    </button>
  );
}
