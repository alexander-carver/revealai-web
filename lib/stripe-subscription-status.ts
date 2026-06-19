const ACCESS_GRANTING_STATUSES = new Set(["active", "trialing"]);
const CHECKOUT_BLOCKING_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "paused",
]);

export function isAccessGrantingStripeSubscriptionStatus(
  status?: string | null
) {
  return !!status && ACCESS_GRANTING_STATUSES.has(status);
}

export function isCheckoutBlockingStripeSubscriptionStatus(
  status?: string | null
) {
  return !!status && CHECKOUT_BLOCKING_STATUSES.has(status);
}
