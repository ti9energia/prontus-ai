#!/usr/bin/env node
/**
 * i18n parity check — every locale catalog must have the EXACT same key set as the
 * source (pt-BR). Exits 1 on any missing/extra key. Wired into CI to enforce the
 * house rule (00-PADRAO §6): no key may be missing in any of the 4 catalogs.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'messages');
const SOURCE = 'pt-BR';
const LOCALES = ['pt-BR', 'en', 'zh-CN', 'fr-FR'];

function flatten(obj, prefix = '', out = new Set()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, key, out);
    else out.add(key);
  }
  return out;
}

const keys = {};
for (const l of LOCALES) {
  keys[l] = flatten(JSON.parse(readFileSync(join(dir, `${l}.json`), 'utf8')));
}

const source = keys[SOURCE];
let failed = false;
console.log(`\n🌐 i18n parity check (source: ${SOURCE}, ${source.size} keys)\n`);

for (const l of LOCALES) {
  if (l === SOURCE) continue;
  const missing = [...source].filter((k) => !keys[l].has(k));
  const extra = [...keys[l]].filter((k) => !source.has(k));
  if (missing.length || extra.length) {
    failed = true;
    console.log(`  ✗ ${l}: ${missing.length} missing, ${extra.length} extra`);
    missing.slice(0, 25).forEach((k) => console.log(`      − missing: ${k}`));
    extra.slice(0, 25).forEach((k) => console.log(`      + extra:   ${k}`));
  } else {
    console.log(`  ✓ ${l}: ${keys[l].size} keys, in parity`);
  }
}

console.log('');
process.exit(failed ? 1 : 0);
