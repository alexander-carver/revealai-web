# CORS Setup for Supabase Edge Functions

## Important: Mobile App Compatibility
⚠️ **These functions are used by both mobile and web apps.** The CORS headers added here are **safe for mobile apps** because:
- CORS is a **browser-only** security feature
- Mobile apps (React Native, iOS, Android) **ignore CORS headers** completely
- We're only **adding headers**, not changing request/response structure
- The OPTIONS handler only affects browsers (mobile apps don't send OPTIONS requests)

## Problem
Your Supabase Edge Functions are being blocked by CORS policy when called from `http://localhost:3000`. This is because the functions don't return the necessary CORS headers.

## Solution
Add CORS headers to all your Supabase Edge Functions that are called from the browser. **This will NOT affect your mobile app.**

## Quick Fix

### Step 1: Add CORS Helper to Each Function

For each of these functions, you need to add CORS headers:
- `enformion-search`
- `enformion-records`
- `username-search`
- `remove-from-search`
- `ai-profile-search` (if it exists)

### Step 2: Update Function Code (Mobile-Safe)

Here's a template for how each function should handle CORS. **This is safe for mobile apps** - we're only adding headers, not changing the API contract:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Your existing function logic here...
    
    return new Response(
      JSON.stringify({ /* your response data */ }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
```

### Step 3: Example - enformion-search Function

Here's what your `enformion-search` function should look like:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { operation, ...payload } = body;

    // Your existing enformion search logic here...
    // const results = await performEnformionSearch(operation, payload);

    return new Response(
      JSON.stringify({ results: [] }), // Replace with actual results
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
```

### Step 4: Deploy Updated Functions

After updating each function, redeploy them:

```bash
supabase functions deploy enformion-search
supabase functions deploy enformion-records
supabase functions deploy username-search
supabase functions deploy remove-from-search
```

Or deploy all at once:
```bash
supabase functions deploy
```

## Production CORS (Optional)

For production, you might want to restrict the origin instead of using `*`:

```typescript
const allowedOrigins = [
  "http://localhost:3000",
  "https://yourdomain.com",
];

const origin = req.headers.get("origin") || "";
const corsHeaders = {
  "Access-Control-Allow-Origin": allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
```

## Testing

After deploying, test from your local app:
1. Open browser console
2. Try a search operation
3. Check that CORS errors are gone
4. Verify requests succeed

## Troubleshooting

If CORS errors persist:
1. Verify the function was deployed successfully
2. Check function logs: `supabase functions logs <function-name>`
3. Ensure the function URL is correct
4. Clear browser cache and try again

