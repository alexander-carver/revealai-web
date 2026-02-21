// Analytics tracking helper for GA4 and Meta Pixel
// All Meta Pixel events include an event_id for deduplication with Conversions API (CAPI)

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const isDev = process.env.NODE_ENV === 'development';

/** Generate a unique event ID for deduplication between browser pixel and CAPI. */
export function generateEventId(prefix: string = 'evt'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${ts}_${rand}`;
}

// GA4 Helper
function trackGA4(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  if (isDev) {
    console.log('[GA4 Event]', eventName, params);
  }
  
  if (window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// Meta Pixel Helper -- passes eventID for deduplication with CAPI
function trackMetaPixel(eventName: string, params?: Record<string, any>, eventId?: string) {
  if (typeof window === 'undefined') return;
  
  if (isDev) {
    console.log('[Meta Pixel Event]', eventName, params, 'eventID:', eventId);
  }
  
  if (window.fbq) {
    if (eventId) {
      window.fbq('track', eventName, params, { eventID: eventId });
    } else {
      window.fbq('track', eventName, params);
    }
  }
}

// Track landing page view
export function trackViewContent() {
  const eventId = generateEventId('vc');
  trackGA4('view_content', {
    content_type: 'landing_page',
    page_title: 'Reveal AI - People Search',
  });
  
  trackMetaPixel('ViewContent', {
    content_name: 'Landing Page',
    content_category: 'People Search',
  }, eventId);
}

// Track CTA button clicks
export function trackCTAClick(buttonName: string) {
  const eventId = generateEventId('cta');
  trackGA4('cta_click', {
    button_name: buttonName,
    event_category: 'engagement',
  });
  
  trackMetaPixel('CTA_Click', {
    button_name: buttonName,
  }, eventId);
}

/**
 * Track checkout initiation (before Stripe redirect).
 * Returns the eventId so it can be passed to the checkout API for CAPI dedup.
 */
export function trackInitiateCheckout(plan: string = 'free_trial'): string {
  const eventId = generateEventId('ic');
  const value = plan === 'yearly' ? 49.99 : plan === 'abandoned_trial' ? 1.99 : 6.99;

  trackGA4('begin_checkout', {
    currency: 'USD',
    value,
    items: [{
      item_id: plan,
      item_name: `Reveal AI ${plan}`,
      price: value,
      quantity: 1,
    }],
  });
  
  trackMetaPixel('InitiateCheckout', {
    content_name: `Reveal AI ${plan}`,
    currency: 'USD',
    value,
  }, eventId);

  return eventId;
}

/**
 * Track completed purchase (only after Stripe verification).
 * eventId must match the one sent via CAPI for deduplication.
 */
export function trackPurchase({
  value,
  currency = 'USD',
  transaction_id,
  plan = 'subscription',
  eventId,
}: {
  value: number;
  currency?: string;
  transaction_id: string;
  plan?: string;
  eventId?: string;
}) {
  const eid = eventId || generateEventId('pur');

  trackGA4('purchase', {
    transaction_id,
    value,
    currency,
    items: [{
      item_id: plan,
      item_name: `Reveal AI ${plan}`,
      price: value,
      quantity: 1,
    }],
  });
  
  trackMetaPixel('Purchase', {
    value,
    currency,
    content_name: `Reveal AI ${plan}`,
    content_type: 'product',
    content_ids: [transaction_id],
    contents: [{
      id: transaction_id,
      quantity: 1,
      item_price: value,
    }],
    num_items: 1,
    content_category: 'subscription',
  }, eid);
  
  if (isDev) {
    console.log('✅ Purchase tracked:', { transaction_id, value, currency, eventId: eid });
  }
}

// Initialize tracking on page load
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  
  if (isDev) {
    console.log('[Analytics] Initialized - GA4 and Meta Pixel ready');
  }
}

/**
 * Update Meta Pixel with user identity for Advanced Matching.
 * Call this when user logs in or email becomes known (e.g. after checkout).
 * fbq('init', ...) with user data can be called multiple times safely.
 */
export function identifyUser(email?: string, externalId?: string) {
  if (typeof window === 'undefined' || !window.fbq) return;

  const userData: Record<string, string> = {};
  if (email) userData.em = email.trim().toLowerCase();
  if (externalId) userData.external_id = externalId;

  if (Object.keys(userData).length > 0) {
    window.fbq('init', '1519956929082381', userData);
    if (isDev) {
      console.log('[Meta Pixel] Advanced Matching updated:', userData);
    }
  }
}

// Track search button clicks on homepage
export function trackSearchButtonClick(searchType: string) {
  const eventId = generateEventId('search');
  trackGA4('search_button_click', {
    search_type: searchType,
    event_category: 'search',
    page_location: 'homepage',
  });
  
  trackMetaPixel('Search', {
    search_string: searchType,
    content_category: 'people_search',
  }, eventId);
}

// Track Most Searched profile clicks
export function trackMostSearchedClick(profileName: string, profileId: string) {
  const eventId = generateEventId('msc');
  trackGA4('most_searched_click', {
    profile_name: profileName,
    profile_id: profileId,
    event_category: 'engagement',
    page_location: 'homepage',
  });
  
  trackMetaPixel('ViewContent', {
    content_name: profileName,
    content_type: 'profile',
    content_id: profileId,
  }, eventId);
}
