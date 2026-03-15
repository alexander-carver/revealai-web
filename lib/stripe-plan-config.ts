export type CheckoutPlan =
  | "weekly"
  | "yearly"
  | "free_trial"
  | "abandoned_trial"
  | "test";

export type CheckoutPlatform = "web" | "mobile";

type SubscriptionTier = "weekly" | "yearly";

function compact(values: Array<string | undefined | null>): string[] {
  return values.filter((value): value is string => Boolean(value && value.length > 0));
}

export function normalizeTierForPlan(plan?: string | null): SubscriptionTier {
  switch (plan) {
    case "weekly":
    case "free_trial":
    case "abandoned_trial":
      return "weekly";
    default:
      return "yearly";
  }
}

export function getWeeklyProductIds(): string[] {
  return compact([
    process.env.STRIPE_WEEKLY_PRODUCT_ID,
    process.env.STRIPE_MOBILE_WEEKLY_PRODUCT_ID,
  ]);
}

export function getYearlyProductIds(): string[] {
  return compact([
    process.env.STRIPE_YEARLY_PRODUCT_ID,
    process.env.STRIPE_MOBILE_YEARLY_PRODUCT_ID,
  ]);
}

export function inferTierFromProductId(productId?: string | null): SubscriptionTier | null {
  if (!productId) return null;
  if (getWeeklyProductIds().includes(productId)) return "weekly";
  if (getYearlyProductIds().includes(productId)) return "yearly";
  return null;
}

export function resolveCheckoutProductId(
  plan: CheckoutPlan,
  platform: CheckoutPlatform = "web"
): string | undefined {
  const weeklyProductId =
    platform === "mobile"
      ? process.env.STRIPE_MOBILE_WEEKLY_PRODUCT_ID || process.env.STRIPE_WEEKLY_PRODUCT_ID
      : process.env.STRIPE_WEEKLY_PRODUCT_ID;

  const yearlyProductId =
    platform === "mobile"
      ? process.env.STRIPE_MOBILE_YEARLY_PRODUCT_ID || process.env.STRIPE_YEARLY_PRODUCT_ID
      : process.env.STRIPE_YEARLY_PRODUCT_ID;

  switch (plan) {
    case "weekly":
    case "free_trial":
    case "abandoned_trial":
      return weeklyProductId;
    case "yearly":
      return yearlyProductId;
    case "test":
      return process.env.STRIPE_TEST_PRODUCT_ID || weeklyProductId;
    default:
      return undefined;
  }
}

export function introCouponIdForPlatform(platform: CheckoutPlatform): string {
  return platform === "mobile"
    ? "revealai_mobile_weekly_intro_500_off"
    : "revealai_abandoned_trial_intro";
}
