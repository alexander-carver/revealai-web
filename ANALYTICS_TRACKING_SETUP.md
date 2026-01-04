# Analytics Tracking Implementation

## Overview
This document describes the GA4 and Meta Pixel conversion tracking implementation for the RevealAI web application.

## Environment Variables Required

Add these to your `.env.local` and Vercel environment variables:

```bash
# Already configured
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key

# Analytics IDs (already hardcoded in implementation)
# GA4: G-KXNE8LSF4X
# Meta Pixel: 1519956929082381
```

## Files Changed

### 1. **lib/analytics.ts** (NEW)
Analytics helper module with safe wrappers for tracking events.

**Functions:**
- `trackViewContent()` - Tracks landing page views
- `trackCTAClick(buttonName)` - Tracks CTA button clicks
- `trackInitiateCheckout(plan)` - Tracks checkout initiation
- `trackPurchase({value, currency, transaction_id, plan})` - Tracks completed purchases

**Features:**
- Console logging in development mode
- Safe window checks for SSR compatibility
- Dual tracking (GA4 + Meta Pixel)

### 2. **app/layout.tsx** (MODIFIED)
Added GA4 and Meta Pixel base scripts to the global layout.

**Changes:**
- Added GA4 gtag.js script with measurement ID `G-KXNE8LSF4X`
- Added Meta Pixel script with ID `1519956929082381`
- Configured automatic PageView tracking
- Added noscript fallback for Meta Pixel

### 3. **app/api/stripe/session/route.ts** (NEW)
Secure API route to verify Stripe checkout sessions.

**Endpoint:** `GET /api/stripe/session?session_id=xxx`

**Returns:**
```json
{
  "success": true,
  "transaction_id": "cs_xxx",
  "value": 9.99,
  "currency": "USD",
  "plan": "free_trial",
  "payment_status": "paid",
  "customer_email": "user@example.com"
}
```

**Security:**
- Uses server-side Stripe secret key
- Verifies payment_status === 'paid' before returning
- Expands line items to get product details

### 4. **app/page.tsx** (MODIFIED)
Added ViewContent tracking on landing page load.

**Changes:**
- Imported `trackViewContent` from analytics
- Added useEffect to track page view when landing page is visible
- Skips tracking during onboarding flow

### 5. **components/shared/free-trial-paywall-modal.tsx** (MODIFIED)
Added CTA click and InitiateCheckout tracking.

**Changes:**
- Tracks CTA click when "CONTINUE" button is clicked
- Tracks InitiateCheckout before redirecting to Stripe
- Event name: "Free Trial Paywall - Continue"

### 6. **components/shared/results-paywall-modal.tsx** (MODIFIED)
Added CTA click and InitiateCheckout tracking.

**Changes:**
- Tracks CTA click when "CONTINUE" button is clicked
- Tracks InitiateCheckout before redirecting to Stripe
- Event name: "Results Paywall - Continue"

### 7. **app/checkout-success/page.tsx** (MODIFIED)
Added Purchase tracking with Stripe verification.

**Changes:**
- Fetches Stripe session details via `/api/stripe/session`
- Verifies payment_status === 'paid'
- Tracks Purchase event with verified transaction data
- Tracks in both automatic flow and manual activation button
- Only fires after successful Stripe verification

## Event Tracking Flow

### 1. Landing Page View
```
User lands on homepage
  → trackViewContent()
  → GA4: view_content
  → Meta: ViewContent
```

### 2. CTA Click
```
User clicks "CONTINUE" on paywall
  → trackCTAClick("Free Trial Paywall - Continue")
  → GA4: cta_click
  → Meta: CTA_Click (custom event)
```

### 3. Initiate Checkout
```
User proceeds to Stripe
  → trackInitiateCheckout("free_trial")
  → GA4: begin_checkout
  → Meta: InitiateCheckout
  → Redirect to Stripe Checkout
```

### 4. Purchase (After Payment)
```
User completes payment
  → Redirected to /checkout-success?session_id=xxx
  → Fetch /api/stripe/session?session_id=xxx
  → Verify payment_status === 'paid'
  → trackPurchase({value, currency, transaction_id, plan})
  → GA4: purchase
  → Meta: Purchase
```

## Testing

### Development Mode
All events log to console with format:
```
[GA4 Event] event_name { params }
[Meta Pixel Event] event_name { params }
✅ Purchase tracked: { transaction_id, value, currency }
```

### GA4 DebugView Testing

1. **Enable Debug Mode:**
   - Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger) Chrome extension
   - OR add `?debug_mode=true` to your URL

2. **View Events:**
   - Go to [GA4 DebugView](https://analytics.google.com/analytics/web/#/a12345p67890/debugview)
   - Replace with your GA4 property ID
   - Events appear in real-time

3. **Expected Events:**
   - `view_content` - Landing page load
   - `cta_click` - Button clicks
   - `begin_checkout` - Checkout initiation
   - `purchase` - Completed payment (with transaction_id, value, currency)

### Meta Events Manager Testing

1. **Open Test Events:**
   - Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
   - Select your Pixel (1519956929082381)
   - Click "Test Events" tab

2. **Enter Your Test URL:**
   - Enter your website URL (e.g., `https://revealai-peoplesearch.com`)
   - Click "Open Website"

3. **Expected Events:**
   - `ViewContent` - Landing page load
   - `CTA_Click` - Button clicks (custom event)
   - `InitiateCheckout` - Checkout initiation
   - `Purchase` - Completed payment (with value, currency)

4. **Verify Purchase Event:**
   - Look for `Purchase` event in test events
   - Verify it includes `value` and `currency` parameters
   - Verify it only fires AFTER Stripe payment is complete

## Verification Checklist

- [ ] GA4 script loads in browser (check Network tab)
- [ ] Meta Pixel script loads in browser (check Network tab)
- [ ] `view_content` fires on landing page (GA4 DebugView)
- [ ] `ViewContent` fires on landing page (Meta Test Events)
- [ ] `cta_click` fires when clicking paywall button
- [ ] `CTA_Click` fires when clicking paywall button
- [ ] `begin_checkout` fires before Stripe redirect
- [ ] `InitiateCheckout` fires before Stripe redirect
- [ ] `purchase` fires ONLY after Stripe payment is verified
- [ ] `Purchase` fires ONLY after Stripe payment is verified
- [ ] Purchase events include correct value and currency
- [ ] Purchase events include transaction_id

## Troubleshooting

### Events Not Showing in GA4
1. Check browser console for errors
2. Verify GA4 measurement ID is correct: `G-KXNE8LSF4X`
3. Check Network tab for gtag requests
4. Wait 24-48 hours for events to appear in standard reports (use DebugView for real-time)

### Events Not Showing in Meta
1. Check browser console for errors
2. Verify Meta Pixel ID is correct: `1519956929082381`
3. Check Network tab for facebook.com/tr requests
4. Use Meta Pixel Helper Chrome extension
5. Check Test Events in Events Manager

### Purchase Not Tracking
1. Check console for "✅ Purchase tracked" message
2. Verify `/api/stripe/session` returns `payment_status: 'paid'`
3. Check that session_id is in URL: `/checkout-success?session_id=cs_xxx`
4. Verify STRIPE_SECRET_KEY is set in environment variables

### Duplicate Purchase Events
- Purchase should only fire once per session_id
- Check that you're not manually refreshing /checkout-success page
- Verify hasVerified.current ref is working correctly

## Production Deployment

1. **Verify Environment Variables:**
   ```bash
   # In Vercel Dashboard → Settings → Environment Variables
   STRIPE_SECRET_KEY=sk_live_xxx (or sk_test_xxx for testing)
   SUPABASE_SERVICE_ROLE_KEY=xxx
   ```

2. **Deploy to Vercel:**
   ```bash
   git add .
   git commit -m "feat: add GA4 and Meta Pixel conversion tracking"
   git push origin main
   ```

3. **Test in Production:**
   - Use Stripe test mode first
   - Verify all events fire correctly
   - Check GA4 DebugView and Meta Test Events
   - Complete a test purchase and verify Purchase event

4. **Switch to Live Mode:**
   - Update STRIPE_SECRET_KEY to live key
   - Test with real payment (refund immediately)
   - Verify Purchase event tracks correctly

## Notes

- All tracking is non-blocking (won't prevent checkout if it fails)
- Purchase events only fire after Stripe payment verification
- Console logs only appear in development mode
- Events respect user privacy settings (browser ad blockers may block them)
- No PII (personally identifiable information) is tracked beyond what Stripe/Meta collect

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify all environment variables are set
3. Test in GA4 DebugView and Meta Test Events
4. Check Vercel deployment logs for API errors

