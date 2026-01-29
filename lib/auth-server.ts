import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export interface GetSessionResult {
  user: User;
  error: null;
}

export interface GetSessionError {
  user: null;
  error: { status: number; message: string };
}

/**
 * Get the authenticated user from an API request (Bearer token or cookie).
 * Use this in API routes that require the caller to be the same user as the target (e.g. cancel subscription).
 */
export async function getSessionFromRequest(
  request: NextRequest
): Promise<GetSessionResult | GetSessionError> {
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: { status: 500, message: "Auth not configured" } };
  }

  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { user: null, error: { status: 401, message: "Missing or invalid Authorization header" } };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error) {
    return { user: null, error: { status: 401, message: error.message } };
  }
  if (!user) {
    return { user: null, error: { status: 401, message: "Invalid or expired token" } };
  }

  return { user, error: null };
}
