/**
 * Sync Missing Subscriptions from Stripe to Supabase
 * 
 * Creates subscriptions in Supabase that exist in Stripe but not in the database
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findOrCreateUser(email, customerId) {
  // Try to find existing user by email (need to check all pages)
  let page = 1;
  let user = null;
  
  while (!user) {
    const { data: users, error } = await supabase.auth.admin.listUsers({ page, perPage: 100 });
    
    if (error || !users.users.length) break;
    
    user = users.users.find(u => u.email?.toLowerCase() === email?.toLowerCase());
    if (user) break;
    
    page++;
  }

  if (user) {
    console.log(`  ✅ Found existing user: ${user.id}`);
    return user.id;
  }

  // Create new user with device-based email pattern if no regular email
  const userEmail = email || `device_${customerId}@revealai.device`;
  const password = customerId; // Use customer ID as password for device users

  console.log(`  📝 Creating new user for: ${userEmail}`);
  
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: userEmail,
    password: password,
    email_confirm: true, // Auto-confirm
    user_metadata: {
      stripe_customer_id: customerId,
      is_device_user: !email,
    },
  });

  if (error) {
    console.error(`  ❌ Error creating user:`, error.message);
    // If user exists, try to find them again
    if (error.code === 'email_exists') {
      const { data: users } = await supabase.auth.admin.listUsers();
      user = users.users.find(u => u.email?.toLowerCase() === userEmail?.toLowerCase());
      if (user) {
        console.log(`  ✅ Found existing user on retry: ${user.id}`);
        return user.id;
      }
    }
    return null;
  }

  console.log(`  ✅ Created user: ${newUser.user.id}`);
  return newUser.user.id;
}

async function syncMissingSubscriptions(dryRun = true) {
  console.log(`\n🔄 ${dryRun ? 'DRY RUN - ' : ''}Syncing missing subscriptions from Stripe to Supabase...\n`);

  // Get all active/trialing subscriptions from Stripe
  const stripeSubscriptions = await stripe.subscriptions.list({
    limit: 100,
  });

  const activeOrTrialing = stripeSubscriptions.data.filter(sub => 
    ['active', 'trialing', 'past_due'].includes(sub.status)
  );

  console.log(`📊 Found ${activeOrTrialing.length} active/trialing subscriptions in Stripe\n`);

  // Get all subscriptions from Supabase
  const { data: supabaseSubscriptions } = await supabase
    .from('subscriptions')
    .select('*');

  console.log(`📊 Found ${supabaseSubscriptions?.length || 0} subscriptions in Supabase\n`);

  let syncedCount = 0;
  let skippedCount = 0;

  for (const stripeSub of activeOrTrialing) {
    // Check if already in Supabase
    const inSupabase = supabaseSubscriptions?.find(s => 
      s.stripe_subscription_id === stripeSub.id
    );

    if (inSupabase) {
      skippedCount++;
      continue;
    }

    // Missing from Supabase - need to create
    const customer = typeof stripeSub.customer === 'string'
      ? await stripe.customers.retrieve(stripeSub.customer)
      : stripeSub.customer;
    
    const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id;
    const email = customer.email;

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📧 Processing: ${email || 'no-email'}`);
    console.log(`   Subscription: ${stripeSub.id}`);
    console.log(`   Status: ${stripeSub.status}`);

    if (dryRun) {
      console.log(`   🔵 Would create subscription in Supabase`);
      syncedCount++;
      console.log('');
      continue;
    }

    // Find or create user
    const userId = await findOrCreateUser(email, customerId);
    if (!userId) {
      console.log(`   ❌ Failed to get/create user - skipping\n`);
      continue;
    }

    // Determine tier and status
    const priceId = stripeSub.items.data[0]?.price?.id;
    let tier = 'weekly'; // Default to weekly
    
    if (priceId?.includes('yearly') || priceId?.includes('year')) {
      tier = 'yearly';
    } else if (priceId?.includes('weekly') || priceId?.includes('week')) {
      tier = 'weekly';
    }

    // Map Stripe status to Supabase status (which only allows: active, canceled, past_due, unpaid)
    let status = stripeSub.status;
    if (status === 'trialing') {
      status = 'active'; // Map trialing to active
    }

    // Create subscription in Supabase (only fields that exist in schema)
    const subscriptionData = {
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSub.id,
      status: status,
      tier: tier,
    };

    // Add current_period_end if available
    if (stripeSub.current_period_end) {
      subscriptionData.current_period_end = new Date(stripeSub.current_period_end * 1000).toISOString();
    } else if (stripeSub.trial_end) {
      // Use trial end as period end for trialing subscriptions
      subscriptionData.current_period_end = new Date(stripeSub.trial_end * 1000).toISOString();
    }

    const { data: newSub, error: subError } = await supabase
      .from('subscriptions')
      .insert(subscriptionData)
      .select()
      .single();

    if (subError) {
      console.log(`   ❌ Error creating subscription:`, subError);
    } else {
      console.log(`   ✅ Created subscription in Supabase`);
      syncedCount++;
    }
    console.log('');
  }

  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  if (dryRun) {
    console.log(`📊 DRY RUN COMPLETE`);
    console.log(`   Would sync: ${syncedCount} subscriptions`);
    console.log(`   Already synced: ${skippedCount} subscriptions\n`);
    console.log(`💡 To actually sync, run:`);
    console.log(`   node scripts/sync-missing-subscriptions.js --sync\n`);
  } else {
    console.log(`✅ SYNC COMPLETE`);
    console.log(`   Synced: ${syncedCount} subscriptions`);
    console.log(`   Already existed: ${skippedCount} subscriptions\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSync = args.includes('--sync');

  if (shouldSync) {
    console.log('⚠️  WARNING: This will create subscriptions in Supabase!\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await syncMissingSubscriptions(false);
  } else {
    await syncMissingSubscriptions(true);
  }
}

main().catch(console.error);

