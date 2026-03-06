const AFFILIATE_STORAGE_KEY = "revealai_affiliate_ref";
const AFFILIATE_TIMESTAMP_KEY = "revealai_affiliate_ref_ts";
const AFFILIATE_TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90-day attribution window

/**
 * Capture `?ref=CREATOR_SLUG` from the current URL and persist to localStorage.
 * Call this on every page load (e.g. in a global provider) so affiliate links
 * landing on any route are tracked. Last-click attribution: a new ref always
 * overwrites a previous one.
 * Also logs the click to the backend for analytics.
 */
export function captureAffiliateRef(): void {
  if (typeof window === "undefined") return;

  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref && ref.trim().length > 0) {
      const cleanRef = ref.trim();
      localStorage.setItem(AFFILIATE_STORAGE_KEY, cleanRef);
      localStorage.setItem(AFFILIATE_TIMESTAMP_KEY, Date.now().toString());

      // Log click to backend for analytics
      logAffiliateClick(cleanRef);

      // Clean the ref param from URL without a full page reload
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.toString());
    }
  } catch {
    // localStorage may be blocked in some browsers
  }
}

/**
 * Log an affiliate click to the backend for tracking.
 * Captures referrer, device info, and timestamp.
 */
async function logAffiliateClick(ref: string): Promise<void> {
  try {
    await fetch("/api/affiliates/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ref,
        referrer: document.referrer || null,
        userAgent: navigator.userAgent,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timestamp: Date.now(),
      }),
    });
  } catch {
    // Non-blocking: don't break the user experience if tracking fails
  }
}

/**
 * Get the stored affiliate ref (if still within the attribution window).
 * Returns `null` when no valid ref exists.
 */
export function getAffiliateRef(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const ref = localStorage.getItem(AFFILIATE_STORAGE_KEY);
    const ts = localStorage.getItem(AFFILIATE_TIMESTAMP_KEY);

    if (!ref) return null;

    if (ts) {
      const age = Date.now() - parseInt(ts, 10);
      if (age > AFFILIATE_TTL_MS) {
        clearAffiliateRef();
        return null;
      }
    }

    return ref;
  } catch {
    return null;
  }
}

/**
 * Clear stored affiliate ref (e.g. after successful conversion).
 */
export function clearAffiliateRef(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AFFILIATE_STORAGE_KEY);
    localStorage.removeItem(AFFILIATE_TIMESTAMP_KEY);
  } catch {
    // noop
  }
}
