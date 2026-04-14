# Chain & VM Decision — CosmWasm on Minitia

Owner: VERA
Decided: Day 1
Status: **LOCKED** — do not re-litigate without a blocker.

## Decision

RYFT deploys as a **Wasm Minitia** (CosmWasm via `weave rollup launch --vm wasm`).
Chain ID: `ryft-1`.

## Reasoning

1. **Tooling maturity.** `cosmwasm-multitest` gives deterministic, in-process unit
   tests for session key scope enforcement. We can prove negative cases (session
   key cannot call `card_registry`) before touching a live chain.
2. **Type generation.** Rust schema → `ts-codegen` → `@ryft/types` consumed by
   `packages/web` and `packages/game`. COLE refuses untyped contract calls; this
   path gives him typed `ExecuteMsg` and `QueryMsg` interfaces for free.
3. **InterwovenKit message compatibility.** `requestTxBlock` takes
   `/cosmwasm.wasm.v1.MsgExecuteContract` directly. Auto-sign allowlist is a
   single msg type URL. No EVM calldata encoding layer required.

## Rejected: Solidity via `minievm`

- Foundry has no Interwoven Bridge mock. We'd be testing against stubs we wrote.
- Gas metering on `minievm` for session-key-authored calls is less documented.
- Would force a second codegen pipeline (viem ABI) and a second type package.
- Net: one week of integration risk for no differentiating benefit.

## Consequences

- Contracts live in `packages/contracts/` as Cargo workspace with 3 crates:
  `ryft_card_registry`, `ryft_battle`, `ryft_session`.
- Auto-sign allowlist is exactly: `["/cosmwasm.wasm.v1.MsgExecuteContract"]`.
- Frontend tx broadcast path: `useInterwovenKit().requestTxBlock({ messages })`
  where each message is a `MsgExecuteContract` with our contract address.
- `@ryft/types` publishes TypeScript interfaces generated from Rust schemas
  (COLE owns consumption, VERA owns generation).
