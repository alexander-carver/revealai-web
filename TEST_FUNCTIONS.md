# Test Functions Summary

All test functions have been created and deployed to Supabase. These are **separate from your production functions** and can be used for testing before updating the real ones.

## ✅ Deployed Test Functions

### Mobile Test Functions (No CORS)
1. ✅ `test-enformion-search` - People search (candidates, profile, phone, email, address)
2. ✅ `test-enformion-records` - Court/criminal records search
3. ✅ `test-username-search` - Social media username lookup
4. ✅ `test-remove-from-search` - Privacy opt-out management
5. ✅ `test-ai-profile-search` - AI-powered research

### Web Test Functions (With CORS)
1. ✅ `test-enformion-search-web` - People search (with CORS)
2. ✅ `test-enformion-records-web` - Records search (with CORS)
3. ✅ `test-username-search-web` - Username search (with CORS)
4. ✅ `test-remove-from-search-web` - Privacy opt-out (with CORS)
5. ✅ `test-ai-profile-search-web` - AI search (with CORS)

## How to Test

### Option 1: Test via Supabase Dashboard
1. Go to Supabase Dashboard → Edge Functions
2. Click on any `test-*` function
3. Use the "Invoke" tab to test with sample payloads

### Option 2: Test via Frontend (Temporary)
Temporarily update your frontend to point to test functions:

```typescript
// In lib/services/people-search.ts
const url = getFunctionsUrl("test-enformion-search-web"); // Instead of "enformion-search-web"
```

### Option 3: Test via cURL
```bash
# Test enformion-search-web
curl -X POST https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/test-enformion-search-web \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"operation": "person_candidates", "FirstName": "John", "LastName": "Doe"}'
```

## Test Function Features

All test functions:
- ✅ Have `[TEST-*]` prefixes in console logs
- ✅ Return `test: true` in responses
- ✅ Use the same structure as production functions
- ✅ Include proper error handling
- ✅ Web versions have CORS headers

## Next Steps

1. **Test each function** to verify they work correctly
2. **Check logs** in Supabase Dashboard to see what's happening
3. **Once verified**, copy the working logic to production functions
4. **Delete test functions** when done (or keep them for future testing)

## Function Locations

All test functions are in:
```
supabase/functions/test-*/
```

Production functions are in:
```
supabase/functions/enformion-search/          (mobile - DO NOT TOUCH)
supabase/functions/enformion-search-web/      (web - production)
supabase/functions/enformion-records/          (needs real implementation)
supabase/functions/username-search/           (needs real implementation)
supabase/functions/remove-from-search/        (needs real implementation)
supabase/functions/ai-profile-search/         (needs real implementation)
```

## Important Notes

- ⚠️ Test functions use the **same environment variables** as production
- ⚠️ Test functions make **real API calls** to Enformion (not mock data)
- ⚠️ Test functions are **separate** - they won't affect your mobile app
- ✅ You can safely test and modify test functions without breaking anything

