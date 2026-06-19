import { NextRequest, NextResponse } from "next/server";
import { getCheckoutProvider } from "@/lib/checkout-provider";
import { createWhopCheckoutResponse, type WhopCheckoutPayload } from "@/lib/whop-checkout";
import { POST as stripeCheckoutPost } from "../stripe/checkout/route";

export async function POST(request: NextRequest) {
  if (getCheckoutProvider() !== "whop") {
    return stripeCheckoutPost(request);
  }

  try {
    const payload = (await request.json()) as WhopCheckoutPayload;
    return await createWhopCheckoutResponse(request, payload);
  } catch (error: any) {
    console.error("Whop checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Whop checkout" },
      { status: 500 }
    );
  }
}
