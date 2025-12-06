# Test Payments Setup

## ⚠️ Current Status: LIVE Keys

You're currently using **LIVE Stripe keys** (`pk_live_...` and `sk_live_...`), which means:
- ✅ **Real payments will be processed** (actual charges)
- ⚠️ **Test mode cards won't work** (Stripe rejects test cards with live keys)
- ⚠️ **Real money will be charged** if you complete a checkout

## Option 1: Use Test Mode (Recommended for Development)

### Switch to Test Keys:

1. **Get Test Keys from Stripe**:
   - Go to Stripe Dashboard → Developers → API keys
   - Toggle to **"Test mode"**
   - Copy the **Publishable key** (starts with `pk_test_...`)
   - Copy the **Secret key** (starts with `sk_test_...`)

2. **Update `.env.local`**:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

3. **Create Test Products**:
   - In Stripe Dashboard (Test mode), create test products
   - Copy the test product IDs
   - Update `.env.local`:
     ```env
     STRIPE_WEEKLY_PRODUCT_ID=prod_test_...
     STRIPE_YEARLY_PRODUCT_ID=prod_test_...
     ```

4. **Update Supabase Secrets** (for Edge Function):
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_WEEKLY_PRODUCT_ID=prod_test_...
   supabase secrets set STRIPE_YEARLY_PRODUCT_ID=prod_test_...
   ```

### Test Cards (Test Mode Only):
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0027 6000 3184`
- Use any future expiry date, any CVC, any ZIP

## Option 2: Keep Live Keys (Production)

If you want to test with real payments:
- ✅ Everything is set up and ready
- ⚠️ Use real credit cards (will charge real money)
- ⚠️ Test cards won't work with live keys

## Current Setup Status

✅ **Ready for payments** (live mode):
- Stripe keys configured
- Checkout API route working
- Webhook Edge Function deployed
- Product IDs configured
- Success/cancel URLs set

## Testing Checklist

### Before Testing:
- [ ] Decide: Test mode or Live mode?
- [ ] If test mode: Switch keys and create test products
- [ ] If live mode: Understand real charges will occur

### Test the Flow:
1. [ ] Go to your app at `http://localhost:3000`
2. [ ] Sign in or create account
3. [ ] Click "Upgrade to Pro"
4. [ ] Select a plan (Weekly $6.99 or Yearly $49.99)
5. [ ] Complete checkout
6. [ ] Verify redirect to success page
7. [ ] Check Supabase `subscriptions` table for new record
8. [ ] Check Stripe Dashboard for payment

## Quick Test Mode Switch

To quickly switch to test mode, update `.env.local`:

```env
# Test Mode Keys (get from Stripe Dashboard in Test mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY
STRIPE_WEEKLY_PRODUCT_ID=prod_test_YOUR_TEST_PRODUCT_ID
STRIPE_YEARLY_PRODUCT_ID=prod_test_YOUR_TEST_PRODUCT_ID
```

Then restart the server:
```bash
npm run dev
```

## Important Notes

- **Live keys = Real money**: Be careful when testing with live keys
- **Test keys = No charges**: Safe for development
- **Webhook**: Make sure your Stripe webhook is configured for the correct mode (test or live)
- **Database**: The `subscriptions` table works the same in both modes

