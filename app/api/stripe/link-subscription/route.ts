import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth-admin";
import { getSessionFromRequest } from "@/lib/auth-server";
import { getStripe } from "@/lib/stripe-server";
import { isAccessGrantingStripeSubscriptionStatus } from "@/lib/stripe-subscription-status";
import {
  findAccessGrantingStripeSubscriptionByEmail,
  getDeviceEmail,
  getTrackedSubscriptionByStripeIdentifiers,
  getTrackedSubscriptionByUserId,
  normalizeEmail,
  snapshotAccessGrantingSubscription,
  trackedSubscriptionGrantsAccess,
  type TrackedSubscriptionRow,
} from "@/lib/subscription-reconciliation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface OwnershipCandidate {
  source:
    | "checkout_session"
    | "device_subscription"
    | "device_email"
    | "account_email";
  stripeCustomerId: string | null;
  stripeSubscriptionId: string;
  tier: "weekly" | "yearly";
  currentPeriodEnd: string;
  existingRecord: TrackedSubscriptionRow | null;
}

function sessionMatchesAuthenticatedIdentity(params: {
  session: Stripe.Checkout.Session;
  currentUserId: string;
  currentUserEmail?: string | null;
  deviceId?: string | null;
  deviceEmail?: string | null;
}) {
  const { session, currentUserId, currentUserEmail, deviceId, deviceEmail } =
    params;

  if (
    session.client_reference_id === currentUserId ||
    session.metadata?.userId === currentUserId
  ) {
    return true;
  }

  if (deviceId && session.metadata?.deviceId === deviceId) {
    return true;
  }

  const sessionEmail = normalizeEmail(
    session.customer_email ||
      session.customer_details?.email ||
      session.metadata?.email
  );

  if (currentUserEmail && sessionEmail === currentUserEmail) {
    return true;
  }

  if (deviceEmail && sessionEmail === deviceEmail) {
    return true;
  }

  return false;
}

async function resolveSessionCandidate(params: {
  stripe: Stripe;
  supabase: SupabaseClient;
  sessionId: string;
  currentUserId: string;
  currentUserEmail?: string | null;
  deviceId?: string | null;
  deviceEmail?: string | null;
}) {
  const {
    stripe,
    supabase,
    sessionId,
    currentUserId,
    currentUserEmail,
    deviceId,
    deviceEmail,
  } = params;

  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["subscription"],
  });

  if (
    !sessionMatchesAuthenticatedIdentity({
      session,
      currentUserId,
      currentUserEmail,
      deviceId,
      deviceEmail,
    })
  ) {
    return null;
  }

  if (session.status !== "complete") {
    return null;
  }

  if (
    session.payment_status !== "paid" &&
    session.payment_status !== "no_payment_required"
  ) {
    return null;
  }

  let stripeSubscription: Stripe.Subscription | null = null;
  if (session.subscription) {
    stripeSubscription =
      typeof session.subscription === "string"
        ? await stripe.subscriptions.retrieve(session.subscription)
        : (session.subscription as Stripe.Subscription);
  }

  if (
    !stripeSubscription ||
    !isAccessGrantingStripeSubscriptionStatus(stripeSubscription.status)
  ) {
    return null;
  }

  const stripeCustomerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id || null;
  const snapshot = snapshotAccessGrantingSubscription({
    stripeCustomerId,
    stripeSubscription,
    fallbackPlan: session.metadata?.plan,
  });
  const existingRecord = await getTrackedSubscriptionByStripeIdentifiers(
    supabase,
    {
      stripeCustomerId: snapshot.stripeCustomerId,
      stripeSubscriptionId: snapshot.stripeSubscriptionId,
    }
  );

  return {
    source: "checkout_session" as const,
    stripeCustomerId: snapshot.stripeCustomerId,
    stripeSubscriptionId: snapshot.stripeSubscriptionId,
    tier: snapshot.tier,
    currentPeriodEnd: snapshot.currentPeriodEnd,
    existingRecord,
  };
}

async function resolveEmailCandidate(params: {
  stripe: Stripe;
  supabase: SupabaseClient;
  email?: string | null;
  source: OwnershipCandidate["source"];
}) {
  const { stripe, supabase, email, source } = params;
  const accessGrantingSubscription =
    await findAccessGrantingStripeSubscriptionByEmail(stripe, email);

  if (!accessGrantingSubscription) {
    return null;
  }

  const snapshot = snapshotAccessGrantingSubscription({
    stripeCustomerId: accessGrantingSubscription.customerId,
    stripeSubscription: accessGrantingSubscription.subscription,
  });
  const existingRecord = await getTrackedSubscriptionByStripeIdentifiers(
    supabase,
    {
      stripeCustomerId: snapshot.stripeCustomerId,
      stripeSubscriptionId: snapshot.stripeSubscriptionId,
    }
  );

  return {
    source,
    stripeCustomerId: snapshot.stripeCustomerId,
    stripeSubscriptionId: snapshot.stripeSubscriptionId,
    tier: snapshot.tier,
    currentPeriodEnd: snapshot.currentPeriodEnd,
    existingRecord,
  };
}

function dedupeCandidates(candidates: OwnershipCandidate[]) {
  const dedupedCandidates = new Map<string, OwnershipCandidate>();

  for (const candidate of candidates) {
    if (!dedupedCandidates.has(candidate.stripeSubscriptionId)) {
      dedupedCandidates.set(candidate.stripeSubscriptionId, candidate);
    }
  }

  return Array.from(dedupedCandidates.values());
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const sessionResult = await getSessionFromRequest(request);
    if (sessionResult.error) {
      return NextResponse.json(
        { error: sessionResult.error.message },
        { status: sessionResult.error.status }
      );
    }

    const { sessionId, deviceId } = await request.json();
    const currentUser = sessionResult.user;
    const currentUserId = currentUser.id;
    const currentUserEmail = normalizeEmail(currentUser.email);
    const deviceEmail = deviceId ? getDeviceEmail(deviceId) : null;
    const now = new Date().toISOString();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const currentTrackedSubscription = await getTrackedSubscriptionByUserId(
      supabase,
      currentUserId
    );

    const candidates: OwnershipCandidate[] = [];

    if (sessionId) {
      try {
        const sessionCandidate = await resolveSessionCandidate({
          stripe,
          supabase,
          sessionId,
          currentUserId,
          currentUserEmail,
          deviceId,
          deviceEmail,
        });

        if (sessionCandidate) {
          candidates.push(sessionCandidate);
        }
      } catch (error) {
        console.error("Error resolving checkout-session ownership candidate:", error);
      }
    }

    if (deviceEmail) {
      try {
        const deviceUser = await findAuthUserByEmail(supabase, deviceEmail);
        if (deviceUser && deviceUser.id !== currentUserId) {
          const deviceTrackedSubscription = await getTrackedSubscriptionByUserId(
            supabase,
            deviceUser.id
          );

          if (
            deviceTrackedSubscription &&
            trackedSubscriptionGrantsAccess(deviceTrackedSubscription) &&
            deviceTrackedSubscription.stripe_subscription_id
          ) {
            candidates.push({
              source: "device_subscription",
              stripeCustomerId: deviceTrackedSubscription.stripe_customer_id,
              stripeSubscriptionId:
                deviceTrackedSubscription.stripe_subscription_id,
              tier: deviceTrackedSubscription.tier,
              currentPeriodEnd:
                deviceTrackedSubscription.current_period_end || now,
              existingRecord: deviceTrackedSubscription,
            });
          }
        }
      } catch (error) {
        console.error("Error resolving tracked device subscription:", error);
      }

      try {
        const deviceEmailCandidate = await resolveEmailCandidate({
          stripe,
          supabase,
          email: deviceEmail,
          source: "device_email",
        });

        if (deviceEmailCandidate) {
          candidates.push(deviceEmailCandidate);
        }
      } catch (error) {
        console.error("Error resolving device-email Stripe subscription:", error);
      }
    }

    if (currentUserEmail) {
      try {
        const accountEmailCandidate = await resolveEmailCandidate({
          stripe,
          supabase,
          email: currentUserEmail,
          source: "account_email",
        });

        if (accountEmailCandidate) {
          candidates.push(accountEmailCandidate);
        }
      } catch (error) {
        console.error("Error resolving account-email Stripe subscription:", error);
      }
    }

    const dedupedCandidates = dedupeCandidates(candidates);
    const preferredCandidate = dedupedCandidates[0] ?? null;
    const currentSubscriptionId =
      currentTrackedSubscription?.stripe_subscription_id || null;
    const currentSubscriptionHasAccess =
      trackedSubscriptionGrantsAccess(currentTrackedSubscription);
    const candidateConflictIds = dedupedCandidates
      .filter(
        (candidate) => candidate.stripeSubscriptionId !== currentSubscriptionId
      )
      .map((candidate) => candidate.stripeSubscriptionId);
    const manualReviewRecommended =
      candidateConflictIds.length > 1 ||
      (currentSubscriptionHasAccess && candidateConflictIds.length > 0);

    if (currentSubscriptionHasAccess) {
      if (manualReviewRecommended) {
        console.warn(
          `[Billing] Manual review recommended for user ${currentUserId}: multiple access-granting subscriptions detected (${[
            currentSubscriptionId,
            ...candidateConflictIds,
          ]
            .filter(Boolean)
            .join(", ")})`
        );
      }

      return NextResponse.json({
        success: true,
        reconciled: false,
        manualReviewRecommended,
        reason: manualReviewRecommended
          ? "multiple_access_granting_subscriptions"
          : "current_user_already_has_access",
        subscription: currentTrackedSubscription,
      });
    }

    if (!preferredCandidate) {
      return NextResponse.json({
        success: true,
        reconciled: false,
        manualReviewRecommended: false,
        reason: "no_access_granting_subscription_found",
      });
    }

    if (manualReviewRecommended) {
      console.warn(
        `[Billing] Manual review recommended while reconciling user ${currentUserId}; preferred subscription ${preferredCandidate.stripeSubscriptionId}, additional candidates: ${candidateConflictIds.join(
          ", "
        )}`
      );
    }

    const nextValues = {
      user_id: currentUserId,
      stripe_customer_id: preferredCandidate.stripeCustomerId,
      stripe_subscription_id: preferredCandidate.stripeSubscriptionId,
      billing_provider: "stripe",
      whop_user_id: null,
      whop_membership_id: null,
      billing_manage_url: null,
      tier: preferredCandidate.tier,
      status: "active",
      current_period_end: preferredCandidate.currentPeriodEnd,
      updated_at: now,
    };

    if (preferredCandidate.existingRecord) {
      if (preferredCandidate.existingRecord.user_id === currentUserId) {
        const { error } = await supabase
          .from("subscriptions")
          .update(nextValues)
          .eq("id", preferredCandidate.existingRecord.id);

        if (error) {
          throw error;
        }
      } else {
        if (
          currentTrackedSubscription &&
          currentTrackedSubscription.id !== preferredCandidate.existingRecord.id
        ) {
          const { error: deleteError } = await supabase
            .from("subscriptions")
            .delete()
            .eq("id", currentTrackedSubscription.id);

          if (deleteError) {
            throw deleteError;
          }
        }

        const { error } = await supabase
          .from("subscriptions")
          .update(nextValues)
          .eq("id", preferredCandidate.existingRecord.id);

        if (error) {
          throw error;
        }
      }
    } else if (currentTrackedSubscription) {
      const { error } = await supabase
        .from("subscriptions")
        .update(nextValues)
        .eq("id", currentTrackedSubscription.id);

      if (error) {
        throw error;
      }
    } else {
      const { error } = await supabase.from("subscriptions").upsert(nextValues, {
        onConflict: "user_id",
      });

      if (error) {
        throw error;
      }
    }

    const reconciledSubscription = await getTrackedSubscriptionByUserId(
      supabase,
      currentUserId
    );

    return NextResponse.json({
      success: true,
      reconciled: true,
      manualReviewRecommended,
      source: preferredCandidate.source,
      subscription: reconciledSubscription,
    });
  } catch (error: any) {
    console.error("Link subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reconcile subscription ownership" },
      { status: 500 }
    );
  }
}
