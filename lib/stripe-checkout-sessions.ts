import type Stripe from "stripe";
import type {
  CheckoutPlan,
  CheckoutPlatform,
} from "@/lib/stripe-plan-config";

const OPEN_CHECKOUT_LOOKBACK_SECONDS = 60 * 60 * 48;
const MAX_OPEN_CHECKOUT_PAGES = 3;

export interface CheckoutSessionIdentity {
  userId?: string | null;
  deviceId?: string | null;
  customerId?: string | null;
  customerEmail?: string | null;
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function matchesCheckoutSessionIdentity(
  session: Stripe.Checkout.Session,
  identity: CheckoutSessionIdentity
) {
  if (identity.customerId && session.customer === identity.customerId) {
    return true;
  }

  if (
    identity.userId &&
    (session.client_reference_id === identity.userId ||
      session.metadata?.userId === identity.userId)
  ) {
    return true;
  }

  if (identity.deviceId && session.metadata?.deviceId === identity.deviceId) {
    return true;
  }

  const identityEmail = normalizeEmail(identity.customerEmail);
  if (!identityEmail) {
    return false;
  }

  const sessionEmail = normalizeEmail(
    session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email
  );

  return sessionEmail === identityEmail;
}

export function matchesCheckoutSessionSelection(
  session: Stripe.Checkout.Session,
  plan: CheckoutPlan,
  platform: CheckoutPlatform
) {
  return (
    session.mode === "subscription" &&
    session.metadata?.plan === plan &&
    (session.metadata?.platform || "web") === platform
  );
}

export async function listOpenCheckoutSessionsForIdentity(
  stripe: Stripe,
  identity: CheckoutSessionIdentity
) {
  if (
    !identity.customerId &&
    !identity.userId &&
    !identity.deviceId &&
    !normalizeEmail(identity.customerEmail)
  ) {
    return [];
  }

  const created = {
    gte: Math.floor(Date.now() / 1000) - OPEN_CHECKOUT_LOOKBACK_SECONDS,
  };

  const matchingSessions: Stripe.Checkout.Session[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < MAX_OPEN_CHECKOUT_PAGES; page += 1) {
    const response = await stripe.checkout.sessions.list({
      created,
      status: "open",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    matchingSessions.push(
      ...response.data.filter((session) =>
        matchesCheckoutSessionIdentity(session, identity)
      )
    );

    if (!response.has_more || response.data.length === 0) {
      break;
    }

    startingAfter = response.data[response.data.length - 1]?.id;
  }

  return matchingSessions.sort((left, right) => right.created - left.created);
}

export async function expireOpenCheckoutSessions(
  stripe: Stripe,
  sessions: Stripe.Checkout.Session[],
  keepSessionId?: string
) {
  const expiredSessionIds: string[] = [];

  for (const session of sessions) {
    if (session.id === keepSessionId) {
      continue;
    }

    try {
      await stripe.checkout.sessions.expire(session.id);
      expiredSessionIds.push(session.id);
    } catch (error: any) {
      if (error?.code === "session_not_expireable") {
        continue;
      }

      throw error;
    }
  }

  return expiredSessionIds;
}
