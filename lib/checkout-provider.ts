import type { CheckoutPlan } from "@/lib/stripe-plan-config";

export type BillingProvider = "stripe" | "whop";
export type TrackedSubscriptionStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "unpaid";

function normalizeEnvValue(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function getCheckoutProvider(): BillingProvider {
  const configuredProvider =
    normalizeEnvValue(process.env.CHECKOUT_PROVIDER) ??
    normalizeEnvValue(process.env.NEXT_PUBLIC_CHECKOUT_PROVIDER);

  return configuredProvider?.toLowerCase() === "whop" ? "whop" : "stripe";
}

export function resolveWhopPlanId(plan: CheckoutPlan): string | undefined {
  const weeklyPlanId = normalizeEnvValue(process.env.WHOP_PLAN_ID_WEEKLY);
  const yearlyPlanId = normalizeEnvValue(process.env.WHOP_PLAN_ID_YEARLY);
  const freeTrialPlanId = normalizeEnvValue(process.env.WHOP_PLAN_ID_FREE_TRIAL);
  const abandonedTrialPlanId = normalizeEnvValue(
    process.env.WHOP_PLAN_ID_ABANDONED_TRIAL
  );

  switch (plan) {
    case "weekly":
      return weeklyPlanId;
    case "yearly":
      return yearlyPlanId;
    case "free_trial":
      return freeTrialPlanId ?? yearlyPlanId;
    case "abandoned_trial":
      return abandonedTrialPlanId ?? weeklyPlanId;
    case "test":
      return yearlyPlanId ?? weeklyPlanId;
    default:
      return undefined;
  }
}

export function inferTierFromWhopPlanId(planId?: string | null) {
  if (!planId) return null;

  const weeklyPlanIds = new Set(
    [process.env.WHOP_PLAN_ID_WEEKLY]
      .map((value) => normalizeEnvValue(value))
      .filter((value): value is string => Boolean(value))
  );
  const yearlyPlanIds = new Set(
    [
      process.env.WHOP_PLAN_ID_YEARLY,
      process.env.WHOP_PLAN_ID_FREE_TRIAL,
      process.env.WHOP_PLAN_ID_ABANDONED_TRIAL,
    ]
      .map((value) => normalizeEnvValue(value))
      .filter((value): value is string => Boolean(value))
  );

  if (weeklyPlanIds.has(planId)) return "weekly";
  if (yearlyPlanIds.has(planId)) return "yearly";
  return null;
}

export function isWhopAccessGrantingStatus(status?: string | null) {
  return status === "active" || status === "trialing" || status === "canceling";
}

export function mapWhopMembershipStatus(
  status?: string | null
): TrackedSubscriptionStatus {
  switch (status) {
    case "active":
    case "trialing":
    case "canceling":
      return "active";
    case "past_due":
      return "past_due";
    case "unresolved":
    case "drafted":
      return "unpaid";
    case "completed":
    case "canceled":
    case "expired":
    default:
      return "canceled";
  }
}
