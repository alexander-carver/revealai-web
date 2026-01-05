# Fix Cloe's Duplicate Account - Step by Step

## Current Situation
- Email: cloe-walker@hotmail.com
- Has 2 active trial subscriptions (ending Jan 11)
- Needs to keep only 1 subscription

---

## Quick Fix Steps

### 1. Install Stripe CLI (if not already installed)
```bash
brew install stripe/stripe-cli/stripe
stripe login
```

### 2. Find Cloe's Subscriptions
```bash
stripe customers list --email cloe-walker@hotmail.com
```

This will show her customer ID(s).

### 3. List All Her Subscriptions
```bash
# Replace with the actual customer ID from step 2
stripe subscriptions list --customer cus_XXXXX
```

You'll see something like:
```
sub_123abc... - Active trial until Jan 11
sub_456def... - Active trial until Jan 11
```

### 4. Get Her User ID from Website
Have Cloe:
1. Visit https://revealai-peoplesearch.com
2. Look at bottom-left sidebar (desktop) or top-right (mobile)
3. Copy the User ID shown
4. Send it to you

### 5. Find Which Subscription to Keep
Go to Supabase Dashboard → SQL Editor:

```sql
SELECT 
  user_id,
  stripe_subscription_id,
  stripe_customer_id,
  status
FROM subscriptions
WHERE user_id = 'PASTE_HER_USER_ID_HERE'
  AND status = 'active';
```

This shows which subscription is linked to her active account.

### 6. Cancel the Duplicate
```bash
# Cancel the subscription that is NOT in Supabase
stripe subscriptions cancel sub_THE_DUPLICATE_ONE
```

### 7. Confirm to Cloe
Message her:
> "Fixed! Your duplicate subscription has been canceled. Your account is now set up correctly with User ID: [HER_USER_ID]. Your trial runs until Jan 11, then you'll be charged for your subscription."

---

## Alternative: If She Can't Get User ID

If Cloe can't access the website to get her User ID:

### Option A: Find in Supabase by Email
```sql
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'cloe-walker@hotmail.com';
```

Then proceed with steps 5-7 above.

### Option B: Keep Oldest Subscription
```bash
# List her subscriptions with creation dates
stripe subscriptions list --customer cus_XXXXX

# Cancel the NEWER one (higher subscription ID usually means newer)
stripe subscriptions cancel sub_NEWER_ONE
```

---

## Automated Fix (All Duplicates)

If you want to fix ALL duplicate accounts at once:

```bash
cd /Users/alexandercarver/Documents/RevealAI/revealai-web

# Dry run - see what would be fixed
node scripts/fix-duplicate-accounts.js

# Actually fix them
node scripts/fix-duplicate-accounts.js --cancel
```

The script will:
- Find all users with multiple subscriptions
- Keep the one linked to their Supabase account
- Cancel all duplicates
- Report what was done

