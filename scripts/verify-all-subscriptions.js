/**
 * Verify All Stripe Subscriptions Are in Supabase
 * 
 * Compares Stripe subscriptions with Supabase database
 * to ensure everything is synced
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAllSubscriptions() {
  console.log('🔍 Verifying all Stripe subscriptions are in Supabase...\n');

  // Get all subscriptions from Stripe (all statuses)
  const stripeSubscriptions = await stripe.subscriptions.list({
    limit: 100,
  });

  console.log(`📊 Stripe: ${stripeSubscriptions.data.length} total subscriptions\n`);

  // Get all subscriptions from Supabase
  const { data: supabaseSubscriptions } = await supabase
    .from('subscriptions')
    .select('*');

  console.log(`📊 Supabase: ${supabaseSubscriptions?.length || 0} subscriptions\n`);

  // Check each Stripe subscription
  const missingFromSupabase = [];
  const activeOrTrialing = stripeSubscriptions.data.filter(sub => 
    ['active', 'trialing', 'past_due'].includes(sub.status)
  );

  console.log(`📋 Active/Trialing/Past Due in Stripe: ${activeOrTrialing.length}\n`);

  for (const stripeSub of activeOrTrialing) {
    const inSupabase = supabaseSubscriptions?.find(s => 
      s.stripe_subscription_id === stripeSub.id
    );

    if (!inSupabase) {
      const customer = typeof stripeSub.customer === 'string'
        ? await stripe.customers.retrieve(stripeSub.customer)
        : stripeSub.customer;
      
      missingFromSupabase.push({
        subscription_id: stripeSub.id,
        customer_id: typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id,
        email: customer.email || 'no-email',
        status: stripeSub.status,
        created: new Date(stripeSub.created * 1000).toISOString(),
        trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
      });
    }
  }

  if (missingFromSupabase.length === 0) {
    console.log('✅ All active Stripe subscriptions are in Supabase!\n');
    return;
  }

  console.log(`\n❌ ${missingFromSupabase.length} subscriptions are MISSING from Supabase:\n`);

  for (const sub of missingFromSupabase) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Subscription: ${sub.subscription_id}`);
    console.log(`Customer: ${sub.customer_id}`);
    console.log(`Email: ${sub.email}`);
    console.log(`Status: ${sub.status}`);
    console.log(`Created: ${sub.created}`);
    if (sub.trial_end) {
      console.log(`Trial Ends: ${sub.trial_end}`);
    }
    console.log('');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('💡 To manually create these subscriptions in Supabase:');
  console.log('   Use the Stripe Dashboard to find the checkout session ID');
  console.log('   Then run: node scripts/process-checkout.js SESSION_ID\n');
}

async function main() {
  await verifyAllSubscriptions();
}

main().catch(console.error);

