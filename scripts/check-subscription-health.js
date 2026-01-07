/**
 * Check Subscription Health
 * 
 * Comprehensive check of all subscriptions to ensure everything is working
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY not found');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Supabase credentials not found');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSubscriptionHealth() {
  console.log('🏥 Subscription Health Check');
  console.log('============================\n');
  
  // 1. Get Stripe subscriptions
  console.log('1️⃣  Checking Stripe subscriptions...');
  const stripeSubs = await stripe.subscriptions.list({
    limit: 100,
    status: 'all',
  });
  
  const activeStripe = stripeSubs.data.filter(s => ['active', 'trialing', 'past_due'].includes(s.status));
  console.log(`   Stripe: ${activeStripe.length} active/trialing/past_due subscriptions\n`);
  
  // 2. Get Supabase subscriptions
  console.log('2️⃣  Checking Supabase subscriptions...');
  const { data: supabaseSubs } = await supabase
    .from('subscriptions')
    .select('*');
  
  const activeSupabase = supabaseSubs?.filter(s => s.status === 'active') || [];
  console.log(`   Supabase: ${activeSupabase.length} active subscriptions\n`);
  
  // 3. Compare
  console.log('3️⃣  Comparing...');
  const stripeIds = new Set(activeStripe.map(s => s.id));
  const supabaseIds = new Set(supabaseSubs?.map(s => s.stripe_subscription_id) || []);
  
  const missingInSupabase = activeStripe.filter(s => !supabaseIds.has(s.id));
  const extraInSupabase = (supabaseSubs || []).filter(s => !stripeIds.has(s.stripe_subscription_id));
  
  if (missingInSupabase.length > 0) {
    console.log(`   ⚠️  ${missingInSupabase.length} Stripe subscriptions missing in Supabase:`);
    missingInSupabase.forEach(sub => {
      const customer = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
      console.log(`      - ${sub.id} (customer: ${customer}, status: ${sub.status})`);
    });
    console.log('');
  }
  
  if (extraInSupabase.length > 0) {
    console.log(`   ⚠️  ${extraInSupabase.length} Supabase subscriptions not in Stripe:`);
    extraInSupabase.forEach(sub => {
      console.log(`      - ${sub.stripe_subscription_id} (user: ${sub.user_id})`);
    });
    console.log('');
  }
  
  if (missingInSupabase.length === 0 && extraInSupabase.length === 0) {
    console.log('   ✅ All subscriptions are properly synced!\n');
  }
  
  // 4. Check recent payments
  console.log('4️⃣  Checking recent payments...');
  const recentPayments = await stripe.paymentIntents.list({
    limit: 20,
  });
  
  const successful = recentPayments.data.filter(p => p.status === 'succeeded');
  console.log(`   Recent successful payments: ${successful.length}\n`);
  
  // 5. Summary
  console.log('📊 Summary:');
  console.log(`   Active Stripe subscriptions: ${activeStripe.length}`);
  console.log(`   Active Supabase subscriptions: ${activeSupabase.length}`);
  console.log(`   Missing in Supabase: ${missingInSupabase.length}`);
  console.log(`   Recent successful payments: ${successful.length}\n`);
  
  if (missingInSupabase.length > 0) {
    console.log('💡 To fix missing subscriptions, run:');
    console.log('   node scripts/fix-all-subscriptions.js --sync\n');
  }
}

checkSubscriptionHealth().catch(console.error);

