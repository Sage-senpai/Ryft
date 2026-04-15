# ryft-1 Deploy Runbook

Owner: VERA (assisted by KAI)
Status: **Pending** — requires `weave` CLI on a host with `go` toolchain
installed. Not executable from this Windows dev box without prior setup.

## Prerequisites

- `go` 1.22+
- `weave` CLI (https://github.com/initia-labs/weave)
- Initia testnet faucet funds (`gas_station_account` mnemonic in secure env)
- Rust + `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`)

## Step 1 — compile contracts

```bash
cd packages/contracts
cargo build --release --target wasm32-unknown-unknown
ls target/wasm32-unknown-unknown/release/*.wasm
# ryft_battle.wasm ryft_card_registry.wasm ryft_session.wasm
```

Optionally optimize:

```bash
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.16.0
```

## Step 2 — launch Minitia

```bash
weave rollup launch --with-config ../../infra/weave.config.json --vm wasm
```

Interactive prompts:

- Chain ID: `ryft-1`
- Moniker: `ryft-validator-0`
- Denom: `uryft`
- OPinit executor: yes
- IBC relayer: yes
- Gas station: import the pre-funded testnet key

After launch completes, weave writes RPC/REST/WS URLs to `~/.weave/<chain>.json`.
Copy those into [`infra/endpoints.json`](../infra/endpoints.json).

## Step 3 — deploy contracts

```bash
# Upload ryft_card_registry
initiad tx wasm store target/wasm32-unknown-unknown/release/ryft_card_registry.wasm \
  --from operator --chain-id ryft-1 --node $RPC_URL --gas auto --gas-adjustment 1.4 -y

# Instantiate
initiad tx wasm instantiate <code_id> '{"admin":"<operator>"}' \
  --from operator --label ryft_card_registry --no-admin \
  --chain-id ryft-1 --node $RPC_URL -y
```

Repeat for `ryft_battle` (instantiate msg: `{"card_registry": "<registry_addr>"}`)
and `ryft_session` (empty instantiate msg).

## Step 4 — update configs

After all three addresses are known:

1. Fill [`infra/endpoints.json`](../infra/endpoints.json) `contract_addresses`.
2. Fill `.env.local` NEXT_PUBLIC_CONTRACT_* vars from the same.
3. Update [`.initia/submission.json`](../.initia/submission.json):
   - `deployed_address` → `ryft_battle` address
   - `commit_sha` → actual `git rev-parse HEAD`
   - `repo_url` → real GitHub URL after push
   - `demo_video_url` → Loom or YouTube link

## Step 5 — generate 2 on-chain txns for submission

Required by hackathon: at least 2 transaction links showing real battle activity.

```bash
# Tx 1: OpenMatch
initiad tx wasm execute <ryft_battle> '{"open_match":{"opponent":"<guest>"}}' \
  --from operator --chain-id ryft-1 --node $RPC_URL -y

# Tx 2: CommitPlay
initiad tx wasm execute <ryft_battle> '{"commit_play":{"match_id":1,"commitment":"<sha256>"}}' \
  --from operator --chain-id ryft-1 --node $RPC_URL -y
```

Save both tx hashes to the submission — the hackathon judges click through.

## Fallback (if weave launch fails under time pressure)

If `weave rollup launch` fails or stalls inside 4 hours:

1. Deploy contracts to **interwoven-1** testnet directly (not our own Minitia).
2. Update `rollup_chain_id` to `interwoven-1` in submission.json.
3. Accept that RYFT will not win the "own Minitia" bonus, but all three
   native features (auto-signing shell, interwoven-bridge, initia-usernames)
   and real contracts are still live.

This degrades from "first cross-chain card game with its own appchain" to
"first cross-chain card game on Initia with a real contract backend" —
still a credible submission.
