import Link from "next/link";

export default function HomePage() {
  return (
    <main className="landing">
      <div className="landing-bg" />
      <div className="landing-content">
        <div className="logo-badge">⚡ MagicBlock Ephemeral Rollups</div>
        <h1 className="landing-title">
          <span className="title-rug">Rug</span>
          <span className="title-roll">Roll</span>
        </h1>
        <p className="landing-tagline">
          10ms provably-fair crash game on Solana.
          <br />
          Bail out before the rug. Or lose everything.
        </p>

        <div className="stats-row">
          <div className="stat">
            <span className="stat-value">10ms</span>
            <span className="stat-label">Block Time</span>
          </div>
          <div className="stat">
            <span className="stat-value">VRF</span>
            <span className="stat-label">Provably Fair</span>
          </div>
          <div className="stat">
            <span className="stat-value">0-click</span>
            <span className="stat-label">Session Keys</span>
          </div>
          <div className="stat">
            <span className="stat-value">~$0</span>
            <span className="stat-label">Gas Fees</span>
          </div>
        </div>

        <Link href="/game" id="play-now-btn" className="cta-btn">
          🎮 PLAY NOW
        </Link>

        <div className="graveyard-banner">
          <span className="grave-icon">💀</span>
          <p>
            <strong>Graveyard Resurrection:</strong> 6 teams attempted &quot;Reaction Battle
            Royale&quot; on base Solana and failed. We built it with 10ms ER blocks.
          </p>
        </div>

        <div className="tech-pills">
          <span className="pill">Ephemeral Rollups</span>
          <span className="pill">MagicBlock VRF</span>
          <span className="pill">Session Keys</span>
          <span className="pill">Anchor 0.31</span>
          <span className="pill">Solana Devnet</span>
        </div>
      </div>
    </main>
  );
}
