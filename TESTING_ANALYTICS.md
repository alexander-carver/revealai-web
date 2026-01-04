# Quick Testing Guide for Analytics

## ✅ What Was Implemented

### Tracking Events:
1. **ViewContent** - Landing page load (GA4 + Meta)
2. **CTA_Click** - Paywall button clicks (GA4 + Meta)
3. **InitiateCheckout** - Before Stripe redirect (GA4 + Meta)
4. **Purchase** - After verified Stripe payment (GA4 + Meta)

### Key Features:
- ✅ Purchase only fires AFTER Stripe payment verification
- ✅ Console logs in dev mode for debugging
- ✅ Non-blocking (won't break checkout if tracking fails)
- ✅ Secure server-side Stripe verification

## 🧪 How to Test

### 1. Open Browser Console
```
Right-click → Inspect → Console tab
```

### 2. Visit Your Site
```
https://revealai-peoplesearch.com
```

**Expected Console Output:**
```
[Analytics] Initialized - GA4 and Meta Pixel ready
[GA4 Event] view_content { content_type: 'landing_page', ... }
[Meta Pixel Event] ViewContent { content_name: 'Landing Page', ... }
```

### 3. Click Paywall Button
Click "CONTINUE" on any paywall

**Expected Console Output:**
```
[GA4 Event] cta_click { button_name: 'Free Trial Paywall - Continue', ... }
[Meta Pixel Event] CTA_Click { button_name: '...' }
[GA4 Event] begin_checkout { currency: 'USD', value: 9.99, ... }
[Meta Pixel Event] InitiateCheckout { value: 9.99, ... }
```

### 4. Complete Test Payment
Use Stripe test card: `4242 4242 4242 4242`
- Any future expiry date
- Any 3-digit CVC
- Any ZIP code

**Expected Console Output on /checkout-success:**
```
Fetching Stripe session details for purchase tracking...
✅ Payment verified: { value: 9.99, currency: 'USD', ... }
[GA4 Event] purchase { transaction_id: 'cs_xxx', value: 9.99, ... }
[Meta Pixel Event] Purchase { value: 9.99, currency: 'USD', ... }
✅ Purchase tracked: { transaction_id: 'cs_xxx', value: 9.99, currency: 'USD' }
```

## 📊 Verify in Dashboards

### GA4 DebugView (Real-time)
1. Go to: https://analytics.google.com/analytics/web/
2. Select your property (G-KXNE8LSF4X)
3. Reports → DebugView
4. Look for events in real-time

### Meta Events Manager (Real-time)
1. Go to: https://business.facebook.com/events_manager2
2. Select Pixel: 1519956929082381
3. Click "Test Events" tab
4. Enter your URL and click "Open Website"
5. Perform actions and watch events appear

## 🔍 What to Check

### ✅ Landing Page
- [ ] `view_content` appears in GA4 DebugView
- [ ] `ViewContent` appears in Meta Test Events

### ✅ Paywall Click
- [ ] `cta_click` appears in GA4 DebugView
- [ ] `CTA_Click` appears in Meta Test Events
- [ ] `begin_checkout` appears before Stripe redirect
- [ ] `InitiateCheckout` appears before Stripe redirect

### ✅ Purchase (MOST IMPORTANT)
- [ ] Purchase event fires ONLY on /checkout-success page
- [ ] Purchase event fires ONLY after Stripe payment is complete
- [ ] Purchase includes `transaction_id` (starts with `cs_`)
- [ ] Purchase includes correct `value` (e.g., 9.99)
- [ ] Purchase includes correct `currency` (USD)
- [ ] Console shows "✅ Payment verified" before tracking
- [ ] Console shows "✅ Purchase tracked" after tracking

## 🚨 Common Issues

### Events Not Showing
**Problem:** No console logs appear
**Solution:** 
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Clear cache and cookies
- Check browser ad blockers (disable for testing)

### Purchase Not Tracking
**Problem:** No purchase event on checkout-success
**Solution:**
- Check URL has `?session_id=cs_xxx` parameter
- Check console for errors
- Verify STRIPE_SECRET_KEY is set in Vercel
- Check `/api/stripe/session` returns `payment_status: 'paid'`

### Duplicate Purchases
**Problem:** Purchase fires multiple times
**Solution:**
- Don't refresh /checkout-success page
- Each session_id should only track once
- Check hasVerified.current ref is working

## 📈 Production Checklist

Before going live:
- [ ] Test with Stripe test mode
- [ ] Verify all 4 events fire correctly
- [ ] Check GA4 DebugView shows events
- [ ] Check Meta Test Events shows events
- [ ] Complete a test purchase end-to-end
- [ ] Verify Purchase event has correct data
- [ ] Switch to Stripe live mode
- [ ] Test one real purchase (refund immediately)
- [ ] Verify live Purchase event tracks correctly

## 🎯 Expected Conversion Funnel

```
1000 Landing Page Views (ViewContent)
    ↓ 10% click paywall
100 CTA Clicks (CTA_Click)
    ↓ 80% proceed to checkout
80 Checkout Initiated (InitiateCheckout)
    ↓ 50% complete payment
40 Purchases (Purchase) ← REVENUE TRACKING
```

## 📞 Need Help?

Check these in order:
1. Browser console for errors
2. Network tab for failed requests
3. Vercel deployment logs
4. ANALYTICS_TRACKING_SETUP.md for detailed docs

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Console logs appear for each action
- ✅ GA4 DebugView shows real-time events
- ✅ Meta Test Events shows real-time events
- ✅ Purchase event includes transaction_id and value
- ✅ Purchase only fires after payment is complete
- ✅ No errors in browser console

