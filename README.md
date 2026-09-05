# 💀 RugRoll — Provably Fair Crash Game on MagicBlock Ephemeral Rollups

> **MagicBlock Blitz 8 Submission** · Sep 4–11, 2026  
> **Graveyard Resurrection:** 6 teams attempted _Reaction Battle Royale_ on base Solana and failed because 400ms latency ruined reaction timing. We resurrected it with a **10ms Ephemeral Rollup loop**, **MagicBlock VRF crash seed**, and **1-click Session Keys**.

---

## 🎮 What Is RugRoll?

A high-frequency multiplayer game of "Chicken" around SOL volatility:

1. 2–10 players deposit SOL into an **Ephemeral Rollup** pot
2. A multiplier climbs in real time: `1.00× → 1.25× → 1.80× → 3.50× → 12.00×` ticking every **10 milliseconds**
3. Players tap **BAIL OUT** (1-click, no wallet popup via Session Keys) to lock their multiplier
4. The **crash point** is pre-seeded by **MagicBlock VRF** — provably fair, operator-cannot-manipulate
5. Players who bailed before the crash collect `deposit × multiplier`; players still holding when it rugs lose their stake

## 🚀 Why This Is IMPOSSIBLE on Base Solana

| Base Solana | RugRoll with MagicBlock |
|-------------|------------------------|
| ~400ms block time | **10ms** Ephemeral Rollup sub-blocks |
| Gas fees on every bail-out | **Gasless** via Session Keys |
| No trustless randomness <0.002 SOL/call | **Free VRF** via ephemeral oracle |
| Players front-run each other | Bail-out is per-player PDA, MEV-resistant |

## 🏛️ MagicBlock Primitives Used

| Primitive | How RugRoll Uses It |
|-----------|---------------------|
| **Ephemeral Rollups (ER)** | `GameRound` PDA delegated to ER; all `join_round` + `bail_out` txs go to ER RPC at 10ms |
| **MagicBlock VRF** | `request_crash` → oracle callback → `resolve_crash` seeds the hidden crash point |
| **Session Keys** | Player pre-signs a session, `bail_out` fires with zero wallet popup |
| **Magic Actions** | `claim_winnings` commits ER state back to Solana L1 atomically |

---

## 🗂️ Repository Structure

```
rugroll/
├── programs/rugroll/          # Anchor on-chain program
│   └── src/
│       ├── lib.rs             # Program entrypoint & instruction dispatch
│       ├── error.rs           # Custom error codes
│       ├── state/mod.rs       # GameRound + PlayerPosition accounts
│       └── instructions/
│           ├── open_round.rs  # Create round + delegate to ER
│           ├── join_round.rs  # Player deposits SOL (ER)
│           ├── bail_out.rs    # Player locks multiplier (ER, session key)
│           ├── request_crash.rs  # Trigger VRF request (ER)
│           ├── resolve_crash.rs  # VRF callback → crash point (ER)
│           └── claim_winnings.rs # Player claims payout (L1)
├── app/                       # Next.js frontend
│   └── src/
│       ├── app/page.tsx       # Landing page
│       ├── app/game/page.tsx  # Live game page
│       ├── components/
│       │   ├── MultiplierChart.tsx    # Real-time Chart.js line chart
│       │   ├── MultiplierDisplay.tsx  # Big animated multiplier number
│       │   ├── BailoutButton.tsx      # Context-aware action button
│       │   ├── PlayerPanel.tsx        # Player list + pot display
│       │   └── WalletProviders.tsx    # Phantom + connection stack
│       └── lib/
│           ├── constants.ts    # RPC endpoints, PDAs, math utils
│           └── GameContext.tsx # ER polling, multiplier ticker, actions
├── Anchor.toml
└── Cargo.toml
```

---

## 🔄 On-Chain Lifecycle

```
L1: open_round()   →  [GameRound delegated to ER]
ER: join_round()   →  player deposits, round goes Live at MIN_PLAYERS
ER: bail_out()     →  player locks multiplier (session key, no popup)
ER: request_crash() → VRF oracle queued
ER: resolve_crash() ← oracle callback; crash_point_bps set; round Settled
L1: claim_winnings() → winners pull their SOL; ER commits back to L1
```

---

## 🛠️ Development Setup

### Prerequisites
- Rust 1.89+, Anchor CLI 0.31+, Solana CLI 2.2+, Node 20+

### 1. Build the program
```bash
cd rugroll
anchor build
```

### 2. Deploy to devnet
```bash
anchor deploy --provider.cluster devnet
# Copy the program ID → update declare_id! in lib.rs + Anchor.toml
```

### 3. Run the frontend
```bash
cd app
npm install
npm run dev
```

Open `http://localhost:3000`

---

## 🧮 Crash Point Math

The crash point is derived from VRF bytes with a **3% house edge**:

```
crash_bps = clamp(
  floor(10000 * 9700 / (raw_u64 % 10000 + 1)),
  MIN=101,
  MAX=10000
)
```

This gives `P(crash > x×) ≈ 0.97 / x`, meaning:
- 97% chance of crashing above 1× (never instant rug)
- 48.5% chance of surviving past 2×
- ~9.7% chance past 10×

Expected value for players = **0.97** (97% return, 3% house edge).

---

## 🎬 60-Second Demo Script

1. Open 3 browser tabs side-by-side (3 players)
2. Each connects Phantom, deposits 0.1 SOL — round goes **Live**
3. Multiplier climbs: `1.03× → 1.18× → 2.45× → 5.2x…`
4. Player 1 panics → **BAIL OUT** at `2.1×` (no popup, session key signs)
5. Player 2 → **BAIL OUT** at `5.4×`
6. Multiplier hits `8.9×` and **💥 RUGS** — Player 3 gets wrecked
7. Devnet explorer shows the VRF signature committing the crash point

---

## 📜 License

MIT — Built for MagicBlock Blitz 8, September 2026.
