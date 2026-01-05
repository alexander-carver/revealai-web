/**
 * Fix Duplicate Accounts Script
 * 
 * Finds users with multiple active subscriptions and helps clean them up
 * 
 * Usage:
 *   node scripts/fix-duplicate-accounts.js [--cancel-duplicates]
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Validate environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY not found in .env.local');
  console.error('\nMake sure .env.local contains:');
  console.error('STRIPE_SECRET_KEY=sk_live_...');
  console.error('\nOr run with:');
  console.error('STRIPE_SECRET_KEY=sk_live_... node scripts/fix-duplicate-accounts.js\n');
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Supabase credentials not found in .env.local');
  console.error('\nMake sure .env.local contains:');
  console.error('NEXT_PUBLIC_SUPABASE_URL=https://...');
  console.error('SUPABASE_SERVICE_ROLE_KEY=eyJ...');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findDuplicateAccounts() {
  console.log('🔍 Finding duplicate accounts...\n');

  // Get all subscriptions (all statuses including trialing, active, past_due, etc.)
  const allSubscriptions = await stripe.subscriptions.list({
    limit: 100,
  });

  // Filter to relevant statuses (active, trialing, past_due)
  const subscriptions = {
    data: allSubscriptions.data.filter(sub => 
      ['active', 'trialing', 'past_due'].includes(sub.status)
    )
  };

  console.log(`📊 Total subscriptions (active/trialing/past_due): ${subscriptions.data.length}`);
  console.log(`📊 Total all-time subscriptions: ${allSubscriptions.data.length}\n`);

  // Group by customer email
  const customerMapByEmail = new Map();
  // Also group by customer ID (in case same person has different emails)
  const customerMapById = new Map();
  // Group by device ID (new device-based system)
  const deviceMap = new Map();

  for (const sub of subscriptions.data) {
    const customer = typeof sub.customer === 'string' 
      ? await stripe.customers.retrieve(sub.customer)
      : sub.customer;
    const email = customer.email;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const deviceId = sub.metadata?.deviceId || null;

    const subInfo = {
      subscription_id: sub.id,
      customer_id: customerId,
      email: email || 'no-email',
      status: sub.status,
      created: sub.created ? new Date(sub.created * 1000).toISOString() : 'unknown',
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      plan: sub.items.data[0]?.price?.id || 'unknown',
      metadata: sub.metadata || {},
      deviceId: deviceId,
    };

    // Group by email
    if (email) {
      if (!customerMapByEmail.has(email)) {
        customerMapByEmail.set(email, []);
      }
      customerMapByEmail.get(email).push(subInfo);
    }

    // Group by customer ID
    if (!customerMapById.has(customerId)) {
      customerMapById.set(customerId, []);
    }
    customerMapById.get(customerId).push(subInfo);

    // Group by device ID
    if (deviceId) {
      if (!deviceMap.has(deviceId)) {
        deviceMap.set(deviceId, []);
      }
      deviceMap.get(deviceId).push(subInfo);
    }
  }

  // Find duplicates by email
  const duplicatesByEmail = [];
  for (const [email, subs] of customerMapByEmail.entries()) {
    if (subs.length > 1) {
      duplicatesByEmail.push({ identifier: email, email, subscriptions: subs, type: 'email' });
    }
  }

  // Find duplicates by customer ID
  const duplicatesById = [];
  for (const [customerId, subs] of customerMapById.entries()) {
    if (subs.length > 1) {
      duplicatesById.push({ 
        identifier: customerId, 
        email: subs[0].email, 
        subscriptions: subs, 
        type: 'customer_id' 
      });
    }
  }

  // Find duplicates by device ID
  const duplicatesByDevice = [];
  for (const [deviceId, subs] of deviceMap.entries()) {
    if (subs.length > 1) {
      duplicatesByDevice.push({
        identifier: deviceId,
        email: subs[0].email,
        subscriptions: subs,
        type: 'device_id'
      });
    }
  }

  // Combine all types (deduplicate - same subscription might appear in multiple groups)
  const seenSubIds = new Set();
  const allDuplicates = [];
  
  for (const dup of [...duplicatesByEmail, ...duplicatesById, ...duplicatesByDevice]) {
    const key = `${dup.type}-${dup.identifier}`;
    if (!seenSubIds.has(key)) {
      seenSubIds.add(key);
      allDuplicates.push(dup);
    }
  }

  return allDuplicates;
}

async function findSupabaseUser(email) {
  const { data: users } = await supabase.auth.admin.listUsers();
  return users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
}

async function getActiveSupabaseSubscription(userId) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  return data;
}

async function displayDuplicates() {
  const duplicates = await findDuplicateAccounts();

  if (duplicates.length === 0) {
    console.log('✅ No duplicate accounts found!\n');
    return [];
  }

  console.log(`\n🔴 Found ${duplicates.length} users/customers with multiple active subscriptions:\n`);

  for (const dup of duplicates) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    if (dup.type === 'email') {
      console.log(`📧 Email: ${dup.email}`);
    } else if (dup.type === 'customer_id') {
      console.log(`🆔 Customer ID: ${dup.identifier}`);
      console.log(`📧 Email: ${dup.email || 'no-email'}`);
    } else if (dup.type === 'device_id') {
      console.log(`📱 Device ID: ${dup.identifier}`);
      console.log(`📧 Email: ${dup.email || 'no-email'}`);
    }
    console.log(`📊 Active Subscriptions: ${dup.subscriptions.length}\n`);

    // Find Supabase user by email (if available)
    const emailToCheck = dup.email && dup.email !== 'no-email' ? dup.email : dup.subscriptions[0]?.email;
    const user = emailToCheck ? await findSupabaseUser(emailToCheck) : null;
    
    if (user) {
      console.log(`👤 Supabase User ID: ${user.id}`);
      
      // Get active subscription in Supabase
      const activeSub = await getActiveSupabaseSubscription(user.id);
      if (activeSub) {
        console.log(`✅ Active in Supabase: ${activeSub.stripe_subscription_id}`);
      }
    } else {
      console.log(`⚠️  No Supabase user found for this email`);
    }

    console.log('\n📋 Stripe Subscriptions:');
    
    // Get active subscription once to check against all subs
    const activeSub = user ? await getActiveSupabaseSubscription(user.id) : null;
    
    for (let idx = 0; idx < dup.subscriptions.length; idx++) {
      const sub = dup.subscriptions[idx];
      console.log(`\n  ${idx + 1}. Subscription: ${sub.subscription_id}`);
      console.log(`     Customer: ${sub.customer_id}`);
      if (sub.email && sub.email !== dup.email) {
        console.log(`     Email: ${sub.email}`);
      }
      console.log(`     Created: ${sub.created}`);
      console.log(`     Status: ${sub.status}`);
      if (sub.trial_end) {
        console.log(`     Trial Ends: ${sub.trial_end}`);
      }
      console.log(`     Period Ends: ${sub.current_period_end}`);
      if (sub.metadata?.deviceId) {
        console.log(`     Device ID: ${sub.metadata.deviceId}`);
      }
      if (sub.metadata?.userId) {
        console.log(`     User ID (metadata): ${sub.metadata.userId}`);
      }
      
      // Mark which one is linked to Supabase
      if (activeSub && activeSub.stripe_subscription_id === sub.subscription_id) {
        console.log(`     🔗 LINKED TO ACTIVE USER IN SUPABASE`);
      }
    }

    console.log('\n');
  }

  return duplicates;
}

async function cancelDuplicateSubscriptions(dryRun = true) {
  const duplicates = await findDuplicateAccounts();

  if (duplicates.length === 0) {
    console.log('✅ No duplicate accounts to fix!\n');
    return;
  }

  console.log(`\n🔧 ${dryRun ? 'DRY RUN - ' : ''}Processing ${duplicates.length} users with duplicates...\n`);

  let canceledCount = 0;

  for (const dup of duplicates) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    if (dup.type === 'email') {
      console.log(`📧 Processing: ${dup.email}`);
    } else if (dup.type === 'customer_id') {
      console.log(`🆔 Processing Customer ID: ${dup.identifier}`);
      console.log(`📧 Email: ${dup.email || 'no-email'}`);
    } else if (dup.type === 'device_id') {
      console.log(`📱 Processing Device ID: ${dup.identifier}`);
      console.log(`📧 Email: ${dup.email || 'no-email'}`);
    }

    // Find Supabase user by email (if available)
    const emailToCheck = dup.email && dup.email !== 'no-email' ? dup.email : dup.subscriptions[0]?.email;
    const user = emailToCheck ? await findSupabaseUser(emailToCheck) : null;
    const activeSub = user ? await getActiveSupabaseSubscription(user.id) : null;

    if (!activeSub) {
      console.log(`⚠️  No active Supabase subscription found. Keeping oldest Stripe subscription.`);
      
      // Keep the oldest subscription, cancel the rest
      const sorted = dup.subscriptions.sort((a, b) => 
        new Date(a.created).getTime() - new Date(b.created).getTime()
      );
      
      const toKeep = sorted[0];
      const toCancel = sorted.slice(1);

      console.log(`✅ Keeping: ${toKeep.subscription_id} (oldest)`);

      for (const sub of toCancel) {
        if (dryRun) {
          console.log(`🔴 Would cancel: ${sub.subscription_id}`);
        } else {
          console.log(`🔴 Canceling: ${sub.subscription_id}`);
          await stripe.subscriptions.cancel(sub.subscription_id);
          canceledCount++;
        }
      }
      continue;
    }

    // Keep the subscription linked to Supabase, cancel others
    console.log(`✅ Keeping: ${activeSub.stripe_subscription_id} (linked to Supabase user ${user.id})`);

    for (const sub of dup.subscriptions) {
      if (sub.subscription_id !== activeSub.stripe_subscription_id) {
        if (dryRun) {
          console.log(`🔴 Would cancel: ${sub.subscription_id}`);
        } else {
          console.log(`🔴 Canceling: ${sub.subscription_id}`);
          await stripe.subscriptions.cancel(sub.subscription_id);
          canceledCount++;
        }
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  if (dryRun) {
    console.log(`\n📊 DRY RUN COMPLETE`);
    console.log(`   Would have canceled ${canceledCount} duplicate subscriptions\n`);
    console.log(`💡 To actually cancel duplicates, run:`);
    console.log(`   node scripts/fix-duplicate-accounts.js --cancel\n`);
  } else {
    console.log(`\n✅ COMPLETE`);
    console.log(`   Canceled ${canceledCount} duplicate subscriptions\n`);
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const shouldCancel = args.includes('--cancel') || args.includes('--cancel-duplicates');

  console.log('\n🔧 Duplicate Account Fixer\n');

  if (shouldCancel) {
    console.log('⚠️  WARNING: This will cancel duplicate subscriptions!\n');
    await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second pause
    await cancelDuplicateSubscriptions(false);
  } else {
    await displayDuplicates();
    console.log('\n💡 To fix duplicates automatically, run:');
    console.log('   node scripts/fix-duplicate-accounts.js --cancel\n');
  }
}

main().catch(console.error);

