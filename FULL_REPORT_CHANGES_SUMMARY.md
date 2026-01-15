# Full Report Search - Implementation Summary

## What Changed

The main `/search` page has been completely refactored from a multi-tab search interface to a single, streamlined **Full Report** search powered by Perplexity AI.

### Before vs After

#### Before (Old System)
- 5 search tabs: Name, Phone, Email, Address, Cheater Buster
- Multiple search modes and APIs
- Results showed candidate lists
- Complex UI with many options

#### After (New System)
- **Single search form**: First Name, Last Name, City (optional), State (optional)
- **Perplexity AI integration**: sonar-pro for first 3 searches, sonar after
- **Structured results**: Images, Sources, Answer sections
- **Follow-up searches**: Suggested searches for deeper investigation
- Clean, focused UI

---

## Files Created

### 1. `/app/api/perplexity/search/route.ts`
**Purpose**: API route for Perplexity AI integration

**Key Features**:
- Accepts search query, userId, and usePro flag
- Calls Perplexity API with custom system prompt
- Logs searches to database for tracking
- Returns structured content (Images, Sources, Answer)

**System Prompt**: 
- Comprehensive instructions for RevealAI people research
- Always include images (up to 20)
- Provide 12-30 source links
- Write thorough narrative answers
- Handle sensitive topics appropriately

### 2. `/components/shared/full-report-result.tsx`
**Purpose**: Component to display Perplexity search results

**Key Features**:
- Parses markdown content into 3 sections
- Image grid with lazy loading and error handling
- Source links with external link icons
- Follow-up search suggestions (first 2 searches only)
- Pro search quota tracking

**Display Logic**:
- Show 6 images initially, expand to 20
- Show 12 sources initially, expand to all
- Format answer with inline links

### 3. `/supabase/migrations/20260107000000_add_perplexity_searches.sql`
**Purpose**: Database table to track search usage

**Schema**:
```sql
perplexity_searches (
  id UUID,
  user_id UUID,
  query TEXT,
  model TEXT,  -- 'sonar-pro' or 'sonar'
  created_at TIMESTAMP
)
```

### 4. `/FULL_REPORT_SETUP.md`
**Purpose**: Complete setup and deployment guide

**Contents**:
- Perplexity API key setup
- Database migration instructions
- Testing checklist
- API documentation
- Usage analytics queries
- Troubleshooting guide

### 5. `/FULL_REPORT_CHANGES_SUMMARY.md`
**Purpose**: This document - overview of all changes

---

## Files Modified

### 1. `/app/(app)/search/page.tsx`
**Major Refactor**: Complete rewrite of search page

**Old Features Removed**:
- ❌ Multi-tab search interface (Name, Phone, Email, Address, Cheater)
- ❌ Enformion API integration
- ❌ Candidate list results
- ❌ Contact matches display
- ❌ Complex form with many fields

**New Features Added**:
- ✅ Simple 4-field form (First Name, Last Name, City, State)
- ✅ Perplexity AI search integration
- ✅ Auto-populated query display
- ✅ Full Report results display
- ✅ Follow-up search functionality
- ✅ Pro search quota tracking (3 Pro searches, then standard)

**Key Changes**:
```typescript
// Old: Multiple search mutations
const personSearchMutation = useMutation({ ... });
const contactSearchMutation = useMutation({ ... });
const aiSearchMutation = useMutation({ ... });

// New: Single Perplexity search mutation
const searchMutation = useMutation({
  mutationFn: async (query: string) => {
    const usePro = searchCount < 3;
    // Call /api/perplexity/search
  },
});
```

---

## Environment Variables

Add to `.env.local`:

```bash
# Perplexity AI API Key
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxx
```

**How to get it**:
1. Go to https://www.perplexity.ai/settings/api
2. Generate an API key
3. Copy to `.env.local`

---

## Database Changes

### New Table: `perplexity_searches`

**Purpose**: Track search usage for analytics and quota management

**Fields**:
- `id` - Primary key (UUID)
- `user_id` - Foreign key to auth.users
- `query` - Search query string
- `model` - 'sonar-pro' or 'sonar'
- `created_at` - Timestamp

**Indexes**:
- `perplexity_searches_user_id_idx` - Fast user lookups
- `perplexity_searches_created_at_idx` - Recent searches

**RLS Policies**:
- Users can SELECT their own searches
- Service role can INSERT searches

---

## User Flow

### 1. Initial Search
```
User enters: John Smith, Austin, TX
↓
System generates: "Tell me everything about John Smith from Austin, TX"
↓
Perplexity API (sonar-pro) searches web
↓
Results displayed: Images | Sources | Answer
↓
Follow-up suggestions shown
```

### 2. Follow-Up Search (1st time)
```
User clicks: "Find dating profiles"
↓
System generates: "Find dating profiles for John Smith from Austin, TX"
↓
Perplexity API (sonar-pro) searches
↓
Results displayed
↓
Follow-up suggestions still shown
```

### 3. Follow-Up Search (2nd time)
```
User clicks: "Find social media accounts"
↓
System generates: "Find social media accounts for John Smith from Austin, TX"
↓
Perplexity API (sonar-pro) searches
↓
Results displayed
↓
Follow-up suggestions HIDDEN (3 searches done)
↓
Badge shows: "Pro Searches Used"
```

### 4. Additional Searches (4+)
```
User enters: Sarah Johnson, Miami, FL
↓
Perplexity API (sonar - standard) searches
↓
Results displayed (no Pro badge)
```

---

## Cost Analysis

### Perplexity API Pricing
- **Sonar Pro**: ~$0.10 per search
- **Sonar**: ~$0.01 per search

### Per-User Cost
| Searches | Model | Cost |
|----------|-------|------|
| 1-3 | sonar-pro | $0.10 each |
| 4+ | sonar | $0.01 each |

**Example User Journey**:
- 3 Pro searches: 3 × $0.10 = $0.30
- 7 additional searches: 7 × $0.01 = $0.07
- **Total for 10 searches**: $0.37

### Monthly Estimates (1000 users)
- Average 5 searches per user
- First 3 are Pro: 3,000 × $0.10 = $300
- Additional 2 are standard: 2,000 × $0.01 = $20
- **Total monthly**: ~$320

---

## Testing Guide

### Manual Testing Steps

1. **Basic Search**
   - [ ] Navigate to `/search`
   - [ ] Enter: "John Smith" (first name), "Smith" (last name)
   - [ ] Click "Generate Full Report"
   - [ ] Verify loading screen appears
   - [ ] Verify results show 3 sections: Images, Sources, Answer

2. **Optional Location**
   - [ ] Search with city: "Austin"
   - [ ] Search with state: "TX"
   - [ ] Search with both: "Austin, TX"
   - [ ] Verify query preview updates

3. **Follow-Up Searches**
   - [ ] After first search, verify 5 follow-up suggestions appear
   - [ ] Click "Find dating profiles"
   - [ ] Verify search executes with context
   - [ ] Verify results display
   - [ ] After 3 total searches, verify suggestions disappear

4. **Pro Quota**
   - [ ] Perform 3 searches
   - [ ] Verify "Pro" badge/indicator shows
   - [ ] Perform 4th search
   - [ ] Verify "Pro Searches Used" message appears
   - [ ] Verify searches still work (using standard model)

5. **Error Handling**
   - [ ] Try searching without first name - verify button disabled
   - [ ] Try searching without last name - verify button disabled
   - [ ] Disconnect internet - verify error message shows

6. **Images Section**
   - [ ] Verify images load
   - [ ] Verify "Show All" button appears if >6 images
   - [ ] Verify external link button appears on hover
   - [ ] Verify broken image links don't crash UI

7. **Sources Section**
   - [ ] Verify source links are clickable
   - [ ] Verify links open in new tab
   - [ ] Verify "Show All" button appears if >12 sources

8. **Answer Section**
   - [ ] Verify narrative text displays
   - [ ] Verify inline links are clickable
   - [ ] Verify formatting is readable

### Database Testing

```sql
-- Verify searches are logged
SELECT * FROM perplexity_searches 
ORDER BY created_at DESC 
LIMIT 10;

-- Count Pro vs Standard
SELECT 
  model,
  COUNT(*) 
FROM perplexity_searches 
GROUP BY model;

-- Check user quota
SELECT 
  user_id,
  COUNT(*) FILTER (WHERE model = 'sonar-pro') as pro_count,
  COUNT(*) as total_count
FROM perplexity_searches
WHERE user_id = 'YOUR_USER_ID'
GROUP BY user_id;
```

---

## Deployment Steps

### 1. Set Environment Variable

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add: `PERPLEXITY_API_KEY` = `pplx-xxxxx`
3. Apply to: Production, Preview, Development

### 2. Run Database Migration

```bash
# Option A: Supabase CLI
supabase migration up

# Option B: Supabase Dashboard
# 1. Go to SQL Editor
# 2. Copy contents of supabase/migrations/20260107000000_add_perplexity_searches.sql
# 3. Execute
```

### 3. Deploy to Vercel

```bash
# Build locally first (test for errors)
npm run build

# Deploy
vercel --prod

# Or push to main branch (if auto-deploy enabled)
git push origin main
```

### 4. Verify Deployment

1. Visit: `https://your-domain.com/search`
2. Perform a test search
3. Check Vercel logs for API calls
4. Check Supabase logs for database inserts
5. Check Perplexity dashboard for API usage

---

## Monitoring & Analytics

### Vercel Logs

Monitor API performance:
```bash
vercel logs --follow
```

Look for:
- `POST /api/perplexity/search`
- Response times
- Error rates

### Supabase Logs

Track database activity:
1. Supabase Dashboard → Logs
2. Filter by table: `perplexity_searches`
3. Check for insert errors

### Perplexity Dashboard

Monitor API usage:
1. https://www.perplexity.ai/settings/api
2. Check request count
3. Monitor costs
4. Set up billing alerts

### Custom Analytics Queries

```sql
-- Daily search volume
SELECT 
  DATE(created_at) as date,
  COUNT(*) as searches,
  COUNT(DISTINCT user_id) as unique_users
FROM perplexity_searches
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Top queries
SELECT 
  query,
  COUNT(*) as frequency
FROM perplexity_searches
GROUP BY query
ORDER BY frequency DESC
LIMIT 20;

-- Average searches per user
SELECT 
  AVG(search_count) as avg_searches_per_user
FROM (
  SELECT user_id, COUNT(*) as search_count
  FROM perplexity_searches
  GROUP BY user_id
) subquery;
```

---

## Rollback Plan

If issues occur, here's how to rollback:

### Quick Rollback (Revert Deployment)
```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback DEPLOYMENT_URL
```

### Full Rollback (Revert Code)
```bash
# If you need to go back to old search system
git revert HEAD~5..HEAD  # Adjust number based on commits
git push origin main
```

### Database Rollback
```sql
-- If needed, drop the new table
DROP TABLE IF EXISTS public.perplexity_searches;
```

---

## Known Limitations

1. **Perplexity API Rate Limits**: Default is 20 requests/minute
2. **Image Loading**: Some images may fail to load (broken links)
3. **Search Results**: Quality depends on Perplexity's web crawling
4. **No Caching**: Each search calls API (costs money)
5. **No History**: Users can't view past searches (yet)

---

## Future Improvements

### Short Term (Next 2 weeks)
- [ ] Add search history page
- [ ] Implement result caching (24 hours)
- [ ] Add "Export to PDF" feature
- [ ] Add rate limiting per user

### Medium Term (Next month)
- [ ] Batch search (upload CSV of names)
- [ ] Share reports via link
- [ ] Email reports functionality
- [ ] Advanced filters (age range, location radius)

### Long Term (Next quarter)
- [ ] Real-time monitoring/alerts
- [ ] Custom report templates
- [ ] API for third-party integrations
- [ ] White-label solution

---

## Support & Questions

**For technical issues**:
1. Check Vercel logs: `vercel logs`
2. Check Supabase logs in dashboard
3. Review Perplexity API status

**For billing questions**:
- Perplexity: https://www.perplexity.ai/settings/billing

**For feature requests**:
- Document in GitHub Issues or internal tracker

---

## Success Metrics

Track these metrics to measure success:

1. **Search Completion Rate**: % of searches that return results
2. **User Engagement**: Average searches per user
3. **Pro Conversion**: % of free users who see paywall
4. **Follow-Up Rate**: % of users who do follow-up searches
5. **API Costs**: Total monthly Perplexity spend
6. **Response Time**: Average search latency
7. **Error Rate**: % of failed searches

**Target Metrics** (suggested):
- Search completion: >95%
- Avg searches/user: 5-10
- Follow-up rate: >30%
- Response time: <10 seconds
- Error rate: <2%

---

## Changelog

### Version 1.0.0 (January 7, 2026)
- ✅ Implemented Perplexity AI integration
- ✅ Created Full Report search page
- ✅ Added follow-up search functionality
- ✅ Implemented Pro search quota (3 Pro, then standard)
- ✅ Added search tracking database
- ✅ Created comprehensive documentation

### Planned Updates
- 1.1.0: Search history and caching
- 1.2.0: Export and sharing features
- 1.3.0: Batch searches
- 2.0.0: Advanced filters and monitoring

---

**Last Updated**: January 7, 2026
**Status**: ✅ Complete and Ready for Deployment

