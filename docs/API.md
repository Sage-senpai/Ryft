# Matchmaking API Spec

Owner: KAI
Consumers: COLE (LobbyScene client), MIRA (lobby UI)
Status: **Day 1 draft** — frozen Day 5. Breaking changes require bumping
`X-Ryft-Api-Version` and notifying COLE + MIRA in the same PR.

## Transport

Single WebSocket endpoint. No REST for gameplay (REST only for `/health`).

- **URL:** `ws://localhost:3001` (dev) / `wss://ryft-matchmaking.up.railway.app` (prod)
- **Protocol:** JSON frames, one message per frame.
- **Heartbeat:** server sends `{ "type": "ping" }` every 20s; client replies `{ "type": "pong" }`.
- **Reconnect:** clients MUST exponential-backoff reconnect on close, starting at 1s, capped at 15s.

## Auth handshake (runs once per connection)

```
Client → Server:  { "type": "hello", "address": "init1...", "username": "player.init" }
Server → Client:  { "type": "challenge", "nonce": "<32-byte hex>" }
Client → Server:  { "type": "challenge_response", "signature": "<hex>" }
Server → Client:  { "type": "welcome", "session_id": "<uuid>" }
         or        { "type": "error", "code": "AUTH_FAILED" }
```

Signature is an InterwovenKit arbitrary-message sign over the nonce. Server
verifies by reconstructing the address from the signature.

## Match flow

```
Client → Server:  { "type": "queue_join", "mode": "quick" }
Server → Client:  { "type": "queue_joined", "position": 2 }
Server → Client:  { "type": "match_found",
                    "match_id": "<uuid>",
                    "opponent": { "address": "init1...", "username": "other.init" },
                    "role": "host" | "guest",
                    "on_chain_match_id": "<u64 as string>"
                  }
Client → Server:  { "type": "match_ready" }
Server → Client:  { "type": "match_start", "seed": "<hex>" }
```

The `host` client is responsible for calling `ryft_battle::OpenMatch` on-chain
and reporting the returned `match_id` back via `{ "type": "match_created",
"on_chain_match_id": "..." }`. The server relays this to the guest in the
`match_found` frame.

## Lobby list

```
Client → Server:  { "type": "lobby_subscribe" }
Server → Client:  { "type": "lobby_snapshot",
                    "players": [
                      { "username": "a.init", "status": "idle" },
                      { "username": "b.init", "status": "in_match" }
                    ]
                  }
Server → Client:  { "type": "lobby_delta", "added": [...], "removed": [...] }
```

## Error envelope

Every server→client error uses:

```
{ "type": "error", "code": "<SNAKE_CASE>", "message": "<human readable>", "recoverable": true | false }
```

Defined codes: `AUTH_FAILED`, `QUEUE_FULL`, `MATCH_CANCELLED`, `OPPONENT_LEFT`,
`SERVER_RESTART`, `INVALID_FRAME`, `NOT_AUTHENTICATED`.

## Health

`GET /health` → `200 { "ok": true, "version": "<semver>", "players_online": <n> }`

## Fallback demo mode

If Railway is down during demo, a `?demo=replay` URL param makes the client skip
the websocket entirely and replay a recorded match from `public/demo-match.json`.
This exists specifically because the demo cannot depend on a live server.
