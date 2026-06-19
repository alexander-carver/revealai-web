import Stripe from "stripe";
import { getServerStripeSecretKey } from "@/lib/stripe-env";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }

  const secretKey = getServerStripeSecretKey();
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  stripeInstance = new Stripe(secretKey, {
    apiVersion: "2025-12-15.clover",
  });

  return stripeInstance;
}
