# Quick Guide: Finding Purchase Events in Meta Events Manager

## 🎯 Even with Dev/Test Account - Events Still Show!

**Important:** Meta Events Manager shows ALL events (test and live) in the same dataset. You don't need to switch modes.

## 📍 Where to See Purchase Events RIGHT NOW

### Step 1: Open Events Manager
1. Go to: https://business.facebook.com/events_manager2
2. Click on **"Datasets"** in left sidebar
3. Select: **"Reveal AI Web"** (ID: 1519956929082381)

### Step 2: View Events
**Option A - Test Events (Real-time):**
1. Click **"Test events"** tab
2. Visit your website: `https://revealai-peoplesearch.com`
3. Complete a purchase
4. Watch events appear in **real-time** in the table

**Option B - Overview (All Events):**
1. Click **"Overview"** tab
2. Scroll to **"Events in last 7 days"**
3. Look for **"Purchase"** in the list
4. Click it to see details

**Option C - History (All Time):**
1. Click **"History"** tab
2. Filter by event: **Purchase**
3. See all Purchase events

## ✅ What You Should See

When you complete a purchase, you'll see:
- **Event Name:** `Purchase`
- **Status:** Processed ✅
- **Parameters:**
  - `value`: 9.99 (or your price)
  - `currency`: USD
  - `content_category`: subscription
  - `transaction_id`: cs_xxx

## 🔧 Use for Ads (Even with Dev Account)

You can still:
1. ✅ See Purchase events (they're all in the same dataset)
2. ✅ Create Custom Conversions from Purchase events
3. ✅ Set up ad campaigns optimized for Purchase
4. ✅ View conversion data

**Note:** The difference between test/live mode is usually just for ad delivery, not for viewing events. All events appear in Events Manager regardless.

## 🚨 If You Don't See Purchase Events

1. **Check Test Events:**
   - Make sure you're on the "Test events" tab
   - Complete a purchase while the tab is open
   - Events appear in real-time

2. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for: `✅ Purchase tracked: { transaction_id, value, currency }`
   - If you see this, events ARE being sent

3. **Check Network Tab:**
   - Look for requests to `facebook.com/tr`
   - These are Meta Pixel events being sent

4. **Clear Browser Cache:**
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Or clear cache and reload

## 💡 Pro Tip

Even if you're using a dev/test Facebook account, the Events Manager still receives and displays all events. The "test mode" vs "live mode" mainly affects:
- Ad delivery (test mode doesn't deliver ads)
- Ad spend (test mode uses fake credits)

But **Events Manager always shows real events** from your Pixel!

