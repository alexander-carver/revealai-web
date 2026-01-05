/**
 * Check Failed Stripe Webhooks and Fix Missing Subscriptions
 * 
 * Finds webhook events that failed and checks if subscriptions
 * were properly created in Supabase
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY required');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkFailedWebhooks() {
  console.log('🔍 Checking failed webhook events...\n');

  // Get recent events (Stripe keeps 30 days)
  const events = await stripe.events.list({
    limit: 100,
    delivery_success: false, // Only failed deliveries
  });

  console.log(`📊 Found ${events.data.length} failed webhook events\n`);

  if (events.data.length === 0) {
    console.log('✅ No failed webhook events found!\n');
    return;
  }

  // Group by event type
  const eventsByType = new Map();
  
  for (const event of events.data) {
    const type = event.type;
    if (!eventsByType.has(type)) {
      eventsByType.set(type, []);
    }
    eventsByType.get(type).push(event);
  }

  console.log('📋 Failed events by type:\n');
  for (const [type, events] of eventsByType.entries()) {
    console.log(`  ${type}: ${events.length} failures`);
  }
  console.log('');

  // Check for checkout.session.completed events (these create subscriptions)
  const checkoutEvents = events.data.filter(e => e.type === 'checkout.session.completed');
  
  if (checkoutEvents.length > 0) {
    console.log(`\n⚠️  ${checkoutEvents.length} failed checkout.session.completed events found!`);
    console.log('These might be subscriptions that were never created in Supabase.\n');

    for (const event of checkoutEvents) {
      const session = event.data.object;
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`Session ID: ${session.id}`);
      console.log(`Customer Email: ${session.customer_email || session.customer_details?.email || 'unknown'}`);
      console.log(`Payment Status: ${session.payment_status}`);
      console.log(`Subscription: ${session.subscription || 'none'}`);
      console.log(`Event Date: ${new Date(event.created * 1000).toISOString()}`);
      
      // Check if subscription exists in Supabase
      if (session.subscription) {
        const { data: subData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('stripe_subscription_id', session.subscription)
          .maybeSingle();

        if (subData) {
          console.log(`✅ Subscription exists in Supabase (user: ${subData.user_id})`);
        } else {
          console.log(`❌ MISSING from Supabase - needs manual creation!`);
        }
      }
      console.log('');
    }
  }

  // Check customer.subscription events
  const subscriptionEvents = events.data.filter(e => 
    e.type.includes('customer.subscription')
  );

  if (subscriptionEvents.length > 0) {
    console.log(`\n📋 ${subscriptionEvents.length} failed subscription events`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n💡 To manually process a failed checkout:');
  console.log('   node scripts/process-checkout.js SESSION_ID\n');
}

async function main() {
  await checkFailedWebhooks();
}

main().catch(console.error);

