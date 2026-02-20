/**
 * Retry All Subscriptions - One-off script to recover unpaid subscriptions
 *
 * - Iterates through ALL Stripe subscriptions (paginated)
 * - Finalizes draft invoices (clears draft pileups)
 * - Attempts payment for collectible invoices (single most recent by default,
 *   or all open up to MAX_INVOICES_PER_SUB when COLLECT_ALL_OPEN_INVOICES=true)
 * - Logs result per subscription and a final summary
 *
 * Env:
 *   STRIPE_SECRET_KEY   (required)
 *   DRY_RUN             default true  - log only, no finalize/pay
 *   COLLECT_ALL_OPEN_INVOICES  default false - pay only latest collectible invoice per sub
 *   MAX_INVOICES_PER_SUB       default 3   - max invoices to pay per sub when collecting all
 *
 * Run:
 *   npm i stripe dotenv
 *   STRIPE_SECRET_KEY=sk_live_... DRY_RUN=false node scripts/retry_all_subscriptions.js
 *
 * Env vars (exact):
 *   STRIPE_SECRET_KEY   (required)
 *   DRY_RUN             default true
 *   COLLECT_ALL_OPEN_INVOICES  default false
 *   MAX_INVOICES_PER_SUB       default 3
 *   INVOICES_PER_SUB           default 20 - max invoices fetched per sub (increase to catch older unpaid)
 *   INCLUDE_UPCOMING_INVOICES  default false - if true, treat "upcoming" invoices as collectible
 *   ONLY_UNPAID_PAST_DUE       default false - if true, only process subscriptions with status past_due or unpaid (for monthly 12‑month retry)
 *
 * Doing the skipped ones:
 *   - skipped (only_upcoming): run with INCLUDE_UPCOMING_INVOICES=true
 *   - skipped (more_invoices_available): run with INVOICES_PER_SUB=50 or 100
 *   - skipped (only_paid_or_void): nothing to collect for that sub
 *
 * Example output:
 *   [1/150] sub=sub_xxx customer=cus_yyy status=past_due => paid (1 invoice(s) paid)
 *   [2/150] sub=sub_aaa customer=cus_bbb status=active => skipped (no collectible invoices)
 *   [3/150] sub=sub_ccc customer=cus_ddd status=unpaid => no_payment_method (no_payment_method)
 *   --- Summary ---
 *   paid: 12
 *   still_failed: 2
 *   requires_action: 1
 *   no_payment_method: 5
 *   skipped: 130
 *   Total: 150
 */

require('dotenv').config({ path: '.env.local' });

const Stripe = require('stripe');

// --- Config from env
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const DRY_RUN = process.env.DRY_RUN !== 'false'; // default true
const COLLECT_ALL_OPEN_INVOICES = process.env.COLLECT_ALL_OPEN_INVOICES === 'true';
const MAX_INVOICES_PER_SUB = Math.max(1, parseInt(process.env.MAX_INVOICES_PER_SUB || '3', 10));
const INVOICES_PER_SUB = Math.min(100, Math.max(10, parseInt(process.env.INVOICES_PER_SUB || '20', 10)));
const INCLUDE_UPCOMING_INVOICES = process.env.INCLUDE_UPCOMING_INVOICES === 'true';
const ONLY_UNPAID_PAST_DUE = process.env.ONLY_UNPAID_PAST_DUE === 'true';

const INVOICES_LIST_LIMIT = INVOICES_PER_SUB;
const SUBSCRIPTIONS_PAGE_SIZE = 100;

// Result categories for summary
const RESULT = {
  PAID: 'paid',
  STILL_FAILED: 'still_failed',
  REQUIRES_ACTION: 'requires_action',
  NO_PAYMENT_METHOD: 'no_payment_method',
  SKIPPED: 'skipped',
};

// --- Stripe client
if (!STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY is required. Set it in env or .env.local');
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

// --- Rate limit: retry with exponential backoff
async function withRetry(fn, context = '') {
  const maxAttempts = 5;
  const baseDelayMs = 1000;
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isRateLimit = err.type === 'StripeRateLimitError' || (err.statusCode === 429);
      if (isRateLimit && attempt < maxAttempts) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        console.warn(`   ⚠️ Rate limited (${context}), retry ${attempt}/${maxAttempts} in ${delay}ms`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

// --- Helpers

/** Invoice statuses we never try to pay */
const NON_COLLECTIBLE_STATUSES = new Set(['paid', 'void', 'uncollectible']);

/** Whether this invoice is chargeable (charge_automatically + open/unpaid, or draft that we will finalize) */
function isChargeableInvoice(inv) {
  if (NON_COLLECTIBLE_STATUSES.has(inv.status)) return false;
  if (inv.collection_method !== 'charge_automatically') return false;
  if (inv.billing_reason === 'upcoming' && !INCLUDE_UPCOMING_INVOICES) return false;
  return true;
}

/** Get collectible invoices for a subscription (draft we can finalize, or open/unpaid). Oldest first for "collect all" order. */
function getCollectibleInvoices(invoices) {
  const collectible = invoices
    .filter((inv) => isChargeableInvoice(inv))
    .sort((a, b) => (a.created - b.created)); // oldest first
  return collectible;
}

/** Reason why we skipped (so user can re-run with different flags for "the skipped ones"). */
function getSkipReason(invoices, hadMoreInvoices) {
  if (invoices.length === 0) return 'no_invoices';
  if (hadMoreInvoices) return `more_invoices_available (try INVOICES_PER_SUB=50)`;
  const chargeAuto = invoices.filter((i) => i.collection_method === 'charge_automatically');
  const notEndState = chargeAuto.filter((i) => !NON_COLLECTIBLE_STATUSES.has(i.status));
  const onlyUpcoming = notEndState.length > 0 && notEndState.every((i) => i.billing_reason === 'upcoming');
  if (onlyUpcoming && !INCLUDE_UPCOMING_INVOICES) return 'only_upcoming (try INCLUDE_UPCOMING_INVOICES=true)';
  if (chargeAuto.length === 0) return 'only_send_invoice';
  if (notEndState.length === 0) return 'only_paid_or_void';
  return 'no_collectible';
}

/** Finalize a draft invoice (with retry). No-op if not draft. */
async function finalizeDraftIfNeeded(invoiceId, dryRun) {
  if (dryRun) {
    console.log(`      [DRY_RUN] Would finalize invoice ${invoiceId}`);
    return null;
  }
  return withRetry(
    () =>
      stripe.invoices.finalizeInvoice(invoiceId, {
        auto_advance: true,
      }),
    `finalize ${invoiceId}`
  );
}

/** Pay an open/unpaid invoice (with retry). Returns { paid, result, error }. */
async function payInvoice(invoiceId, dryRun) {
  if (dryRun) {
    console.log(`      [DRY_RUN] Would pay invoice ${invoiceId}`);
    return { paid: true, result: RESULT.PAID, error: null };
  }
  try {
    await withRetry(
      () => stripe.invoices.pay(invoiceId, { off_session: true }),
      `pay ${invoiceId}`
    );
    return { paid: true, result: RESULT.PAID, error: null };
  } catch (err) {
    const code = err.code || err.type;
    const message = (err.message || '').toLowerCase();
    if (code === 'invoice_payment_intent_requires_action' || message.includes('requires_action')) {
      return { paid: false, result: RESULT.REQUIRES_ACTION, error: err };
    }
    if (
      code === 'invoice_payment_intent_requires_payment_method' ||
      message.includes('payment_method') ||
      message.includes('card')
    ) {
      return { paid: false, result: RESULT.NO_PAYMENT_METHOD, error: err };
    }
    return { paid: false, result: RESULT.STILL_FAILED, error: err };
  }
}

// --- Main: list all subscriptions (paginate); optionally only unpaid/past_due for 12‑month retry schedule
async function listAllSubscriptions() {
  const subs = [];
  let startingAfter = null;
  let hasMore = true;
  while (hasMore) {
    const listParams = { limit: SUBSCRIPTIONS_PAGE_SIZE, status: 'all' };
    if (startingAfter) listParams.starting_after = startingAfter;
    const page = await withRetry(
      () => stripe.subscriptions.list(listParams),
      'subscriptions.list'
    );
    subs.push(...page.data);
    hasMore = page.has_more;
    if (hasMore && page.data.length) startingAfter = page.data[page.data.length - 1].id;
  }
  if (ONLY_UNPAID_PAST_DUE) {
    const filtered = subs.filter((s) => s.status === 'past_due' || s.status === 'unpaid');
    return filtered;
  }
  return subs;
}

// --- Process one subscription: get invoices, finalize drafts, select targets, pay
async function processSubscription(sub, dryRun) {
  const subId = sub.id;
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

  // List invoices for this subscription (up to INVOICES_PER_SUB)
  const invoices = [];
  let hasMore = true;
  let startingAfter = null;
  while (hasMore && invoices.length < INVOICES_LIST_LIMIT) {
    const listParams = {
      subscription: subId,
      limit: Math.min(INVOICES_LIST_LIMIT - invoices.length, 10),
    };
    if (startingAfter) listParams.starting_after = startingAfter;
    const page = await withRetry(
      () => stripe.invoices.list(listParams),
      `invoices.list ${subId}`
    );
    invoices.push(...page.data);
    hasMore = page.has_more && invoices.length < INVOICES_LIST_LIMIT;
    if (hasMore && page.data.length) startingAfter = page.data[page.data.length - 1].id;
  }
  const hadMoreInvoices = hasMore;

  let collectible = getCollectibleInvoices(invoices);

  // Finalize drafts (so they become open and chargeable)
  for (const inv of collectible.filter((i) => i.status === 'draft')) {
    await finalizeDraftIfNeeded(inv.id, dryRun);
  }

  // Re-fetch if we finalized any (so we see 'open' status)
  if (!dryRun && collectible.some((i) => i.status === 'draft')) {
    const refreshed = await withRetry(
      () => stripe.invoices.list({ subscription: subId, limit: INVOICES_LIST_LIMIT }),
      `invoices.list refresh ${subId}`
    );
    collectible = getCollectibleInvoices(refreshed.data);
  }

  // Not collectible = no invoice to pay; classify skip reason for "doing the skipped ones"
  if (collectible.length === 0) {
    const skipReason = getSkipReason(invoices, hadMoreInvoices);
    return { result: RESULT.SKIPPED, detail: skipReason };
  }

  // Which invoices to pay: single most recent (default) or oldest→newest up to cap
  let toPay;
  if (COLLECT_ALL_OPEN_INVOICES) {
    toPay = collectible.slice(0, MAX_INVOICES_PER_SUB);
  } else {
    toPay = [collectible[collectible.length - 1]]; // single most recent
  }

  let lastResult = RESULT.SKIPPED;
  let paidCount = 0;
  for (const inv of toPay) {
    const { paid, result } = await payInvoice(inv.id, dryRun);
    lastResult = result;
    if (paid) paidCount++;
    // If we're in "collect all" and one fails, we still report that failure
    if (!paid && !COLLECT_ALL_OPEN_INVOICES) break;
  }

  if (paidCount > 0) return { result: RESULT.PAID, detail: `${paidCount} invoice(s) paid` };
  return { result: lastResult, detail: lastResult };
}

// --- Run
async function main() {
  console.log('Retry All Subscriptions');
  console.log('=======================\n');
  console.log('Config:');
  console.log('  DRY_RUN:', DRY_RUN);
  console.log('  COLLECT_ALL_OPEN_INVOICES:', COLLECT_ALL_OPEN_INVOICES);
  console.log('  MAX_INVOICES_PER_SUB:', MAX_INVOICES_PER_SUB);
  console.log('  INVOICES_PER_SUB:', INVOICES_PER_SUB);
  console.log('  INCLUDE_UPCOMING_INVOICES:', INCLUDE_UPCOMING_INVOICES);
  console.log('  ONLY_UNPAID_PAST_DUE:', ONLY_UNPAID_PAST_DUE);
  if (ONLY_UNPAID_PAST_DUE) console.log('  (Only past_due/unpaid subscriptions)\n');
  if (DRY_RUN) console.log('  (No charges will be made)\n');
  else console.log('  (LIVE – will finalize and charge)\n');

  const allSubs = await listAllSubscriptions();
  console.log(`Total subscriptions: ${allSubs.length}\n`);

  const summary = {
    [RESULT.PAID]: 0,
    [RESULT.STILL_FAILED]: 0,
    [RESULT.REQUIRES_ACTION]: 0,
    [RESULT.NO_PAYMENT_METHOD]: 0,
    [RESULT.SKIPPED]: 0,
  };
  const skippedReasons = {};

  for (let i = 0; i < allSubs.length; i++) {
    const sub = allSubs[i];
    const subId = sub.id;
    const status = sub.status;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id || '';

    const { result, detail } = await processSubscription(sub, DRY_RUN);
    summary[result]++;
    if (result === RESULT.SKIPPED && detail) {
      const reason = detail.replace(/\s*\(try.*\)$/, '').trim();
      skippedReasons[reason] = (skippedReasons[reason] || 0) + 1;
    }

    console.log(`[${i + 1}/${allSubs.length}] sub=${subId} customer=${customerId} status=${status} => ${result}${detail ? ` (${detail})` : ''}`);
  }

  console.log('\n--- Summary ---');
  console.log('paid:', summary[RESULT.PAID]);
  console.log('still_failed:', summary[RESULT.STILL_FAILED]);
  console.log('requires_action:', summary[RESULT.REQUIRES_ACTION]);
  console.log('no_payment_method:', summary[RESULT.NO_PAYMENT_METHOD]);
  console.log('skipped:', summary[RESULT.SKIPPED]);
  if (summary[RESULT.SKIPPED] > 0 && Object.keys(skippedReasons).length > 0) {
    console.log('Skipped breakdown (re-run with suggested env to retry):');
    Object.entries(skippedReasons)
      .sort((a, b) => b[1] - a[1])
      .forEach(([reason, count]) => console.log(`  ${reason}: ${count}`));
  }
  console.log('Total:', allSubs.length);
}

main().catch((err) => {
  console.error('Fatal error:', err.message || err);
  process.exit(1);
});
