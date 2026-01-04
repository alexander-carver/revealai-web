#!/usr/bin/env node

/**
 * Script to reactivate all successful checkouts by resending their events
 * This catches people who paid but the webhook failed to process
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/reactivate-all-checkouts.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { execSync } = require('child_process');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
const WEBHOOK_ENDPOINT_ID = 'we_1Sakb9Gjo8o5J3MxLHa4mWFE';

async function getAllSuccessfulCheckoutEvents() {
  console.log('🔍 Finding all checkout.session.completed events from the last 60 days...\n');
  
  const eventIds = new Set();
  let hasMore = true;
  let startingAfter = null;
  const sixtyDaysAgo = Math.floor((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000);
  
  try {
    while (hasMore) {
      const params = {
        limit: 100,
        type: 'checkout.session.completed',
        created: { gte: sixtyDaysAgo }
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const events = await stripe.events.list(params);
      
      for (const event of events.data) {
        eventIds.add(event.id);
        const session = event.data.object;
        const date = new Date(event.created * 1000).toISOString().split('T')[0];
        const email = session.customer_email || session.customer_details?.email || 'no email';
        console.log(`  📋 Found checkout: ${event.id} - ${email} (${date})`);
      }
      
      hasMore = events.has_more;
      if (hasMore && events.data.length > 0) {
        startingAfter = events.data[events.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching events:', error.message);
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
    const errorOutput = error.stdout || error.stderr || error.message || '';
    if (errorOutput.includes('No such event') || errorOutput.includes('not found')) {
      return true; // Not a critical error
    }
    console.error(`    ❌ Failed to resend ${eventId}`);
    if (errorOutput) {
      console.error(`       Error: ${errorOutput.substring(0, 200)}`);
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Reactivating all successful checkouts...\n');
  
  try {
    const eventIds = await getAllSuccessfulCheckoutEvents();
    console.log(`\n📊 Found ${eventIds.length} checkout.session.completed events\n`);
    
    if (eventIds.length === 0) {
      console.log('✅ No checkout events found!');
      return;
    }
    
    // Check if Stripe CLI is available
    let useCLI = false;
    try {
      execSync('which stripe', { stdio: 'ignore' });
      useCLI = true;
    } catch {
      console.log('⚠️  Stripe CLI not found. Install with: brew install stripe/stripe-cli/stripe\n');
    }
    
    if (useCLI) {
      console.log('🔄 Resending checkout events using Stripe CLI...\n');
      
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
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`\n✅ Processing complete: ${successCount} succeeded, ${failCount} failed`);
      console.log('\n📝 Next steps:');
      console.log('   1. Wait a few minutes for webhook to process');
      console.log('   2. Check Supabase subscriptions table for new entries');
      console.log('   3. Check Supabase auth.users for new accounts');
      console.log('   4. All future payments will process automatically!');
      
    } else {
      console.log('📝 Stripe CLI commands to resend all events:\n');
      eventIds.forEach(eventId => {
        console.log(`stripe events resend ${eventId} --webhook-endpoint ${WEBHOOK_ENDPOINT_ID} --live --api-key ${stripeSecretKey.substring(0, 20)}... --confirm`);
      });
      console.log(`\n✅ Generated ${eventIds.length} resend commands`);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

