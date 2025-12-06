# Stripe Webhook Setup - Final Steps

## ✅ Completed Automatically
- [x] Supabase Edge Function deployed
- [x] Secrets configured (STRIPE_SECRET_KEY, STRIPE_WEEKLY_PRODUCT_ID, STRIPE_YEARLY_PRODUCT_ID)
- [x] Function URL: `https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook`

## 🔲 Manual Steps Required (Stripe Dashboard)

### 1. Configure Stripe Webhook
1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"** button
3. **Endpoint URL**: 
   ```
   https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook
   ```
4. **Description**: "RevealAI Subscription Webhook"
5. **Events to send**: Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
6. Click **"Add endpoint"**

### 2. Get Webhook Signing Secret
1. After creating the endpoint, click on it
2. Find **"Signing secret"** section
3. Click **"Reveal"** to show the secret (starts with `whsec_...`)
4. Copy the entire secret

### 3. Add Webhook Secret to Supabase
Run this command (replace `whsec_...` with your actual secret):

```bash
cd /Users/alexandercarver/Documents/RevealAI/revealai-web
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
```

Or add it via Supabase Dashboard:
1. Go to Supabase Dashboard → Settings → Edge Functions → Secrets
2. Add new secret:
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: `whsec_...` (your secret from Stripe)

## Testing

### Test the Webhook
1. Go to Stripe Dashboard → Webhooks
2. Click on your webhook endpoint
3. Click **"Send test webhook"**
4. Select event: `checkout.session.completed`
5. Click **"Send test webhook"**
6. Check Supabase Dashboard → Edge Functions → Logs to see if it processed

### Test with Stripe CLI (Optional)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your function
stripe listen --forward-to https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook
```

## Verify Everything Works

1. **Test Checkout**: 
   - Go to your app
   - Click "Upgrade to Pro"
   - Complete a test checkout
   - Check Supabase `subscriptions` table to see if record was created

2. **Check Logs**:
   - Supabase Dashboard → Edge Functions → stripe-webhook → Logs
   - Should see successful webhook processing

## Troubleshooting

- **Webhook not receiving events**: 
  - Verify the URL in Stripe matches exactly
  - Check Supabase Edge Function logs
  
- **Signature verification fails**:
  - Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
  - Re-copy the secret from Stripe (they change when you recreate the endpoint)

- **Database errors**:
  - Make sure you ran the SQL migration (`supabase-migrations.sql`) first
  - Check that the `subscriptions` table exists

## Next Steps

Once the webhook is configured:
1. ✅ Webhook will automatically update subscriptions when users purchase
2. ✅ Subscriptions will update when users cancel or renew
3. ✅ Your app will show correct subscription status

You're all set! 🎉

