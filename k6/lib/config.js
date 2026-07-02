// Shared config + helpers for every k6 scenario. Imported by smoke/load/
// stress/spike so the target URL, endpoints and thresholds live in one place.
//
// BASE_URL is read from the environment (`-e BASE_URL=...`) so the same script
// runs against a local `next start`, a CI-spawned server, or a real deploy
// without edits. Defaults to the CI port used by scripts/k6-ci.sh.
import http from 'k6/http';
import { check } from 'k6';

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3100';

// The seeded in-memory developer key — see src/lib/data/store.ts. Works under
// `next start` (production mode) now that the seed hash is a real sha256.
// Override with `-e API_KEY=...` to point at a real deploy's key.
export const API_KEY = __ENV.API_KEY || 'sk_test_auronis_dev';

// Latency/error budgets. Deliberately generous: these run on a shared 2-core
// GitHub runner against the in-memory adapter — the goal is "the app stays
// healthy and responsive under concurrency", not a production SLO. Real
// production numbers need a real deployment (documented in k6/README.md).
export const THRESHOLDS = {
  smoke: {
    http_req_failed: ['rate<0.01'], // <1% errors
    http_req_duration: ['p(95)<600'], // 95% under 600ms
    checks: ['rate>0.99'],
  },
  load: {
    http_req_failed: ['rate<0.02'],
    http_req_duration: ['p(95)<1200', 'p(99)<2500'],
    checks: ['rate>0.98'],
  },
  stress: {
    // Under deliberate overload we only require the server not to collapse:
    // most requests still succeed and it doesn't hang indefinitely.
    http_req_failed: ['rate<0.15'],
    http_req_duration: ['p(95)<5000'],
  },
  spike: {
    http_req_failed: ['rate<0.10'],
    http_req_duration: ['p(95)<4000'],
  },
};

/** GET /api/health — cheap liveness JSON. The main stress/spike target. */
export function hitHealth() {
  const res = http.get(`${BASE_URL}/api/health`, { tags: { name: 'health' } });
  check(res, {
    'health 200': (r) => r.status === 200,
    'health status ok': (r) => {
      try {
        return r.json('status') === 'ok';
      } catch {
        return false;
      }
    },
  });
  return res;
}

/** GET /pt-BR — the marketing landing page (full SSR/static render). */
export function hitLanding() {
  const res = http.get(`${BASE_URL}/pt-BR`, { tags: { name: 'landing' } });
  check(res, {
    'landing 200': (r) => r.status === 200,
    'landing has hero': (r) => typeof r.body === 'string' && r.body.includes('Auronis'),
  });
  return res;
}

/** GET /api/v1/stats — authenticated data-read path (API key + store rollup). */
export function hitStats() {
  const res = http.get(`${BASE_URL}/api/v1/stats`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    tags: { name: 'stats' },
  });
  check(res, {
    'stats 200': (r) => r.status === 200,
    'stats has billing': (r) => {
      try {
        return r.json('data.billing') !== undefined;
      } catch {
        return false;
      }
    },
  });
  return res;
}

/** GET /api/v1/patients — authenticated list read (larger payload than stats). */
export function hitPatients() {
  const res = http.get(`${BASE_URL}/api/v1/patients`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    tags: { name: 'patients' },
  });
  check(res, {
    'patients 200': (r) => r.status === 200,
  });
  return res;
}
