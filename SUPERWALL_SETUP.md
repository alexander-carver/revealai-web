# Superwall Integration Guide

Superwall is a paywall management platform that helps you track payments, A/B test paywalls, and manage subscriptions. Here's how to integrate it:

## Option 1: Superwall Web SDK (Recommended)

Superwall provides a JavaScript SDK that you can integrate into your Next.js app.

### 1. Get Your Superwall API Key
1. Sign up at [Superwall](https://superwall.com)
2. Get your API key from the dashboard
3. Add it to `.env.local`:
   ```
   NEXT_PUBLIC_SUPERWALL_API_KEY=your_api_key_here
   ```

### 2. Install Superwall SDK
Superwall typically provides their SDK via a script tag or npm package. Check their documentation for the latest integration method.

### 3. Initialize Superwall
Create a Superwall provider component:

```typescript
// lib/superwall.ts
export const initializeSuperwall = async () => {
  // Initialize Superwall with your API key
  // This will depend on Superwall's SDK
};
```

### 4. Track Events
Track subscription events in your Stripe webhook:

```typescript
// In app/api/stripe/webhook/route.ts
// After successful subscription, track with Superwall
await trackSuperwallEvent('subscription_created', {
  userId,
  plan,
  amount: session.amount_total,
});
```

## Option 2: Superwall API Integration

If Superwall provides a REST API, you can integrate it directly:

1. Track subscription events via API calls
2. Send user data and subscription status
3. Get paywall configurations from Superwall

## Current Setup

Right now, your app uses:
- **Stripe** for payment processing
- **Supabase** for database and auth
- **Custom paywall modal** for displaying plans

To add Superwall:
1. Sign up for Superwall account
2. Get your API key
3. Add tracking calls in your webhook handler
4. Optionally replace the paywall modal with Superwall's paywall

## Next Steps

1. **Sign up for Superwall**: https://superwall.com
2. **Get your API key** from the dashboard
3. **Add it to `.env.local`**
4. **Update webhook handler** to track events with Superwall
5. **Integrate Superwall SDK** (if using their paywall UI)

For now, your Stripe integration is working and you can add Superwall tracking on top of it.

