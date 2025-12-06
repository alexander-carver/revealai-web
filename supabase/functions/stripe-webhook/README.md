# Stripe Webhook Edge Function

This Supabase Edge Function handles Stripe webhook events for subscription management.

## Deployment

### 1. Install Supabase CLI
```bash
brew install supabase/tap/supabase
```

### 2. Login to Supabase
```bash
supabase login
```

### 3. Link Your Project
```bash
supabase link --project-ref ddoginuyioiatbpfemxr
```

### 4. Set Environment Variables
```bash
supabase secrets set STRIPE_SECRET_KEY=YOUR_LIVE_SECRET_KEY
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
supabase secrets set STRIPE_WEEKLY_PRODUCT_ID=prod_TXnLmsWmubVfIh
supabase secrets set STRIPE_YEARLY_PRODUCT_ID=prod_TXnMRenhMBjfBM
```

### 5. Deploy the Function
```bash
supabase functions deploy stripe-webhook
```

### 6. Get the Function URL
After deployment, you'll get a URL like:
```
https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook
```

### 7. Configure Stripe Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint URL: `https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy the webhook signing secret
5. Update the secret:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_YOUR_NEW_SECRET
   ```

## Local Testing

```bash
# Start local Supabase (optional, for local dev)
supabase start

# Serve function locally
supabase functions serve stripe-webhook --no-verify-jwt

# Test with Stripe CLI
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

## Environment Variables

The function needs these secrets set in Supabase:
- `STRIPE_SECRET_KEY` - Your Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret from Stripe
- `STRIPE_WEEKLY_PRODUCT_ID` - Weekly product ID
- `STRIPE_YEARLY_PRODUCT_ID` - Yearly product ID

Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in Edge Functions.

