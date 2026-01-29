import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-11-17.clover",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const { plan, userId, email, deviceId } = await request.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan" },
        { status: 400 }
      );
    }

    // Detect if we're using test or live mode based on the secret key
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
    
    // Define product IDs - HARDCODED to ensure correct products are used
    // Main paywall products:
    // - Weekly: prod_Tn7ov8WD9p7Zty ($6.99/week)
    // - Yearly: prod_Tn7peqRLz4B8Ho ($39.99/year)
    // - Abandoned Trial: prod_TnGdDqDGvyBlhK ($1.99 for first week, then upgrades to $6.99/week)
    // - Free Trial: Same as weekly, no trial (charges $6.99 immediately)
    const productIds: Record<string, string> = {
      weekly: "prod_Tn7ov8WD9p7Zty", // $6.99/week - DO NOT CHANGE
      yearly: "prod_Tn7peqRLz4B8Ho", // $39.99/year - DO NOT CHANGE
      free_trial: "prod_Tn7ov8WD9p7Zty", // $6.99/week, charges immediately - DO NOT CHANGE
      // Abandoned trial - $1.99 for first week, then upgrades to $6.99/week
      abandoned_trial: "prod_TnGdDqDGvyBlhK", // $1.99 first week - DO NOT CHANGE
      // Test plan - use test product ID if set, otherwise use weekly for testing
      test: process.env.STRIPE_TEST_PRODUCT_ID || "prod_Tn7ov8WD9p7Zty",
    };

    const productId = productIds[plan as string];
    
    // Log which product ID is being used for debugging
    console.log(`[Checkout] Plan: ${plan}, Product ID: ${productId}`);

    if (!productId) {
      return NextResponse.json(
        { error: `Invalid plan: ${plan}. STRIPE_${plan.toUpperCase()}_PRODUCT_ID environment variable is required for production plans.` },
        { status: 400 }
      );
    }
    
    // Fetch the product to get its default price and verify mode match
    let product: Stripe.Product;
    try {
      product = await stripe.products.retrieve(productId);
      
      // Verify the product mode matches the key mode
      const productIsTest = product.livemode === false;
      
      if (isTestMode && !productIsTest) {
        return NextResponse.json(
          { error: `Product ${productId} is a live mode product, but you're using a test mode key. Please create a test product or use live mode keys.` },
          { status: 400 }
        );
      }
      
      if (!isTestMode && productIsTest) {
        return NextResponse.json(
          { error: `Product ${productId} is a test mode product, but you're using a live mode key.` },
          { status: 400 }
        );
      }
    } catch (error: any) {
      if (error.code === "resource_missing") {
        const modeHint = isTestMode 
          ? "Make sure you're using a test mode product ID and test mode keys."
          : "Make sure you're using a live mode product ID and live mode keys. Check your Stripe Dashboard.";
        return NextResponse.json(
          { 
            error: `Product ${productId} not found in ${isTestMode ? 'test' : 'live'} mode. ${modeHint}`,
            productId,
            isTestMode
          },
          { status: 400 }
        );
      }
      throw error;
    }
    const priceId = product.default_price as string;

    if (!priceId) {
      return NextResponse.json(
        { error: "Product has no default price" },
        { status: 400 }
      );
    }

    // Get user email if userId provided
    let customerEmail = email;
    if (userId && !customerEmail) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      customerEmail = userData?.user?.email;
    }

    // Try to find or create Stripe customer for returning customers
    let customerId: string | undefined;
    if (customerEmail) {
      try {
        // Search for existing customer by email
        const existingCustomers = await stripe.customers.list({
          email: customerEmail,
          limit: 1,
        });
        
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        }
      } catch (error) {
        console.error("Error finding customer:", error);
        // Continue without customer
      }
    }

    // Create Stripe checkout session - works with or without signed in user
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // Use existing customer if found, otherwise let Stripe create one
      ...(customerId && { customer: customerId }),
      // If no existing customer, pre-fill email (or Stripe will collect it)
      ...(!customerId && customerEmail && { customer_email: customerEmail }),
      // Store userId if available for direct linking
      ...(userId && { client_reference_id: userId }),
      // Always collect billing address (ensures email is collected)
      billing_address_collection: "required",
      success_url: `${request.nextUrl.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/?canceled=true`,
      metadata: {
        ...(userId && { userId }),
        plan,
        // Store email in metadata as backup
        ...(customerEmail && { email: customerEmail }),
        // Store device ID for consistent user creation (like mobile apps)
        ...(deviceId && { deviceId }),
      },
    };

    // Idempotency key: same user+plan within same minute returns same session (avoids duplicate sessions on double-click)
    const idempotencyKey = `${userId || deviceId || "anon"}-${plan}-${Math.floor(Date.now() / 60000)}`;
    const session = await stripe.checkout.sessions.create(sessionConfig, {
      idempotencyKey,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

