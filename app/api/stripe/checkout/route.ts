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
    const { plan, userId, email } = await request.json();

    if (!plan) {
      return NextResponse.json(
        { error: "Missing plan" },
        { status: 400 }
      );
    }

    // Detect if we're using test or live mode based on the secret key
    const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_");
    
    // Define product IDs - require environment variables in production
    // Special "test" plan - uses test product if set, otherwise falls back to weekly
    const productIds: Record<string, string | undefined> = {
      weekly: process.env.STRIPE_WEEKLY_PRODUCT_ID,
      yearly: process.env.STRIPE_YEARLY_PRODUCT_ID,
      // Free trial plan - 7 day free trial then $9.99/week
      free_trial: process.env.STRIPE_FREE_TRIAL_PRODUCT_ID,
      // Test plan - use test product ID if set, otherwise use weekly for testing
      test: process.env.STRIPE_TEST_PRODUCT_ID || process.env.STRIPE_WEEKLY_PRODUCT_ID,
    };

    const productId = productIds[plan as string];
    const isFreeTrial = plan === "free_trial";
    
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
      },
    };

    // Add 7-day free trial for free_trial plan
    if (isFreeTrial) {
      sessionConfig.subscription_data = {
        trial_period_days: 7,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

