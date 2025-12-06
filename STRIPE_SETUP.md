# Stripe & OAuth Setup Guide

## Stripe Setup

### 1. Install Dependencies
✅ Already installed: `stripe` and `@stripe/stripe-js`

### 2. Get Stripe API Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Get your **Publishable Key** and **Secret Key** from API Keys section
3. Add them to your `.env.local`:
   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_... (get this after setting up webhook)
   ```

### 3. Create Products & Prices in Stripe
1. Go to Stripe Dashboard → Products
2. Create two products:
   - **Weekly Plan**: $9.99/week (recurring)
   - **Yearly Plan**: $49.99/year (recurring)
3. Copy the **Price IDs** (starts with `price_...`)
4. Add them to `.env.local`:
   ```
   STRIPE_WEEKLY_PRICE_ID=price_...
   STRIPE_YEARLY_PRICE_ID=price_...
   ```

### 4. Set Up Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://yourdomain.com/api/stripe/webhook`
   - For local testing, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
     ```bash
     stripe listen --forward-to localhost:3000/api/stripe/webhook
     ```
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Webhook Signing Secret** (starts with `whsec_...`)
6. Add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`

### 5. Set Up Supabase Database
1. Go to your Supabase Dashboard → SQL Editor
2. Run the SQL from `supabase-migrations.sql` to create the subscriptions table
3. Get your **Service Role Key** from Settings → API
4. Add it to `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

## OAuth Setup (Google & Apple)

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `https://yourdomain.com/auth/callback`
   - For local: `http://localhost:3000/auth/callback`
6. Copy Client ID and Secret
7. In Supabase Dashboard:
   - Go to Authentication → Providers → Google
   - Enable Google provider
   - Add your Client ID and Secret
   - Save redirect URL: `https://yourdomain.com/auth/callback`

### Apple OAuth
1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID and Service ID
3. Configure Sign in with Apple
4. Add redirect URLs:
   - `https://yourdomain.com/auth/callback`
5. In Supabase Dashboard:
   - Go to Authentication → Providers → Apple
   - Enable Apple provider
   - Add your Service ID, Team ID, Key ID, and Private Key
   - Save redirect URL: `https://yourdomain.com/auth/callback`

### Important Notes
- The OAuth callback route is already set up at `/app/auth/callback/route.ts`
- Make sure redirect URLs match exactly in both Google/Apple and Supabase
- For production, update redirect URLs to your actual domain

## Environment Variables Summary

Add all these to your `.env.local`:

```env
# Supabase (already set up)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_WEEKLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

## Testing

1. **Test OAuth**: Click "Continue with Google" or "Continue with Apple" on login page
2. **Test Stripe Checkout**: Click "Upgrade to Pro" and select a plan
3. **Test Webhook**: Use Stripe CLI for local testing or check webhook logs in Stripe Dashboard

## Troubleshooting

- **OAuth not working**: Check redirect URLs match exactly
- **Stripe checkout fails**: Verify API keys and price IDs are correct
- **Webhook not receiving events**: Check webhook secret and endpoint URL
- **Subscription not updating**: Check Supabase RLS policies and service role key

