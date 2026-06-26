#!/usr/bin/env node
/**
 * Aureon Health — lightweight security / pen-test scan.
 * Usage: node scripts/security-scan.mjs [url]   (default: https://aureonhealth.com)
 * Pass the live deploy URL as an argument when the canonical domain isn't wired yet,
 * e.g. `node scripts/security-scan.mjs https://prontus-ai.vercel.app`.
 * Checks security headers, blocked sensitive paths, API input validation,
 * method handling, info leakage and path traversal. Exits 1 on any failure.
 */
const base = (process.argv[2] || process.env.TARGET || 'https://aureonhealth.com').replace(/\/$/, '');

let pass = 0;
let fail = 0;
const rows = [];
function check(name, cond, detail = '') {
  cond ? pass++ : fail++;
  rows.push(`  ${cond ? '✓' : '✗'} ${name}${detail ? `  [${detail}]` : ''}`);
}

async function probe(path, opts) {
  try {
    return await fetch(base + path, { redirect: 'manual', ...(opts || {}) });
  } catch (e) {
    return { status: 0, headers: { get: () => null }, _err: String((e && e.message) || e) };
  }
}

(async () => {
  console.log(`\n🔒 Aureon Health security scan → ${base}\n`);

  // 1) Security headers
  const home = await probe('/pt-BR');
  const h = (k) => home.headers.get(k);
  check('X-Content-Type-Options: nosniff', h('x-content-type-options') === 'nosniff', h('x-content-type-options') || 'missing');
  check('X-Frame-Options present', !!h('x-frame-options'), h('x-frame-options') || 'missing');
  check('Referrer-Policy present', !!h('referrer-policy'), h('referrer-policy') || 'missing');
  check('Permissions-Policy present', !!h('permissions-policy'), h('permissions-policy') || 'missing');
  check('Content-Security-Policy present', !!h('content-security-policy'), h('content-security-policy') ? 'set' : 'missing');
  check('No X-Powered-By leak', !h('x-powered-by'), h('x-powered-by') || 'absent');
  if (base.startsWith('https')) {
    check('HSTS present', !!h('strict-transport-security'), h('strict-transport-security') ? 'set' : 'missing');
  }

  // 2) Sensitive paths must not be served (200)
  const sensitive = [
    '/.env',
    '/.env.local',
    '/.git/config',
    '/package.json',
    '/package-lock.json',
    '/.vercel/project.json',
    '/next.config.mjs',
    '/src/lib/data/store.ts',
    '/.npmrc',
  ];
  for (const p of sensitive) {
    const r = await probe(p);
    check(`Blocked ${p}`, r.status !== 200, `HTTP ${r.status}`);
  }

  // 3) API: method handling + input validation
  const apiGet = await probe('/api/ai/chat');
  check('GET /api/ai/chat not allowed', apiGet.status === 405 || apiGet.status === 404, `HTTP ${apiGet.status}`);

  const oversized = await probe('/api/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'a'.repeat(7000) }] }),
  });
  check('Oversized chat payload rejected (400)', oversized.status === 400, `HTTP ${oversized.status}`);

  const health = await probe('/api/health');
  check('Health endpoint responds 200', health.status === 200, `HTTP ${health.status}`);

  // 4) Path traversal attempt
  const trav = await probe('/pt-BR/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd');
  check('Path traversal not served', trav.status !== 200, `HTTP ${trav.status}`);

  // Report
  console.log(rows.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
})();
