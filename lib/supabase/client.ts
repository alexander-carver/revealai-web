import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Fallback for local dev when .env.local is missing - allows app to load (auth won't work)
const url = supabaseUrl || "https://ddoginuyioiatbpfemxr.supabase.co";
const key =
  supabaseAnonKey ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not found in env. Using fallback for local dev. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local for full auth."
  );
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

// Helper to get auth headers for API calls
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: key,
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

// Helper to get the functions URL
export function getFunctionsUrl(functionName: string): string {
  // Handle both .supabase.co and custom domains
  let baseUrl = url;
  if (baseUrl.includes(".supabase.co")) {
    baseUrl = baseUrl.replace(".supabase.co", ".supabase.co/functions/v1");
  } else {
    // For custom domains or other formats, append /functions/v1
    baseUrl = `${baseUrl}/functions/v1`;
  }
  
  return `${baseUrl}/${functionName}`;
}

