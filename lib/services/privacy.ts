import { getAuthHeaders, getFunctionsUrl } from "@/lib/supabase/client";
import type {
  RemoveMePayload,
  RemoveMeResponse,
  ExposureScoreData,
  ExposureCategory,
} from "@/lib/types";

class PrivacyServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "PrivacyServiceError";
  }
}

export async function updateOptOutStatus(
  userId: string,
  isOptedOut: boolean
): Promise<void> {
  try {
  const url = getFunctionsUrl("remove-from-search");
  const headers = await getAuthHeaders();

  const payload: RemoveMePayload = {
    userId,
    optOut: isOptedOut,
    client: "web-profile",
    requestedAt: new Date().toISOString(),
  };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
      let errorMessage = `Opt-out update failed (${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
    const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      throw new PrivacyServiceError(errorMessage, response.status);
  }

  // Check for error in response body
  if (response.headers.get("content-length") !== "0") {
    const data = (await response.json()) as RemoveMeResponse;
    if (data.error) {
      throw new PrivacyServiceError(data.error);
    }
    }
  } catch (error) {
    if (error instanceof PrivacyServiceError) {
      throw error;
    }
    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new PrivacyServiceError(
        "Network error: Unable to connect to privacy service. Please check your internet connection.",
        0
      );
    }
    throw new PrivacyServiceError(
      error instanceof Error ? error.message : "An unexpected error occurred",
      0
    );
  }
}

// ============================================
// Exposure Score Calculation (Client-side)
// ============================================

const EXPOSURE_CATEGORIES: Omit<ExposureCategory, "exposed">[] = [
  {
    name: "Phone Numbers",
    severity: "high",
    description: "Your phone numbers are publicly visible",
  },
  {
    name: "Email Addresses",
    severity: "high",
    description: "Your email addresses are exposed online",
  },
  {
    name: "Home Addresses",
    severity: "high",
    description: "Your residential addresses are publicly listed",
  },
  {
    name: "Social Media",
    severity: "medium",
    description: "Your social profiles are easily discoverable",
  },
  {
    name: "Employment History",
    severity: "medium",
    description: "Your work history is visible on data brokers",
  },
  {
    name: "Family Connections",
    severity: "medium",
    description: "Your relatives and associates are linked publicly",
  },
  {
    name: "Court Records",
    severity: "low",
    description: "Public court records are associated with your name",
  },
  {
    name: "Property Records",
    severity: "low",
    description: "Property ownership records are publicly accessible",
  },
];

export function calculateExposureScore(
  exposedCategories: string[]
): ExposureScoreData {
  const severityWeights = {
    high: 20,
    medium: 10,
    low: 5,
  };

  const categories: ExposureCategory[] = EXPOSURE_CATEGORIES.map((cat) => ({
    ...cat,
    exposed: exposedCategories.includes(cat.name),
  }));

  const maxScore = EXPOSURE_CATEGORIES.reduce(
    (sum, cat) => sum + severityWeights[cat.severity],
    0
  );

  const score = categories
    .filter((cat) => cat.exposed)
    .reduce((sum, cat) => sum + severityWeights[cat.severity], 0);

  return {
    score,
    maxScore,
    categories,
  };
}

export function getExposureLevel(
  score: number,
  maxScore: number
): { level: string; color: string } {
  const percentage = (score / maxScore) * 100;

  if (percentage <= 25) {
    return { level: "Low", color: "text-green-500" };
  } else if (percentage <= 50) {
    return { level: "Moderate", color: "text-yellow-500" };
  } else if (percentage <= 75) {
    return { level: "High", color: "text-orange-500" };
  } else {
    return { level: "Critical", color: "text-red-500" };
  }
}

// ============================================
// Data Broker List
// ============================================

export interface DataBroker {
  name: string;
  url: string;
  optOutUrl: string;
  difficulty: "easy" | "medium" | "hard";
  timeEstimate: string;
}

export const DATA_BROKERS: DataBroker[] = [
  {
    name: "Spokeo",
    url: "https://spokeo.com",
    optOutUrl: "https://www.spokeo.com/optout",
    difficulty: "easy",
    timeEstimate: "5 minutes",
  },
  {
    name: "WhitePages",
    url: "https://whitepages.com",
    optOutUrl: "https://www.whitepages.com/suppression-requests",
    difficulty: "medium",
    timeEstimate: "10 minutes",
  },
  {
    name: "BeenVerified",
    url: "https://beenverified.com",
    optOutUrl: "https://www.beenverified.com/faq/opt-out/",
    difficulty: "medium",
    timeEstimate: "10 minutes",
  },
  {
    name: "Intelius",
    url: "https://intelius.com",
    optOutUrl: "https://www.intelius.com/opt-out",
    difficulty: "medium",
    timeEstimate: "15 minutes",
  },
  {
    name: "PeopleFinder",
    url: "https://peoplefinder.com",
    optOutUrl: "https://www.peoplefinder.com/optout.php",
    difficulty: "easy",
    timeEstimate: "5 minutes",
  },
  {
    name: "TruePeopleSearch",
    url: "https://truepeoplesearch.com",
    optOutUrl: "https://www.truepeoplesearch.com/removal",
    difficulty: "easy",
    timeEstimate: "5 minutes",
  },
  {
    name: "FastPeopleSearch",
    url: "https://fastpeoplesearch.com",
    optOutUrl: "https://www.fastpeoplesearch.com/removal",
    difficulty: "easy",
    timeEstimate: "5 minutes",
  },
  {
    name: "Radaris",
    url: "https://radaris.com",
    optOutUrl: "https://radaris.com/control/privacy",
    difficulty: "hard",
    timeEstimate: "20 minutes",
  },
];

