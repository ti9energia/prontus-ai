// Load test — a realistic sustained mix, ramping to a steady concurrency and
// holding it. Weighted toward reads (health + landing + authed data), which is
// the real traffic shape for this app. Answers: "does p95 stay acceptable and
// the error rate near zero under steady expected load?"
import { sleep } from 'k6';
import { hitHealth, hitLanding, hitStats, hitPatients, THRESHOLDS } from './lib/config.js';

export const options = {
  scenarios: {
    steady: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 20 }, // ramp up
        { duration: '1m', target: 20 }, // hold
        { duration: '15s', target: 0 }, // ramp down
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: THRESHOLDS.load,
};

export default function loadScenario() {
  // Traffic mix per iteration: liveness is cheapest/most frequent, then a page
  // render, then the two authenticated reads.
  hitHealth();
  hitLanding();
  hitStats();
  hitPatients();
  sleep(Math.random() * 1.5 + 0.5); // 0.5–2s think time, avoids lockstep
}
