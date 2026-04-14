# Phaser Scene Map

Owner: COLE
Consumers: MIRA (wires UI components into scene events), KAI (LobbyScene imports ws client)
Status: **Day 1 contract** — any new scene or event requires this file to be updated
in the same PR.

## Scene list

| Key          | File                       | Owns                                        |
|--------------|----------------------------|---------------------------------------------|
| `Boot`       | `scenes/BootScene.ts`      | Asset manifest load, preloader handoff       |
| `Preload`    | `scenes/PreloadScene.ts`   | Texture atlas + audio, progress bar         |
| `MainMenu`   | `scenes/MainMenuScene.ts`  | Title, Connect .init button overlay          |
| `Lobby`      | `scenes/LobbyScene.ts`     | Player list, queue buttons, bridge panel     |
| `Battle`     | `scenes/BattleScene.ts`    | Card play, animation playback, HP bars       |
| `GameOver`   | `scenes/GameOverScene.ts`  | Winner reveal, rematch / return buttons      |

## Strict rules

1. **No `await` inside `update()`.** Ever. `update()` is frame-rate critical.
   All async work goes through the EventBus and resolves via an `ACTION_CONFIRMED`
   event that the scene listens for.
2. **No wallet state inside scenes.** Scenes never call `useInterwovenKit()` or
   touch wallet context directly. Wallet state is pushed into the Phaser
   registry (`this.registry.set('address', addr)`) by a React wrapper, and
   scenes only read from the registry.
3. **No hardcoded tween durations.** All ms values come from
   `docs/animation-beats.json`, loaded in `BootScene` and placed on the registry
   as `beats`. Scenes read `this.registry.get('beats').attack_ms`.
4. **One in-progress tween per card per rarity.** Concurrent tweens on the same
   card are a bug — the EventBus queue must serialize card actions.

## EventBus event dictionary

Events flow bidirectionally between the Phaser game and the React shell. The
React side owns wallet / network I/O; the Phaser side owns rendering.

### React → Phaser

| Event                | Payload                                         | Consumer scene |
|----------------------|-------------------------------------------------|----------------|
| `WALLET_CONNECTED`   | `{ address: string, username: string }`         | MainMenu, Lobby|
| `WALLET_DISCONNECTED`| `{}`                                            | any            |
| `SESSION_KEY_READY`  | `{ chainId: string, expiresAt: number }`        | Lobby, Battle  |
| `LOBBY_SNAPSHOT`     | `{ players: LobbyPlayer[] }`                    | Lobby          |
| `MATCH_FOUND`        | `{ matchId, opponent, role, onChainMatchId }`   | Lobby → Battle |
| `ACTION_CONFIRMED`   | `{ eventId: string, txHash: string }`           | Battle         |
| `ACTION_FAILED`      | `{ eventId: string, code: string }`             | Battle         |
| `OPPONENT_MOVED`     | `{ cardId, target, damage }`                    | Battle         |
| `MATCH_RESOLVED`     | `{ winner: "me" \| "opponent", reason: string }`| Battle → GameOver |

### Phaser → React

| Event                | Payload                                         | Handler        |
|----------------------|-------------------------------------------------|----------------|
| `REQUEST_CONNECT`    | `{}`                                            | MainMenu button|
| `REQUEST_QUEUE`      | `{ mode: "quick" }`                             | Lobby button   |
| `REQUEST_BRIDGE_OPEN`| `{}`                                            | Lobby button   |
| `PLAY_CARD`          | `{ eventId, cardId, targetIndex }`              | Battle card tap|
| `TURN_ENDED`         | `{ turnNumber }`                                | Battle         |
| `SCENE_READY`        | `{ sceneKey: string }`                          | any scene create|

## The play-card race

COLE's flagged risk: two `PLAY_CARD` events within 200ms (double-tap, combo).
Resolution: `useRyftAction()` maintains a FIFO queue. `PLAY_CARD` is enqueued,
not processed immediately. The hook processes one item at a time, awaiting
`requestTxBlock` for each before dequeuing. The card sprite enters a
`pending` state as soon as the tap lands (local optimistic), and only commits
to the `confirmed` state when `ACTION_CONFIRMED` arrives with the matching
`eventId`. If `ACTION_FAILED`, the sprite rolls back.

This means the player can queue 3 cards in one breath and they play in order,
at the animation pace dictated by `turn_ms`. No nonce collisions.

## Scene transition graph

```
Boot → Preload → MainMenu → Lobby ↔ Battle → GameOver → Lobby
                     ↑                                    ↑
              WALLET_DISCONNECTED                  REQUEST_QUEUE
```

GameOver → Lobby is the ONLY path back after a match. No jumping straight
into another queue without passing through Lobby (KAI's websocket client
needs the `match_ended` frame before accepting new `queue_join`).
