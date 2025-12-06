# Deploy Supabase Edge Functions

## Quick Deploy Commands

After making changes to the edge functions, redeploy them:

```bash
# Navigate to project
cd /Users/alexandercarver/Documents/RevealAI/revealai-web

# Login to Supabase (if not already logged in)
supabase login

# Link project (if not already linked)
supabase link --project-ref ddoginuyioiatbpfemxr

# Deploy all functions at once
supabase functions deploy --no-verify-jwt

# OR deploy individually:
supabase functions deploy enformion-search --no-verify-jwt
supabase functions deploy enformion-records --no-verify-jwt
supabase functions deploy username-search --no-verify-jwt
supabase functions deploy remove-from-search --no-verify-jwt
supabase functions deploy ai-profile-search --no-verify-jwt
```

## Verify Deployment

After deploying, check the function logs:

```bash
# View logs for a specific function
supabase functions logs enformion-search

# Or view in Supabase Dashboard:
# Dashboard → Edge Functions → [function-name] → Logs
```

## Testing Profile Loading

After deploying, test the profile loading:

1. Go to People Search
2. Search for someone
3. Click on a result
4. Check browser console for any errors
5. Check Supabase function logs to see if the request is being received

If profile still doesn't load:
- Check browser console for errors
- Check Supabase function logs
- Verify the `enformionId` is being passed correctly in the URL

