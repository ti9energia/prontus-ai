// Smoke test — 1 VU, ~30s. The cheapest sanity check: does every target
// endpoint answer correctly under a trickle of traffic? Run this first; if it
// fails, the load/stress/spike numbers are meaningless.
import { sleep } from 'k6';
import { THRESHOLDS, hitHealth, hitLanding, hitStats, hitPatients } from './lib/config.js';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: THRESHOLDS.smoke,
};

export default function () {
  hitHealth();
  hitLanding();
  hitStats();
  hitPatients();
  sleep(1);
}
