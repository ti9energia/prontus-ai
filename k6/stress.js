// Stress test — push concurrency past the comfortable range in steps and watch
// where latency degrades. The point isn't zero errors (we're deliberately
// overloading a 2-core runner); it's that the server degrades gracefully:
// keeps answering, doesn't hang, recovers. Targets the cheap health endpoint
// so we're measuring server/runtime headroom, not one heavy handler.
import { sleep } from 'k6';
import { hitHealth, hitStats, THRESHOLDS } from './lib/config.js';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 150 },
        { duration: '20s', target: 0 }, // recovery
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: THRESHOLDS.stress,
};

export default function () {
  hitHealth();
  hitStats();
  sleep(0.3);
}
