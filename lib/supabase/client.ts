import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "", {
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
    apikey: supabaseAnonKey || "",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return headers;
}

// Helper to get the functions URL
export function getFunctionsUrl(functionName: string): string {
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  
  // Handle both .supabase.co and custom domains
  let baseUrl = supabaseUrl;
  if (baseUrl.includes(".supabase.co")) {
    baseUrl = baseUrl.replace(".supabase.co", ".supabase.co/functions/v1");
  } else {
    // For custom domains or other formats, append /functions/v1
    baseUrl = `${baseUrl}/functions/v1`;
  }
  
  return `${baseUrl}/${functionName}`;
}

