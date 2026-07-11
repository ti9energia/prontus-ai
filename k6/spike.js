// Spike test — a sudden burst (e.g. a launch tweet, a cron fan-out) then back
// to baseline. Answers two things: does the server survive the jump without
// erroring out, and does latency recover promptly once the burst passes?
import { sleep } from 'k6';
import { hitHealth, hitLanding, THRESHOLDS } from './lib/config.js';

export const options = {
  scenarios: {
    spike: {
      executor: 'ramping-vus',
      startVUs: 5,
      stages: [
        { duration: '15s', target: 5 }, // calm baseline
        { duration: '10s', target: 120 }, // sudden spike
        { duration: '20s', target: 120 }, // sustain the burst
        { duration: '10s', target: 5 }, // drop back
        { duration: '15s', target: 5 }, // confirm recovery at baseline
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: THRESHOLDS.spike,
};

export default function spikeScenario() {
  hitHealth();
  hitLanding();
  sleep(0.5);
}
