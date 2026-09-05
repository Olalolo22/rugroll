"use client";

import React from "react";
import { useGame } from "@/lib/GameContext";

export default function MultiplierDisplay() {
  const { currentMultiplierBps, round } = useGame();
  const multiplier = (currentMultiplierBps / 100).toFixed(2);
  const hasCrashed = round?.status === "Settled" || round?.status === "Resolving";

  const color =
    hasCrashed
      ? "#ef4444"
      : currentMultiplierBps > 300_00 / 10
      ? "#fb923c"
      : currentMultiplierBps > 200_00 / 10
      ? "#facc15"
      : "#34d399";

  return (
    <div className="multiplier-display">
      <div
        className="multiplier-value"
        style={{
          color,
          textShadow: `0 0 40px ${color}80`,
          transform: hasCrashed ? "scale(1.1)" : "scale(1)",
        }}
      >
        {hasCrashed ? "💥" : ""}{multiplier}×
      </div>
      <div className="multiplier-sub">
        {hasCrashed ? "RUGGED" : round?.status === "Waiting" ? "Waiting for players…" : "LIVE"}
      </div>
    </div>
  );
}
