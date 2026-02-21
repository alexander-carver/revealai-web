/**
 * Meta Conversions API (CAPI) - Server-side event tracking
 *
 * Sends events to Meta from the server, bypassing ad blockers and browser limitations.
 * Used alongside the browser pixel for redundant coverage. Events are deduplicated
 * using event_id shared between browser and server.
 *
 * Env:
 *   META_PIXEL_ID          - Your pixel ID (same as browser pixel)
 *   META_CAPI_ACCESS_TOKEN - System user access token from Meta Events Manager
 */

const PIXEL_ID = process.env.META_PIXEL_ID || "1519956929082381";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || "";
const API_VERSION = "v21.0";
const ENDPOINT = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

import { createHash } from "crypto";

function sha256(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

interface CAPIUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  externalId?: string;
  clientIpAddress?: string;
  clientUserAgent?: string;
  fbc?: string; // _fbc cookie value
  fbp?: string; // _fbp cookie value
}

interface CAPIEvent {
  eventName: string;
  eventId: string;
  eventTime?: number;
  eventSourceUrl?: string;
  userData: CAPIUserData;
  customData?: Record<string, any>;
  actionSource?: "website" | "app" | "email" | "phone_call" | "chat" | "other";
}

function buildUserData(data: CAPIUserData) {
  const ud: Record<string, any> = {};
  if (data.email) ud.em = [sha256(data.email)];
  if (data.phone) ud.ph = [sha256(data.phone)];
  if (data.firstName) ud.fn = sha256(data.firstName);
  if (data.lastName) ud.ln = sha256(data.lastName);
  if (data.externalId) ud.external_id = [sha256(data.externalId)];
  if (data.clientIpAddress) ud.client_ip_address = data.clientIpAddress;
  if (data.clientUserAgent) ud.client_user_agent = data.clientUserAgent;
  if (data.fbc) ud.fbc = data.fbc;
  if (data.fbp) ud.fbp = data.fbp;
  return ud;
}

export async function sendCAPIEvent(event: CAPIEvent): Promise<boolean> {
  if (!ACCESS_TOKEN) {
    console.warn("[CAPI] META_CAPI_ACCESS_TOKEN not set, skipping server event:", event.eventName);
    return false;
  }

  const payload = {
    data: [
      {
        event_name: event.eventName,
        event_time: event.eventTime || Math.floor(Date.now() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl,
        action_source: event.actionSource || "website",
        user_data: buildUserData(event.userData),
        custom_data: event.customData,
      },
    ],
    // Use test_event_code during development to see events in Events Manager > Test Events
    ...(process.env.META_TEST_EVENT_CODE && {
      test_event_code: process.env.META_TEST_EVENT_CODE,
    }),
  };

  try {
    const response = await fetch(`${ENDPOINT}?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("[CAPI] Error sending event:", event.eventName, result);
      return false;
    }

    console.log("[CAPI] Sent:", event.eventName, "event_id:", event.eventId, "events_received:", result.events_received);
    return true;
  } catch (err) {
    console.error("[CAPI] Network error sending event:", event.eventName, err);
    return false;
  }
}

/** Generate a unique event ID for deduplication between browser pixel and CAPI. */
export function generateEventId(prefix: string = "evt"): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${ts}_${rand}`;
}

// --- Convenience helpers for common events ---

export async function sendPurchaseEvent(opts: {
  eventId: string;
  email: string;
  value: number;
  currency: string;
  transactionId: string;
  plan: string;
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  externalId?: string;
  fbc?: string;
  fbp?: string;
}) {
  return sendCAPIEvent({
    eventName: "Purchase",
    eventId: opts.eventId,
    eventSourceUrl: opts.sourceUrl,
    userData: {
      email: opts.email,
      externalId: opts.externalId,
      clientIpAddress: opts.clientIp,
      clientUserAgent: opts.userAgent,
      fbc: opts.fbc,
      fbp: opts.fbp,
    },
    customData: {
      value: opts.value,
      currency: opts.currency,
      content_name: `Reveal AI ${opts.plan}`,
      content_type: "product",
      content_ids: [opts.transactionId],
      contents: [{ id: opts.transactionId, quantity: 1, item_price: opts.value }],
      num_items: 1,
      content_category: "subscription",
    },
  });
}

export async function sendStartTrialEvent(opts: {
  eventId: string;
  email: string;
  value: number;
  currency: string;
  plan: string;
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  externalId?: string;
}) {
  return sendCAPIEvent({
    eventName: "StartTrial",
    eventId: opts.eventId,
    eventSourceUrl: opts.sourceUrl,
    userData: {
      email: opts.email,
      externalId: opts.externalId,
      clientIpAddress: opts.clientIp,
      clientUserAgent: opts.userAgent,
    },
    customData: {
      value: opts.value,
      currency: opts.currency,
      content_name: `Reveal AI ${opts.plan}`,
      content_category: "subscription",
      predicted_ltv: opts.value,
    },
  });
}

export async function sendInitiateCheckoutEvent(opts: {
  eventId: string;
  email?: string;
  value: number;
  currency: string;
  plan: string;
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  externalId?: string;
}) {
  return sendCAPIEvent({
    eventName: "InitiateCheckout",
    eventId: opts.eventId,
    eventSourceUrl: opts.sourceUrl,
    userData: {
      email: opts.email,
      externalId: opts.externalId,
      clientIpAddress: opts.clientIp,
      clientUserAgent: opts.userAgent,
    },
    customData: {
      value: opts.value,
      currency: opts.currency,
      content_name: `Reveal AI ${opts.plan}`,
      content_category: "subscription",
    },
  });
}

export async function sendLeadEvent(opts: {
  eventId: string;
  email: string;
  sourceUrl?: string;
  clientIp?: string;
  userAgent?: string;
  externalId?: string;
}) {
  return sendCAPIEvent({
    eventName: "Lead",
    eventId: opts.eventId,
    eventSourceUrl: opts.sourceUrl,
    userData: {
      email: opts.email,
      externalId: opts.externalId,
      clientIpAddress: opts.clientIp,
      clientUserAgent: opts.userAgent,
    },
    customData: {
      content_name: "Reveal AI Signup",
      content_category: "registration",
    },
  });
}
