#!/usr/bin/env node

/**
 * Script to get failed webhook event IDs and generate Stripe CLI commands to resend them
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/resend-failed-webhooks.js
 * 
 * Or set it in .env.local and run:
 *   node scripts/resend-failed-webhooks.js
 * 
 * This will output Stripe CLI commands that you can run to resend all failed events.
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { execSync } = require('child_process');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  console.error('   Set it in .env.local or pass as environment variable');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

// Webhook endpoint ID from the user's Stripe dashboard
const WEBHOOK_ENDPOINT_ID = 'we_1Sakb9Gjo8o5J3MxLHa4mWFE';

async function getFailedEventIds() {
  console.log('🔍 Getting recent webhook events that may have failed...\n');
  console.log('   Since the API doesn\'t directly list failed deliveries,');
  console.log('   we\'ll get recent events and you can resend them.\n');
  
  const eventIds = new Set();
  let hasMore = true;
  let startingAfter = null;
  
  // Get events from the last 60 days (to catch all failed events)
  const sixtyDaysAgo = Math.floor((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000);
  
  const eventTypes = [
    'checkout.session.completed',
    'invoice.payment_succeeded',
    'invoice.payment_failed',
    'customer.subscription.updated',
    'customer.subscription.deleted'
  ];
  
  try {
    console.log('   Fetching events from the last 60 days...\n');
    
    while (hasMore) {
      const params = {
        limit: 100,
        created: { gte: sixtyDaysAgo },
        types: eventTypes
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const events = await stripe.events.list(params);
      
      for (const event of events.data) {
        eventIds.add(event.id);
        const date = new Date(event.created * 1000).toISOString().split('T')[0];
        console.log(`  📋 ${event.type} - ${event.id} (${date})`);
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
  
  console.log(`\n   Found ${eventIds.size} events in the last 60 days`);
  console.log('   ⚠️  Note: This includes all events, not just failed ones.');
  console.log('   The webhook uses upsert, so resending is safe (won\'t create duplicates).\n');
  
  return Array.from(eventIds);
}

async function resendWithCLI(eventId) {
  try {
    console.log(`  🔄 Resending: ${eventId}...`);
    
    // Use Stripe CLI to resend to the specific webhook endpoint
    // Use --live flag since these are production events
    const command = `stripe events resend ${eventId} --webhook-endpoint ${WEBHOOK_ENDPOINT_ID} --live --api-key ${stripeSecretKey} --confirm`;
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    
    console.log(`    ✅ Successfully resent: ${eventId}`);
    return true;
  } catch (error) {
    // Check if it's a "not found" error (event might have already been processed)
    const errorOutput = error.stdout || error.stderr || error.message || '';
    if (errorOutput.includes('No such event') || errorOutput.includes('not found')) {
      console.log(`    ⚠️  Event not found (may have been deleted): ${eventId}`);
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
  console.log('🚀 Starting webhook resend process...\n');
  console.log(`📡 Webhook Endpoint: ${WEBHOOK_ENDPOINT_ID}\n`);
  
  try {
    // Get failed event IDs
    const failedEventIds = await getFailedEventIds();
    
    console.log(`\n📊 Found ${failedEventIds.length} unique failed events\n`);
    
    if (failedEventIds.length === 0) {
      console.log('✅ No failed events found!');
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
      console.log('🔄 Resending events using Stripe CLI...\n');
      
      let successCount = 0;
      let failCount = 0;
      
      for (const eventId of failedEventIds) {
        const success = await resendWithCLI(eventId);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      console.log(`\n✅ Resend complete: ${successCount} succeeded, ${failCount} failed`);
    } else {
      // Generate CLI commands
      console.log('📝 Stripe CLI commands to resend all events:\n');
      console.log('# Copy and run these commands:\n');
      failedEventIds.forEach(eventId => {
        console.log(`stripe events resend ${eventId} --webhook-endpoint ${WEBHOOK_ENDPOINT_ID} --live --api-key ${stripeSecretKey.substring(0, 20)}... --confirm`);
      });
      
      console.log(`\n✅ Generated ${failedEventIds.length} resend commands`);
      console.log('   Install Stripe CLI: brew install stripe/stripe-cli/stripe');
      console.log('   Then run the commands above, or use the Stripe Dashboard to resend.');
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

