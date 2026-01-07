/**
 * Fix Canceled Subscriptions
 * 
 * Updates Supabase subscriptions that are marked as active but are actually canceled in Stripe
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

async function fixCanceledSubscriptions(dryRun = true) {
  console.log(`\n🔧 ${dryRun ? 'DRY RUN - ' : ''}Fixing canceled subscriptions...\n`);
  
  // Get all Supabase subscriptions
  const { data: supabaseSubs } = await supabase
    .from('subscriptions')
    .select('*');
  
  console.log(`📊 Found ${supabaseSubs?.length || 0} subscriptions in Supabase\n`);
  
  if (!supabaseSubs || supabaseSubs.length === 0) {
    console.log('✅ No subscriptions to check\n');
    return;
  }
  
  // Get all Stripe subscriptions
  const stripeSubs = [];
  let hasMore = true;
  let startingAfter = null;
  
  while (hasMore) {
    const listParams = { limit: 100 };
    if (startingAfter) listParams.starting_after = startingAfter;
    
    const subs = await stripe.subscriptions.list(listParams);
    stripeSubs.push(...subs.data);
    
    if (subs.has_more) {
      startingAfter = subs.data[subs.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }
  
  const stripeSubIds = new Set(stripeSubs.map(s => s.id));
  const stripeSubMap = new Map(stripeSubs.map(s => [s.id, s]));
  
  let updated = 0;
  
  // Check each Supabase subscription
  for (const sub of supabaseSubs) {
    if (!sub.stripe_subscription_id) continue;
    
    const stripeSub = stripeSubMap.get(sub.stripe_subscription_id);
    
    if (!stripeSub) {
      // Subscription not found in Stripe - likely canceled
      console.log(`⚠️  Subscription ${sub.stripe_subscription_id} not found in Stripe`);
      console.log(`   User: ${sub.user_id}`);
      console.log(`   Current status in Supabase: ${sub.status}`);
      
      if (!dryRun) {
        const { error } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', sub.stripe_subscription_id);
        
        if (error) {
          console.log(`   ❌ Error updating: ${error.message}\n`);
        } else {
          console.log(`   ✅ Updated to canceled status\n`);
          updated++;
        }
      } else {
        console.log(`   🔵 Would update to canceled status\n`);
        updated++;
      }
    } else {
      // Subscription exists in Stripe - check if status matches
      const stripeStatus = stripeSub.status === 'active' ? 'active' : 
                          stripeSub.status === 'trialing' ? 'active' :
                          'canceled';
      
      if (sub.status !== stripeStatus && stripeSub.status !== 'active') {
        console.log(`⚠️  Status mismatch for ${sub.stripe_subscription_id}`);
        console.log(`   Supabase: ${sub.status}, Stripe: ${stripeSub.status}`);
        
        if (!dryRun) {
          const { error } = await supabase
            .from('subscriptions')
            .update({ 
              status: stripeStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', sub.stripe_subscription_id);
          
          if (error) {
            console.log(`   ❌ Error updating: ${error.message}\n`);
          } else {
            console.log(`   ✅ Updated status to ${stripeStatus}\n`);
            updated++;
          }
        } else {
          console.log(`   🔵 Would update status to ${stripeStatus}\n`);
          updated++;
        }
      }
    }
  }
  
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  if (dryRun) {
    console.log(`📊 DRY RUN COMPLETE`);
    console.log(`   Would update: ${updated} subscriptions\n`);
    console.log(`💡 To actually fix, run:`);
    console.log(`   node scripts/fix-canceled-subscriptions.js --fix\n`);
  } else {
    console.log(`✅ FIX COMPLETE`);
    console.log(`   Updated: ${updated} subscriptions\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  
  if (shouldFix) {
    console.log('⚠️  WARNING: This will update subscription statuses in Supabase!\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    await fixCanceledSubscriptions(false);
  } else {
    await fixCanceledSubscriptions(true);
  }
}

main().catch(console.error);

