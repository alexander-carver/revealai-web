# Quick Setup Instructions

## ✅ Already Done

1. ✅ Vercel CLI authenticated
2. ✅ Migration file created
3. ✅ Setup script created

## 🔑 Step 1: Add Perplexity API Key

### Option A: Run the Setup Script (Easiest)

```bash
cd /Users/alexandercarver/Documents/RevealAI/revealai-web
./scripts/setup-perplexity.sh
```

When prompted, paste your Perplexity API key from:
**https://www.perplexity.ai/settings/api**

### Option B: Manual Setup

**Add to Vercel:**

```bash
# Get your Perplexity API key from: https://www.perplexity.ai/settings/api
# Then run (replace YOUR_KEY with actual key):

echo "pplx-YOUR_KEY" | vercel env add PERPLEXITY_API_KEY production --force
echo "pplx-YOUR_KEY" | vercel env add PERPLEXITY_API_KEY preview --force
echo "pplx-YOUR_KEY" | vercel env add PERPLEXITY_API_KEY development --force
```

**Add to .env.local:**

```bash
echo "PERPLEXITY_API_KEY=pplx-YOUR_KEY" >> .env.local
```

## 🗄️ Step 2: Run Database Migration

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of:
   ```
   supabase/migrations/20260107000000_add_perplexity_searches.sql
   ```
4. Paste into SQL Editor
5. Click **Run**

### Option B: Supabase CLI (If you have Docker running)

```bash
# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migration
supabase migration up
```

## 🚀 Step 3: Deploy

```bash
vercel --prod
```

## ✅ Step 4: Test

```bash
npm run dev
# Navigate to http://localhost:3000/search
# Try searching for: "John Smith" from "Austin, TX"
```

## 📊 Verify Setup

**Check Vercel environment variables:**
```bash
vercel env ls
```

**Check Supabase table (SQL Editor):**
```sql
SELECT * FROM perplexity_searches LIMIT 5;
```

---

## 🆘 Troubleshooting

**Issue**: "PERPLEXITY_API_KEY not found"
- Make sure you added it to all 3 environments (production, preview, development)
- Check: `vercel env ls`

**Issue**: "Table perplexity_searches doesn't exist"
- Make sure you ran the migration SQL in Supabase Dashboard
- Check: Supabase Dashboard → Table Editor

**Issue**: "Search failed" error
- Check your Perplexity API key is valid
- Check you have credits in Perplexity account
- Check Vercel logs: `vercel logs`

