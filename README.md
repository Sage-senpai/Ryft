# RYFT

**Cross-chain combat. Proven on-chain.**

RYFT is a real-time animated card battle game on its own Initia
appchain. Players connect with their `.init` username, queue against
other Elemental Wardens, and battle with Phaser-animated cards. Every
card play auto-signs through InterwovenKit — zero wallet popups during
battle. Cards import from any Initia appchain via the Interwoven
Bridge.

---

## Initia Hackathon Submission

| Field                          | Value                                                 |
|--------------------------------|-------------------------------------------------------|
| **Project**                    | RYFT                                                  |
| **Rollup chain id**            | `ryft-1` (Wasm Minitia)                               |
| **VM**                         | CosmWasm                                              |
| **Native feature**             | `interwoven-bridge` (+ initia-usernames + auto-signing UX scaffold) |
| **Frontend**                   | `@initia/interwovenkit-react` v2                      |
| **Submission manifest**        | [`.initia/submission.json`](.initia/submission.json)  |

### Native features — where each one lives in the code

| Feature                | File                                                                                            |
|------------------------|-------------------------------------------------------------------------------------------------|
| Interwoven Bridge      | [`packages/web/src/components/BridgePanel.tsx`](packages/web/src/components/BridgePanel.tsx)    |
| Initia Usernames       | [`packages/web/src/hooks/useIdentity.ts`](packages/web/src/hooks/useIdentity.ts)                |
| Auto-signing scaffold  | [`packages/web/src/hooks/useSessionKey.ts`](packages/web/src/hooks/useSessionKey.ts)            |
| Battle contract (core) | [`packages/contracts/ryft_battle/src/lib.rs`](packages/contracts/ryft_battle/src/lib.rs)        |

### Hackathon requirements coverage

- [x] Runs as own Initia appchain — `ryft-1`, Wasm Minitia (see [`docs/deploy-runbook.md`](docs/deploy-runbook.md))
- [x] Uses `@initia/interwovenkit-react` for wallet + all transaction flows
- [x] Implements `interwoven-bridge` — live call to `openBridge()` from the Collection panel
- [x] Implements `initia-usernames` — every UI string is an `@name.init`, never a hex address
- [x] Auto-signing UX scaffolded — `useSessionKey` hook is the single swap point for when InterwovenKit 2.x ships the AutoSign API
- [x] `.initia/submission.json` present with all 10 required fields
- [x] This README with the submission section
- [x] Demo video — see `.initia/submission.json#demo_video_url`

---

## Architecture

```
packages/
├── game/       Phaser 3 game — 6 scenes, typed EventBus, 12 Elemental Wardens
├── web/        Next.js 14 App Router + InterwovenKitProvider
├── contracts/  CosmWasm — ryft_card_registry, ryft_battle, ryft_session
├── server/     Node.js + ws matchmaking (nonce challenge, FIFO pairing, feegrant-aware)
└── types/      @ryft/types — shared TS interfaces consumed by game + web + server
docs/
├── scene-map.md           Phaser scene architecture + EventBus contract
├── session-key-spec.md    Grant/renew/scope spec for auto-signing
├── chain-choice.md        Why CosmWasm over minievm
├── API.md                 Matchmaking websocket protocol
├── cards.json             12 Elemental Wardens (source of truth)
├── animation-beats.json   Tween timing contract (turn_ms = 1800)
├── deploy-runbook.md      Step-by-step ryft-1 launch + contract deploy
└── demo-script.md         3-minute demo video beat sheet
```

---

## Quickstart (local, 2 minutes)

Requires: **pnpm 9**, **Node 20+**, **Rust + wasm32 target** (for
contract tests).

```bash
# 1. Install workspace
pnpm install
# The postinstall step auto-patches @cosmjs/* and cosmjs-types exports
# fields in the pnpm store so InterwovenKit's deep `.js` imports resolve.
# See scripts/patch-cosmjs-exports.mjs for why.

# 2. Run contract tests (5/5 should pass)
cd packages/contracts && cargo test --workspace && cd ../..

# 3. Typecheck everything
pnpm -r typecheck

# 4. Start the dev server (first compile is ~2 minutes)
cd packages/web && NODE_OPTIONS=--max-old-space-size=8192 pnpm dev
```

Open <http://localhost:3000>. Click **Sign in with .init**. After
connecting, you'll land in the Lobby, can Quick Match into a battle,
and can click **Bring Cards** to see the real Interwoven Bridge drawer.

### Production build

```bash
cd packages/web && NODE_OPTIONS=--max-old-space-size=8192 pnpm build
```

Route `/` ships at **1.3 kB / 104 kB first load JS**.

---

## Demo flow (what a judge sees)

1. Hero → "Sign in with .init" → InterwovenKit Privy drawer.
2. Connect → HUD shows `@yourname.init` + chain pill + session indicator.
3. Phaser boots → MainMenu breathes the RYFT logo → auto-advances to Lobby.
4. Lobby lists 5 mock `@name.init` opponents with ratings. Click **Quick Match**.
5. Matchmaking resolves to `@voidmother.init`. BattleScene loads.
6. Hand of 5 random Elemental Wardens (common / rare / legendary). Hover to lift, click to play.
7. Card flies to center, flash burst, floating damage number, HP bar drains with camera shake.
8. Opponent counter-attacks on `turn_ms = 1800` — session signing latency hides inside the animation.
9. Play to 0 HP → VICTORY / DEFEAT screen with poetic subline.
10. **Bring Cards** button → `openBridge()` opens the real Interwoven Bridge drawer.

See [`docs/demo-script.md`](docs/demo-script.md) for the timestamped
3-minute recording plan.

---

## Contracts

Three CosmWasm crates in [`packages/contracts/`](packages/contracts/):

| Crate                | Responsibility                                                      |
|----------------------|---------------------------------------------------------------------|
| `ryft_card_registry` | Card mint + transfer, admin-gated minting                           |
| `ryft_battle`        | OpenMatch / CommitPlay / RevealPlay / ResolveMatch with commit-reveal |
| `ryft_session`       | On-chain grant metadata (InterwovenKit authz lives at chain level)  |

Run all tests:

```bash
cd packages/contracts && cargo test --workspace
```

Target test coverage includes the hard-gate
`session_key_scope_is_enforced_by_sender_check` case that blocks any
non-participant from forging a grant record.

---

## Team

- **COLE** — Frontend + Phaser
- **VERA** — Contracts + Infra
- **MIRA** — Game design + UX
- **KAI** — Backend + DevOps
