import { getAuthHeaders, getFunctionsUrl } from "@/lib/supabase/client";
import type { UsernameSearchResponse, UsernameProbe } from "@/lib/types";

class UsernameSearchError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "UsernameSearchError";
  }
}

export async function searchUsername(
  username: string
): Promise<UsernameSearchResponse> {
  try {
  const normalizedUsername = username.trim().replace("@", "");

  if (normalizedUsername.length < 2) {
    throw new UsernameSearchError("Username must be at least 2 characters");
  }

  const url = getFunctionsUrl("username-search");
  const headers = await getAuthHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ username: normalizedUsername }),
  });

  if (!response.ok) {
      let errorMessage = `Username search failed (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
    const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new UsernameSearchError(errorMessage, response.status);
    }

    const data = await response.json();
    return parseUsernameResponse(data, normalizedUsername);
  } catch (error) {
    if (error instanceof UsernameSearchError) {
      throw error;
    }
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new UsernameSearchError(
        "Network error: Unable to connect to username search service. Please check your internet connection.",
        0
      );
    }
    throw new UsernameSearchError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      0
    );
  }
}

function parseUsernameResponse(
  data: unknown,
  username: string
): UsernameSearchResponse {
  if (!data || typeof data !== "object") {
    return { username, profiles: [] };
  }

  const response = data as Record<string, unknown>;
  const rawProfiles = (response.profiles || []) as unknown[];

  const profiles: UsernameProbe[] = rawProfiles.map((item: unknown) => {
    const raw = item as Record<string, unknown>;
    return {
      site: (raw.site as string) || "Unknown",
      display: (raw.display as string) || (raw.site as string) || "Unknown",
      url: raw.url as string,
      status: raw.status as number,
      exists: (raw.exists as boolean) ?? false,
      confidence: (raw.confidence as number) ?? 0,
      error: raw.error as string,
    };
  });

  // Sort: existing profiles first, then alphabetically
  profiles.sort((a, b) => {
    if (a.exists !== b.exists) return a.exists ? -1 : 1;
    return a.display.localeCompare(b.display);
  });

  return {
    username,
    profiles,
    provider: response.provider as string,
    tookMs: response.tookMs as number,
  };
}

