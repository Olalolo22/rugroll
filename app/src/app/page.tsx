import Link from "next/link";
import type { Metadata } from "next";
import { Zap, Rocket, Skull, Gamepad2, Dices, KeyRound, ShieldCheck, ExternalLink } from "lucide-react";


export const metadata: Metadata = {
  title: "RugRoll — 10ms Provably Fair Solana Crash Game",
  description:
    "Resurrecting Reaction Battle Royale on Solana with 10ms MagicBlock Ephemeral Rollups, VRF, and Session Keys.",
};

export default function HomePage() {
  return (
    <main className="landing-container">
      {/* Dynamic Background Glow */}
      <div className="landing-ambient-glow" />
      <div className="landing-grid-overlay" />

      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <span className="logo-spark"><Zap size={18} /></span>
          <span className="logo-bold">RUG</span>
          <span className="logo-light">ROLL</span>
        </div>
        <div className="landing-nav-links">
          <a href="#graveyard" className="nav-item">
            The Graveyard
          </a>
          <a href="#architecture" className="nav-item">
            How ER Works
          </a>
          <a
            href="https://magicblock.gg"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-item"
          >
            MagicBlock Docs ↗
          </a>
          <Link href="/game" className="nav-cta-btn">
            Launch Arena <Rocket size={14} style={{ display: "inline", marginLeft: "4px" }} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="hero-badge">
          <span className="badge-spark"><Skull size={16} /></span>
          <span>MAGICBLOCK BLITZ 8 · GRAVEYARD RESURRECTION</span>
        </div>

        <h1 className="hero-headline">
          THE <span className="text-neon-green">10ms</span> SOLANA CRASH GAME.
          <br />
          <span className="hero-gradient-text">BAIL OUT BEFORE THE RUG.</span>
        </h1>

        <p className="hero-subhead">
          <strong>6 teams failed</strong> trying to build a real-time reaction game on base Solana because 400ms block times killed sub-second reflexes. We resurrected it using <strong>MagicBlock 10ms Ephemeral Rollups</strong>, on-chain <strong>VRF</strong>, and 1-click <strong>Session Keys</strong>.
        </p>

        <div className="hero-cta-group">
          <Link href="/game" className="btn-primary-glow">
            <Gamepad2 size={18} style={{ display: "inline", marginRight: "8px" }} />PLAY LIVE ARENA NOW
          </Link>
          <a href="#graveyard" className="btn-secondary-outline">
            <Skull size={16} style={{ display: "inline", marginRight: "6px" }} />Why Base Solana Failed ↓
          </a>
        </div>

        {/* Live Telemetry Bar */}
        <div className="hero-telemetry-banner">
          <div className="telemetry-item">
            <span className="telemetry-val text-green">10ms</span>
            <span className="telemetry-lbl">ER Block Time</span>
          </div>
          <div className="telemetry-divider" />
          <div className="telemetry-item">
            <span className="telemetry-val text-purple">100Hz</span>
            <span className="telemetry-lbl">State Ticker</span>
          </div>
          <div className="telemetry-divider" />
          <div className="telemetry-item">
            <span className="telemetry-val text-yellow">VRF</span>
            <span className="telemetry-lbl">Provably Fair</span>
          </div>
          <div className="telemetry-divider" />
          <div className="telemetry-item">
            <span className="telemetry-val text-cyan">0-Click</span>
            <span className="telemetry-lbl">Session Keys</span>
          </div>
          <div className="telemetry-divider" />
          <div className="telemetry-item">
            <span className="telemetry-val text-green">~$0</span>
            <span className="telemetry-lbl">Sub-Block Gas</span>
          </div>
        </div>
      </section>

      {/* The Graveyard Resurrection Section */}
      <section id="graveyard" className="graveyard-section">
        <div className="section-header">
          <span className="section-kicker">THE GRAVEYARD INTEL</span>
          <h2 className="section-title">Why 6 Teams Abandoned This on Base Solana</h2>
          <p className="section-subtitle">
            Base Solana is fast for financial swaps, but completely unviable for high-velocity multiplayer reaction games. Here is how Ephemeral Rollups change everything:
          </p>
        </div>

        <div className="duel-comparison-grid">
          {/* Failed Attempt on Base Solana */}
          <div className="duel-column duel-column-dead">
            <div className="column-header">
              <span className="column-status-icon"><Skull size={22} /></span>
              <h3>Base Solana L1 (6 Failed Teams)</h3>
            </div>
            <ul className="duel-points">
              <li>
                <strong>400ms Block Latency:</strong> When the multiplier is soaring, 400ms of slot lag means you get rugged before your bailout transaction even reaches a validator.
              </li>
              <li>
                <strong>Wallet Signature Friction:</strong> Prompting Phantom on every click kills reaction time. By the time you approve, you&apos;re dead.
              </li>
              <li>
                <strong>Gas & Frontrunning:</strong> Network congestion causes failed transactions and MEV frontrunning on bailout queues.
              </li>
              <li>
                <strong>Verdict:</strong> Unplayable. The graveyard of abandoned crash games.
              </li>
            </ul>
          </div>

          {/* Resurrected on MagicBlock ER */}
          <div className="duel-column duel-column-alive">
            <div className="column-header">
              <span className="column-status-icon"><Zap size={22} /></span>
              <h3>Resurrected with MagicBlock ER</h3>
            </div>
            <ul className="duel-points">
              <li>
                <strong>10ms Sub-Block Loop:</strong> High-frequency state transitions run inside an Ephemeral Rollup at 100Hz. Sub-second reflexes actually work.
              </li>
              <li>
                <strong>1-Click Session Keys:</strong> Pre-authorized ephemeral delegate keys execute instant bailouts with zero wallet popups.
              </li>
              <li>
                <strong>MagicBlock On-Chain VRF:</strong> The crash point is seeded with verifiable randomness on-chain. Provably fair, mathematically un-manipulatable.
              </li>
              <li>
                <strong>Atomic L1 Settlement:</strong> When the round finishes, winnings and states commit back to Solana devnet seamlessly.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Technical Architecture Section */}
      <section id="architecture" className="architecture-section">
        <div className="section-header">
          <span className="section-kicker">MAGICBLOCK STACK</span>
          <h2 className="section-title">How RugRoll Executes Under The Hood</h2>
        </div>

        <div className="arch-cards-grid">
          <div className="arch-card">
            <div className="arch-icon"><Zap size={26} /></div>
            <h3>Ephemeral Rollups (ER)</h3>
            <p>
              Round state accounts are delegated from Solana L1 into a 10ms MagicBlock ER runtime. Multiplier growth and bailouts execute with zero gas fees.
            </p>
          </div>

          <div className="arch-card">
            <div className="arch-icon"><Dices size={26} /></div>
            <h3>MagicBlock VRF Randomness</h3>
            <p>
              Before any player deposits, a VRF request seeds the crash point on-chain. No server operator can cheat or manipulate the outcome.
            </p>
          </div>

          <div className="arch-card">
            <div className="arch-icon"><KeyRound size={26} /></div>
            <h3>Session Keys Delegation</h3>
            <p>
              Players delegate an ephemeral keypair upon entering the round. Tapping &quot;BAIL OUT&quot; signs instantaneously in memory with zero Phantom popups.
            </p>
          </div>

          <div className="arch-card">
            <div className="arch-icon"><ShieldCheck size={26} /></div>
            <h3>Atomic Anchor Settlement</h3>
            <p>
              Once settled, the ER state commits a proof back to Solana L1, unlocking winner claims via standard Anchor instructions.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="landing-cta-banner">
        <h2>READY TO TEST YOUR REFLEXES?</h2>
        <p>Deposit SOL, watch the multiplier skyrocket at 100 FPS, and bail out before the crash.</p>
        <Link href="/game" className="btn-primary-glow btn-huge">
          <Rocket size={18} style={{ display: "inline", marginRight: "8px" }} />ENTER RUGROLL ARENA
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>
          Built for <strong>MagicBlock Blitz 8</strong> (September 2026) · Resurrecting the Solana Graveyard.
        </p>
      </footer>
    </main>
  );
}
