# Full Report Search Setup Guide

## Overview

The main search page has been transformed into a **Full Report** search powered by Perplexity AI. This provides comprehensive people intelligence reports with:

1. **Images** - Up to 20 publicly available photos
2. **Sources** - 12-30 curated links (social profiles, news, public records)
3. **Answer** - Thorough narrative write-up with inline citations

## Key Features

### 1. Simple Search Form
- **Only 4 fields**: First Name, Last Name, City (optional), State (optional)
- Auto-populates query: "Tell me everything about [Name] from [Location]"
- No more complex tabs or multiple search types

### 2. Perplexity Pro Integration
- **First 3 searches per user** use Perplexity Pro (`sonar-pro` model)
- **Searches 4+** use standard Perplexity (`sonar` model)
- Automatic tracking in `perplexity_searches` database table

### 3. Follow-Up Searches
- After initial search, users can perform **2 additional follow-up searches**
- Suggested topics:
  - Find dating profiles
  - Find social media accounts
  - Find criminal records
  - Find property records
  - Find employment history
- After 3 total searches, follow-up suggestions are hidden

### 4. Custom System Prompt
The search uses a highly detailed system prompt that instructs Perplexity to:
- Always include images (never skip this section)
- Prioritize headshots and professional photos
- Provide 12-30 source links
- Write comprehensive narrative answers
- Handle sensitive topics appropriately
- Disambiguate common names
- Include minors when publicly relevant (athletes, performers, etc.)

## Setup Instructions

### 1. Get Perplexity API Key

1. Go to [https://www.perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Generate an API key
3. Add to your `.env.local`:

```bash
PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxxxxxxxxxx
```

### 2. Run Database Migration

Run the migration to create the `perplexity_searches` table:

```bash
# If using Supabase CLI
supabase migration up

# Or manually run the SQL in Supabase Dashboard -> SQL Editor:
# File: supabase/migrations/20260107000000_add_perplexity_searches.sql
```

This creates:
- `perplexity_searches` table to track usage
- Indexes for performance
- RLS policies for security

### 3. Deploy & Test

```bash
# Build and deploy
npm run build
vercel --prod

# Or run locally
npm run dev
```

## Testing Checklist

- [ ] Search form accepts first/last name
- [ ] Optional city/state fields work
- [ ] Loading screen shows during search
- [ ] Results display in 3 sections: Images, Sources, Answer
- [ ] Images load properly (with fallback for broken links)
- [ ] Source links are clickable and open in new tabs
- [ ] Follow-up search suggestions appear (first 2 searches)
- [ ] Follow-up searches work correctly
- [ ] Pro badge shows for first 3 searches
- [ ] Standard searches work after 3 Pro searches
- [ ] Paywall triggers for non-Pro users

## API Endpoint

**Endpoint**: `/api/perplexity/search`

**Method**: `POST`

**Request Body**:
```json
{
  "query": "Tell me everything about John Smith from Austin, TX",
  "userId": "user-uuid",
  "usePro": true
}
```

**Response**:
```json
{
  "success": true,
  "content": "# Images\n...\n\n# Sources\n...\n\n# Answer\n...",
  "model": "sonar-pro"
}
```

## File Structure

```
app/
├── api/
│   └── perplexity/
│       └── search/
│           └── route.ts           # Perplexity API integration
├── (app)/
│   └── search/
│       └── page.tsx               # Full Report search page
components/
└── shared/
    └── full-report-result.tsx     # Results display component
supabase/
└── migrations/
    └── 20260107000000_add_perplexity_searches.sql
```

## Database Schema

```sql
CREATE TABLE perplexity_searches (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  query TEXT NOT NULL,
  model TEXT NOT NULL,  -- 'sonar-pro' or 'sonar'
  created_at TIMESTAMP WITH TIME ZONE
);
```

## Usage Analytics

To check search usage per user:

```sql
-- Count searches per user
SELECT 
  user_id,
  COUNT(*) as total_searches,
  COUNT(*) FILTER (WHERE model = 'sonar-pro') as pro_searches,
  COUNT(*) FILTER (WHERE model = 'sonar') as standard_searches
FROM perplexity_searches
GROUP BY user_id
ORDER BY total_searches DESC;

-- Recent searches
SELECT 
  user_id,
  query,
  model,
  created_at
FROM perplexity_searches
ORDER BY created_at DESC
LIMIT 20;
```

## Pricing Considerations

### Perplexity API Costs (as of 2025)
- **Sonar Pro**: ~$0.10 per search
- **Sonar**: ~$0.01 per search

### Cost Per User (with our setup)
- First 3 searches (Pro): 3 × $0.10 = **$0.30**
- Additional searches: $0.01 each

### Recommendations
1. **Monitor usage** with the `perplexity_searches` table
2. **Set up billing alerts** in Perplexity dashboard
3. **Consider limits** for free users (e.g., 5 searches/day)
4. **Rate limiting** already implemented via middleware

## Troubleshooting

### Issue: "Search failed" error
**Solution**: Check Perplexity API key is valid and has credits

### Issue: Images not loading
**Solution**: Images are pulled from web sources - broken links are handled gracefully with `onError` handler

### Issue: No results returned
**Solution**: Check that user is authenticated (`userId` required)

### Issue: Follow-up searches not working
**Solution**: Ensure `searchCount` is being tracked properly in component state

## Future Enhancements

Potential improvements to consider:

1. **Cached Results**: Store results in database to avoid duplicate searches
2. **Export to PDF**: Allow users to download reports
3. **Share Reports**: Generate shareable links
4. **Search History**: Show user's past searches
5. **Advanced Filters**: Add age range, location radius, etc.
6. **Batch Searches**: Upload CSV of names to search
7. **Alert Subscriptions**: Notify when new info appears about a person

## Support

For issues or questions:
1. Check logs in Vercel/Next.js console
2. Review Perplexity API dashboard for errors
3. Check Supabase logs for database issues

