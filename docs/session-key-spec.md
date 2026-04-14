# Session Key Spec — RYFT Auto-Sign Contract

Owner: VERA
Consumers: COLE (frontend hooks), KAI (env vars)
Status: **Day 1 draft** — frozen Day 2 after COLE review.

## Overview

RYFT uses InterwovenKit's built-in AutoSign (authz + feegrant) to grant a derived
grantee wallet permission to execute the `ryft_battle` contract on the player's
behalf for 1 hour. The player sees one drawer confirmation at login, then zero
popups for the entire session. Fees are paid by the feegrant from the player's
main wallet — no operator subsidy.

This is NOT a custom session key contract. InterwovenKit creates a
`MsgGrantAllowance` (feegrant) + `MsgGrant` (authz) pair scoped to a single msg
type URL for a single chain.

## Scope

- **Chain:** `ryft-1` only.
- **Allowed msg type URLs:** `["/cosmwasm.wasm.v1.MsgExecuteContract"]`
- **Contract allowlist:** `ryft_battle` address only. Enforced at the contract
  level by asserting `info.sender` matches an active match participant for every
  `ExecuteMsg` variant except `OpenMatch`.
- **Grantee storage:** InterwovenKit stores the grantee key per app origin. We
  never read or write the grantee private key from our code.

## Lifecycle

```
  [Connect wallet]
        │
        ▼
  autoSign.enable("ryft-1")                    ← single user confirmation
        │                                         (authz + feegrant drawer)
        ▼
  EventBus.emit("PLAY_CARD", { ... })          ← in-game, zero popups
        │
        ▼
  useRyftAction() → requestTxBlock({           ← InterwovenKit signs with
    messages: [MsgExecuteContract(            ← grantee, broadcasts under
      contract: RYFT_BATTLE,                  ← feegrant
      msg: { commit_play: {...} },
    )]
  })
        │
        ▼
  EventBus.emit("ACTION_CONFIRMED", { txHash })
        │
        ▼
  BattleScene plays attack animation
```

## Renewal

`autoSign.expiredAtByChain["ryft-1"]` returns the grant expiration Date.
`useSessionKey` hook polls every 60s; if `expiredAt - now < 300s`, calls
`autoSign.enable("ryft-1")` again. The renewal drawer CAN interrupt the player,
so MIRA's UX rule is: renewals only happen at turn boundaries, never mid-attack.
If the hook detects <300s remaining AND the player is mid-turn, it queues the
renewal until `TURN_ENDED` fires.

## Gas estimates (testnet, multitest-derived placeholders)

| Action                           | Gas (est) | Notes                                 |
|----------------------------------|-----------|---------------------------------------|
| `autoSign.enable` (authz+feegrant)| ~180_000  | One-time per session                  |
| `OpenMatch`                      | ~120_000  | Player-signed, not session-key        |
| `CommitPlay` (commit phase)      | ~85_000   | Session-key signed                    |
| `RevealPlay` (reveal phase)      | ~92_000   | Session-key signed                    |
| `ResolveMatch`                   | ~140_000  | Anyone can call, usually loser        |

All numbers placeholder pending Day-3 multitest output.

## Scope enforcement — the test that must pass

```rust
#[test]
fn session_key_cannot_call_card_registry() {
    // grant session key scoped to ryft_battle
    // attempt MsgExecuteContract(ryft_card_registry, TransferCard{...})
    // assert: Err(Unauthorized)
}
```

No contract deploy to `ryft-1` without this test green. No exceptions.
