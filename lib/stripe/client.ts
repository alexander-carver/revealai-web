import { loadStripe, Stripe } from "@stripe/stripe-js";
import { getClientStripePublishableKey } from "@/lib/stripe-env";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = getClientStripePublishableKey();

    if (!publishableKey) {
      throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not configured");
    }

    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};
