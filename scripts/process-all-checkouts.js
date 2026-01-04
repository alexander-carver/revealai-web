#!/usr/bin/env node

/**
 * Script to process all successful checkout sessions and ensure accounts/subscriptions are created
 * This catches people who paid but the webhook failed
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/process-all-checkouts.js
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const fetch = require('node-fetch');

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment variables');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);

async function getAllSuccessfulCheckouts() {
  console.log('🔍 Finding all successful checkout sessions from the last 60 days...\n');
  
  const checkouts = [];
  let hasMore = true;
  let startingAfter = null;
  const sixtyDaysAgo = Math.floor((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000);
  
  try {
    while (hasMore) {
      const params = {
        limit: 100,
        created: { gte: sixtyDaysAgo },
        status: 'complete',
        payment_status: 'paid'
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const sessions = await stripe.checkout.sessions.list(params);
      
      for (const session of sessions.data) {
        checkouts.push({
          id: session.id,
          customerId: session.customer,
          customerEmail: session.customer_email,
          subscriptionId: session.subscription,
          amount: session.amount_total,
          currency: session.currency,
          created: session.created,
          metadata: session.metadata
        });
        
        const date = new Date(session.created * 1000).toISOString().split('T')[0];
        const amount = (session.amount_total / 100).toFixed(2);
        console.log(`  📋 Found checkout: ${session.id} - $${amount} ${session.currency?.toUpperCase()} - ${session.customer_email || 'no email'} (${date})`);
      }
      
      hasMore = sessions.has_more;
      if (hasMore && sessions.data.length > 0) {
        startingAfter = sessions.data[sessions.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching checkouts:', error.message);
    throw error;
  }
  
  return checkouts;
}

async function processCheckout(checkout) {
  try {
    // Use the verify-session API endpoint to create account and subscription
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://revealai-peoplesearch.com';
    const response = await fetch(`${baseUrl}/api/stripe/verify-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: checkout.id,
        email: checkout.customerEmail,
      }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`    ✅ Processed: ${checkout.id} - Account created for ${result.email || checkout.customerEmail}`);
      return true;
    } else {
      console.log(`    ⚠️  Failed: ${checkout.id} - ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`    ❌ Error processing ${checkout.id}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Processing all successful checkouts...\n');
  
  try {
    const checkouts = await getAllSuccessfulCheckouts();
    console.log(`\n📊 Found ${checkouts.length} successful checkout sessions\n`);
    
    if (checkouts.length === 0) {
      console.log('✅ No checkouts found!');
      return;
    }
    
    console.log('🔄 Processing checkouts through verify-session API...\n');
    console.log('⚠️  Note: This requires the app to be deployed (or running locally)');
    console.log('   Using base URL:', process.env.NEXT_PUBLIC_APP_URL || 'https://revealai-peoplesearch.com\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < checkouts.length; i++) {
      const checkout = checkouts[i];
      console.log(`  [${i + 1}/${checkouts.length}] Processing: ${checkout.id}...`);
      
      const success = await processCheckout(checkout);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
      
      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n✅ Processing complete: ${successCount} succeeded, ${failCount} failed`);
    console.log('\n📝 Next steps:');
    console.log('   1. Check Supabase subscriptions table for new entries');
    console.log('   2. Check Supabase auth.users for new accounts');
    console.log('   3. All future payments will process automatically!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

