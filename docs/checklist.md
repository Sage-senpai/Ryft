# RYFT Submission Checklist

Owner: VERA + KAI (co-own)
Deadline: Apr 14 2026 23:00 UTC (1h buffer before Apr 15 hard deadline)

Hackathon requirements (from https://docs.initia.xyz/hackathon):

- [ ] Project runs as own Initia appchain (Wasm Minitia, chain_id `ryft-1`)
- [ ] Frontend uses `@initia/interwovenkit-react` for wallet + tx flows
- [ ] Implements at least one native feature. RYFT ships all three:
  - [ ] `auto-signing` (session keys via AutoSign)
  - [ ] `interwoven-bridge` (card import from second Minitia, or attestation fallback)
  - [ ] `initia-usernames` (.init username display, never hex addresses)
- [ ] `.initia/submission.json` present with all required fields
- [ ] `README.md` at root with Initia Hackathon Submission section
- [ ] Demo video (3–5 min) linked in submission
- [ ] GitHub repo public
- [ ] Meaningful custom logic (not a blueprint reproduction)

Derivable-by-judges:

- [ ] At least 2 transaction links showing real on-chain battle activity
- [ ] `commit_sha` in submission.json resolves to a real commit
- [ ] `deployed_address` resolves to a live contract on `ryft-1`
- [ ] `core_logic_path` points to a real file in the repo
- [ ] `native_feature_frontend_path` points to a real file in the repo
- [ ] Demo video shows full battle loop start to finish

Day-by-day cutoffs:

- **Day 1:** scaffold, docs, cards.json, contract stubs (today)
- **Day 2:** contracts compile, multitest green, atlas generated
- **Day 3:** `ryft-1` live via `weave rollup launch`, `infra/endpoints.json` committed
- **Day 4:** contracts deployed, addresses in `.env.example`, session key tested on chain
- **Day 5:** matchmaking server on Railway, API frozen, lobby wired to server
- **Day 6:** BattleScene end-to-end, animations tied to on-chain events
- **Day 7:** Bridge (real or attestation fallback) working
- **Day 8:** MIRA playtest with 5 non-crypto users, fix top 3 friction points
- **Day 9:** Demo recording, `submission.json` final commit
