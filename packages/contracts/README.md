# RYFT Contracts

Owner: VERA
VM: CosmWasm (see [../../docs/chain-choice.md](../../docs/chain-choice.md))

## Workspace

| Crate                | Purpose                                               |
|----------------------|-------------------------------------------------------|
| `ryft_card_registry` | Card ownership map, rarity/stat storage, mint authority |
| `ryft_battle`        | Match state (commit-reveal), prize escrow, resolution  |
| `ryft_session`       | Session metadata + revoke hooks (authz lives on-chain via InterwovenKit feegrant, this crate records match participation) |

## Build

```bash
cargo build --release --target wasm32-unknown-unknown
```

## Test

```bash
cargo test -p ryft_battle
cargo test -p ryft_card_registry
cargo test -p ryft_session
```

## Must-pass test before any deploy

See [../../docs/session-key-spec.md](../../docs/session-key-spec.md). The test
`session_key_cannot_call_card_registry` in `ryft_session` is a hard gate.
