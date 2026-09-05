import MultiplierChart from "@/components/MultiplierChart";
import MultiplierDisplay from "@/components/MultiplierDisplay";
import BailoutButton from "@/components/BailoutButton";
import PlayerPanel from "@/components/PlayerPanel";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RugRoll — Live Game",
  description: "Active crash game round. Bail out before the rug!",
};

export default function GamePage() {
  return (
    <div className="game-layout">
      {/* Header */}
      <header className="game-header">
        <Link href="/" className="game-logo">
          <span className="title-rug">Rug</span>
          <span className="title-roll">Roll</span>
        </Link>
        <div className="header-right">
          <span className="er-indicator">
            <span className="er-dot" />
            ER Live · ~10ms
          </span>
          <WalletMultiButton className="wallet-btn-sm" />
        </div>
      </header>

      {/* Main game area */}
      <main className="game-main">
        {/* Left: chart + action */}
        <section className="game-center">
          <div className="chart-wrapper">
            <MultiplierDisplay />
            <MultiplierChart />
          </div>
          <div className="action-area">
            <BailoutButton />
          </div>
        </section>

        {/* Right: player panel */}
        <aside className="game-sidebar">
          <PlayerPanel />
        </aside>
      </main>

      {/* Footer */}
      <footer className="game-footer">
        <span>
          Powered by{" "}
          <a
            href="https://magicblock.gg"
            target="_blank"
            rel="noopener noreferrer"
          >
            MagicBlock
          </a>{" "}
          · Blitz 8 · Graveyard Resurrection
        </span>
      </footer>
    </div>
  );
}
