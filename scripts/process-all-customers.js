#!/usr/bin/env node

/**
 * Script to process ALL customers through the webhook
 * Finds all customers who paid and resends their checkout/invoice events
 * 
 * Usage:
 *   STRIPE_SECRET_KEY=sk_live_... node scripts/process-all-customers.js
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

async function getAllCustomersWithPayments() {
  console.log('🔍 Finding all customers who have made payments...\n');
  
  const customers = [];
  let hasMore = true;
  let startingAfter = null;
  
  try {
    while (hasMore) {
      const params = {
        limit: 100
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const customerList = await stripe.customers.list(params);
      
      for (const customer of customerList.data) {
        // Get customer's subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10
        });
        
        // Get customer's payment intents/invoices
        const invoices = await stripe.invoices.list({
          customer: customer.id,
          limit: 10
        });
        
        // Only include if they have subscriptions or paid invoices
        if (subscriptions.data.length > 0 || invoices.data.some(inv => inv.status === 'paid')) {
          customers.push({
            id: customer.id,
            email: customer.email,
            subscriptions: subscriptions.data,
            invoices: invoices.data.filter(inv => inv.status === 'paid')
          });
          console.log(`  📋 Found: ${customer.email || customer.id} (${subscriptions.data.length} subscriptions, ${invoices.data.filter(inv => inv.status === 'paid').length} paid invoices)`);
        }
      }
      
      hasMore = customerList.has_more;
      if (hasMore && customerList.data.length > 0) {
        startingAfter = customerList.data[customerList.data.length - 1].id;
      } else {
        hasMore = false;
      }
    }
  } catch (error) {
    console.error('❌ Error fetching customers:', error.message);
    throw error;
  }
  
  return customers;
}

async function findCheckoutEventsForCustomers(customers) {
  console.log('\n🔍 Finding checkout.session.completed events for these customers...\n');
  
  const eventIds = new Set();
  const sixtyDaysAgo = Math.floor((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000);
  
  try {
    // Get all checkout.session.completed events
    let hasMore = true;
    let startingAfter = null;
    
    while (hasMore) {
      const params = {
        limit: 100,
        created: { gte: sixtyDaysAgo },
        types: ['checkout.session.completed']
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const events = await stripe.events.list(params);
      
      for (const event of events.data) {
        const session = event.data.object;
        const customerId = session.customer;
        
        // Check if this customer is in our list
        if (customers.some(c => c.id === customerId)) {
          eventIds.add(event.id);
          const customer = customers.find(c => c.id === customerId);
          console.log(`  ✅ Found checkout for: ${customer?.email || customerId} (${event.id})`);
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
    console.error('❌ Error finding checkout events:', error.message);
    throw error;
  }
  
  return Array.from(eventIds);
}

async function findInvoiceEventsForCustomers(customers) {
  console.log('\n🔍 Finding invoice.payment_succeeded events for these customers...\n');
  
  const eventIds = new Set();
  const sixtyDaysAgo = Math.floor((Date.now() - 60 * 24 * 60 * 60 * 1000) / 1000);
  
  try {
    let hasMore = true;
    let startingAfter = null;
    
    while (hasMore) {
      const params = {
        limit: 100,
        created: { gte: sixtyDaysAgo },
        types: ['invoice.payment_succeeded']
      };
      
      if (startingAfter) {
        params.starting_after = startingAfter;
      }
      
      const events = await stripe.events.list(params);
      
      for (const event of events.data) {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        
        // Check if this customer is in our list
        if (customers.some(c => c.id === customerId)) {
          eventIds.add(event.id);
          const customer = customers.find(c => c.id === customerId);
          console.log(`  ✅ Found invoice payment for: ${customer?.email || customerId} (${event.id})`);
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
    console.error('❌ Error finding invoice events:', error.message);
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
      return true; // Not critical
    }
    return false;
  }
}

async function main() {
  console.log('🚀 Processing ALL customers through webhook...\n');
  
  try {
    // Step 1: Get all customers who have paid
    const customers = await getAllCustomersWithPayments();
    console.log(`\n📊 Found ${customers.length} customers with payments/subscriptions\n`);
    
    if (customers.length === 0) {
      console.log('✅ No customers found with payments');
      return;
    }
    
    // Step 2: Find their checkout events
    const checkoutEventIds = await findCheckoutEventsForCustomers(customers);
    console.log(`\n📋 Found ${checkoutEventIds.length} checkout.session.completed events\n`);
    
    // Step 3: Find their invoice events
    const invoiceEventIds = await findInvoiceEventsForCustomers(customers);
    console.log(`\n📋 Found ${invoiceEventIds.length} invoice.payment_succeeded events\n`);
    
    // Combine all event IDs
    const allEventIds = [...new Set([...checkoutEventIds, ...invoiceEventIds])];
    console.log(`\n🔄 Total unique events to resend: ${allEventIds.length}\n`);
    
    if (allEventIds.length === 0) {
      console.log('⚠️  No events found to resend');
      return;
    }
    
    // Step 4: Resend all events
    console.log('🔄 Resending events using Stripe CLI...\n');
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < allEventIds.length; i++) {
      const eventId = allEventIds[i];
      console.log(`  [${i + 1}/${allEventIds.length}] Resending: ${eventId}...`);
      
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
    console.log('   1. Check Supabase subscriptions table for new entries');
    console.log('   2. Verify customers now have active subscriptions');
    console.log('   3. Future payments will process automatically!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

