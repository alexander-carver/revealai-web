export type CheckoutPlan =
  | "weekly"
  | "yearly"
  | "free_trial"
  | "abandoned_trial"
  | "test";

export type CheckoutPlatform = "web" | "mobile";

type SubscriptionTier = "weekly" | "yearly";

function compact(values: Array<string | undefined | null>): string[] {
  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value && value.length > 0));
}

export function normalizeTierForPlan(plan?: string | null): SubscriptionTier {
  switch (plan) {
    case "weekly":
    case "abandoned_trial":
      return "weekly";
    case "free_trial":
    case "yearly":
      return "yearly";
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

export function getFreeTrialProductIds(): string[] {
  return compact([
    process.env.STRIPE_FREE_TRIAL_PRODUCT_ID,
    process.env.STRIPE_MOBILE_FREE_TRIAL_PRODUCT_ID,
  ]);
}

export function getAbandonedTrialProductIds(): string[] {
  return compact([process.env.STRIPE_ABANDONED_TRIAL_PRODUCT_ID]);
}

export function getWeeklyPriceIds(): string[] {
  return compact([
    process.env.STRIPE_WEEKLY_PRICE_ID,
    process.env.STRIPE_MOBILE_WEEKLY_PRICE_ID,
  ]);
}

export function getYearlyPriceIds(): string[] {
  return compact([
    process.env.STRIPE_YEARLY_PRICE_ID,
    process.env.STRIPE_MOBILE_YEARLY_PRICE_ID,
  ]);
}

export function getFreeTrialPriceIds(): string[] {
  return compact([
    process.env.STRIPE_FREE_TRIAL_PRICE_ID,
    process.env.STRIPE_MOBILE_FREE_TRIAL_PRICE_ID,
  ]);
}

export function getAbandonedTrialPriceIds(): string[] {
  return compact([process.env.STRIPE_ABANDONED_TRIAL_PRICE_ID]);
}

export function inferTierFromProductId(productId?: string | null): SubscriptionTier | null {
  if (!productId) return null;
  if (getWeeklyProductIds().includes(productId) || getAbandonedTrialProductIds().includes(productId)) {
    return "weekly";
  }
  if (getYearlyProductIds().includes(productId) || getFreeTrialProductIds().includes(productId)) {
    return "yearly";
  }
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

  const freeTrialProductId =
    platform === "mobile"
      ? process.env.STRIPE_MOBILE_FREE_TRIAL_PRODUCT_ID || process.env.STRIPE_FREE_TRIAL_PRODUCT_ID
      : process.env.STRIPE_FREE_TRIAL_PRODUCT_ID;

  const abandonedTrialProductId = process.env.STRIPE_ABANDONED_TRIAL_PRODUCT_ID;

  switch (plan) {
    case "weekly":
      return weeklyProductId;
    case "yearly":
      return yearlyProductId;
    case "free_trial":
      return freeTrialProductId || yearlyProductId;
    case "abandoned_trial":
      return abandonedTrialProductId || weeklyProductId;
    case "test":
      return process.env.STRIPE_TEST_PRODUCT_ID || weeklyProductId;
    default:
      return undefined;
  }
}

export function resolveCheckoutPriceId(
  plan: CheckoutPlan,
  platform: CheckoutPlatform = "web"
): string | undefined {
  const weeklyPriceId =
    platform === "mobile"
      ? process.env.STRIPE_MOBILE_WEEKLY_PRICE_ID || process.env.STRIPE_WEEKLY_PRICE_ID
      : process.env.STRIPE_WEEKLY_PRICE_ID;

  const yearlyPriceId =
    platform === "mobile"
      ? process.env.STRIPE_MOBILE_YEARLY_PRICE_ID || process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_YEARLY_PRICE_ID;

  const freeTrialPriceId =
    platform === "mobile"
      ? process.env.STRIPE_MOBILE_FREE_TRIAL_PRICE_ID || process.env.STRIPE_FREE_TRIAL_PRICE_ID
      : process.env.STRIPE_FREE_TRIAL_PRICE_ID;

  const abandonedTrialPriceId = process.env.STRIPE_ABANDONED_TRIAL_PRICE_ID;

  switch (plan) {
    case "weekly":
      return weeklyPriceId;
    case "yearly":
      return yearlyPriceId;
    case "free_trial":
      return freeTrialPriceId || yearlyPriceId;
    case "abandoned_trial":
      return abandonedTrialPriceId || weeklyPriceId;
    default:
      return undefined;
  }
}

export function introCouponIdForPlatform(platform: CheckoutPlatform): string {
  return platform === "mobile"
    ? "revealai_mobile_weekly_intro_500_off"
    : "revealai_abandoned_trial_intro";
}
