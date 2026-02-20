# 12‑month subscription retry setup

Stripe’s built-in retries only run for up to **2 months**. To keep retrying unpaid/past_due subscriptions for a full **12 months**, run the retry script on a schedule (e.g. monthly).

## How it works

1. **Months 1–2:** Stripe’s Revenue recovery (Billing → Retries) retries failed payments automatically.
2. **Months 3–12:** A monthly job runs `retry_all_subscriptions.js` with `ONLY_UNPAID_PAST_DUE=true`, so only `past_due` and `unpaid` subscriptions are retried. Each run attempts the single most recent collectible invoice per subscription (safe default).

## Option 1: Cron (recommended for a server or always-on machine)

1. Make the runner executable:
   ```bash
   chmod +x scripts/run-monthly-retries.sh
   ```

2. Add a cron job. Example (run on the 1st of every month at 9:00 AM):
   ```bash
   0 9 1 * * cd /path/to/revealai-web && STRIPE_SECRET_KEY=sk_live_xxx DRY_RUN=false ONLY_UNPAID_PAST_DUE=true ./scripts/run-monthly-retries.sh >> /var/log/retry-subscriptions.log 2>&1
   ```
   Replace `/path/to/revealai-web` with your repo path and set `STRIPE_SECRET_KEY` (or source it from a file so it’s not in crontab).

3. Optional: load env from `.env.local` in the script or cron:
   ```bash
   0 9 1 * * cd /path/to/revealai-web && set -a && . .env.local && set +a && DRY_RUN=false ONLY_UNPAID_PAST_DUE=true ./scripts/run-monthly-retries.sh >> /var/log/retry-subscriptions.log 2>&1
   ```

## Option 2: GitHub Actions (scheduled workflow)

A workflow runs the retry script on a schedule (e.g. 1st of each month). You must add `STRIPE_SECRET_KEY` as a repository secret.

1. In GitHub: **Settings → Secrets and variables → Actions** → **New repository secret**  
   Name: `STRIPE_SECRET_KEY`  
   Value: your live secret key (e.g. `sk_live_...`).

2. The workflow file is `.github/workflows/retry-subscriptions-monthly.yml`. It runs at 09:00 UTC on the 1st of every month and uses `ONLY_UNPAID_PAST_DUE=true` and `DRY_RUN=false`.

3. To test without charging: either run the workflow manually and set `DRY_RUN` to `true` in the workflow, or run the script locally with `DRY_RUN=true`.

## Env vars for the monthly run

| Variable               | Recommended for monthly run |
|------------------------|-----------------------------|
| `STRIPE_SECRET_KEY`    | Required (live key)        |
| `DRY_RUN`              | `false` for real charges    |
| `ONLY_UNPAID_PAST_DUE` | `true` so only at-risk subs are retried |
| `COLLECT_ALL_OPEN_INVOICES` | Leave `false` (one invoice per sub per run) |
| `MAX_INVOICES_PER_SUB` | Default 3 (only used if collecting all)   |

## One-off manual run

```bash
# Dry run (no charges)
STRIPE_SECRET_KEY=sk_live_... DRY_RUN=true ONLY_UNPAID_PAST_DUE=true node scripts/retry_all_subscriptions.js

# Live run (only past_due/unpaid)
STRIPE_SECRET_KEY=sk_live_... DRY_RUN=false ONLY_UNPAID_PAST_DUE=true node scripts/retry_all_subscriptions.js
```

Or use the shell script:

```bash
STRIPE_SECRET_KEY=sk_live_... DRY_RUN=false ONLY_UNPAID_PAST_DUE=true ./scripts/run-monthly-retries.sh
```
