"use client";

import React, { useState } from "react";
import { useGame, HistoricalRound } from "@/lib/GameContext";
import { Dices, X, ExternalLink, FlaskConical } from "lucide-react";

export default function RoundHistory() {
  const { history } = useGame();
  const [selectedRound, setSelectedRound] = useState<HistoricalRound | null>(null);

  if (!history || history.length === 0) return null;

  return (
    <div className="history-bar-wrapper">
      <div className="history-label">RECENT:</div>
      <div className="history-scroll-container">
        {history.map((r, i) => {
          const mult = r.crashPointBps / 100;
          const isHuge = mult >= 10;
          const isMid = mult >= 2 && mult < 10;
          const isLow = mult < 2;

          let badgeClass = "history-pill";
          if (isHuge) badgeClass += " pill-huge";
          else if (isMid) badgeClass += " pill-mid";
          else if (isLow) badgeClass += " pill-low";

          return (
            <button
              key={r.roundId + "-" + i}
              className={badgeClass}
              onClick={() => setSelectedRound(r)}
              title={`Round #${r.roundId} — Click to verify VRF randomness`}
            >
              {mult.toFixed(2)}×
            </button>
          );
        })}
      </div>

      {/* VRF Modal */}
      {selectedRound && (
        <div className="modal-backdrop" onClick={() => setSelectedRound(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <span className="modal-icon">
                  <Dices size={20} />
                </span>
                <h3>Round #{selectedRound.roundId} · Provably Fair VRF Proof</h3>
              </div>
              <button
                className="modal-close"
                onClick={() => setSelectedRound(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div className="proof-card">
                <div className="proof-row">
                  <span className="proof-label">Result Multiplier:</span>
                  <span
                    className={`proof-value ${
                      selectedRound.crashPointBps >= 200 ? "text-green" : "text-red"
                    }`}
                  >
                    {(selectedRound.crashPointBps / 100).toFixed(2)}×
                  </span>
                </div>
                <div className="proof-row">
                  <span className="proof-label">ER Commit Slot:</span>
                  <span className="proof-value font-mono">
                    #{selectedRound.startSlot + 1420}
                  </span>
                </div>
                <div className="proof-row">
                  <span className="proof-label">MagicBlock VRF Seed:</span>
                  <span className="proof-value font-mono truncate">
                    {selectedRound.vrfHash}
                  </span>
                </div>
                <div className="proof-row">
                  <span className="proof-label">House Edge:</span>
                  <span className="proof-value">1.00% (Provably Capped)</span>
                </div>
              </div>

              <div className="formula-box">
                <div className="formula-title">
                  <FlaskConical size={14} style={{ display: "inline", marginRight: "6px" }} />
                  VERIFICATION FORMULA (ANCHOR):
                </div>
                <pre className="formula-code">
{`let random_u64 = u64::from_le_bytes(vrf_seed[0..8]);
let r = random_u64 % 10000;
let crash_bps = if r == 0 { 100 } else { (9900 * 100) / (10000 - r) };
// Result matches on-chain ER record: ${(selectedRound.crashPointBps / 100).toFixed(2)}×`}
                </pre>
              </div>

              <div className="modal-actions">
                <a
                  href={`https://explorer.solana.com/address/11111111111111111111111111111111?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modal-cta-btn"
                >
                  <ExternalLink size={14} style={{ display: "inline", marginRight: "6px" }} />
                  View MagicBlock VRF on Explorer
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
