#!/usr/bin/env node
// Finalize .initia/submission.json before hackathon submit.
//
// Fills in commit_sha and repo_url from local git state so the judge
// can click through to the exact revision. Leaves deployed_address,
// rollup_chain_id, and demo_video_url alone — those have to be set
// by hand after the Minitia launch and demo upload.
//
// Usage: node scripts/finalize-submission.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const SUB = join(ROOT, ".initia", "submission.json");

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: "utf8" }).trim();
}

function safeGit(cmd, fallback = "") {
  try {
    return sh(cmd);
  } catch {
    return fallback;
  }
}

const sub = JSON.parse(readFileSync(SUB, "utf8"));

const headSha = safeGit("git rev-parse HEAD");
if (headSha && /^[0-9a-f]{40}$/.test(headSha)) {
  sub.commit_sha = headSha;
  console.log(`  commit_sha → ${headSha}`);
} else {
  console.warn("  ⚠ could not read git HEAD — commit_sha unchanged");
}

const remote = safeGit("git config --get remote.origin.url");
if (remote) {
  const https = remote
    .replace(/^git@github\.com:/, "https://github.com/")
    .replace(/^ssh:\/\/git@github\.com\//, "https://github.com/")
    .replace(/\.git$/, "");
  sub.repo_url = https;
  console.log(`  repo_url   → ${https}`);
} else {
  console.warn("  ⚠ no git remote origin — repo_url unchanged");
}

// Validate the shape against the hackathon spec so judges can't reject us
// for a missing field.
const REQUIRED = [
  "project_name",
  "repo_url",
  "commit_sha",
  "rollup_chain_id",
  "deployed_address",
  "vm",
  "native_feature",
  "core_logic_path",
  "native_feature_frontend_path",
  "demo_video_url",
];

const missing = REQUIRED.filter((k) => !sub[k] || String(sub[k]).includes("REPLACE_ME") || String(sub[k]).includes("pending"));
if (missing.length > 0) {
  console.warn("  ⚠ still-placeholder fields: " + missing.join(", "));
}

writeFileSync(SUB, JSON.stringify(sub, null, 2) + "\n");
console.log("[finalize-submission] wrote .initia/submission.json");
