import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const stripe = await import("https://esm.sh/stripe@14.21.0?target=deno");

const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY") || "";
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const stripeClient = new stripe.Stripe(stripeSecret, {
  apiVersion: "2025-03-31.basil",
  httpClient: stripe.Stripe.createFetchHttpClient(),
});

const weeklyProductIds = [
  Deno.env.get("STRIPE_WEEKLY_PRODUCT_ID"),
  Deno.env.get("STRIPE_MOBILE_WEEKLY_PRODUCT_ID"),
].filter((value): value is string => Boolean(value));

const yearlyProductIds = [
  Deno.env.get("STRIPE_YEARLY_PRODUCT_ID"),
  Deno.env.get("STRIPE_MOBILE_YEARLY_PRODUCT_ID"),
].filter((value): value is string => Boolean(value));

const USERS_PAGE_SIZE = 200;
const MAX_USER_PAGES = 20;
const ACCESS_GRANTING_STATUSES = new Set(["active", "trialing"]);
const OPEN_CHECKOUT_LOOKBACK_SECONDS = 60 * 60 * 48;
const MAX_OPEN_CHECKOUT_PAGES = 3;
type TrackedSubscriptionStatus = "active" | "canceled" | "past_due" | "unpaid";

function normalizeTierForPlan(plan?: string | null): "weekly" | "yearly" {
  switch (plan) {
    case "weekly":
      return "weekly";
    case "free_trial":
    case "abandoned_trial":
    default:
      return "yearly";
  }
}

function inferTierFromProductId(productId?: string | null): "weekly" | "yearly" | null {
  if (!productId) return null;
  if (weeklyProductIds.includes(productId)) return "weekly";
  if (yearlyProductIds.includes(productId)) return "yearly";
  return null;
}

function isAccessGrantingStripeSubscriptionStatus(status?: string | null) {
  return !!status && ACCESS_GRANTING_STATUSES.has(status);
}

function mapStripeSubscriptionStatus(
  status?: string | null
): TrackedSubscriptionStatus {
  if (isAccessGrantingStripeSubscriptionStatus(status)) {
    return "active";
  }

  if (status === "past_due" || status === "unpaid") {
    return status;
  }

  return "canceled";
}

function getInvoiceSubscriptionId(
  invoice: stripe.Stripe.Invoice
): string | null {
  const invoiceSubscription = (invoice as any).subscription;

  if (!invoiceSubscription) {
    return null;
  }

  return typeof invoiceSubscription === "string"
    ? invoiceSubscription
    : invoiceSubscription.id;
}

async function findAuthUserByEmail(supabase: any, email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  for (let page = 1; page <= MAX_USER_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: USERS_PAGE_SIZE,
    });

    if (error) {
      throw error;
    }

    const users = data?.users ?? [];
    const match = users.find(
      (user: any) => user.email?.trim().toLowerCase() === normalizedEmail
    );

    if (match) {
      return match;
    }

    if (users.length < USERS_PAGE_SIZE) {
      break;
    }
  }

  return null;
}

async function ensureDeviceAuthUser(supabase: any, deviceId: string) {
  const deviceEmail = `device_${deviceId}@revealai.device`;
  let existingUser = await findAuthUserByEmail(supabase, deviceEmail);

  if (existingUser) {
    const currentMetadata = existingUser.user_metadata ?? {};
    const shouldRepairPassword = currentMetadata.device_password_managed !== true;
    const shouldRepairMetadata =
      currentMetadata.device_id !== deviceId ||
      currentMetadata.is_device_user !== true;

    if (shouldRepairPassword || shouldRepairMetadata) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          ...(shouldRepairPassword ? { password: deviceId } : {}),
          email_confirm: true,
          user_metadata: {
            ...currentMetadata,
            device_id: deviceId,
            is_device_user: true,
            device_password_managed: true,
          },
        }
      );

      if (updateError) {
        throw updateError;
      }
    }

    return { userId: existingUser.id, deviceEmail };
  }

  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: deviceEmail,
      password: deviceId,
      email_confirm: true,
      user_metadata: {
        device_id: deviceId,
        is_device_user: true,
        device_password_managed: true,
      },
    });

  if (createError) {
    const isDuplicateError =
      createError.message?.toLowerCase().includes("already exists") ||
      createError.message?.toLowerCase().includes("already registered");

    if (!isDuplicateError) {
      throw createError;
    }

    existingUser = await findAuthUserByEmail(supabase, deviceEmail);
    if (!existingUser) {
      throw createError;
    }

    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        password: deviceId,
        email_confirm: true,
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          device_id: deviceId,
          is_device_user: true,
          device_password_managed: true,
        },
      }
    );

    if (updateError) {
      throw updateError;
    }

    return { userId: existingUser.id, deviceEmail };
  }

  if (!createdUser.user?.id) {
    throw new Error("Device user creation did not return a user id");
  }

  return { userId: createdUser.user.id, deviceEmail };
}

async function ensureEmailAuthUser(supabase: any, email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  let existingUser = await findAuthUserByEmail(supabase, normalizedEmail);

  if (existingUser) {
    return { userId: existingUser.id, email: normalizedEmail };
  }

  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll(
        "-",
        ""
      ),
      email_confirm: true,
    });

  if (createError) {
    const isDuplicateError =
      createError.message?.toLowerCase().includes("already exists") ||
      createError.message?.toLowerCase().includes("already registered");

    if (!isDuplicateError) {
      throw createError;
    }

    existingUser = await findAuthUserByEmail(supabase, normalizedEmail);
    if (!existingUser) {
      throw createError;
    }

    return { userId: existingUser.id, email: normalizedEmail };
  }

  if (!createdUser.user?.id) {
    throw new Error("Email user creation did not return a user id");
  }

  return { userId: createdUser.user.id, email: normalizedEmail };
}

function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

function matchesCheckoutSessionIdentity(
  session: stripe.Stripe.Checkout.Session,
  identity: {
    userId?: string | null;
    deviceId?: string | null;
    customerId?: string | null;
    customerEmail?: string | null;
  }
) {
  if (identity.customerId && session.customer === identity.customerId) {
    return true;
  }

  if (
    identity.userId &&
    (session.client_reference_id === identity.userId ||
      session.metadata?.userId === identity.userId)
  ) {
    return true;
  }

  if (identity.deviceId && session.metadata?.deviceId === identity.deviceId) {
    return true;
  }

  const identityEmail = normalizeEmail(identity.customerEmail);
  if (!identityEmail) {
    return false;
  }

  const sessionEmail = normalizeEmail(
    session.customer_details?.email ||
      session.customer_email ||
      session.metadata?.email
  );

  return sessionEmail === identityEmail;
}

async function listOpenCheckoutSessionsForIdentity(
  identity: {
    userId?: string | null;
    deviceId?: string | null;
    customerId?: string | null;
    customerEmail?: string | null;
  }
) {
  if (
    !identity.customerId &&
    !identity.userId &&
    !identity.deviceId &&
    !normalizeEmail(identity.customerEmail)
  ) {
    return [];
  }

  const matchingSessions: stripe.Stripe.Checkout.Session[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < MAX_OPEN_CHECKOUT_PAGES; page += 1) {
    const response = await stripeClient.checkout.sessions.list({
      created: {
        gte:
          Math.floor(Date.now() / 1000) - OPEN_CHECKOUT_LOOKBACK_SECONDS,
      },
      status: "open",
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    matchingSessions.push(
      ...response.data.filter((session) =>
        matchesCheckoutSessionIdentity(session, identity)
      )
    );

    if (!response.has_more || response.data.length === 0) {
      break;
    }

    startingAfter = response.data[response.data.length - 1]?.id;
  }

  return matchingSessions.sort((left, right) => right.created - left.created);
}

async function expireOpenCheckoutSessions(
  sessions: stripe.Stripe.Checkout.Session[],
  keepSessionId?: string
) {
  const expiredSessionIds: string[] = [];

  for (const session of sessions) {
    if (session.id === keepSessionId) {
      continue;
    }

    try {
      await stripeClient.checkout.sessions.expire(session.id);
      expiredSessionIds.push(session.id);
    } catch (error: any) {
      if (error?.code === "session_not_expireable") {
        continue;
      }

      throw error;
    }
  }

  return expiredSessionIds;
}

serve(async (req) => {
  try {
    console.log("Webhook received");
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("No signature in webhook request");
      return new Response(
        JSON.stringify({ error: "No signature" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.text();
    let event: stripe.Stripe.Event;

    try {
      event = await stripeClient.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret
      );
      console.log("Webhook event verified:", event.type);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        console.log("Processing checkout.session.completed");
        const session = event.data.object as stripe.Stripe.Checkout.Session;
        let userId = session.metadata?.userId || session.client_reference_id;
        const plan = session.metadata?.plan || "yearly";
        const deviceId = session.metadata?.deviceId;
        let customerEmail =
          session.customer_email ||
          session.customer_details?.email ||
          session.metadata?.email;
        const customerId =
          typeof session.customer === "string"
            ? session.customer
            : session.customer?.id || null;
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id || null;

        console.log("Checkout session data:", {
          userId,
          plan,
          deviceId,
          customerEmail,
          customerId,
          subscriptionId,
        });

        const subscriptionTier = normalizeTierForPlan(plan);
        let subscription: stripe.Stripe.Subscription | null = null;
        let currentPeriodEnd: Date;
        let appSubscriptionStatus: TrackedSubscriptionStatus = "active";
        
        if (subscriptionId) {
          try {
            subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
            console.log("Retrieved subscription:", subscription.id);
            appSubscriptionStatus = mapStripeSubscriptionStatus(
              subscription.status
            );
            
            // Safely parse current_period_end
            if (subscription.current_period_end && 
                typeof subscription.current_period_end === 'number' && 
                subscription.current_period_end > 0) {
              const timestamp = subscription.current_period_end * 1000;
              currentPeriodEnd = new Date(timestamp);
              // Validate the date
              if (isNaN(currentPeriodEnd.getTime())) {
                console.warn("Invalid current_period_end, using fallback");
                currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
              }
            } else {
              console.warn("No valid current_period_end in subscription, using fallback");
              currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            }
          } catch (err: any) {
            console.error("Error retrieving subscription:", err.message);
            // Fallback to default period end
            currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          }
        } else {
          // No subscription ID - use default period end
          currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }

        if (!userId && deviceId) {
          try {
            const ensuredDeviceUser = await ensureDeviceAuthUser(
              supabase,
              deviceId
            );
            userId = ensuredDeviceUser.userId;
            console.log("Resolved device user during webhook:", userId);
          } catch (err: any) {
            console.error("Error ensuring device user:", err.message);
          }
        }

        if (!userId && customerEmail) {
          try {
            const matchingUser = await findAuthUserByEmail(
              supabase,
              customerEmail
            );
            if (matchingUser) {
              userId = matchingUser.id;
              console.log("Resolved user by email during webhook:", userId);
            }
          } catch (err: any) {
            console.error("Error looking up user by email:", err.message);
          }
        }

        if (!userId && customerEmail) {
          try {
            const ensuredEmailUser = await ensureEmailAuthUser(
              supabase,
              customerEmail
            );
            userId = ensuredEmailUser.userId;
            customerEmail = ensuredEmailUser.email;
            console.log("Created or found user by email during webhook:", userId);
          } catch (err: any) {
            console.error("Error creating user by email:", err.message);
          }
        }

        if (userId) {
          // User was signed in - create subscription directly
          console.log("Creating subscription for user:", userId);
          const { error } = await supabase
            .from("subscriptions")
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              billing_provider: "stripe",
              whop_user_id: null,
              whop_membership_id: null,
              billing_manage_url: null,
              tier: subscriptionTier,
              status: appSubscriptionStatus,
              current_period_end: currentPeriodEnd.toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: "user_id",
            });

          if (error) {
            console.error("Error updating subscription:", error);
            return new Response(
              JSON.stringify({ error: error.message }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
          console.log("Subscription created successfully for user:", userId);

          if (appSubscriptionStatus === "active") {
            try {
              const openSessionsForIdentity =
                await listOpenCheckoutSessionsForIdentity({
                  userId,
                  deviceId,
                  customerId,
                  customerEmail,
                });

              if (openSessionsForIdentity.length > 0) {
                const expiredSessionIds = await expireOpenCheckoutSessions(
                  openSessionsForIdentity,
                  session.id
                );

                if (expiredSessionIds.length > 0) {
                  console.log(
                    `Expired stale open checkout sessions after webhook completion: ${expiredSessionIds.join(
                      ", "
                    )}`
                  );
                }
              }
            } catch (openSessionError: any) {
              console.error(
                "Error expiring stale open checkout sessions after webhook completion:",
                openSessionError.message || openSessionError
              );
            }
          }
        } else if (customerEmail) {
          console.log(
            "No existing user found for checkout session after device/email reconciliation."
          );
        }
        break;
      }

      case "invoice.payment_failed":
      case "invoice.payment_action_required": {
        const invoice = event.data.object as stripe.Stripe.Invoice;
        const invoiceSubId = getInvoiceSubscriptionId(invoice);
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id || null;

        if (!invoiceSubId) {
          console.log(
            `Skipping ${event.type} because invoice ${invoice.id} has no subscription`
          );
          break;
        }

        let nextStatus: TrackedSubscriptionStatus = "past_due";
        let nextTier: "weekly" | "yearly" | null = null;
        let nextPeriodEnd: string | null = null;

        try {
          const invoiceSubscription = await stripeClient.subscriptions.retrieve(
            invoiceSubId
          );
          nextStatus = mapStripeSubscriptionStatus(invoiceSubscription.status);
          nextTier =
            inferTierFromProductId(
              invoiceSubscription.items.data[0]?.price?.product as
                | string
                | undefined
            ) ?? null;

          if (invoiceSubscription.current_period_end) {
            nextPeriodEnd = new Date(
              invoiceSubscription.current_period_end * 1000
            ).toISOString();
          }
        } catch (subscriptionError: any) {
          console.error(
            `Failed to retrieve subscription ${invoiceSubId} after ${event.type}:`,
            subscriptionError.message || subscriptionError
          );
        }

        const initialLookup = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", invoiceSubId)
          .maybeSingle();

        let subData = initialLookup.data;
        let findError = initialLookup.error;

        if (!subData && !findError && customerId) {
          const fallbackLookup = await supabase
            .from("subscriptions")
            .select("user_id")
            .eq("stripe_customer_id", customerId)
            .maybeSingle();

          subData = fallbackLookup.data;
          findError = fallbackLookup.error;
        }

        if (findError) {
          console.error("Error finding subscription:", findError);
          break;
        }

        if (!subData) {
          console.log(
            `No tracked subscription found for invoice ${invoice.id} / subscription ${invoiceSubId}`
          );
          break;
        }

        const updatePayload: Record<string, string | null> = {
          billing_provider: "stripe",
          whop_user_id: null,
          whop_membership_id: null,
          billing_manage_url: null,
          status: nextStatus,
          updated_at: new Date().toISOString(),
        };

        if (nextTier) {
          updatePayload.tier = nextTier;
        }

        if (nextPeriodEnd) {
          updatePayload.current_period_end = nextPeriodEnd;
        }

        const { error: updateError } = await supabase
          .from("subscriptions")
          .update(updatePayload)
          .eq("user_id", subData.user_id);

        if (updateError) {
          console.error("Error updating subscription after invoice failure:", updateError);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as stripe.Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`Processing ${event.type} for customer: ${customerId}`);
        console.log("Subscription data:", {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          customer: customerId,
        });

        // Find user by customer ID
        const { data: subData, error: findError } = await supabase
          .from("subscriptions")
          .select("user_id, stripe_subscription_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle();

        if (findError) {
          console.error("Error finding subscription:", findError);
          // Don't fail the webhook - subscription might not exist yet
          break;
        }

        if (!subData) {
          console.log("No subscription found for customer:", customerId);
          break;
        }

        if (subData) {
          const status = mapStripeSubscriptionStatus(subscription.status);
          
          // Determine tier from subscription items
          const priceId = subscription.items.data[0]?.price.id;
          let tier = "yearly"; // default
          if (priceId) {
            const price = await stripeClient.prices.retrieve(priceId);
            tier = inferTierFromProductId(price.product as string) ?? "yearly";
          }

          // Safely handle current_period_end - validate it's a valid number
          let periodEndDate: Date;
          if (subscription.current_period_end && 
              typeof subscription.current_period_end === 'number' && 
              subscription.current_period_end > 0) {
            try {
              periodEndDate = new Date(subscription.current_period_end * 1000);
              // Validate the date is valid
              if (isNaN(periodEndDate.getTime())) {
                console.warn("Invalid current_period_end timestamp, using fallback");
                periodEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
              }
            } catch (err) {
              console.error("Error parsing current_period_end:", err);
              periodEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            }
          } else {
            periodEndDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          }

          if (status === "active") {
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update({
                stripe_subscription_id: subscription.id,
                billing_provider: "stripe",
                whop_user_id: null,
                whop_membership_id: null,
                billing_manage_url: null,
                status,
                tier,
                current_period_end: periodEndDate.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", subData.user_id);

            if (updateError) {
              console.error("Error updating subscription:", updateError);
            }
          } else if (status === "past_due" || status === "unpaid") {
            const { error: updateError } = await supabase
              .from("subscriptions")
              .update({
                stripe_subscription_id: subscription.id,
                billing_provider: "stripe",
                whop_user_id: null,
                whop_membership_id: null,
                billing_manage_url: null,
                status,
                tier,
                current_period_end: periodEndDate.toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", subData.user_id);

            if (updateError) {
              console.error("Error updating subscription billing state:", updateError);
            }
          } else {
            const allSubscriptions = await stripeClient.subscriptions.list({
              customer: customerId,
              status: "all",
              limit: 10,
            });

            const remainingAccessSubscription = allSubscriptions.data.find(
              (candidate) =>
                candidate.id !== subscription.id &&
                isAccessGrantingStripeSubscriptionStatus(candidate.status)
            );

            if (remainingAccessSubscription) {
              const remainingPriceId =
                remainingAccessSubscription.items.data[0]?.price.id;
              let remainingTier = tier;
              if (remainingPriceId) {
                const price = await stripeClient.prices.retrieve(remainingPriceId);
                remainingTier =
                  inferTierFromProductId(price.product as string) ?? remainingTier;
              }

              const { error: updateError } = await supabase
                .from("subscriptions")
                .update({
                  stripe_subscription_id: remainingAccessSubscription.id,
                  billing_provider: "stripe",
                  whop_user_id: null,
                  whop_membership_id: null,
                  billing_manage_url: null,
                  status: "active",
                  tier: remainingTier,
                  current_period_end: new Date(
                    remainingAccessSubscription.current_period_end * 1000
                  ).toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", subData.user_id);

              if (updateError) {
                console.error(
                  "Error switching to remaining active subscription:",
                  updateError
                );
              }
            } else {
              const { error: updateError } = await supabase
                .from("subscriptions")
                .update({
                  status: "canceled",
                  tier,
                  current_period_end: periodEndDate.toISOString(),
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", subData.user_id);

              if (updateError) {
                console.error("Error updating subscription:", updateError);
              }
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Webhook handler error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
