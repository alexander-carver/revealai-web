type DebugCheckoutPlan =
  | "weekly"
  | "yearly"
  | "annual_offer"
  | "free_trial"
  | "abandoned_trial"
  | "test";

type DebugCheckoutPlatform = "web" | "mobile";

function isTruthy(value?: string | null) {
  return value === "true";
}

export function isStripeDebugTestModeEnabled() {
  return process.env.NODE_ENV !== "production" && isTruthy(process.env.STRIPE_DEBUG_TEST_MODE);
}

export const isServerStripeDebugTestModeEnabled = isStripeDebugTestModeEnabled;

export function isClientStripeDebugTestModeEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    isTruthy(process.env.NEXT_PUBLIC_STRIPE_DEBUG_TEST_MODE)
  );
}

export function getServerStripeSecretKey() {
  if (isStripeDebugTestModeEnabled() && process.env.STRIPE_TEST_SECRET_KEY) {
    return process.env.STRIPE_TEST_SECRET_KEY;
  }

  return process.env.STRIPE_SECRET_KEY;
}

export function getServerStripeWebhookSecret() {
  if (isStripeDebugTestModeEnabled() && process.env.STRIPE_TEST_WEBHOOK_SECRET) {
    return process.env.STRIPE_TEST_WEBHOOK_SECRET;
  }

  return process.env.STRIPE_WEBHOOK_SECRET;
}

export function getClientStripePublishableKey() {
  if (
    isClientStripeDebugTestModeEnabled() &&
    process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY
  ) {
    return process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY;
  }

  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
}

export function isServerStripeUsingTestMode() {
  return getServerStripeSecretKey()?.startsWith("sk_test_") ?? false;
}

export function getDebugCheckoutProductId(
  plan: DebugCheckoutPlan,
  _platform: DebugCheckoutPlatform = "web"
) {
  if (!isStripeDebugTestModeEnabled()) {
    return undefined;
  }

  switch (plan) {
    case "weekly":
      return process.env.STRIPE_DEBUG_TEST_WEEKLY_PRODUCT_ID;
    case "annual_offer":
    case "free_trial":
      return (
        process.env.STRIPE_DEBUG_TEST_FREE_TRIAL_PRODUCT_ID ||
        process.env.STRIPE_DEBUG_TEST_YEARLY_PRODUCT_ID
      );
    case "abandoned_trial":
      return (
        process.env.STRIPE_DEBUG_TEST_ABANDONED_TRIAL_PRODUCT_ID ||
        process.env.STRIPE_DEBUG_TEST_FREE_TRIAL_PRODUCT_ID ||
        process.env.STRIPE_DEBUG_TEST_YEARLY_PRODUCT_ID
      );
    case "yearly":
      return process.env.STRIPE_DEBUG_TEST_YEARLY_PRODUCT_ID;
    case "test":
      return (
        process.env.STRIPE_DEBUG_TEST_WEEKLY_PRODUCT_ID ||
        process.env.STRIPE_DEBUG_TEST_YEARLY_PRODUCT_ID
      );
    default:
      return undefined;
  }
}

export function getDebugCheckoutPriceId(
  plan: DebugCheckoutPlan,
  _platform: DebugCheckoutPlatform = "web"
) {
  if (!isStripeDebugTestModeEnabled()) {
    return undefined;
  }

  switch (plan) {
    case "weekly":
      return process.env.STRIPE_DEBUG_TEST_WEEKLY_PRICE_ID;
    case "annual_offer":
    case "free_trial":
      return (
        process.env.STRIPE_DEBUG_TEST_FREE_TRIAL_PRICE_ID ||
        process.env.STRIPE_DEBUG_TEST_YEARLY_PRICE_ID
      );
    case "abandoned_trial":
      return (
        process.env.STRIPE_DEBUG_TEST_ABANDONED_TRIAL_PRICE_ID ||
        process.env.STRIPE_DEBUG_TEST_FREE_TRIAL_PRICE_ID ||
        process.env.STRIPE_DEBUG_TEST_YEARLY_PRICE_ID
      );
    case "yearly":
      return process.env.STRIPE_DEBUG_TEST_YEARLY_PRICE_ID;
    case "test":
      return (
        process.env.STRIPE_DEBUG_TEST_WEEKLY_PRICE_ID ||
        process.env.STRIPE_DEBUG_TEST_YEARLY_PRICE_ID
      );
    default:
      return undefined;
  }
}
