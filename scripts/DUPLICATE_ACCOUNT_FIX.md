# Fix Duplicate Accounts Guide

## Quick Fix for Individual Users (Like Cloe)

### Step 1: Get User Info from Website
1. Have user visit https://revealai-peoplesearch.com
2. User copies their User ID from bottom-left sidebar (or top-right on mobile)
3. User sends you the ID

### Step 2: Find Their Active Subscription in Supabase
```bash
# In Supabase Dashboard → SQL Editor:
SELECT 
  user_id,
  stripe_customer_id,
  stripe_subscription_id,
  status,
  tier,
  current_period_end
FROM subscriptions
WHERE user_id = 'USER_ID_HERE'
  AND status = 'active';
```

### Step 3: Cancel Duplicate in Stripe

**Option A: Using Stripe CLI**
```bash
# List all subscriptions for the customer
stripe subscriptions list --customer cus_XXXXX

# Cancel the duplicate (NOT the one linked to Supabase)
stripe subscriptions cancel sub_XXXXX
```

**Option B: Using Stripe Dashboard**
1. Go to Stripe Dashboard → Customers
2. Search for customer email (e.g., cloe-walker@hotmail.com)
3. Find the subscription that DOESN'T match the one in Supabase
4. Click "Cancel subscription"

---

## Bulk Fix for All Duplicates

### Step 1: Analyze All Duplicates (Dry Run)
```bash
cd /Users/alexandercarver/Documents/RevealAI/revealai-web
node scripts/fix-duplicate-accounts.js
```

This shows:
- Users with multiple active subscriptions
- Which subscription is linked to their active Supabase account
- Which subscriptions would be canceled

### Step 2: Auto-Fix All Duplicates
```bash
node scripts/fix-duplicate-accounts.js --cancel
```

This will:
- Keep the subscription linked to the active Supabase user
- Cancel all other subscriptions for that email
- If no Supabase link: keeps oldest subscription, cancels newer ones

---

## Manual Stripe CLI Commands

### Install Stripe CLI (if needed)
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

### Find Duplicates
```bash
# List all active subscriptions
stripe subscriptions list --status active --limit 100

# Search for specific customer
stripe customers list --email cloe-walker@hotmail.com

# Get customer's subscriptions
stripe subscriptions list --customer cus_XXXXX
```

### Cancel Specific Subscription
```bash
# Cancel immediately
stripe subscriptions cancel sub_XXXXX

# Cancel at period end (let trial/billing cycle finish)
stripe subscriptions update sub_XXXXX --cancel-at-period-end=true
```

---

## For Cloe Specifically

Based on Stripe screenshot, she has:
- Email: `cloe-walker@hotmail.com`
- 2 active trial subscriptions ending Jan 11

**Steps:**
1. Get her User ID from https://revealai-peoplesearch.com (bottom-left)
2. Look up in Supabase which subscription_id is linked to that user
3. In Stripe CLI:
   ```bash
   stripe subscriptions list --customer EMAIL_OR_CUSTOMER_ID
   # Find the subscription NOT linked to her active Supabase account
   stripe subscriptions cancel sub_XXXXX
   ```
4. Tell her: "Fixed! Your account is good to go. You have one subscription linked to User ID: XXXXX"

---

## Prevention Going Forward

With the new device ID system (just deployed), duplicate accounts should stop happening because:
- Every device gets a consistent device ID
- Device ID creates a persistent user account
- Same device = same user = same subscription
- All domains redirect to revealai-peoplesearch.com (no localStorage conflicts)

