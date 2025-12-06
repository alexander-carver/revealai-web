# Test Mode Webhook Setup Guide

## ⚠️ Important: Test Mode vs Live Mode Webhooks

Stripe has **separate webhook endpoints** for Test mode and Live mode. If you're using test keys, you need to configure a **test mode webhook** in Stripe Dashboard.

## Step 1: Configure Test Mode Webhook in Stripe

1. **Go to Stripe Dashboard** → Make sure you're in **TEST MODE** (toggle in top right)
2. **Navigate to**: Developers → Webhooks
3. **Click "Add endpoint"**
4. **Enter your Edge Function URL**:
   ```
   https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook
   ```
5. **Select events to listen for**:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
6. **Click "Add endpoint"**
7. **Copy the Webhook Signing Secret** (starts with `whsec_...`)
   - This is your **TEST MODE** webhook secret

## Step 2: Update Supabase Edge Function Secrets

You need to update the Edge Function secrets with your **TEST MODE** keys:

### Option A: Via Supabase Dashboard (Easiest)

1. Go to Supabase Dashboard → Edge Functions → stripe-webhook
2. Click on "Secrets" tab
3. Update/add these secrets:
   - `STRIPE_SECRET_KEY` = `sk_test_...` (your TEST secret key)
   - `STRIPE_WEBHOOK_SECRET` = `whsec_...` (the TEST webhook secret from Step 1)
   - `STRIPE_WEEKLY_PRODUCT_ID` = `prod_TXqXbNAwVFC55c` (your test weekly product ID)
   - `STRIPE_YEARLY_PRODUCT_ID` = `prod_TXqZyyl5sHmNtZ` (your test yearly product ID)

### Option B: Via Supabase CLI

```bash
# Make sure you're in the project directory
cd /Users/alexandercarver/Documents/RevealAI/revealai-web

# Set test mode secrets
supabase secrets set STRIPE_SECRET_KEY=sk_test_YOUR_TEST_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET
supabase secrets set STRIPE_WEEKLY_PRODUCT_ID=prod_TXqXbNAwVFC55c
supabase secrets set STRIPE_YEARLY_PRODUCT_ID=prod_TXqZyyl5sHmNtZ
```

## Step 3: Verify Your .env.local Has Test Keys

Make sure your `.env.local` has:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEEKLY_PRODUCT_ID=prod_TXqXbNAwVFC55c
STRIPE_YEARLY_PRODUCT_ID=prod_TXqZyyl5sHmNtZ
```

## Step 4: Test the Webhook

1. **Make a test payment** using test card: `4242 4242 4242 4242`
2. **Check Stripe Dashboard** → Developers → Webhooks → Your endpoint
   - You should see webhook events being sent
   - Click on an event to see the request/response
3. **Check Supabase Dashboard** → Edge Functions → stripe-webhook → Logs
   - You should see logs from the webhook function
   - Look for "Webhook received" and "Processing checkout.session.completed"

## Troubleshooting

### No logs in Supabase Edge Function

**Possible causes:**
1. ❌ Webhook endpoint not configured in Stripe (TEST mode)
2. ❌ Wrong webhook URL in Stripe
3. ❌ Webhook secret mismatch (using live secret with test keys)
4. ❌ Edge Function not deployed or has errors

**Solutions:**
- Double-check you're configuring the webhook in **TEST MODE** in Stripe
- Verify the Edge Function URL is correct
- Make sure the webhook secret in Supabase matches the one from Stripe TEST mode
- Check Edge Function logs for errors

### Webhook events not being sent

**Check in Stripe Dashboard:**
- Go to Developers → Webhooks → Your endpoint
- Look at "Recent events" - are any events showing?
- If events show but have errors, check the error message

### Subscription not being created in database

**Check:**
1. Is the webhook receiving events? (Check Stripe Dashboard)
2. Are there errors in Edge Function logs?
3. Is the `subscriptions` table created in Supabase?
4. Does the user_id exist in your auth.users table?

## Quick Checklist

- [ ] Stripe Dashboard is in **TEST MODE**
- [ ] Webhook endpoint added in Stripe (TEST mode)
- [ ] Webhook URL points to your Supabase Edge Function
- [ ] Test webhook secret copied from Stripe
- [ ] Supabase Edge Function secrets updated with TEST keys
- [ ] `.env.local` has TEST keys
- [ ] Edge Function deployed
- [ ] Test payment completed
- [ ] Checked webhook logs in Supabase

## Test Cards (Test Mode Only)

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`
- Use any future expiry date, any CVC, any ZIP

