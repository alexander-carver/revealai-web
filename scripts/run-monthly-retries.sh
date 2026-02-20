#!/usr/bin/env bash
#
# Run subscription retries for unpaid/past_due only (for 12‑month retry schedule).
# Use with cron to run monthly; Stripe handles the first ~2 months, this covers months 3–12.
#
# Prereqs: STRIPE_SECRET_KEY in env or .env.local
#
# Cron example (run 1st of each month at 9:00 AM):
#   0 9 1 * * cd /path/to/revealai-web && STRIPE_SECRET_KEY=sk_live_xxx DRY_RUN=false ONLY_UNPAID_PAST_DUE=true ./scripts/run-monthly-retries.sh >> /var/log/retry-subscriptions.log 2>&1
#
# One-off run (live):
#   STRIPE_SECRET_KEY=sk_live_xxx DRY_RUN=false ONLY_UNPAID_PAST_DUE=true ./scripts/run-monthly-retries.sh

set -e
cd "$(dirname "$0")/.."

if [ -z "$STRIPE_SECRET_KEY" ]; then
  echo "ERROR: Set STRIPE_SECRET_KEY (e.g. in .env.local or export)"
  exit 1
fi

export DRY_RUN="${DRY_RUN:-false}"
export ONLY_UNPAID_PAST_DUE="${ONLY_UNPAID_PAST_DUE:-true}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting monthly retry run (ONLY_UNPAID_PAST_DUE=$ONLY_UNPAID_PAST_DUE DRY_RUN=$DRY_RUN)"
node scripts/retry_all_subscriptions.js
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Finished monthly retry run"
