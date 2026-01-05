// Analytics tracking helper for GA4 and Meta Pixel
// Provides safe wrappers for conversion tracking

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

const isDev = process.env.NODE_ENV === 'development';

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

// Meta Pixel Helper
function trackMetaPixel(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined') return;
  
  if (isDev) {
    console.log('[Meta Pixel Event]', eventName, params);
  }
  
  if (window.fbq) {
    window.fbq('track', eventName, params);
  }
}

// Track landing page view
export function trackViewContent() {
  trackGA4('view_content', {
    content_type: 'landing_page',
    page_title: 'Reveal AI - People Search',
  });
  
  trackMetaPixel('ViewContent', {
    content_name: 'Landing Page',
    content_category: 'People Search',
  });
}

// Track CTA button clicks
export function trackCTAClick(buttonName: string) {
  trackGA4('cta_click', {
    button_name: buttonName,
    event_category: 'engagement',
  });
  
  trackMetaPixel('CTA_Click', {
    button_name: buttonName,
  });
}

// Track checkout initiation (before Stripe redirect)
export function trackInitiateCheckout(plan: string = 'free_trial') {
  trackGA4('begin_checkout', {
    currency: 'USD',
    value: plan === 'yearly' ? 49.99 : 9.99,
    items: [{
      item_id: plan,
      item_name: `Reveal AI ${plan}`,
      price: plan === 'yearly' ? 49.99 : 9.99,
      quantity: 1,
    }],
  });
  
  trackMetaPixel('InitiateCheckout', {
    content_name: `Reveal AI ${plan}`,
    currency: 'USD',
    value: plan === 'yearly' ? 49.99 : 9.99,
  });
}

// Track completed purchase (only after Stripe verification)
export function trackPurchase({
  value,
  currency = 'USD',
  transaction_id,
  plan = 'subscription',
}: {
  value: number;
  currency?: string;
  transaction_id: string;
  plan?: string;
}) {
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
    content_ids: [transaction_id], // Helps Facebook match events better
    contents: [{
      id: transaction_id,
      quantity: 1,
      item_price: value,
    }],
    num_items: 1, // Standard Facebook parameter
    content_category: 'subscription', // Helps with ad optimization
  });
  
  if (isDev) {
    console.log('✅ Purchase tracked:', { transaction_id, value, currency });
  }
}

// Initialize tracking on page load
export function initAnalytics() {
  if (typeof window === 'undefined') return;
  
  if (isDev) {
    console.log('[Analytics] Initialized - GA4 and Meta Pixel ready');
  }
}

// Track search button clicks on homepage
export function trackSearchButtonClick(searchType: string) {
  trackGA4('search_button_click', {
    search_type: searchType,
    event_category: 'search',
    page_location: 'homepage',
  });
  
  trackMetaPixel('Search', {
    search_string: searchType,
    content_category: 'people_search',
  });
}

// Track Most Searched profile clicks
export function trackMostSearchedClick(profileName: string, profileId: string) {
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
  });
}

