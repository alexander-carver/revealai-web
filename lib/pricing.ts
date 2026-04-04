export const PUBLIC_PRICING = {
  weekly: 9.99,
  yearly: 29.99,
  freeTrialDays: 3,
  annualTrialPrice: 19.99,
  annualTrialCompareAtPrice: 29.99,
  abandonedTrialIntro: 1.99,
} as const;

export type CheckoutValuePlan =
  | "weekly"
  | "yearly"
  | "free_trial"
  | "abandoned_trial"
  | "test"
  | string;

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function getCheckoutValue(plan: CheckoutValuePlan): number {
  switch (plan) {
    case "yearly":
      return PUBLIC_PRICING.yearly;
    case "abandoned_trial":
      return PUBLIC_PRICING.abandonedTrialIntro;
    case "free_trial":
      return PUBLIC_PRICING.annualTrialPrice;
    default:
      return PUBLIC_PRICING.weekly;
  }
}

export function getYearlyWeeklyEquivalent(): number {
  return PUBLIC_PRICING.yearly / 52;
}

export function getYearlySavingsAmount(): number {
  return PUBLIC_PRICING.weekly * 52 - PUBLIC_PRICING.yearly;
}

export function getYearlySavingsPercent(): number {
  const fullWeeklyCost = PUBLIC_PRICING.weekly * 52;
  return Math.round((getYearlySavingsAmount() / fullWeeklyCost) * 100);
}
