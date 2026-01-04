#!/usr/bin/env node

/**
 * Script to reactivate subscriptions for customers who have active Stripe subscriptions
 * but don't have subscriptions in the database
 * 
 * This finds customers who should have access but don't, and resends their events
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/reactivate-subscriptions.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { execSync } = require('child_process');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('   Required: STRIPE_SECRET_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const supabase = createClient(supabaseUrl, supabaseServiceKey);
const WEBHOOK_ENDPOINT_ID = 'we_1Sakb9Gjo8o5J3MxLHa4mWFE';

async function getActiveStripeSubscriptions() {
  console.log('🔍 Finding all active Stripe subscriptions...\n');
  
  const subscriptions = [];
  let hasMore = true;
  let startingAfter = null;
  
  try {
    while (hasMore) {
      const params = {
        limit: 100,
        status: 'active'
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const stripeSubs = await stripe.subscriptions.list(params);
      
      for (const sub of stripeSubs.data) {
        subscriptions.push({
          id: sub.id,
          customerId: sub.customer,
          status: sub.status,
          currentPeriodEnd: sub.current_period_end,
          items: sub.items.data,
          metadata: sub.metadata
        });
        console.log(`  📋 Found active subscription: ${sub.id} (customer: ${sub.customer})`);
      }
      
      hasMore = stripeSubs.has_more;
      if (hasMore && stripeSubs.data.length > 0) {
        startingAfter = stripeSubs.data[stripeSubs.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching Stripe subscriptions:', error.message);
    throw error;
  }
  
  return subscriptions;
}

async function checkDatabaseSubscriptions(stripeSubscriptions) {
  console.log('\n🔍 Checking which subscriptions exist in database...\n');
  
  const missingSubscriptions = [];
  
  for (const stripeSub of stripeSubscriptions) {
    // Check if subscription exists in database
    const { data, error } = await supabase
      .from('subscriptions')
      .select('id, user_id, stripe_subscription_id, status')
      .eq('stripe_subscription_id', stripeSub.id)
      .single();
    
    if (error && error.code === 'PGRST116') {
      // No subscription found
      missingSubscriptions.push(stripeSub);
      console.log(`  ⚠️  Missing: ${stripeSub.id} (customer: ${stripeSub.customerId})`);
    } else if (data) {
      console.log(`  ✅ Exists: ${stripeSub.id}`);
    }
  }
  
  return missingSubscriptions;
}

async function findEventsForSubscriptions(missingSubscriptions) {
  console.log('\n🔍 Finding events for missing subscriptions...\n');
  
  const eventIds = new Set();
  const sixtyDaysAgo = Math.floor((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000);
  
  // Get customer IDs
  const customerIds = missingSubscriptions.map(sub => sub.customerId);
  
  try {
    // Find checkout.session.completed events
    let hasMore = true;
    let startingAfter = null;
    
    while (hasMore) {
      const params = {
        limit: 100,
        created: { gte: sixtyDaysAgo },
        types: ['checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated']
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const events = await stripe.events.list(params);
      
      for (const event of events.data) {
        let customerId = null;
        
        if (event.type === 'checkout.session.completed') {
          customerId = event.data.object.customer;
        } else if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
          customerId = event.data.object.customer;
        }
        
        if (customerId && customerIds.includes(customerId)) {
          eventIds.add(event.id);
          console.log(`  ✅ Found ${event.type} for customer ${customerId}: ${event.id}`);
        }
      }
      
      hasMore = events.has_more;
      if (hasMore && events.data.length > 0) {
        startingAfter = events.data[events.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error('❌ Error finding events:', error.message);
    throw error;
  }
  
  return Array.from(eventIds);
}

async function resendWithCLI(eventId) {
  try {
    const command = `stripe events resend ${eventId} --webhook-endpoint ${WEBHOOK_ENDPOINT_ID} --live --api-key ${stripeSecretKey} --confirm`;
    execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  console.log('🚀 Reactivating missing subscriptions...\n');
  
  try {
    // Step 1: Get all active Stripe subscriptions
    const stripeSubscriptions = await getActiveStripeSubscriptions();
    console.log(`\n📊 Found ${stripeSubscriptions.length} active Stripe subscriptions\n`);
    
    if (stripeSubscriptions.length === 0) {
      console.log('✅ No active subscriptions found');
      return;
    }
    
    // Step 2: Check which ones are missing from database
    const missingSubscriptions = await checkDatabaseSubscriptions(stripeSubscriptions);
    console.log(`\n📊 Found ${missingSubscriptions.length} subscriptions missing from database\n`);
    
    if (missingSubscriptions.length === 0) {
      console.log('✅ All subscriptions are synced!');
      return;
    }
    
    // Step 3: Find events for missing subscriptions
    const eventIds = await findEventsForSubscriptions(missingSubscriptions);
    console.log(`\n📋 Found ${eventIds.length} events to resend\n`);
    
    if (eventIds.length === 0) {
      console.log('⚠️  No events found to resend. These subscriptions may need manual creation.');
      return;
    }
    
    // Step 4: Resend events
    console.log('🔄 Resending events...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < eventIds.length; i++) {
      const eventId = eventIds[i];
      console.log(`  [${i + 1}/${eventIds.length}] Resending: ${eventId}...`);
      
      const success = await resendWithCLI(eventId);
      if (success) {
        successCount++;
        console.log(`    ✅ Success`);
      } else {
        failCount++;
        console.log(`    ❌ Failed`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Processing complete: ${successCount} succeeded, ${failCount} failed`);
    console.log('\n📝 Next steps:');
    console.log('   1. Wait a few minutes for webhook to process');
    console.log('   2. Check Supabase subscriptions table again');
    console.log('   3. If still missing, may need manual creation');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

