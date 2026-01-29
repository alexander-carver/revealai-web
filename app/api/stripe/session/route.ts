import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Force this route to be dynamic since it uses searchParams
export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing session_id parameter" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    // Verify the session is paid/complete
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed", payment_status: session.payment_status },
        { status: 400 }
      );
    }

    // Extract purchase details
    const lineItem = session.line_items?.data[0];
    const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert cents to dollars
    const currency = session.currency?.toUpperCase() || 'USD';
    
    // Get plan name from metadata or line item
    let planName = session.metadata?.plan || 'subscription';
    if (lineItem?.price?.product && typeof lineItem.price.product === 'object') {
      // Check if it's a Product (not DeletedProduct) before accessing name
      const product = lineItem.price.product;
      if ('name' in product && product.name) {
        planName = product.name;
      }
    }

    return NextResponse.json({
      success: true,
      transaction_id: session.id,
      value: amount,
      currency: currency,
      plan: planName,
      payment_status: session.payment_status,
      customer_email: session.customer_email,
    });
  } catch (error: any) {
    console.error("Error retrieving Stripe session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve session" },
      { status: 500 }
    );
  }
}

