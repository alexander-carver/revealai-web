# Supabase Edge Function Setup for Stripe Webhook

## Quick Setup Steps

### 1. Install Supabase CLI
```bash
brew install supabase/tap/supabase
```

### 2. Login and Link Project
```bash
supabase login
supabase link --project-ref ddoginuyioiatbpfemxr
```

### 3. Set Secrets
```bash
supabase secrets set STRIPE_SECRET_KEY=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
supabase secrets set STRIPE_WEEKLY_PRODUCT_ID=prod_TXnLmsWmubVfIh
supabase secrets set STRIPE_YEARLY_PRODUCT_ID=prod_TXnMRenhMBjfBM
```

**Note:** You'll need to set `STRIPE_WEBHOOK_SECRET` after creating the webhook in Stripe.

### 4. Deploy Function
```bash
supabase functions deploy stripe-webhook
```

### 5. Get Function URL
After deployment, the function URL will be:
```
https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook
```

### 6. Configure Stripe Webhook
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Set it as a secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
   ```

## Alternative: Deploy via Supabase Dashboard

1. Go to Supabase Dashboard → **Edge Functions**
2. Click **Create a new function**
3. Name it: `stripe-webhook`
4. Copy the code from `supabase/functions/stripe-webhook/index.ts`
5. Paste it into the editor
6. Set secrets in the dashboard (Settings → Edge Functions → Secrets)
7. Deploy

## Testing

### Test with Stripe CLI
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to your function
stripe listen --forward-to https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook
```

### Test Webhook Events
```bash
# Trigger a test event
stripe trigger checkout.session.completed
```

## What This Function Does

1. **Verifies webhook signatures** from Stripe
2. **Handles checkout.session.completed**: Creates/updates subscription in Supabase
3. **Handles subscription.updated**: Updates subscription status and tier
4. **Handles subscription.deleted**: Marks subscription as canceled

## Troubleshooting

- **Function not receiving webhooks**: Check the URL in Stripe dashboard matches exactly
- **Signature verification fails**: Make sure `STRIPE_WEBHOOK_SECRET` is set correctly
- **Database errors**: Ensure the `subscriptions` table exists (run SQL migration first)
- **View logs**: `supabase functions logs stripe-webhook`

