# Setup Checklist

## ✅ Completed
- [x] Stripe integration code
- [x] OAuth setup (Google & Apple)
- [x] Environment variables added
- [x] Checkout API route
- [x] Webhook handler
- [x] Subscription hook updated

## 🔲 To Do

### 1. Fix CORS for Edge Functions (CRITICAL - Fixes "Failed to fetch" errors)
1. Your Supabase Edge Functions need CORS headers to work from the browser
2. See `EDGE_FUNCTION_CORS_SETUP.md` for detailed instructions
3. **Quick fix**: Add CORS headers to these functions:
   - `enformion-search`
   - `enformion-records`
   - `username-search`
   - `remove-from-search`
   - `ai-profile-search` (if exists)
4. Each function needs to:
   - Handle `OPTIONS` preflight requests
   - Return CORS headers in all responses
5. After updating, redeploy:
   ```bash
   supabase functions deploy enformion-search
   supabase functions deploy enformion-records
   supabase functions deploy username-search
   supabase functions deploy remove-from-search
   ```

### 2. Run SQL Migration in Supabase
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase-migrations.sql`
4. Paste and run the SQL
5. This creates the `subscriptions` table with proper RLS policies

### 3. Add Supabase Service Role Key
1. Go to Supabase Dashboard → **Settings** → **API**
2. Copy the **service_role** key (NOT the anon key)
3. Add to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (your service role key)
   ```

### 4. Set Up Stripe Webhook
1. Go to Stripe Dashboard → **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - For local testing, use Stripe CLI:
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook Signing Secret** (starts with `whsec_...`)
6. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 5. Verify OAuth Redirect URLs
1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local)
   - `https://yourdomain.com/auth/callback` (for production)
3. Make sure Google and Apple providers have the same redirect URLs

### 6. Superwall Setup (Optional)
1. Sign up at https://superwall.com
2. Get your API key
3. Add to `.env.local`:
   ```
   NEXT_PUBLIC_SUPERWALL_API_KEY=your_key
   ```
4. See `SUPERWALL_SETUP.md` for integration details

## Testing

### Test OAuth
1. Go to `/login`
2. Click "Continue with Google" or "Continue with Apple"
3. Should redirect back to `/search` after auth

### Test Stripe Checkout
1. Click "Upgrade to Pro" button
2. Select a plan (Weekly $6.99 or Yearly $49.99)
3. Should redirect to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`

### Test Webhook (Local)
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Environment Variables Summary

Your `.env.local` should have:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://ddoginuyioiatbpfemxr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (ADD THIS)

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RIJzr...
STRIPE_SECRET_KEY=sk_live_51RIJzr...
STRIPE_WEEKLY_PRODUCT_ID=prod_TXnLmsWmubVfIh
STRIPE_YEARLY_PRODUCT_ID=prod_TXnMRenhMBjfBM
STRIPE_WEBHOOK_SECRET=whsec_... (ADD THIS)

# Superwall (Optional)
NEXT_PUBLIC_SUPERWALL_API_KEY=... (ADD IF USING SUPERWALL)
```

## Quick Start Commands

```bash
# Run SQL migration in Supabase Dashboard SQL Editor
# (Copy from supabase-migrations.sql)

# Test locally with Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Restart dev server after adding env vars
npm run dev
```

