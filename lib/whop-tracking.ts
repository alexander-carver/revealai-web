import { inferTierFromWhopPlanId } from "@/lib/checkout-provider";
import { getCheckoutValue } from "@/lib/pricing";
import type { CheckoutPlan } from "@/lib/stripe-plan-config";

type WhopMembershipLike = {
  plan?: { id?: string | null } | null;
  metadata?: Record<string, unknown> | null;
};

const TRACKABLE_CHECKOUT_PLANS = new Set<CheckoutPlan>([
  "weekly",
  "yearly",
  "free_trial",
  "abandoned_trial",
  "test",
]);

function normalizeCheckoutPlan(plan?: string | null): CheckoutPlan | null {
  if (!plan) return null;

  return TRACKABLE_CHECKOUT_PLANS.has(plan as CheckoutPlan)
    ? (plan as CheckoutPlan)
    : null;
}

function sanitizeEventIdPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
}

export function getTrackedCheckoutPlan(plan?: string | null): CheckoutPlan {
  return normalizeCheckoutPlan(plan) ?? "yearly";
}

export function getWhopTrackedPlan(membership: WhopMembershipLike): CheckoutPlan {
  const metadataPlan = normalizeCheckoutPlan(
    typeof membership.metadata?.plan === "string" ? membership.metadata.plan : null
  );

  if (metadataPlan) {
    return metadataPlan;
  }

  const inferredTier = inferTierFromWhopPlanId(membership.plan?.id);
  return inferredTier ?? "yearly";
}

export function getTrackedCheckoutValue(plan?: string | null) {
  return getCheckoutValue(getTrackedCheckoutPlan(plan));
}

export function getWhopPurchaseEventId(membershipId: string) {
  return `pur_whop_${sanitizeEventIdPart(membershipId)}`;
}
