#!/usr/bin/env node
// Post-install patch: fix package.json `exports` fields in @cosmjs/* and
// cosmjs-types so deep `.js`-suffixed imports from InterwovenKit resolve.
//
// Why: InterwovenKit 2.0 was compiled with imports like
//   `cosmjs-types/cosmos/tx/v1beta1/tx.js`
//   `@cosmjs/amino/build/signdoc.js`
// but modern @cosmjs packages only export `.` and cosmjs-types explicitly
// blocks `"./*.js": null`. This script rewrites those package.json files.
//
// Idempotent. Runs on every `pnpm install` via the root `postinstall` hook.

import { readdirSync, readFileSync, writeFileSync, lstatSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "..", "..");
const PNPM_DIR = join(ROOT, "node_modules", ".pnpm");

// .pnpm layout: .pnpm/<pkg>@<hash>/node_modules/<scope?>/<pkg>/package.json
// We only need depth 4 at most from PNPM_DIR, and we must skip symlinks to
// avoid cycles. Use lstatSync to detect symlinks.

function listRealDirs(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const out = [];
  for (const name of entries) {
    const full = join(dir, name);
    let st;
    try {
      st = lstatSync(full);
    } catch {
      continue;
    }
    if (st.isDirectory() && !st.isSymbolicLink()) {
      out.push({ name, full });
    }
  }
  return out;
}

function collectTargetPackageJsons() {
  const files = [];
  // level 1: .pnpm/<pkg>@<hash>
  for (const l1 of listRealDirs(PNPM_DIR)) {
    // only descend into dirs that look like @cosmjs+... or cosmjs-types@...
    if (!l1.name.startsWith("@cosmjs+") && !l1.name.startsWith("cosmjs-types@")) continue;
    // level 2: .pnpm/<pkg>@<hash>/node_modules
    const nm = join(l1.full, "node_modules");
    for (const l2 of listRealDirs(nm)) {
      if (l2.name.startsWith("@cosmjs") || l2.name === "@cosmjs") {
        // level 3: .pnpm/.../node_modules/@cosmjs/<name>
        for (const l3 of listRealDirs(l2.full)) {
          files.push(join(l3.full, "package.json"));
        }
      } else if (l2.name === "cosmjs-types") {
        files.push(join(l2.full, "package.json"));
      }
    }
  }
  return files;
}

function patchFile(file) {
  let pkg;
  try {
    pkg = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return false;
  }
  const existing = pkg.exports;
  const before = JSON.stringify(existing ?? null);

  if (pkg.name === "cosmjs-types") {
    pkg.exports = {
      ".": { types: "./index.d.ts", default: "./index.js" },
      "./*": { types: "./*.d.ts", default: "./*.js" },
      "./*.js": { types: "./*.d.ts", default: "./*.js" },
      "./package.json": "./package.json",
    };
  } else if (pkg.name && pkg.name.startsWith("@cosmjs/")) {
    let rootEntry = existing?.["."];
    if (!rootEntry && existing && (existing.types || existing.default || existing.import || existing.require)) {
      rootEntry = {};
      if (existing.types) rootEntry.types = existing.types;
      if (existing.import) rootEntry.import = existing.import;
      if (existing.require) rootEntry.require = existing.require;
      if (existing.default) rootEntry.default = existing.default;
    }
    if (!rootEntry && pkg.main) {
      rootEntry = { default: pkg.main.startsWith("./") ? pkg.main : "./" + pkg.main };
      if (pkg.types) rootEntry.types = pkg.types.startsWith("./") ? pkg.types : "./" + pkg.types;
    }
    if (!rootEntry) return false;
    pkg.exports = {
      ".": rootEntry,
      "./*": "./*",
      "./*.js": "./*.js",
      "./package.json": "./package.json",
    };
  } else {
    return false;
  }

  const after = JSON.stringify(pkg.exports);
  if (after === before) return false;
  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  return true;
}

console.log("[patch-cosmjs-exports] scanning .pnpm store");
const files = collectTargetPackageJsons();
console.log(`[patch-cosmjs-exports] found ${files.length} candidate package.json files`);

let patched = 0;
for (const f of files) {
  if (patchFile(f)) {
    patched++;
    try {
      const n = JSON.parse(readFileSync(f, "utf8")).name;
      console.log(`  patched ${n}`);
    } catch {}
  }
}
console.log(`[patch-cosmjs-exports] patched ${patched} packages`);
