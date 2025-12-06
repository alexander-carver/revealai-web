import { getAuthHeaders, getFunctionsUrl } from "@/lib/supabase/client";
import type {
  RecordsSearchRequest,
  RecordsSearchResponse,
  CourtRecord,
} from "@/lib/types";

class RecordsSearchError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "RecordsSearchError";
  }
}

export async function searchRecords(
  request: RecordsSearchRequest
): Promise<RecordsSearchResponse> {
  try {
  const url = getFunctionsUrl("enformion-records");
  const headers = await getAuthHeaders();

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  if (!response.ok) {
      let errorMessage = `Records search failed (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
    const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new RecordsSearchError(errorMessage, response.status);
    }

    const data = await response.json();
    return parseRecordsResponse(data);
  } catch (error) {
    if (error instanceof RecordsSearchError) {
      throw error;
    }
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new RecordsSearchError(
        "Network error: Unable to connect to records service. Please check your internet connection.",
        0
      );
    }
    throw new RecordsSearchError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      0
    );
  }
}

function parseRecordsResponse(data: unknown): RecordsSearchResponse {
  if (!data || typeof data !== "object") {
    return { records: [] };
  }

  const response = data as Record<string, unknown>;
  const rawRecords = (response.records || []) as unknown[];

  const records: CourtRecord[] = rawRecords.map((item: unknown, index) => {
    const raw = item as Record<string, unknown>;
    return {
      id: (raw.id as string) || `record-${index}`,
      category: (raw.category as string) || "Unknown",
      caseNumber: raw.caseNumber as string,
      filedDate: raw.filedDate as string,
      status: raw.status as string,
      jurisdiction: raw.jurisdiction as string,
      description: raw.description as string,
      raw: raw.raw as Record<string, unknown>,
    };
  });

  return {
    records,
    provider: response.provider as string,
    tookMs: response.tookMs as number,
  };
}

// Helper to format DOB from various formats to YYYY-MM-DD
export function normalizeDob(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  // Already in YYYY-MM-DD format
  if (trimmed.includes("-")) {
    return trimmed;
  }

  // MM/DD/YYYY format
  const parts = trimmed.split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    const normalizedMonth = month.padStart(2, "0");
    const normalizedDay = day.padStart(2, "0");
    return `${year}-${normalizedMonth}-${normalizedDay}`;
  }

  return trimmed;
}

