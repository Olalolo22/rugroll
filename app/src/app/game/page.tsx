import RocketCanvas from "@/components/RocketCanvas";
import BailoutButton from "@/components/BailoutButton";
import RoundHistory from "@/components/RoundHistory";
import GameTabs from "@/components/GameTabs";
import SoundToggle from "@/components/SoundToggle";
import { WalletButton } from "@/components/WalletButton";
import Link from "next/link";
import type { Metadata } from "next";
import { Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "RugRoll Arena — 10ms Solana Crash Game",
  description: "Real-time crash game on MagicBlock Ephemeral Rollups and VRF. Bail out before the rug!",
};

export default function GamePage() {
  return (
    <div className="game-layout">
      {/* Top Navigation Bar */}
      <header className="game-header">
        <div className="header-left">
          <Link href="/" className="game-logo">
            <span className="logo-glitch"><Zap size={16} /></span>
            <span className="title-rug">RUG</span>
            <span className="title-roll">ROLL</span>
          </Link>
          <div className="telemetry-pill">
            <span className="telemetry-dot" />
            <span className="telemetry-text">ER SUB-BLOCKS: 10ms</span>
          </div>
        </div>

        <div className="header-right">
          <SoundToggle />
          <WalletButton className="wallet-btn-sm" />
        </div>
      </header>

      {/* Recent Round Multipliers Ticker */}
      <RoundHistory />

      {/* Main Game Arena */}
      <main className="game-main">
        {/* Left / Center: Rocket Arena + Betting Deck */}
        <section className="game-center">
          <RocketCanvas />
          <BailoutButton />
        </section>

        {/* Right: Live Bets, Provably Fair, and 10ms vs 400ms Speed Test */}
        <aside className="game-sidebar">
          <GameTabs />
        </aside>
      </main>

      {/* Footer info banner */}
      <footer className="game-footer">
        <div className="footer-content">
          <span>
            <Zap size={14} style={{ display: "inline", marginRight: "6px" }} />Built for <strong>MagicBlock Blitz 8</strong> · Resurrecting <em>Reaction Battle Royale</em> with 10ms Ephemeral Rollups
          </span>
          <div className="footer-links">
            <a
              href="https://magicblock.gg"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              MagicBlock Docs ↗
            </a>
            <Link href="/" className="footer-link">
              About Project
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
