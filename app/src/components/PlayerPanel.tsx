"use client";

import React from "react";
import { useGame } from "@/lib/GameContext";

export default function PlayerPanel() {
  const { positions, round, myPosition } = useGame();
  const totalPotSol = ((round?.totalPot ?? 0) / 1e9).toFixed(3);
  const playerCount = round?.playerCount ?? 0;
  const status = round?.status ?? "Waiting";

  return (
    <div className="player-panel">
      <div className="panel-header">
        <h3>🎯 Round #{round?.roundId ?? "—"}</h3>
        <div className={`status-badge status-${status.toLowerCase()}`}>{status}</div>
      </div>

      <div className="pot-display">
        <span className="pot-label">Pot</span>
        <span className="pot-value">{totalPotSol} SOL</span>
      </div>

      <div className="players-list">
        <div className="players-header">
          <span>Player</span>
          <span>Deposit</span>
          <span>Exit</span>
        </div>
        {positions.length === 0 ? (
          <p className="empty-hint">Waiting for players…</p>
        ) : (
          positions.map((p, i) => {
            const isMe = p.player === (myPosition?.player ?? "");
            const hasBailed = p.bailMultiplierBps > 0;
            const crashed =
              round?.status === "Settled" &&
              (!hasBailed || p.bailMultiplierBps >= (round?.crashPointBps ?? 0));
            return (
              <div
                key={i}
                className={`player-row ${isMe ? "me" : ""} ${
                  crashed ? "crashed" : hasBailed ? "bailed" : "active"
                }`}
              >
                <span className="player-addr">
                  {isMe ? "🟢 You" : p.player}
                </span>
                <span>{(p.depositLamports / 1e9).toFixed(3)} SOL</span>
                <span>
                  {hasBailed
                    ? `${(p.bailMultiplierBps / 100).toFixed(2)}×`
                    : crashed
                    ? "💀"
                    : "—"}
                </span>
              </div>
            );
          })
        )}
      </div>

      {round?.status === "Settled" && round.crashPointBps > 0 && (
        <div className="crash-result">
          <span>Crashed at</span>
          <span className="crash-value">{(round.crashPointBps / 100).toFixed(2)}×</span>
        </div>
      )}

      <div className="magicblock-badge">
        ⚡ Powered by MagicBlock Ephemeral Rollups · ~10ms blocks
      </div>
    </div>
  );
}
