# 🚀 Vercel Deployment Reminder

## ⚠️ IMPORTANT: Add These Environment Variables Before Deploying

Before redeploying on Vercel, make sure to add/update these environment variables:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add or update these:

```
STRIPE_WEEKLY_PRODUCT_ID=prod_TexubYU0K47p6u
STRIPE_FREE_TRIAL_PRODUCT_ID=prod_TexsO0iCT5ep5s
```

### Then Redeploy:

1. Go to **Deployments** tab
2. Click **...** menu on latest deployment
3. Click **Redeploy**
4. Uncheck "Use existing Build Cache" (to ensure new env vars are picked up)
5. Click **Redeploy**

---

## What These Do:

- **STRIPE_WEEKLY_PRODUCT_ID**: Regular weekly plan ($9.99/week) - shown in main paywall
- **STRIPE_FREE_TRIAL_PRODUCT_ID**: Free trial plan (7-day free, then $9.99/week) - shown when user clicks X after onboarding

---

## Also Update Supabase Edge Function (if using webhooks):

```bash
supabase secrets set STRIPE_WEEKLY_PRODUCT_ID=prod_TexubYU0K47p6u
supabase secrets set STRIPE_FREE_TRIAL_PRODUCT_ID=prod_TexsO0iCT5ep5s
```

---

**Created:** December 23, 2025  
**Last Updated:** December 23, 2025

