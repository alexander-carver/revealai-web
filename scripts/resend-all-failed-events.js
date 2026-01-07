/**
 * Resend All Failed Webhook Events
 * 
 * Gets all failed webhook deliveries and attempts to resend them
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ ERROR: STRIPE_SECRET_KEY not found in .env.local');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const WEBHOOK_ENDPOINT_ID = 'we_1Sakb9Gjo8o5J3MxLHa4mWFE';

async function getAllFailedEvents() {
  console.log('🔍 Finding failed webhook events...\n');
  
  // Get recent checkout.session.completed events
  const checkoutEvents = await stripe.events.list({
    type: 'checkout.session.completed',
    limit: 100,
  });
  
  // Get recent subscription events
  const subUpdatedEvents = await stripe.events.list({
    type: 'customer.subscription.updated',
    limit: 100,
  });
  
  const subDeletedEvents = await stripe.events.list({
    type: 'customer.subscription.deleted',
    limit: 100,
  });
  
  const allEvents = [
    ...checkoutEvents.data,
    ...subUpdatedEvents.data,
    ...subDeletedEvents.data,
  ];
  
  console.log(`📊 Found ${allEvents.length} total events\n`);
  
  // Note: We can't easily check delivery status via API
  // But we can try to resend recent events that might have failed
  return allEvents.map(e => e.id);
}

async function resendEvent(eventId) {
  try {
    console.log(`  🔄 Resending: ${eventId}`);
    
    // Use Stripe CLI to resend
    const { execSync } = require('child_process');
    const command = `stripe events resend ${eventId} --webhook-endpoint ${WEBHOOK_ENDPOINT_ID} 2>&1`;
    
    try {
      const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      if (output.includes('success') || output.includes('triggered')) {
        console.log(`    ✅ Success`);
        return true;
      }
    } catch (err) {
      const errorMsg = err.stdout || err.stderr || err.message || '';
      if (errorMsg.includes('already') || errorMsg.includes('No such')) {
        console.log(`    ⚠️  Already processed or not found`);
        return true; // Not an error
      }
      console.log(`    ❌ Failed: ${errorMsg.substring(0, 100)}`);
      return false;
    }
  } catch (err) {
    console.log(`    ❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldResend = args.includes('--resend');
  
  console.log('🔧 Resend Failed Webhook Events');
  console.log('================================\n');
  
  const eventIds = await getAllFailedEvents();
  
  if (!shouldResend) {
    console.log(`\n📋 Found ${eventIds.length} events that could be resent\n`);
    console.log('💡 To resend all events, run:');
    console.log('   node scripts/resend-all-failed-events.js --resend\n');
    console.log('⚠️  Note: This will resend ALL recent events. Only do this if needed.\n');
    console.log('💡 Better approach: Use Stripe Dashboard to manually resend specific failed events');
    console.log('   1. Go to: Stripe Dashboard → Webhooks → Your webhook → Event deliveries');
    console.log('   2. Filter by "Failed" status');
    console.log('   3. Click "Resend" on each failed event\n');
    return;
  }
  
  console.log(`\n⚠️  WARNING: This will resend ${eventIds.length} events!\n`);
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('🔄 Resending events...\n');
  
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < eventIds.length; i++) {
    const eventId = eventIds[i];
    console.log(`[${i + 1}/${eventIds.length}]`);
    const result = await resendEvent(eventId);
    if (result) {
      success++;
    } else {
      failed++;
    }
    
    // Delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n✅ Complete: ${success} succeeded, ${failed} failed\n`);
  console.log('📊 Check results in Stripe Dashboard → Webhooks → Event deliveries\n');
}

main().catch(console.error);

