# RYFT

**Cross-chain combat. Proven on-chain.**

RYFT is a real-time animated card battle game on its own Initia appchain. Players
connect with their `.init` username, queue into a lobby, and battle with
Phaser-animated NFT cards. Every card play auto-signs via InterwovenKit session
keys — zero wallet popups during battle. Cards can be imported from a second
Initia appchain via the Interwoven Bridge.

## Initia Hackathon Submission

- **Appchain:** `ryft-1` (Wasm Minitia)
- **Frontend:** `@initia/interwovenkit-react` for all wallet + transaction flows
- **Native features implemented:**
  - **Auto-signing** — `packages/web/src/hooks/useSessionKey.ts`
  - **Initia Usernames** — `packages/web/src/hooks/useIdentity.ts` (resolves
    `.init` via InterwovenKit `username` field)
  - **Interwoven Bridge** — `packages/web/src/components/BridgePanel.tsx`
    (opens `openBridge({ srcChainId, dstChainId, ... })`)
- **Submission manifest:** [`.initia/submission.json`](.initia/submission.json)

## Architecture

```
packages/
├── game/       Phaser 3 game (scenes, sprites, EventBus)
├── web/        Next.js 14 app shell (InterwovenKitProvider, hooks, UI)
├── contracts/  CosmWasm crates: ryft_card_registry, ryft_battle, ryft_session
├── server/     Node.js + ws matchmaking server
└── types/      @ryft/types — shared TS interfaces (generated from Rust)
```

Design docs: [`docs/`](docs/) — read `scene-map.md`, `session-key-spec.md`,
`API.md`, and `cards.json` before contributing.

## Local dev

```bash
pnpm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_* vars from infra/endpoints.json after `weave rollup launch`
pnpm dev
```

## Running the appchain

```bash
weave rollup launch --with-config infra/weave.config.json --vm wasm
```

Endpoints get written to `infra/endpoints.json` after launch.

## Demo

- **Live URL:** https://ryft.gg
- **Video:** see `demo_video_url` in submission.json
- **Testnet:** `ryft-1`

## Team

- **COLE** — Frontend + Phaser
- **VERA** — Contracts + Infra
- **MIRA** — Game design + UX
- **KAI** — Backend + DevOps
