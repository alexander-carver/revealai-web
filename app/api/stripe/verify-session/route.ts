import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import {
  ensureDeviceAuthUser,
  ensureEmailAuthUser,
  findAuthUserByEmail,
} from "@/lib/auth-admin";
import { getBillingCustomerEmail } from "@/lib/customer-email";
import {
  expireOpenCheckoutSessions,
  listOpenCheckoutSessionsForIdentity,
} from "@/lib/stripe-checkout-sessions";
import { normalizeTierForPlan } from "@/lib/stripe-plan-config";
import { getStripe } from "@/lib/stripe-server";
import { isAccessGrantingStripeSubscriptionStatus } from "@/lib/stripe-subscription-status";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const { sessionId, userId, email } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    console.log("Verifying session:", sessionId, "for user:", userId || "unknown", "email:", email || "unknown");

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    });

    console.log("Session status:", session.status, session.payment_status);
    console.log("Session customer email:", session.customer_email);
    console.log("Session metadata:", session.metadata);
    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id || null;

    let stripeSubscription: Stripe.Subscription | null = null;
    if (session.subscription) {
      stripeSubscription =
        typeof session.subscription === "string"
          ? await stripe.subscriptions.retrieve(session.subscription)
          : (session.subscription as Stripe.Subscription);
    }

    if (session.status !== "complete") {
      return NextResponse.json(
        {
          error: "Checkout session is not complete yet",
          status: session.status,
        },
        { status: 400 }
      );
    }

    if (
      session.payment_status !== "paid" &&
      session.payment_status !== "no_payment_required"
    ) {
      return NextResponse.json(
        { error: "Payment not completed", status: session.payment_status },
        { status: 400 }
      );
    }

    if (
      !stripeSubscription ||
      !isAccessGrantingStripeSubscriptionStatus(stripeSubscription.status)
    ) {
      return NextResponse.json(
        {
          error: "Subscription is not active yet",
          status: stripeSubscription?.status || "missing",
        },
        { status: 400 }
      );
    }

    // Get the user ID only from Stripe session (never trust client-supplied userId for subscription linking)
    const hadUserIdFromStripe = !!(session.metadata?.userId || session.client_reference_id);
    let finalUserId = session.metadata?.userId || session.client_reference_id || undefined;
    const deviceId = session.metadata?.deviceId;
    
    // Get customer email from multiple possible sources
    let customerEmail =
      email ||
      session.customer_email ||
      session.customer_details?.email ||
      session.metadata?.email;
    const billingEmail = getBillingCustomerEmail(customerEmail);
    
    console.log("Email sources:", {
      fromParam: email,
      customer_email: session.customer_email,
      customer_details_email: session.customer_details?.email,
      metadata_email: session.metadata?.email,
      finalEmail: customerEmail
    });
    
    if (billingEmail) {
      try {
        await ensureEmailAuthUser(supabase, billingEmail);
      } catch (billingEmailEnsureError) {
        console.error("Error ensuring billing email user:", billingEmailEnsureError);
      }
    }

    // If we still don't have a userId, try to find or create the user by device ID first (like mobile apps)
    // Device ID creates a consistent user per device, not per email
    if (!finalUserId && deviceId) {
      console.log("Looking up user by device ID:", deviceId);
      try {
        const ensuredDeviceUser = await ensureDeviceAuthUser(supabase, deviceId);
        finalUserId = ensuredDeviceUser.userId;
        customerEmail = customerEmail || ensuredDeviceUser.deviceEmail;
        console.log("Resolved device-based user:", finalUserId);
      } catch (err: any) {
        console.error("Error ensuring device user:", err);
      }
    }
    
    // If we still don't have a userId, try to find or create the user by email (fallback)
    if (!finalUserId && customerEmail) {
      console.log("Looking up user by email:", customerEmail);

      try {
        const matchingUser = await findAuthUserByEmail(supabase, customerEmail);
        if (matchingUser) {
          finalUserId = matchingUser.id;
          console.log("Found existing user by email:", finalUserId);
        }
      } catch (userLookupError) {
        console.error("Error looking up user by email:", userLookupError);
      }

      if (!finalUserId) {
        console.log(
          "No user found, creating new account automatically for:",
          customerEmail
        );

        try {
          const ensuredEmailUser = await ensureEmailAuthUser(
            supabase,
            customerEmail
          );
          finalUserId = ensuredEmailUser.userId;
          customerEmail = ensuredEmailUser.email;
          console.log("Created or found email-based user:", finalUserId);
        } catch (err: any) {
          console.error("Error in user creation:", err);

          if (!finalUserId) {
            return NextResponse.json(
              { error: "Failed to create account. Please contact support." },
              { status: 500 }
            );
          }
        }
      }
    }

    if (!finalUserId) {
      return NextResponse.json(
        { error: "Could not determine user email from payment. Please contact support." },
        { status: 400 }
      );
    }

    const subscriptionId = stripeSubscription.id;
    const currentPeriodEnd = (stripeSubscription as any).current_period_end
      ? new Date((stripeSubscription as any).current_period_end * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Determine plan from metadata or default
    const plan = session.metadata?.plan || "yearly";
    const tier = normalizeTierForPlan(plan);

    console.log("Creating subscription for user:", finalUserId, "tier:", tier);

    // Upsert subscription
    const { data, error } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: finalUserId,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: subscriptionId,
        billing_provider: "stripe",
        whop_user_id: null,
        whop_membership_id: null,
        billing_manage_url: null,
        tier,
        status: "active",
              current_period_end: currentPeriodEnd.toISOString(),
              customer_email: billingEmail,
              updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating subscription:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log("Subscription created/updated:", data);

    try {
      const openSessionsForIdentity = await listOpenCheckoutSessionsForIdentity(
        stripe,
        {
          userId: finalUserId,
          deviceId,
          customerId: stripeCustomerId,
          customerEmail,
        }
      );

      if (openSessionsForIdentity.length > 0) {
        const expiredSessionIds = await expireOpenCheckoutSessions(
          stripe,
          openSessionsForIdentity,
          session.id
        );

        if (expiredSessionIds.length > 0) {
          console.log(
            `Expired stale open checkout sessions after verify-session: ${expiredSessionIds.join(
              ", "
            )}`
          );
        }
      }
    } catch (openSessionError) {
      console.error(
        "Failed to expire stale open checkout sessions after verify-session:",
        openSessionError
      );
    }

    return NextResponse.json({
      success: true,
      subscription: data,
      userId: finalUserId,
      email: billingEmail || customerEmail,
      accountCreated: !hadUserIdFromStripe, // True when user was resolved via device/email (not from Stripe metadata)
    });
  } catch (error: any) {
    console.error("Verify session error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify session" },
      { status: 500 }
    );
  }
}
