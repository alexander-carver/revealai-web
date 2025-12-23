# Switching Between Test and Live Mode

## Current Setup: TEST MODE

The Supabase Edge Function secrets are currently set to **TEST MODE**. To switch to **LIVE MODE**, you'll need to update the secrets.

## Supabase Edge Function Secrets

Edge Functions can only have ONE set of secrets at a time. To switch modes, you need to update all the secrets.

### Current (TEST MODE):
- `STRIPE_SECRET_KEY` = `YOUR_TEST_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` = `whsec_XhtvVOEgEWZa1QqutCOyboHjSapkw7DJ`
- `STRIPE_WEEKLY_PRODUCT_ID` = `prod_TXqXbNAwVFC55c`
- `STRIPE_YEARLY_PRODUCT_ID` = `prod_TXqZyyl5sHmNtZ`

### For LIVE MODE (when ready):
- `STRIPE_SECRET_KEY` = `YOUR_LIVE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` = `whsec_5aeysXN5ZOMabuLrUPqhwvibyNBgRwLX`
- `STRIPE_WEEKLY_PRODUCT_ID` = `prod_TexubYU0K47p6u` (Updated: $9.99/week)
- `STRIPE_YEARLY_PRODUCT_ID` = `prod_TXnMRenhMBjfBM`
- `STRIPE_FREE_TRIAL_PRODUCT_ID` = `prod_TexsO0iCT5ep5s` (NEW: 7-day free trial, then $9.99/week)

## How to Switch Modes

### Option 1: Via Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard → Edge Functions → stripe-webhook
2. Click on "Secrets" tab
3. Update each secret with the new values
4. The function will automatically use the new secrets

### Option 2: Via Supabase CLI

```bash
# Switch to TEST MODE
supabase secrets set STRIPE_SECRET_KEY=YOUR_TEST_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XhtvVOEgEWZa1QqutCOyboHjSapkw7DJ
supabase secrets set STRIPE_WEEKLY_PRODUCT_ID=prod_TXqXbNAwVFC55c
supabase secrets set STRIPE_YEARLY_PRODUCT_ID=prod_TXqZyyl5sHmNtZ

# Switch to LIVE MODE
supabase secrets set STRIPE_SECRET_KEY=YOUR_LIVE_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_5aeysXN5ZOMabuLrUPqhwvibyNBgRwLX
supabase secrets set STRIPE_WEEKLY_PRODUCT_ID=prod_TexubYU0K47p6u
supabase secrets set STRIPE_YEARLY_PRODUCT_ID=prod_TXnMRenhMBjfBM
supabase secrets set STRIPE_FREE_TRIAL_PRODUCT_ID=prod_TexsO0iCT5ep5s
```

## .env.local Configuration

Your `.env.local` should match the mode you're using:

### TEST MODE (.env.local):
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_TEST_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=YOUR_TEST_SECRET_KEY
STRIPE_WEEKLY_PRODUCT_ID=prod_TXqXbNAwVFC55c
STRIPE_YEARLY_PRODUCT_ID=prod_TXqZyyl5sHmNtZ
```

### LIVE MODE (.env.local):
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_LIVE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=YOUR_LIVE_SECRET_KEY
STRIPE_WEEKLY_PRODUCT_ID=prod_TexubYU0K47p6u
STRIPE_YEARLY_PRODUCT_ID=prod_TXnMRenhMBjfBM
STRIPE_FREE_TRIAL_PRODUCT_ID=prod_TexsO0iCT5ep5s
```

## Stripe Dashboard Webhooks

**IMPORTANT**: You need to configure webhooks separately for TEST and LIVE mode in Stripe:

### TEST MODE Webhook:
1. Go to Stripe Dashboard → Make sure you're in **TEST MODE**
2. Developers → Webhooks → Add endpoint
3. URL: `https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook`
4. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the signing secret: `whsec_XhtvVOEgEWZa1QqutCOyboHjSapkw7DJ`

### LIVE MODE Webhook:
1. Go to Stripe Dashboard → Make sure you're in **LIVE MODE**
2. Developers → Webhooks → Add endpoint
3. URL: `https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook`
4. Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. Copy the signing secret: `whsec_5aeysXN5ZOMabuLrUPqhwvibyNBgRwLX`

## About Your New Live Secret Key

You created a new live secret key (`YOUR_LIVE_SECRET_KEY`). 

**You don't need to do anything special** - just use it when you switch to live mode. The old live key will stop working, so make sure to:
1. Update `.env.local` with the new key
2. Update Supabase Edge Function secrets with the new key
3. The webhook will continue to work with the same webhook secret

## Quick Checklist for Testing

- [ ] Supabase Edge Function secrets set to TEST mode
- [ ] `.env.local` has TEST mode keys
- [ ] Stripe Dashboard TEST mode webhook configured
- [ ] Test payment with card `4242 4242 4242 4242`
- [ ] Check Supabase Edge Function logs
- [ ] Check Supabase `subscriptions` table

