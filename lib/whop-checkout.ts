import { NextRequest, NextResponse } from "next/server";
import type { CheckoutPlan } from "@/lib/stripe-plan-config";
import { resolveWhopPlanId } from "@/lib/checkout-provider";
import { getWhopClient, toWhopCheckoutUrl } from "@/lib/whop-server";

export interface WhopCheckoutPayload {
  plan?: CheckoutPlan;
  userId?: string;
  email?: string;
  deviceId?: string;
  affiliateRef?: string;
  platform?: string;
  metaAttribution?: {
    fbp?: string;
    fbc?: string;
    sourceUrl?: string;
    initiateCheckoutEventId?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    mc_flow?: string;
    mc_subscriber_id?: string;
    fbclid?: string;
  };
}

function normalizeConfiguredUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

function getWhopBaseUrl(request: NextRequest) {
  const configuredBaseUrl =
    normalizeConfiguredUrl(process.env.WHOP_REDIRECT_BASE_URL) ||
    normalizeConfiguredUrl(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeConfiguredUrl(process.env.APP_URL) ||
    normalizeConfiguredUrl(process.env.NEXT_PUBLIC_SITE_URL) ||
    normalizeConfiguredUrl(process.env.SITE_URL);

  if (configuredBaseUrl) {
    return configuredBaseUrl;
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");

  if (host) {
    return `https://${host}`;
  }

  return request.nextUrl.origin.replace(/^http:\/\//i, "https://");
}

function getWhopSourceUrl(request: NextRequest, baseUrl: string) {
  const referer = request.headers.get("referer");
  const normalizedReferer = normalizeConfiguredUrl(referer);

  if (!normalizedReferer) {
    return baseUrl;
  }

  const refererUrl = new URL(normalizedReferer);
  const isLocalHost =
    refererUrl.hostname === "localhost" ||
    refererUrl.hostname === "127.0.0.1" ||
    refererUrl.hostname === "::1";

  if (refererUrl.protocol !== "https:" || isLocalHost) {
    return baseUrl;
  }

  return normalizedReferer;
}

function trimMetadataValue(value?: string | null, maxLength = 500) {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

export async function createWhopCheckoutResponse(
  request: NextRequest,
  payload: WhopCheckoutPayload
) {
  const whop = getWhopClient();
  const { plan, userId, email, deviceId, affiliateRef, platform, metaAttribution } =
    payload;

  if (!plan) {
    return NextResponse.json({ error: "Missing plan" }, { status: 400 });
  }

  if (
    plan === "abandoned_trial" &&
    !process.env.WHOP_PLAN_ID_ABANDONED_TRIAL?.trim()
  ) {
    return NextResponse.json(
      {
        error:
          "Missing WHOP_PLAN_ID_ABANDONED_TRIAL. Point it at the $19.99 Whop offer before using the abandoned checkout paywall.",
      },
      { status: 400 }
    );
  }

  const whopPlanId = resolveWhopPlanId(plan);

  if (!whopPlanId) {
    return NextResponse.json(
      {
        error: `Missing Whop plan ID for ${plan}. Add the matching WHOP_PLAN_ID_* env var before switching checkout to Whop.`,
      },
      { status: 400 }
    );
  }

  const baseUrl = getWhopBaseUrl(request);
  const redirectUrl = new URL("/checkout-success", baseUrl);
  redirectUrl.searchParams.set("provider", "whop");
  redirectUrl.searchParams.set("plan", plan);

  const sourceUrl = getWhopSourceUrl(request, baseUrl);

  const checkoutConfiguration = await whop.checkoutConfigurations.create({
    plan_id: whopPlanId,
    affiliate_code: affiliateRef || undefined,
    redirect_url: redirectUrl.toString(),
    source_url: sourceUrl,
    metadata: {
      plan,
      platform: platform || "web",
      userId: userId || null,
      email: email?.trim().toLowerCase() || null,
      deviceId: deviceId || null,
      affiliateRef: affiliateRef || null,
      meta_fbp: trimMetadataValue(metaAttribution?.fbp),
      meta_fbc: trimMetadataValue(metaAttribution?.fbc),
      meta_source_url: trimMetadataValue(metaAttribution?.sourceUrl),
      meta_initiate_checkout_event_id: trimMetadataValue(
        metaAttribution?.initiateCheckoutEventId,
        128
      ),
      utm_source: trimMetadataValue(metaAttribution?.utm_source),
      utm_medium: trimMetadataValue(metaAttribution?.utm_medium),
      utm_campaign: trimMetadataValue(metaAttribution?.utm_campaign),
      utm_term: trimMetadataValue(metaAttribution?.utm_term),
      utm_content: trimMetadataValue(metaAttribution?.utm_content),
      mc_flow: trimMetadataValue(metaAttribution?.mc_flow),
      mc_subscriber_id: trimMetadataValue(metaAttribution?.mc_subscriber_id),
      fbclid: trimMetadataValue(metaAttribution?.fbclid),
    },
  });

  return NextResponse.json({
    provider: "whop",
    url: toWhopCheckoutUrl(checkoutConfiguration.purchase_url),
    checkoutConfigurationId: checkoutConfiguration.id,
  });
}
