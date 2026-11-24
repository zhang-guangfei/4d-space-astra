/**
 * Beyond 3D — Syntax & Static Invariant Check (`npm run check`)
 * Verifies every .js / .mjs file under src/, scripts/, tests/ with `node --check`
 * and checks rendering / pure-core isolation invariants.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scanRoots = ['src', 'scripts', 'tests'];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.mjs'))) {
      out.push(full);
    }
  }
  return out;
}

const files = scanRoots.flatMap((rel) => walk(path.join(rootDir, rel))).sort();
let checked = 0;

for (const file of files) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(rootDir, file);

  // Pure core isolation check: src/core/* must NEVER reference DOM or BABYLON
  if (rel.startsWith(`src${path.sep}core${path.sep}`)) {
    if (/\b(document|window|BABYLON)\b/.test(content)) {
      throw new Error(`Pure core violation in ${rel}: found browser/DOM/BABYLON reference.`);
    }
  }

  // Anti-regression rendering invariant: never assign needDepthPrePass to true in src/
  if (
    rel.startsWith(`src${path.sep}`) &&
    /needDepthPrePass\s*(?::|=)(?!=)\s*true/.test(content)
  ) {
    throw new Error(`Render invariant violation in ${rel}: needDepthPrePass must never be true.`);
  }

  checked += 1;
}

console.log(`✓ Syntax & static invariants passed across ${checked} JS/MJS files.`);
