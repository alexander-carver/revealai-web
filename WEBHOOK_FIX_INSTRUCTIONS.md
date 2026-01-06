# Webhook Fix Instructions

## Issues Fixed ✅

1. **API Version Mismatch** - Updated to `2025-03-31.basil` (matches Stripe dashboard)
2. **Timeout Issues** - Fixed inefficient user lookup that was causing 6+ second response times
3. **Null Checks** - Added proper null handling for subscription dates
4. **Error Handling** - Better error catching to prevent webhook failures

## Deploy the Fixed Webhook

```bash
# Make sure you're logged into Supabase
supabase login

# Link your project (if not already linked)
supabase link --project-ref ddoginuyioiatbpfemxr

# Deploy the fixed webhook
supabase functions deploy stripe-webhook
```

## Test the Webhook

### Option 1: Using Stripe CLI (Recommended)

```bash
# Login to Stripe CLI
stripe login

# Send test events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
```

### Option 2: Using the Test Script

```bash
# Make script executable (already done)
chmod +x scripts/test-webhook-events.sh

# Run the test script
./scripts/test-webhook-events.sh
```

### Option 3: Manual Test via Stripe Dashboard

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook" button
4. Select event type (e.g., `checkout.session.completed`)
5. Click "Send test webhook"

## Monitor Results

### Check Stripe Dashboard
- Go to: **Stripe Dashboard → Developers → Webhooks → [Your webhook] → Event deliveries**
- Look for recent events - they should show "Succeeded" ✅

### Check Supabase Logs
- Go to: **Supabase Dashboard → Edge Functions → stripe-webhook → Logs**
- You should see:
  - "Webhook received"
  - "Webhook event verified: checkout.session.completed"
  - "Subscription created successfully"

## Expected Results

After deploying and testing:
- ✅ Response times should be < 1 second (was 6+ seconds)
- ✅ Success rate should be 100% (was ~39% with 200 failures)
- ✅ No more timeout errors
- ✅ Proper subscription creation/updates in Supabase

## If Issues Persist

1. **Check webhook secret**:
   ```bash
   supabase secrets list
   ```
   Make sure `STRIPE_WEBHOOK_SECRET` matches the secret in Stripe Dashboard

2. **Check API version**:
   - Stripe Dashboard should show: `2025-03-31.basil`
   - Webhook code uses: `2025-03-31.basil` ✅

3. **View detailed logs**:
   ```bash
   supabase functions logs stripe-webhook --tail
   ```

