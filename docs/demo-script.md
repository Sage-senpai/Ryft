# RYFT Demo Script

Owner: KAI + MIRA
Target length: **3:00** (hard cap at 3:30)
Format: Landscape 1080p, 60fps. Single continuous take, no cuts.
Recording: OBS with the Chromium window source at exactly 1280×720 client area.

## Pre-flight (60 seconds before record)

- [ ] Close all other tabs. Minimize Discord, Slack, email.
- [ ] Disable OS notifications (Windows Focus / macOS Do Not Disturb).
- [ ] `cd packages/web && NODE_OPTIONS=--max-old-space-size=8192 pnpm dev`
- [ ] Open `http://localhost:3000` in Chrome incognito. Wait for the hero
      to fully paint and InterwovenKit's Privy script to load.
- [ ] Confirm your wallet has a `.init` username registered on
      `interwoven-1` so it shows as `@yourname.init` in the HUD.
- [ ] Hard refresh (Ctrl+Shift+R) so Privy state starts clean.
- [ ] Open OBS. Scene: `RYFT-demo`. Source: Window Capture on the
      Chrome window. Audio: mic on, system sound off.
- [ ] 3, 2, 1, record.

## Beat sheet (timestamps are cumulative)

### 0:00 — Hero (8s)

> "RYFT is a cross-chain animated card battle game on Initia. Every card
> is a cross-chain asset. Every play is proven on-chain. And there's not
> a single wallet popup during battle."

On-screen: the landing hero with the gradient RYFT logo, the tagline,
and the three feature cards below. No cursor movement yet.

### 0:08 — Connect (12s)

Click **Sign in with .init**. InterwovenKit's Privy drawer opens.
Connect the pre-set up wallet.

> "I'm signing in with my Initia Username — the same identity across
> every Initia appchain."

On-screen: the drawer collapses, the hero swaps to the authenticated
HUD showing `@yourname.init` top right.

### 0:20 — Main menu → Lobby (10s)

The Phaser canvas boots. The RYFT logo breathes over the starfield
for 600ms, then the scene auto-advances to the Lobby because the
WALLET_CONNECTED event fires.

> "We're in the lobby. These are the Elemental Wardens currently queued."

Hover one of the mock players so the idle dot pulses visibly.

### 0:30 — Collection / Bring Cards (20s)

Click **Bring Cards**. The InterwovenKit Bridge drawer opens showing
the cross-chain transfer form.

> "This is the Interwoven Bridge — live, today. I can import any card
> from any Initia appchain into my RYFT deck in one tap. No manual
> contract calls, no chain switching."

Let the drawer sit on screen for 3 seconds so judges can see it's
the real Initia bridge, not a mock. Then close it.

### 0:50 — Quick Match → Battle (15s)

Click **QUICK MATCH**. The searching overlay appears, resolves to
`@voidmother.init`, the BattleScene loads.

> "Quick match. My opponent is matched by their .init name — never a
> hex address. We're both dropped straight into a match."

### 1:05 — Card play, turn 1 (20s)

Hover over your hand. Cards lift on hover. Click a **rare** card
(Emberstrike Warden or Frostbound Huntress, depending on the deal).

> "I play Emberstrike Warden. The card flies to center, the hit lands,
> the HP bar drops. And notice what didn't happen: no wallet popup.
> Auto-sign handled the transaction in the background."

Wait for the counter-attack animation to fully play and the draw
animation to pull one new card.

### 1:25 — Card play, turn 2 (20s)

Play a **legendary** card (The Unbroken or Voidmother). Emphasize
the larger hit, the flash, the bigger damage number.

> "Legendary cards hit harder. Everything here is typed end-to-end —
> the card data is a Rust struct in my CosmWasm contract, the same
> Rust struct generates the TypeScript type the Phaser scene imports,
> and the same data shape ends up in the battle log on-chain."

### 1:45 — Finish the match (30s)

Play through until either player hits 0 HP. Let the VICTORY or
DEFEAT screen land with the poetic subline.

> "Match resolved. The on-chain match record is final: opponent,
> turn count, winner, commit-reveal hashes for every play. Nothing
> we can't audit."

### 2:15 — Contracts flyover (25s)

Cut to the code editor (OBS scene 2 — VS Code with
`packages/contracts/ryft_battle/src/lib.rs` open). Don't scroll
random code; stop on the `ExecuteMsg` enum and the two multitest
cases at the bottom of the file.

> "Here's the battle contract. Three variants: OpenMatch,
> CommitPlay, RevealPlay. Commit-reveal means your hand is hidden
> until you reveal it. The session-key scope test asserts that
> a session key can never call the card registry — only battle
> execute messages. All five multitest cases are green."

### 2:40 — Closing (20s)

Cut back to the hero scene (OBS scene 1).

> "RYFT: three native Initia features working today — auto-signing
> UX, the Interwoven Bridge, and Initia Usernames. Runs on its own
> ryft-1 Minitia. Ships with a live matchmaking server and
> end-to-end typed contracts. Thanks."

Fade to black at 3:00.

## Required retakes

- If the Privy drawer fumbles or takes > 4 seconds to open, retake.
- If the BattleScene happens to deal you 5 commons and no rare/legendary
  shows up, retake — you need at least one rare AND one legendary in
  the demo hand.
- If the RYFT logo animation visibly stutters on the first frame
  (devtools can cause this on first compile), retake after a warm
  reload.

## Upload + link

1. Upload to Loom (preferred — no watermark, fast) or YouTube unlisted.
2. Paste the URL into [`.initia/submission.json`](../.initia/submission.json)
   as `demo_video_url`.
3. Run `node scripts/finalize-submission.mjs` to auto-populate
   `commit_sha` and `repo_url` from git.
