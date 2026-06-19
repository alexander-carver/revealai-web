import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ensureEmailAuthUser } from "@/lib/auth-admin";
import { resolveBillingIdentity } from "@/lib/billing-identity";
import { getBillingCustomerEmail } from "@/lib/customer-email";
import {
  inferTierFromWhopPlanId,
  isWhopAccessGrantingStatus,
  mapWhopMembershipStatus,
} from "@/lib/checkout-provider";
import { sendPurchaseEvent } from "@/lib/meta-capi";
import { getWhopClient } from "@/lib/whop-server";
import { normalizeTierForPlan } from "@/lib/stripe-plan-config";
import {
  getTrackedCheckoutValue,
  getWhopPurchaseEventId,
  getWhopTrackedPlan,
} from "@/lib/whop-tracking";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function getMembershipTier(membership: {
  plan?: { id?: string | null } | null;
  metadata?: Record<string, unknown> | null;
}) {
  const metadataPlan =
    typeof membership.metadata?.plan === "string" ? membership.metadata.plan : null;
  if (metadataPlan) {
    return normalizeTierForPlan(metadataPlan);
  }

  const inferredTier = inferTierFromWhopPlanId(membership.plan?.id);
  return inferredTier ?? "yearly";
}

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

function getMetadataValue(
  metadata: Record<string, unknown> | null | undefined,
  key: string
) {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function syncMembership(
  request: NextRequest,
  rawBody: string,
  supabase = createClient(supabaseUrl, supabaseServiceKey)
) {
  const whop = getWhopClient();
  const event = whop.webhooks.unwrap(rawBody, {
    headers: Object.fromEntries(request.headers.entries()),
  });

  if (
    event.type !== "membership.activated" &&
    event.type !== "membership.deactivated" &&
    event.type !== "membership.cancel_at_period_end_changed"
  ) {
    return { ignored: true, eventType: event.type };
  }

  const membership = event.data;
  const billingEmail = getBillingCustomerEmail(
    membership.user?.email ||
      (typeof membership.metadata?.email === "string"
        ? membership.metadata.email
        : null)
  );

  if (billingEmail) {
    try {
      await ensureEmailAuthUser(supabase, billingEmail);
    } catch (emailUserError) {
      console.error("Whop webhook email-account ensure failed:", emailUserError);
    }
  }

  const identity = await resolveBillingIdentity(supabase, {
    userId:
      typeof membership.metadata?.userId === "string"
        ? membership.metadata.userId
        : null,
    deviceId:
      typeof membership.metadata?.deviceId === "string"
        ? membership.metadata.deviceId
        : null,
    email: billingEmail,
  });

  if (!identity) {
    return {
      ignored: true,
      eventType: event.type,
      reason: "No user identity in Whop membership payload",
    };
  }

  const nextStatus =
    event.type === "membership.cancel_at_period_end_changed" &&
    isWhopAccessGrantingStatus(membership.status)
      ? "active"
      : mapWhopMembershipStatus(membership.status);

  const { error } = await supabase.from("subscriptions").upsert(
    {
      user_id: identity.userId,
      tier: getMembershipTier(membership),
      status: nextStatus,
      current_period_end: getMembershipCurrentPeriodEnd(membership),
      billing_provider: "whop",
      whop_user_id: membership.user?.id || null,
      whop_membership_id: membership.id,
      billing_manage_url: membership.manage_url,
      customer_email: billingEmail,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id",
    }
  );

  if (error) {
    throw error;
  }

  if (event.type === "membership.activated") {
    const trackedPlan = getWhopTrackedPlan(membership);
    const trackedValue = getTrackedCheckoutValue(trackedPlan);
    const normalizedEmail = membership.user?.email || identity.email || "";
    const currency = (membership.currency || "usd").toUpperCase();
    const metaFbp = getMetadataValue(membership.metadata, "meta_fbp");
    const metaFbc = getMetadataValue(membership.metadata, "meta_fbc");
    const sourceUrl =
      getMetadataValue(membership.metadata, "meta_source_url") ||
      new URL("/checkout-success", request.nextUrl.origin).toString();

    try {
      await sendPurchaseEvent({
        eventId: getWhopPurchaseEventId(membership.id),
        email: normalizedEmail,
        value: trackedValue,
        currency,
        transactionId: membership.id,
        plan: trackedPlan,
        sourceUrl,
        externalId: identity.userId,
        fbc: metaFbc,
        fbp: metaFbp,
      });

    } catch (capiErr) {
      console.error("Whop CAPI tracking error (non-fatal):", capiErr);
    }
  }

  return {
    ignored: false,
    eventType: event.type,
    userId: identity.userId,
    membershipId: membership.id,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const result = await syncMembership(request, body);
    return NextResponse.json({ received: true, ...result });
  } catch (error: any) {
    console.error("Whop webhook error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process Whop webhook" },
      { status: 400 }
    );
  }
}
