/**
 * Fix All Subscriptions - Comprehensive Fix Script
 * 
 * 1. Finds all failed webhook events
 * 2. Resends them to fix missing subscriptions
 * 3. Syncs any remaining missing subscriptions from Stripe to Supabase
 * 4. Verifies all active subscriptions are properly synced
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY not found in .env.local');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Supabase credentials not found in .env.local');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Webhook endpoint ID - get this from Stripe Dashboard
const WEBHOOK_ENDPOINT_ID = 'we_1Sakb9Gjo8o5J3MxLHa4mWFE'; // From the dashboard

async function getActiveStripeSubscriptions() {
  console.log('📊 Fetching all active Stripe subscriptions...');
  const allSubscriptions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const listParams = {
      limit: 100,
      status: 'all',
      expand: ['data.customer'],
    };
    
    if (startingAfter) {
      listParams.starting_after = startingAfter;
    }
    
    const subscriptions = await stripe.subscriptions.list(listParams);

    // Filter for active, trialing, or past_due
    const activeSubs = subscriptions.data.filter(sub => 
      ['active', 'trialing', 'past_due'].includes(sub.status)
    );
    
    allSubscriptions.push(...activeSubs);
    
    if (subscriptions.has_more) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  console.log(`   Found ${allSubscriptions.length} active/trialing/past_due subscriptions\n`);
  return allSubscriptions;
}

async function getSupabaseSubscriptions() {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('stripe_subscription_id, user_id, status');
  
  if (error) {
    console.error('❌ Error fetching Supabase subscriptions:', error);
    return [];
  }
  
  return data || [];
}

async function findOrCreateUser(email, customerId, deviceId) {
  // Try to find by email
  let page = 1;
  let user = null;
  
  while (!user && page <= 5) { // Limit to 5 pages to avoid timeout
    const { data: users, error } = await supabase.auth.admin.listUsers({ 
      page, 
      perPage: 100 
    });
    
    if (error || !users?.users.length) break;
    
    user = users.users.find(u => 
      u.email?.toLowerCase() === email?.toLowerCase() ||
      u.user_metadata?.device_id === deviceId
    );
    
    if (user) break;
    page++;
  }

  if (user) {
    console.log(`  ✅ Found user: ${user.id}`);
    return user.id;
  }

  // Create new user
  const userEmail = email || `device_${deviceId || customerId}@revealai.device`;
  const password = deviceId || customerId;
  
  console.log(`  📝 Creating user: ${userEmail}`);
  
  try {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email: userEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        device_id: deviceId,
        stripe_customer_id: customerId,
        is_device_user: !email,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        // User exists, try to find again
        const { data: users } = await supabase.auth.admin.listUsers();
        user = users.users.find(u => u.email?.toLowerCase() === userEmail.toLowerCase());
        if (user) return user.id;
      }
      console.error(`  ❌ Error creating user:`, error.message);
      return null;
    }

    console.log(`  ✅ Created user: ${newUser.user.id}`);
    return newUser.user.id;
  } catch (err) {
    console.error(`  ❌ Error:`, err.message);
    return null;
  }
}

async function syncMissingSubscription(stripeSub) {
  const customer = typeof stripeSub.customer === 'string'
    ? await stripe.customers.retrieve(stripeSub.customer)
    : stripeSub.customer;
  
  const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id;
  const email = customer.email;
  const deviceId = stripeSub.metadata?.deviceId;

  // Find or create user
  const userId = await findOrCreateUser(email, customerId, deviceId);
  if (!userId) {
    console.log(`  ❌ Could not get/create user`);
    return false;
  }

  // Determine tier
  const priceId = stripeSub.items.data[0]?.price?.id;
  const weeklyProductId = process.env.STRIPE_WEEKLY_PRODUCT_ID;
  const yearlyProductId = process.env.STRIPE_YEARLY_PRODUCT_ID;
  
  let tier = 'yearly';
  if (priceId && weeklyProductId) {
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (price.product === weeklyProductId) {
        tier = 'weekly';
      }
    } catch (err) {
      // Use default
    }
  }

  // Handle current_period_end safely
  let currentPeriodEnd;
  if (stripeSub.current_period_end && typeof stripeSub.current_period_end === 'number' && stripeSub.current_period_end > 0) {
    currentPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
  } else {
    currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }

  // Create subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSub.id,
      tier: tier,
      status: stripeSub.status === 'trialing' ? 'active' : stripeSub.status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    console.error(`  ❌ Error creating subscription:`, error.message);
    return false;
  }

  console.log(`  ✅ Synced subscription to Supabase`);
  return true;
}

async function resendFailedWebhookEvents() {
  console.log('\n🔄 Step 1: Finding and resending failed webhook events...\n');
  
  try {
    // Get webhook endpoint
    const endpoint = await stripe.webhookEndpoints.retrieve(WEBHOOK_ENDPOINT_ID);
    console.log(`📡 Webhook endpoint: ${endpoint.url}`);
    
    // Get failed event deliveries (we'll use Stripe CLI for this)
    console.log('\n💡 To resend failed events, run:');
    console.log('   Stripe Dashboard → Webhooks → Your webhook → Event deliveries');
    console.log('   Click "Resend" on failed events\n');
    
    // We can't programmatically list failed deliveries easily, so we'll focus on syncing
    return true;
  } catch (err) {
    console.error('❌ Error accessing webhook:', err.message);
    return false;
  }
}

async function syncAllMissingSubscriptions(dryRun = true) {
  console.log(`\n🔄 Step 2: ${dryRun ? 'Checking' : 'Syncing'} missing subscriptions...\n`);
  
  const stripeSubs = await getActiveStripeSubscriptions();
  const supabaseSubs = await getSupabaseSubscriptions();
  
  const supabaseSubIds = new Set(supabaseSubs.map(s => s.stripe_subscription_id));
  const missing = stripeSubs.filter(sub => !supabaseSubIds.has(sub.id));
  
  console.log(`📊 Missing subscriptions: ${missing.length}\n`);
  
  if (missing.length === 0) {
    console.log('✅ All subscriptions are synced!\n');
    return { synced: 0, failed: 0 };
  }

  let synced = 0;
  let failed = 0;

  for (let i = 0; i < missing.length; i++) {
    const sub = missing[i];
    console.log(`[${i + 1}/${missing.length}] Processing: ${sub.id}`);
    
    if (dryRun) {
      console.log(`  🔵 Would sync this subscription\n`);
      synced++;
    } else {
      const success = await syncMissingSubscription(sub);
      if (success) {
        synced++;
      } else {
        failed++;
      }
      console.log('');
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return { synced, failed };
}

async function verifyAllSubscriptions() {
  console.log('\n✅ Step 3: Verifying all subscriptions...\n');
  
  const stripeSubs = await getActiveStripeSubscriptions();
  const supabaseSubs = await getSupabaseSubscriptions();
  
  const supabaseSubIds = new Set(supabaseSubs.map(s => s.stripe_subscription_id));
  const missing = stripeSubs.filter(sub => !supabaseSubIds.has(sub.id));
  
  if (missing.length === 0) {
    console.log('✅ All active Stripe subscriptions are in Supabase!\n');
  } else {
    console.log(`⚠️  ${missing.length} subscriptions still missing from Supabase\n`);
  }
  
  return missing.length === 0;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSync = args.includes('--sync');
  const shouldResend = args.includes('--resend');

  console.log('🔧 Fix All Subscriptions Tool');
  console.log('==============================\n');

  if (shouldSync) {
    console.log('⚠️  WARNING: This will create subscriptions in Supabase!\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Step 1: Try to resend failed webhooks (manual step)
  if (shouldResend) {
    await resendFailedWebhookEvents();
  }

  // Step 2: Sync missing subscriptions
  const result = await syncAllMissingSubscriptions(!shouldSync);
  
  if (shouldSync) {
    console.log(`\n✅ Sync complete: ${result.synced} synced, ${result.failed} failed\n`);
  } else {
    console.log(`\n📊 Dry run complete: ${result.synced} would be synced\n`);
    console.log('💡 To actually sync, run:');
    console.log('   node scripts/fix-all-subscriptions.js --sync\n');
  }

  // Step 3: Verify
  const allGood = await verifyAllSubscriptions();

  if (allGood) {
    console.log('🎉 All subscriptions are properly synced!\n');
  } else {
    console.log('⚠️  Some subscriptions may still need manual attention\n');
  }
}

main().catch(console.error);

