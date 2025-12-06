# Current Setup Status

## ✅ Supabase Edge Function Secrets (TEST MODE)

All secrets are configured for **TEST MODE**:

- ✅ `STRIPE_SECRET_KEY` = `YOUR_TEST_SECRET_KEY`
- ✅ `STRIPE_WEBHOOK_SECRET` = `whsec_XhtvVOEgEWZa1QqutCOyboHjSapkw7DJ`
- ✅ `STRIPE_WEEKLY_PRODUCT_ID` = `prod_TXqXbNAwVFC55c`
- ✅ `STRIPE_YEARLY_PRODUCT_ID` = `prod_TXqZyyl5sHmNtZ`

## 📝 Next Steps

### 1. Update Your `.env.local` File

Make sure your `.env.local` has these TEST mode keys:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=YOUR_TEST_PUBLISHABLE_KEY
STRIPE_SECRET_KEY=YOUR_TEST_SECRET_KEY
STRIPE_WEEKLY_PRODUCT_ID=prod_TXqXbNAwVFC55c
STRIPE_YEARLY_PRODUCT_ID=prod_TXqZyyl5sHmNtZ
```

### 2. Configure Test Mode Webhook in Stripe

**CRITICAL**: You must configure the webhook in Stripe Dashboard for TEST mode:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. **Toggle to TEST MODE** (top right corner)
3. Navigate to: **Developers → Webhooks**
4. Click **"Add endpoint"**
5. Enter endpoint URL:
   ```
   https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook
   ```
6. Select events to listen for:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
7. Click **"Add endpoint"**
8. Copy the **Signing secret** (should be `whsec_XhtvVOEgEWZa1QqutCOyboHjSapkw7DJ`)

### 3. Test the Flow

1. **Restart your dev server** (if running):
   ```bash
   npm run dev
   ```

2. **Sign in** to your app

3. **Click "Upgrade to Pro"** and select a plan

4. **Use test card**: `4242 4242 4242 4242`
   - Any future expiry date
   - Any CVC
   - Any ZIP

5. **Check the results**:
   - ✅ Should redirect to checkout success page
   - ✅ Check Supabase Dashboard → Edge Functions → stripe-webhook → Logs (should see "Webhook received")
   - ✅ Check Supabase Dashboard → Table Editor → `subscriptions` table (should see new record)
   - ✅ User should be marked as Pro

## 🔄 Switching to Live Mode

When you're ready for production, see `SWITCH_TEST_LIVE_MODE.md` for instructions on switching all secrets to live mode.

## 📋 Live Mode Keys (Saved for Later)

**Live Mode Secrets** (for when you switch):
- `STRIPE_SECRET_KEY` = `YOUR_LIVE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET` = `whsec_5aeysXN5ZOMabuLrUPqhwvibyNBgRwLX`
- `STRIPE_WEEKLY_PRODUCT_ID` = `prod_TXnLmsWmubVfIh`
- `STRIPE_YEARLY_PRODUCT_ID` = `prod_TXnMRenhMBjfBM`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `YOUR_LIVE_PUBLISHABLE_KEY`

## ❓ About Your New Live Secret Key

You created a new live secret key. **You don't need to do anything special** - just use it when you switch to live mode. The old live key will stop working, so make sure to update both:
1. `.env.local` 
2. Supabase Edge Function secrets

The webhook secret stays the same.

