# Meta Ads Purchase Event Setup Guide

## 🎯 Event Details

**Event Name:** `Purchase`  
**Pixel ID:** `1519956929082381`  
**Dataset Name:** "Reveal AI Web" (ID: 1519956929082381)

## 📍 Where to Find Your Purchase Event

### Step 1: Open Meta Events Manager
1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Select your Pixel: **1519956929082381** (Reveal AI Web)
3. Click on **"Test events"** tab (or "Overview" → "Test events")

### Step 2: View Live Purchase Events
1. In the "Test events" tab, you'll see a table with events
2. Look for events with:
   - **Event Name:** `Purchase`
   - **Event Type:** Standard event
   - **Status:** Processed ✅
   - **Time Received:** Shows when purchase completed

### Step 3: View Event Details
Click on any `Purchase` event to see full details:
- **value:** Purchase amount (e.g., 9.99, 49.99)
- **currency:** USD
- **content_name:** "Reveal AI subscription" or plan name
- **content_ids:** Transaction ID (e.g., "cs_xxx")
- **contents:** Array with item details
- **num_items:** 1
- **content_category:** "subscription"

---

## 🔧 Set Up Purchase Event for Ad Optimization

### Step 1: Create a Custom Conversion (Optional but Recommended)

1. Go to **Events Manager** → **Datasets** → **"Reveal AI Web"**
2. Click **"Custom Conversions"** in the left sidebar
3. Click **"Create Custom Conversion"**
4. Configure:
   - **Conversion Name:** "Purchase - Subscription"
   - **Description:** "Completed subscription purchase"
   - **Event:** Select `Purchase`
   - **Filters (optional):**
     - `content_category` equals `subscription`
     - `value` is greater than `0`
   - **Value:** Use event value
   - **Attribution Window:** 7-day click, 1-day view (recommended)
5. Click **"Create"**

### Step 2: Set Purchase as a Conversion Event

1. Go to **Events Manager** → **Datasets** → **"Reveal AI Web"**
2. Click **"Settings"** tab
3. Scroll to **"Aggregated Event Measurement"** section
4. Click **"Edit Events"**
5. Find `Purchase` event
6. Set **Event Priority:** High (or highest)
7. Set **Event Count Method:** Once per event
8. Save changes

### Step 3: Verify Event is Receiving Data

1. Go to **Events Manager** → **Datasets** → **"Reveal AI Web"**
2. Click **"Overview"** tab
3. Look for **"Purchase"** in the events list
4. Check **"Events in last 7 days"** - should show activity
5. Click **"Purchase"** to see:
   - Event count
   - Conversion value
   - Time range data

---

## 📊 Use Purchase Event for Ad Optimization

### In Meta Ads Manager:

1. **Go to Ads Manager:** [ads.facebook.com](https://ads.facebook.com)
2. **Create or Edit Campaign:**
   - Campaign Objective: **Conversions** or **Catalog Sales**
   - Conversion Event: Select **"Purchase"** (or your Custom Conversion)
   - Optimization Event: **Purchase**
3. **Set Bidding:**
   - Bid Strategy: **Lowest cost** or **Cost cap**
   - Optimization: **Purchase conversions**
4. **Create Ad Set:**
   - Budget: Set daily/lifetime budget
   - Optimization: **Purchase** event
   - Attribution: 7-day click, 1-day view

### Recommended Settings:

- **Campaign Objective:** Conversions
- **Optimization Event:** Purchase
- **Attribution Window:** 7-day click, 1-day view
- **Conversion Window:** 7-day click, 1-day view
- **Bid Strategy:** Lowest cost (let Meta optimize)
- **Target Cost per Purchase:** (Optional - set after collecting data)

---

## ✅ Verification Checklist

Before running ads, verify:

- [ ] Purchase events are showing in Events Manager Test Events
- [ ] Purchase events have correct `value` parameter
- [ ] Purchase events have `currency: "USD"`
- [ ] Purchase events only fire AFTER payment is completed
- [ ] Purchase event is set as a conversion event
- [ ] Custom Conversion created (optional but recommended)
- [ ] Event shows in Overview with recent activity

---

## 🧪 Testing Your Purchase Event

### Method 1: Test Events Tab (Real-time)

1. Open Events Manager → Test Events
2. Visit: `https://revealai-peoplesearch.com`
3. Complete a test checkout (use Stripe test mode)
4. Watch for `Purchase` event to appear in real-time
5. Verify event parameters are correct

### Method 2: Meta Pixel Helper (Browser Extension)

1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/fdgfkebogiimcoedlicjlajpkdmockpc) Chrome extension
2. Complete a purchase on your site
3. Click the extension icon
4. Look for `Purchase` event in the list
5. Verify parameters match expected values

### Method 3: Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Complete a purchase
4. Look for: `✅ Purchase tracked: { transaction_id, value, currency }`
5. Check Network tab for `facebook.com/tr` requests

---

## 📈 What Data is Being Sent

Each Purchase event includes:

```javascript
{
  value: 9.99,              // Purchase amount
  currency: "USD",          // Currency code
  content_name: "Reveal AI subscription",  // Product name
  content_type: "product",  // Type
  content_ids: ["cs_xxx"],  // Transaction ID array
  contents: [{              // Item details
    id: "cs_xxx",
    quantity: 1,
    item_price: 9.99
  }],
  num_items: 1,             // Item count
  content_category: "subscription"  // Category for optimization
}
```

---

## 🎯 Optimization Tips

### 1. Let Meta Learn (7-14 days)
- Don't change optimization settings during learning phase
- Need 50+ conversions/week for best performance
- Let algorithm optimize for lowest cost per purchase

### 2. Use Lookalike Audiences
- Create Lookalike from Purchase conversions
- Use 1% Lookalike for highest quality
- Exclude existing customers

### 3. Retargeting Campaigns
- Target users who InitiateCheckout but didn't Purchase
- Use Custom Audience from Purchase events
- Offer different messaging

### 4. Value Optimization
- Use "Purchase" event (already includes value)
- Meta will optimize for higher-value purchases
- Better for subscription business model

### 5. Monitor Performance
- Check Purchase conversion rate in Ads Manager
- Monitor Cost per Purchase (CPA)
- Track ROAS (Return on Ad Spend)
- Adjust budgets based on performance

---

## 🚨 Troubleshooting

### Purchase Events Not Showing

1. **Check Pixel is Installed:**
   - Verify Pixel ID `1519956929082381` in page source
   - Use Meta Pixel Helper extension

2. **Check Event is Firing:**
   - Open browser console
   - Look for `✅ Purchase tracked` message
   - Check Network tab for facebook.com/tr requests

3. **Check Payment Verification:**
   - Purchase only fires after Stripe payment is verified
   - Ensure `/api/stripe/session` returns `payment_status: 'paid'`
   - Check checkout-success page is loading correctly

4. **Check Filters:**
   - Ad blockers may block Pixel
   - Test in incognito mode
   - Disable ad blockers temporarily

### Events Showing But Not Optimizing

1. **Verify Event is Set as Conversion:**
   - Go to Events Manager → Settings
   - Ensure Purchase is marked as conversion event

2. **Check Event Quality:**
   - Events Manager → Overview → Purchase
   - Look for "Data Quality" score
   - Should be "Good" or higher

3. **Verify Attribution:**
   - Check attribution window settings
   - Ensure events are within attribution window
   - Look for matched events vs. unmatched

### Low Conversion Quality

1. **Improve Event Parameters:**
   - Already optimized with value, currency, content_category
   - Ensure transaction_id is unique
   - Add more context if needed

2. **Reduce Duplicate Events:**
   - Currently prevents duplicates with useRef
   - Ensure checkout-success page isn't refreshed
   - Check for multiple redirects

---

## 📞 Quick Reference

**Event Name:** `Purchase`  
**Pixel ID:** `1519956929082381`  
**Dataset:** Reveal AI Web  
**Location:** Events Manager → Datasets → Reveal AI Web → Test Events  

**Optimization Settings:**
- Campaign Objective: Conversions
- Conversion Event: Purchase
- Optimization: Purchase conversions
- Attribution: 7-day click, 1-day view

---

## 🎉 You're All Set!

Once you verify Purchase events are showing in Events Manager, you can:

1. ✅ Create ad campaigns optimized for Purchase conversions
2. ✅ Build Lookalike audiences from purchasers
3. ✅ Set up retargeting campaigns
4. ✅ Track ROAS and optimize budgets

**Next Steps:**
1. Complete a test purchase and verify event in Test Events
2. Create Custom Conversion (optional)
3. Set up your first Purchase-optimized ad campaign
4. Monitor performance and optimize!

