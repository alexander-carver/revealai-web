# Production Setup Checklist

## ✅ Code Changes Complete
- Removed all hardcoded test values
- Updated to use live product IDs
- Added proper error handling

## 🔧 Required Setup Steps

### 1. Update Supabase Edge Function Secrets (LIVE MODE)

Run these commands to set live mode secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=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
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_5aeysXN5ZOMabuLrUPqhwvibyNBgRwLX
supabase secrets set STRIPE_WEEKLY_PRODUCT_ID=prod_TXnLmsWmubVfIh
supabase secrets set STRIPE_YEARLY_PRODUCT_ID=prod_TXnMRenhMBjfBM
```

### 2. Set Vercel Environment Variables (LIVE MODE)

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

Add these for **Production** environment:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RIJzrGjo8o5J3Mxk4f3kovLgYyTZ8RtwrFtlBRU1yCb4cwmhrp5IumNYPff5Rlt3oHCWq002JHTl2g92ZEq50AE00uODVnJje
STRIPE_SECRET_KEY=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
STRIPE_WEBHOOK_SECRET=whsec_5aeysXN5ZOMabuLrUPqhwvibyNBgRwLX
STRIPE_WEEKLY_PRODUCT_ID=prod_TXnLmsWmubVfIh
STRIPE_YEARLY_PRODUCT_ID=prod_TXnMRenhMBjfBM
```

### 3. Verify Stripe Live Webhook

1. Go to Stripe Dashboard → **Switch to LIVE MODE** (toggle in top right)
2. Developers → Webhooks
3. Verify webhook exists:
   - URL: `https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Signing secret should be: `whsec_5aeysXN5ZOMabuLrUPqhwvibyNBgRwLX`

### 4. Update Local .env.local (Required - for local testing)

Update your `.env.local` file with these live keys:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RIJzrGjo8o5J3Mxk4f3kovLgYyTZ8RtwrFtlBRU1yCb4cwmhrp5IumNYPff5Rlt3oHCWq002JHTl2g92ZEq50AE00uODVnJje
STRIPE_SECRET_KEY=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
STRIPE_WEEKLY_PRODUCT_ID=prod_TXnLmsWmubVfIh
STRIPE_YEARLY_PRODUCT_ID=prod_TXnMRenhMBjfBM
```

**Important:** After updating `.env.local`, restart your dev server!

## 🧪 Testing

1. **Test Real Payment**: Go to `/settings` → Click "Test with $0.01 Product"
   - Uses product `prod_TYY5JwnOucEw7x` ($0.01/month)
   - This is a REAL payment (small amount for testing)

2. **Test Regular Plans**: Use the "Upgrade to Pro" button
   - Weekly: `prod_TXnLmsWmubVfIh`
   - Yearly: `prod_TXnMRenhMBjfBM`

## ⚠️ Important Notes

- All payments are now **REAL** - no test mode
- The test button uses a $0.01/month subscription (real money)
- Make sure webhook is configured correctly or subscriptions won't activate
- After setting secrets, redeploy if needed

## ✅ Verification Checklist

- [ ] Supabase secrets updated to live mode
- [ ] Vercel environment variables set for production
- [ ] Stripe live webhook configured and verified
- [ ] Test payment works ($0.01 product)
- [ ] Regular checkout works (weekly/yearly)
- [ ] Subscriptions appear in database after payment
