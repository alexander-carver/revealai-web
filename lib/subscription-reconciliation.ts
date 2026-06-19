import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  inferTierFromProductId,
  normalizeTierForPlan,
} from "@/lib/stripe-plan-config";
import { isAccessGrantingStripeSubscriptionStatus } from "@/lib/stripe-subscription-status";

export interface TrackedSubscriptionRow {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  tier: "weekly" | "yearly";
  status: string;
  current_period_end: string | null;
  updated_at?: string | null;
}

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

export function isDeviceEmail(email?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  return !!normalizedEmail && normalizedEmail.endsWith("@revealai.device");
}

export function getDeviceEmail(deviceId: string) {
  return `device_${deviceId}@revealai.device`;
}

export function trackedSubscriptionGrantsAccess(
  subscription?: Pick<TrackedSubscriptionRow, "status" | "current_period_end"> | null
) {
  if (!subscription || subscription.status !== "active") {
    return false;
  }

  if (!subscription.current_period_end) {
    return true;
  }

  const currentPeriodEnd = new Date(subscription.current_period_end).getTime();
  if (!Number.isFinite(currentPeriodEnd)) {
    return true;
  }

  return currentPeriodEnd > Date.now();
}

export async function getTrackedSubscriptionByUserId(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, user_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_end, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as TrackedSubscriptionRow | null) ?? null;
}

export async function getTrackedSubscriptionByStripeIdentifiers(
  supabase: SupabaseClient,
  identifiers: {
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  }
) {
  if (identifiers.stripeSubscriptionId) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "id, user_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_end, updated_at"
      )
      .eq("stripe_subscription_id", identifiers.stripeSubscriptionId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as TrackedSubscriptionRow;
    }
  }

  if (identifiers.stripeCustomerId) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "id, user_id, stripe_customer_id, stripe_subscription_id, tier, status, current_period_end, updated_at"
      )
      .eq("stripe_customer_id", identifiers.stripeCustomerId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (data) {
      return data as TrackedSubscriptionRow;
    }
  }

  return null;
}

function scoreStripeSubscription(subscription: Stripe.Subscription) {
  const accessScore = subscription.status === "active" ? 2 : 1;
  const currentPeriodEnd = (subscription as any).current_period_end ?? 0;
  return accessScore * 10_000_000_000 + currentPeriodEnd;
}

export async function findAccessGrantingStripeSubscriptionByEmail(
  stripe: Stripe,
  email?: string | null
) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    return null;
  }

  const customers = await stripe.customers.list({
    email: normalizedEmail,
    limit: 10,
  });

  let bestMatch:
    | {
        customerId: string;
        subscription: Stripe.Subscription;
        tier: "weekly" | "yearly";
      }
    | null = null;

  for (const customer of customers.data) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: "all",
      limit: 10,
    });

    for (const subscription of subscriptions.data) {
      if (!isAccessGrantingStripeSubscriptionStatus(subscription.status)) {
        continue;
      }

      const tier =
        inferTierFromProductId(
          subscription.items.data[0]?.price?.product as string | undefined
        ) ?? normalizeTierForPlan();

      if (
        !bestMatch ||
        scoreStripeSubscription(subscription) >
          scoreStripeSubscription(bestMatch.subscription)
      ) {
        bestMatch = {
          customerId: customer.id,
          subscription,
          tier,
        };
      }
    }
  }

  return bestMatch;
}

export function snapshotAccessGrantingSubscription(params: {
  stripeCustomerId: string | null;
  stripeSubscription: Stripe.Subscription;
  fallbackPlan?: string | null;
}) {
  const { stripeCustomerId, stripeSubscription, fallbackPlan } = params;
  const currentPeriodEndUnix = (stripeSubscription as any).current_period_end;

  return {
    stripeCustomerId,
    stripeSubscriptionId: stripeSubscription.id,
    tier:
      inferTierFromProductId(
        stripeSubscription.items.data[0]?.price?.product as string | undefined
      ) ?? normalizeTierForPlan(fallbackPlan),
    currentPeriodEnd: currentPeriodEndUnix
      ? new Date(currentPeriodEndUnix * 1000).toISOString()
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
}
