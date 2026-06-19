import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth-admin";
import { getSessionFromRequest } from "@/lib/auth-server";
import { getBillingCustomerEmail } from "@/lib/customer-email";
import { getDeviceEmail } from "@/lib/subscription-reconciliation";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface SubscriptionRow {
  id: string;
  user_id: string;
  billing_provider: "stripe" | "whop" | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  whop_user_id: string | null;
  whop_membership_id: string | null;
  billing_manage_url: string | null;
  tier: "weekly" | "yearly";
  status: string;
  current_period_end: string | null;
  customer_email: string | null;
  updated_at?: string | null;
}

interface OwnershipCandidate {
  source: "account_email" | "device_subscription";
  record: SubscriptionRow;
}

function trackedSubscriptionGrantsAccess(
  subscription?: Pick<SubscriptionRow, "status" | "current_period_end"> | null
) {
  if (!subscription || subscription.status !== "active") {
    return false;
  }

  if (!subscription.current_period_end) {
    return true;
  }

  const currentPeriodEnd = new Date(subscription.current_period_end).getTime();
  if (!Number.isFinite(currentPeriodEnd)) {
    return true;
  }

  return currentPeriodEnd > Date.now();
}

function getCandidateKey(record: SubscriptionRow) {
  return (
    record.whop_membership_id ||
    record.stripe_subscription_id ||
    record.id
  );
}

async function getTrackedSubscriptionByUserId(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, user_id, billing_provider, stripe_customer_id, stripe_subscription_id, whop_user_id, whop_membership_id, billing_manage_url, tier, status, current_period_end, customer_email, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SubscriptionRow | null) ?? null;
}

async function getTrackedSubscriptionsByCustomerEmail(
  supabase: SupabaseClient,
  customerEmail: string
) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, user_id, billing_provider, stripe_customer_id, stripe_subscription_id, whop_user_id, whop_membership_id, billing_manage_url, tier, status, current_period_end, customer_email, updated_at"
    )
    .eq("customer_email", customerEmail)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data as SubscriptionRow[] | null) ?? [];
}

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await getSessionFromRequest(request);
    if (sessionResult.error) {
      return NextResponse.json(
        { error: sessionResult.error.message },
        { status: sessionResult.error.status }
      );
    }

    const { deviceId } = await request.json();
    const currentUser = sessionResult.user;
    const currentUserId = currentUser.id;
    const currentUserEmail = getBillingCustomerEmail(currentUser.email);
    const deviceEmail = deviceId ? getDeviceEmail(deviceId) : null;
    const now = new Date().toISOString();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const currentTrackedSubscription = await getTrackedSubscriptionByUserId(
      supabase,
      currentUserId
    );

    if (trackedSubscriptionGrantsAccess(currentTrackedSubscription)) {
      return NextResponse.json({
        success: true,
        reconciled: false,
        manualReviewRecommended: false,
        reason: "current_user_already_has_access",
        subscription: currentTrackedSubscription,
      });
    }

    const candidates: OwnershipCandidate[] = [];

    if (currentUserEmail) {
      const emailCandidates = await getTrackedSubscriptionsByCustomerEmail(
        supabase,
        currentUserEmail
      );

      for (const candidate of emailCandidates) {
        if (
          candidate.user_id !== currentUserId &&
          trackedSubscriptionGrantsAccess(candidate)
        ) {
          candidates.push({
            source: "account_email",
            record: candidate,
          });
        }
      }
    }

    if (deviceEmail) {
      const deviceUser = await findAuthUserByEmail(supabase, deviceEmail);
      if (deviceUser && deviceUser.id !== currentUserId) {
        const deviceTrackedSubscription = await getTrackedSubscriptionByUserId(
          supabase,
          deviceUser.id
        );

        if (
          deviceTrackedSubscription &&
          trackedSubscriptionGrantsAccess(deviceTrackedSubscription)
        ) {
          candidates.push({
            source: "device_subscription",
            record: deviceTrackedSubscription,
          });
        }
      }
    }

    const dedupedCandidates = Array.from(
      new Map(candidates.map((candidate) => [candidate.record.id, candidate])).values()
    );
    const sortedCandidates = dedupedCandidates.sort((left, right) => {
      if (left.source === right.source) return 0;
      return left.source === "account_email" ? -1 : 1;
    });
    const preferredCandidate = sortedCandidates[0] ?? null;
    const distinctCandidateKeys = Array.from(
      new Set(sortedCandidates.map((candidate) => getCandidateKey(candidate.record)))
    );
    const manualReviewRecommended = distinctCandidateKeys.length > 1;

    if (!preferredCandidate) {
      return NextResponse.json({
        success: true,
        reconciled: false,
        manualReviewRecommended: false,
        reason: "no_access_granting_subscription_found",
      });
    }

    const nextValues = {
      user_id: currentUserId,
      billing_provider: preferredCandidate.record.billing_provider,
      stripe_customer_id: preferredCandidate.record.stripe_customer_id,
      stripe_subscription_id: preferredCandidate.record.stripe_subscription_id,
      whop_user_id: preferredCandidate.record.whop_user_id,
      whop_membership_id: preferredCandidate.record.whop_membership_id,
      billing_manage_url: preferredCandidate.record.billing_manage_url,
      tier: preferredCandidate.record.tier,
      status: preferredCandidate.record.status,
      current_period_end: preferredCandidate.record.current_period_end,
      customer_email:
        currentUserEmail ||
        preferredCandidate.record.customer_email ||
        null,
      updated_at: now,
    };

    if (preferredCandidate.record.user_id === currentUserId) {
      const { error } = await supabase
        .from("subscriptions")
        .update(nextValues)
        .eq("id", preferredCandidate.record.id);

      if (error) {
        throw error;
      }
    } else {
      if (
        currentTrackedSubscription &&
        currentTrackedSubscription.id !== preferredCandidate.record.id
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
        .eq("id", preferredCandidate.record.id);

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
    console.error("Billing link subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reconcile subscription ownership" },
      { status: 500 }
    );
  }
}
