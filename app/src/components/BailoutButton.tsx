"use client";

import React, { useState } from "react";
import { useGame } from "@/lib/GameContext";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletButton } from "@/components/WalletButton";
import { soundEngine } from "@/lib/audio";

export default function BailoutButton() {
  const {
    myPosition,
    bailOut,
    joinRound,
    claimWinnings,
    round,
    currentMultiplierBps,
    isLoading,
    autoCashoutBps,
    setAutoCashoutBps,
    countdown,
  } = useGame();
  const { connected } = useWallet();

  const [depositSol, setDepositSol] = useState("0.1");
  const [autoCashoutActive, setAutoCashoutActive] = useState(false);
  const [autoCashoutInput, setAutoCashoutInput] = useState("2.00");

  const isWaiting = round?.status === "Waiting";
  const isLive = round?.status === "Live";
  const isSettled = round?.status === "Settled";
  const hasBailed = (myPosition?.bailMultiplierBps ?? 0) > 0;
  const currentMultiplier = currentMultiplierBps / 100;
  const crashPoint = (round?.crashPointBps ?? 0) / 100;

  // Calculate live return
  const depositLamports = myPosition?.depositLamports ?? 0;
  const depositSolNum = depositLamports / 1e9;
  const livePayoutSol = (depositSolNum * currentMultiplier).toFixed(4);
  const liveProfitSol = (depositSolNum * (currentMultiplier - 1)).toFixed(4);

  const canClaim =
    isSettled &&
    myPosition &&
    hasBailed &&
    myPosition.bailMultiplierBps < (round?.crashPointBps ?? 0) &&
    !myPosition.claimed;

  const handlePreset = (val: string) => {
    soundEngine.playClick();
    setDepositSol(val);
  };

  const handleMultiplierHalf = () => {
    soundEngine.playClick();
    const cur = parseFloat(depositSol) || 0.1;
    setDepositSol(Math.max(0.01, cur / 2).toFixed(2));
  };

  const handleMultiplierDouble = () => {
    soundEngine.playClick();
    const cur = parseFloat(depositSol) || 0.1;
    setDepositSol((cur * 2).toFixed(2));
  };

  const handleJoin = () => {
    soundEngine.playClick();
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }
    const lamports = Math.floor(parseFloat(depositSol) * 1e9);
    if (autoCashoutActive && parseFloat(autoCashoutInput) > 1.01) {
      setAutoCashoutBps(Math.floor(parseFloat(autoCashoutInput) * 100));
    } else {
      setAutoCashoutBps(null);
    }
    joinRound(lamports);
  };

  const handleBailout = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
    bailOut();
  };

  // Not connected
  if (!connected) {
    return (
      <div className="controls-card">
        <div className="connect-prompt">
          <div className="connect-icon">⚡</div>
          <div className="connect-text">
            <h3>Connect Phantom to Play</h3>
            <p>1-Click Session Keys enabled · 10ms Ephemeral Rollup execution</p>
          </div>
          <WalletButton className="wallet-btn-large" />
        </div>
      </div>
    );
  }

  // Connected: Control Deck
  return (
    <div className="controls-card">
      {/* Top Deck: Deposit Inputs & Auto Cashout */}
      {!myPosition && (
        <div className="bet-setup-deck">
          <div className="bet-input-row">
            <div className="bet-input-field">
              <label className="input-title">AMOUNT</label>
              <div className="input-group">
                <input
                  type="number"
                  className="sol-input"
                  value={depositSol}
                  min="0.01"
                  step="0.05"
                  onChange={(e) => setDepositSol(e.target.value)}
                />
                <span className="sol-badge">SOL</span>
              </div>
            </div>

            <div className="presets-group">
              {["0.05", "0.1", "0.25", "0.5", "1.0"].map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`chip-btn ${depositSol === v ? "active" : ""}`}
                  onClick={() => handlePreset(v)}
                >
                  {v}
                </button>
              ))}
              <button
                type="button"
                className="chip-btn chip-modifier"
                onClick={handleMultiplierHalf}
              >
                ½
              </button>
              <button
                type="button"
                className="chip-btn chip-modifier"
                onClick={handleMultiplierDouble}
              >
                2×
              </button>
            </div>
          </div>

          <div className="auto-cashout-row">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoCashoutActive}
                onChange={(e) => {
                  soundEngine.playClick();
                  setAutoCashoutActive(e.target.checked);
                }}
              />
              <span className="toggle-text">AUTO BAILOUT</span>
            </label>
            {autoCashoutActive && (
              <div className="auto-input-wrap">
                <input
                  type="number"
                  className="auto-input"
                  value={autoCashoutInput}
                  min="1.05"
                  step="0.1"
                  onChange={(e) => setAutoCashoutInput(e.target.value)}
                />
                <span className="mult-suffix">×</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Interactive Button Area */}
      <div className="action-button-area">
        {/* State 1: User hasn't joined yet */}
        {!myPosition && (
          <button
            id="join-round-btn"
            className="big-action-btn btn-join"
            disabled={isLoading}
            onClick={handleJoin}
          >
            {isLoading ? (
              <span>⏳ Registering Session Key...</span>
            ) : isWaiting ? (
              <div className="btn-content-flex">
                <span className="btn-icon">🚀</span>
                <span className="btn-main-text">
                  JOIN ROUND #{round?.roundId ?? 1}
                </span>
                <span className="btn-sub-tag">({depositSol} SOL)</span>
              </div>
            ) : (
              <div className="btn-content-flex">
                <span className="btn-icon">⚡</span>
                <span className="btn-main-text">
                  BET FOR NEXT ROUND ({depositSol} SOL)
                </span>
              </div>
            )}
          </button>
        )}

        {/* State 2: In Flight — Show Massive BAIL OUT Button */}
        {myPosition && !hasBailed && isLive && (
          <button
            id="bail-out-btn"
            className="big-action-btn btn-bailout animate-pulse-border"
            disabled={isLoading}
            onClick={handleBailout}
          >
            <div className="bailout-btn-grid">
              <div className="bailout-action-row">
                <span className="bailout-title">🛑 BAIL OUT NOW</span>
                <span className="bailout-multiplier">
                  {currentMultiplier.toFixed(2)}×
                </span>
              </div>
              <div className="bailout-payout-row">
                <span>Profit: +{liveProfitSol} SOL</span>
                <span>Payout: {livePayoutSol} SOL</span>
              </div>
            </div>
          </button>
        )}

        {/* State 3: User already bailed out */}
        {myPosition && hasBailed && (
          <div className="status-banner banner-bailed">
            <div className="banner-icon">🎉</div>
            <div className="banner-details">
              <h4>Bailed Out at {(myPosition.bailMultiplierBps / 100).toFixed(2)}×</h4>
              <p>
                Secured{" "}
                {(
                  (myPosition.depositLamports / 1e9) *
                  (myPosition.bailMultiplierBps / 100)
                ).toFixed(3)}{" "}
                SOL · Waiting for round settlement
              </p>
            </div>
          </div>
        )}

        {/* State 4: Round Crashed while user was in flight */}
        {myPosition && !hasBailed && isSettled && (
          <div className="status-banner banner-rugged">
            <div className="banner-icon">💀</div>
            <div className="banner-details">
              <h4>You Got Rugged at {crashPoint.toFixed(2)}×</h4>
              <p>Lost {(myPosition.depositLamports / 1e9).toFixed(3)} SOL. Better luck next roll!</p>
            </div>
          </div>
        )}

        {/* State 5: Can claim winnings */}
        {canClaim && (
          <button
            id="claim-btn"
            className="big-action-btn btn-claim"
            disabled={isLoading}
            onClick={claimWinnings}
          >
            <div className="btn-content-flex">
              <span className="btn-icon">💰</span>
              <span className="btn-main-text">
                CLAIM {(
                  (myPosition.depositLamports / 1e9) *
                  (myPosition.bailMultiplierBps / 100)
                ).toFixed(3)}{" "}
                SOL WINNINGS
              </span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
}
