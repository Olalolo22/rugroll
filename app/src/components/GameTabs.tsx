"use client";

import React, { useState } from "react";
import { useGame } from "@/lib/GameContext";

export default function GameTabs() {
  const [activeTab, setActiveTab] = useState<"players" | "fair" | "speed">("players");
  const { positions, round, myPosition } = useGame();

  // Speed test state
  const [baseLagState, setBaseLagState] = useState<"idle" | "testing" | "rugged">("idle");
  const [erLagState, setErLagState] = useState<"idle" | "testing" | "success">("idle");

  const runBaseTest = () => {
    setBaseLagState("testing");
    setTimeout(() => {
      setBaseLagState("rugged");
    }, 420); // 420ms average Solana slot
  };

  const runErTest = () => {
    setErLagState("testing");
    setTimeout(() => {
      setErLagState("success");
    }, 12); // 10-12ms ER slot
  };

  const totalPot = ((round?.totalPot ?? 0) / 1e9).toFixed(3);

  return (
    <div className="game-tabs-container">
      {/* Tab Switcher */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === "players" ? "active" : ""}`}
          onClick={() => setActiveTab("players")}
        >
          👥 Live Bets ({positions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === "fair" ? "active" : ""}`}
          onClick={() => setActiveTab("fair")}
        >
          🎲 Provably Fair
        </button>
        <button
          className={`tab-btn ${activeTab === "speed" ? "active" : ""}`}
          onClick={() => setActiveTab("speed")}
        >
          ⚡ 10ms vs 400ms
        </button>
      </div>

      {/* Tab 1: Live Players */}
      {activeTab === "players" && (
        <div className="tab-pane">
          <div className="pot-banner">
            <div className="pot-col">
              <span className="pot-sub">TOTAL POT</span>
              <span className="pot-num">{totalPot} SOL</span>
            </div>
            <div className="pot-col text-right">
              <span className="pot-sub">ROUND</span>
              <span className="pot-num text-purple">#{round?.roundId ?? 1}</span>
            </div>
          </div>

          <div className="players-table-wrapper">
            <div className="table-row-head">
              <span>Player</span>
              <span>Bet</span>
              <span className="text-right">Multiplier / Exit</span>
            </div>

            <div className="table-body">
              {positions.length === 0 ? (
                <div className="empty-players">
                  <span>Waiting for deposits in next round…</span>
                </div>
              ) : (
                positions.map((p, idx) => {
                  const isMe = p.player === (myPosition?.player ?? "");
                  const hasBailed = p.bailMultiplierBps > 0;
                  const isRoundSettled = round?.status === "Settled";
                  const crashed =
                    isRoundSettled &&
                    (!hasBailed || p.bailMultiplierBps >= (round?.crashPointBps ?? 0));

                  return (
                    <div
                      key={idx}
                      className={`player-item-row ${isMe ? "is-user" : ""} ${
                        crashed ? "row-crashed" : hasBailed ? "row-bailed" : "row-live"
                      }`}
                    >
                      <div className="player-meta">
                        <span className="player-avatar">
                          {isMe ? "😎" : "👾"}
                        </span>
                        <span className="player-name">
                          {isMe ? "You (Connected)" : p.player}
                        </span>
                      </div>
                      <span className="player-bet">
                        {(p.depositLamports / 1e9).toFixed(3)} SOL
                      </span>
                      <div className="player-status-cell">
                        {hasBailed ? (
                          <span className="badge-bailed">
                            {(p.bailMultiplierBps / 100).toFixed(2)}× (+
                            {(
                              ((p.depositLamports / 1e9) * (p.bailMultiplierBps / 100) -
                                p.depositLamports / 1e9)
                            ).toFixed(3)}{" "}
                            SOL)
                          </span>
                        ) : crashed ? (
                          <span className="badge-rugged">💀 Rugged</span>
                        ) : (
                          <span className="badge-in-play">🚀 In Flight</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Provably Fair VRF */}
      {activeTab === "fair" && (
        <div className="tab-pane provably-fair-pane">
          <div className="fair-header">
            <span className="fair-icon">🛡️</span>
            <div>
              <h4 className="fair-title">MagicBlock VRF Provable Fairness</h4>
              <p className="fair-desc">
                No house manipulation. The crash multiplier is seeded cryptographically on-chain before the round opens and resolved via MagicBlock VRF.
              </p>
            </div>
          </div>

          <div className="fair-steps">
            <div className="fair-step-card">
              <span className="step-num">1</span>
              <div className="step-content">
                <strong>VRF Alpha Generation</strong>
                <p>Round PDA commits a sealed hash before deposits close.</p>
              </div>
            </div>
            <div className="fair-step-card">
              <span className="step-num">2</span>
              <div className="step-content">
                <strong>Sub-Block 10ms Ticker</strong>
                <p>Ephemeral Rollup ticks at 100Hz without latency frontrunning.</p>
              </div>
            </div>
            <div className="fair-step-card">
              <span className="step-num">3</span>
              <div className="step-content">
                <strong>Atomic L1 Settlement</strong>
                <p>Winners claim on Solana devnet using on-chain state proof.</p>
              </div>
            </div>
          </div>

          <div className="fair-code-preview">
            <span className="code-label">CRASH SEED FORMULA:</span>
            <code>{`const e = 2 ** 32;\nconst h = parseInt(hash.slice(0, 8), 16);\nconst crash = Math.floor((100 * e - h) / (e - h)) / 100;`}</code>
          </div>
        </div>
      )}

      {/* Tab 3: Speed Arena (10ms vs 400ms) */}
      {activeTab === "speed" && (
        <div className="tab-pane speed-pane">
          <div className="speed-intro">
            <h4>Why 6 Teams Failed on Base Solana</h4>
            <p>
              Crash games require sub-second reflexes. Base Solana&apos;s 400ms block time makes bailouts arrive too late. Test it yourself below:
            </p>
          </div>

          <div className="speed-duel-grid">
            {/* Base Solana Card */}
            <div className="duel-card duel-bad">
              <div className="duel-card-header">
                <span className="duel-badge">Base Solana L1</span>
                <span className="duel-ms">~400ms latency</span>
              </div>
              <p className="duel-text">
                Slot gaps and gossip propagation delay your Bail Out transaction by nearly half a second.
              </p>
              <button
                className="duel-btn duel-btn-bad"
                onClick={runBaseTest}
                disabled={baseLagState === "testing"}
              >
                {baseLagState === "testing"
                  ? "⏳ Waiting 400ms on L1..."
                  : baseLagState === "rugged"
                  ? "💀 RUGGED! Slot Missed (+400ms)"
                  : "Simulate L1 Bailout"}
              </button>
              {baseLagState === "rugged" && (
                <div className="duel-verdict verdict-bad">
                  ❌ Multiplier crashed at 2.10× while your transaction was stuck waiting for the 400ms block!
                </div>
              )}
            </div>

            {/* MagicBlock ER Card */}
            <div className="duel-card duel-good">
              <div className="duel-card-header">
                <span className="duel-badge duel-badge-er">⚡ MagicBlock ER</span>
                <span className="duel-ms text-green">~10ms sub-block</span>
              </div>
              <p className="duel-text">
                Ephemeral Rollups execute state transitions at 100Hz with zero wallet popups via Session Keys.
              </p>
              <button
                className="duel-btn duel-btn-good"
                onClick={runErTest}
                disabled={erLagState === "testing"}
              >
                {erLagState === "testing"
                  ? "⚡ 10ms Sub-Block..."
                  : erLagState === "success"
                  ? "✅ LOCKED IN! (+10ms Instant)"
                  : "Simulate 10ms ER Bailout"}
              </button>
              {erLagState === "success" && (
                <div className="duel-verdict verdict-good">
                  🚀 Multiplier secured instantly at current slot with 0ms slippage!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
