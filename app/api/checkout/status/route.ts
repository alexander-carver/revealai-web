import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveBillingIdentity } from "@/lib/billing-identity";
import { ensureEmailAuthUser } from "@/lib/auth-admin";
import { getBillingCustomerEmail } from "@/lib/customer-email";
import { getWhopClient } from "@/lib/whop-server";
import {
  inferTierFromWhopPlanId,
  isWhopAccessGrantingStatus,
  mapWhopMembershipStatus,
} from "@/lib/checkout-provider";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getMembershipCurrentPeriodEnd(membership: {
  renewal_period_end?: string | null;
  canceled_at?: string | null;
  updated_at?: string | null;
}) {
  return (
    membership.renewal_period_end ||
    membership.canceled_at ||
    membership.updated_at ||
    new Date().toISOString()
  );
}

async function syncWhopPaymentIfNeeded({
  paymentId,
  userId,
  email,
  deviceId,
}: {
  paymentId?: string | null;
  userId?: string;
  email?: string;
  deviceId?: string;
}) {
  if (!paymentId) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const whop = getWhopClient();
  const payment = await whop.payments.retrieve(paymentId);

  if (!payment.membership?.id) {
    return null;
  }

  const membership = await whop.memberships.retrieve(payment.membership.id);
  const metadata = membership.metadata ?? payment.metadata ?? {};
  const billingEmail = getBillingCustomerEmail(
    email ||
      membership.user?.email ||
      payment.user?.email ||
      (typeof metadata.email === "string" ? metadata.email : null) ||
      undefined
  );

  if (billingEmail) {
    try {
      await ensureEmailAuthUser(supabase, billingEmail);
    } catch (emailUserError) {
      console.error("Whop payment sync email-account ensure failed:", emailUserError);
    }
  }

  const identity = await resolveBillingIdentity(supabase, {
    userId:
      userId ||
      (typeof metadata.userId === "string" ? metadata.userId : null) ||
      undefined,
    email:
      billingEmail || undefined,
    deviceId:
      deviceId ||
      (typeof metadata.deviceId === "string" ? metadata.deviceId : null) ||
      undefined,
  });

  if (!identity) {
    return null;
  }

  const nextStatus =
    membership.cancel_at_period_end && isWhopAccessGrantingStatus(membership.status)
      ? "active"
      : mapWhopMembershipStatus(membership.status);

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: identity.userId,
      tier: inferTierFromWhopPlanId(membership.plan?.id) ?? "yearly",
      status: nextStatus,
      current_period_end: getMembershipCurrentPeriodEnd(membership),
      billing_provider: "whop",
      whop_user_id: membership.user?.id || payment.user?.id || null,
      whop_membership_id: membership.id,
      billing_manage_url: membership.manage_url,
      customer_email: billingEmail,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw error;
  }

  return { identity, billingEmail };
}

export async function POST(request: NextRequest) {
  try {
    const { userId, email, deviceId, provider, paymentId, receiptId } =
      await request.json();

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    let identity = await resolveBillingIdentity(supabase, {
      userId,
      email,
      deviceId,
    });
    let billingEmail = getBillingCustomerEmail(email);

    if (!identity && provider === "whop") {
      try {
        const syncResult = await syncWhopPaymentIfNeeded({
          paymentId: paymentId || receiptId,
          userId,
          email,
          deviceId,
        });

        identity = syncResult?.identity ?? null;
        billingEmail = syncResult?.billingEmail ?? billingEmail;
      } catch (whopSyncError) {
        console.error("Whop checkout sync fallback failed:", whopSyncError);
      }
    }

    if (!identity) {
      return NextResponse.json({
        success: false,
        isPro: false,
        pending: true,
      });
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select(
        "tier, status, current_period_end, billing_provider, whop_membership_id, customer_email"
      )
      .eq("user_id", identity.userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const periodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end)
      : null;
    const isActive =
      subscription?.status === "active" &&
      (!periodEnd || Number.isNaN(periodEnd.valueOf()) || periodEnd > new Date());

    if (!isActive && provider === "whop") {
      try {
        await syncWhopPaymentIfNeeded({
          paymentId: paymentId || receiptId,
          userId: identity.userId,
          email: identity.email || undefined,
          deviceId: identity.deviceId || undefined,
        });

        const { data: refreshedSubscription, error: refreshedError } = await supabase
          .from("subscriptions")
          .select(
            "tier, status, current_period_end, billing_provider, whop_membership_id, customer_email"
          )
          .eq("user_id", identity.userId)
          .maybeSingle();

        if (refreshedError) {
          throw refreshedError;
        }

        const refreshedPeriodEnd = refreshedSubscription?.current_period_end
          ? new Date(refreshedSubscription.current_period_end)
          : null;
        const refreshedIsActive =
          refreshedSubscription?.status === "active" &&
          (!refreshedPeriodEnd ||
            Number.isNaN(refreshedPeriodEnd.valueOf()) ||
            refreshedPeriodEnd > new Date());

        return NextResponse.json({
          success: refreshedIsActive,
          isPro: refreshedIsActive,
          pending: !refreshedIsActive,
          email: refreshedSubscription?.customer_email || billingEmail || identity.email,
          membershipId: refreshedSubscription?.whop_membership_id ?? null,
          subscription: refreshedSubscription ?? null,
        });
      } catch (whopSyncError) {
        console.error("Whop checkout resync failed:", whopSyncError);
      }
    }

    return NextResponse.json({
      success: isActive,
      isPro: isActive,
      pending: !isActive,
      email: subscription?.customer_email || billingEmail || identity.email,
      membershipId: subscription?.whop_membership_id ?? null,
      subscription: subscription ?? null,
    });
  } catch (error: any) {
    console.error("Checkout status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check checkout status" },
      { status: 500 }
    );
  }
}
