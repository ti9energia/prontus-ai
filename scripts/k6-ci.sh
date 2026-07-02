#!/usr/bin/env bash
# Runs the k6 load scenarios against a freshly-started production server and
# tears it down afterward — the k6 equivalent of Playwright's `webServer`.
# Used by .github/workflows/k6.yml, but also runnable locally:
#   npm run build && bash scripts/k6-ci.sh
#
# Which scenarios run is controlled by K6_SCENARIOS (space-separated); defaults
# to the three that give clean signal on a shared 2-core runner. stress.js is
# intentionally excluded by default — a 150-VU ramp on the same 2 cores as the
# load generator measures the runner, not the app; run it against a real deploy
# (see k6/README.md).
set -euo pipefail

PORT="${PORT:-3100}"
BASE_URL="http://localhost:${PORT}"
K6_SCENARIOS="${K6_SCENARIOS:-smoke load spike}"

echo "Starting production server on :${PORT} …"
AUTH_SECRET="${AUTH_SECRET:-k6-secret-not-for-production}" \
OWNER_PASSWORD="${OWNER_PASSWORD:-k6-owner-password}" \
DEMO_MODE="true" \
NEXT_TELEMETRY_DISABLED="1" \
npm run start -- -p "${PORT}" >/tmp/k6-server.log 2>&1 &
SERVER_PID=$!

cleanup() {
  echo "Tearing down server (pid ${SERVER_PID}) …"
  kill "${SERVER_PID}" 2>/dev/null || true
  wait "${SERVER_PID}" 2>/dev/null || true
}
trap cleanup EXIT

echo "Waiting for ${BASE_URL}/api/health (max 90s) …"
UP=0
for i in $(seq 1 90); do
  if curl -sf "${BASE_URL}/api/health" >/dev/null 2>&1; then
    UP=1
    echo "Server is up after ${i}s."
    break
  fi
  sleep 1
done
if [ "${UP}" != "1" ]; then
  echo "ERROR: server never became healthy. Last server log:"
  tail -n 40 /tmp/k6-server.log || true
  exit 1
fi

FAIL=0
for scenario in ${K6_SCENARIOS}; do
  echo ""
  echo "════════════════════════════════════════════════════════"
  echo "  k6 run: ${scenario}"
  echo "════════════════════════════════════════════════════════"
  if ! k6 run -e "BASE_URL=${BASE_URL}" "k6/${scenario}.js"; then
    echo "!! k6 ${scenario} failed its thresholds"
    FAIL=1
  fi
done

if [ "${FAIL}" != "0" ]; then
  echo ""
  echo "One or more k6 scenarios failed their thresholds."
  exit 1
fi
echo ""
echo "All k6 scenarios passed their thresholds."
