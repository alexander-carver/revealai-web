export interface AttributionData {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  mc_flow?: string;
  mc_subscriber_id?: string;
  fbclid?: string;
  fbc?: string;
  fbp?: string;
}

const ATTRIBUTION_STORAGE_KEY = "revealai_attribution";

function setCookie(name: string, value: string, days: number) {
  if (typeof window === "undefined") return;
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = "expires=" + d.toUTCString();
  const domain = window.location.hostname.replace("www.", "");
  // Ensure we prefix the domain with a dot for subdomains if it's not localhost
  const domainStr = domain === "localhost" ? "" : `domain=.${domain};`;
  document.cookie = `${name}=${value};${expires};${domainStr}path=/`;
}

function getCookie(name: string) {
  if (typeof window === "undefined") return null;
  const v = document.cookie.match("(^|;) ?" + name + "=([^;]*)(;|$)");
  return v ? v[2] : null;
}

export function captureAttributionParams(searchParams: URLSearchParams) {
  if (typeof window === "undefined") return;

  const currentData = getAttributionData();
  const newData: AttributionData = { ...currentData };
  let hasChanges = false;

  const paramsToCapture = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "mc_flow",
    "mc_subscriber_id",
    "fbclid",
  ] as const;

  for (const param of paramsToCapture) {
    const val = searchParams.get(param);
    if (val) {
      newData[param] = val;
      hasChanges = true;

      // Format and store _fbc cookie
      if (param === "fbclid") {
        const creationTime = new Date().getTime();
        const fbcValue = `fb.1.${creationTime}.${val}`;
        setCookie("_fbc", fbcValue, 90);
        newData.fbc = fbcValue;
      }
    }
  }

  // Read _fbp and _fbc if not in our new data
  const fbp = getCookie("_fbp");
  if (fbp && newData.fbp !== fbp) {
    newData.fbp = fbp;
    hasChanges = true;
  }

  const fbc = getCookie("_fbc");
  if (fbc && newData.fbc !== fbc && !newData.fbclid) {
    newData.fbc = fbc;
    hasChanges = true;
  }

  if (hasChanges) {
    localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(newData));
  }
}

export function getAttributionData(): AttributionData {
  if (typeof window === "undefined") return {};

  try {
    const stored = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
    const data = stored ? JSON.parse(stored) : {};

    // Always get fresh cookies for Meta pixels
    const fbp = getCookie("_fbp");
    const fbc = getCookie("_fbc");

    if (fbp) data.fbp = fbp;
    if (fbc) data.fbc = fbc;

    return data;
  } catch (e) {
    return {};
  }
}
