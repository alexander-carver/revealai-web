/**
 * Email All Active Subscribers via Stripe
 * 
 * Sends professional subscription status emails with customer portal links via Stripe invoices
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const PORTAL_RETURN_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://revealai.com/settings';

async function createCustomerPortalLink(customerId) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: PORTAL_RETURN_URL,
    });
    return session.url;
  } catch (error) {
    console.error(`Error creating portal link for ${customerId}:`, error.message);
    return null;
  }
}

async function emailAllSubscribersViaStripe(dryRun = true) {
  console.log('📧 Starting subscriber email process via Stripe...\n');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No invoices will be created\n');
  }

  // Fetch all active subscriptions
  let allSubscriptions = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = { status: 'active', limit: 100 };
    if (startingAfter) {
      params.starting_after = startingAfter;
    }

    const subscriptions = await stripe.subscriptions.list(params);
    allSubscriptions = allSubscriptions.concat(subscriptions.data);
    
    hasMore = subscriptions.has_more;
    if (hasMore && subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${allSubscriptions.length} active subscriptions\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const sub of allSubscriptions) {
    try {
      // Get customer details
      const customer = typeof sub.customer === 'string' 
        ? await stripe.customers.retrieve(sub.customer)
        : sub.customer;
      
      if (!customer.email) {
        console.log(`⚠️  Skipping subscription ${sub.id} - no customer email`);
        skippedCount++;
        continue;
      }

      // Skip device users
      if (customer.email.includes('@revealai.device') || customer.email.includes('device_')) {
        console.log(`⚠️  Skipping subscription ${sub.id} - device user`);
        skippedCount++;
        continue;
      }

      // Get subscription details
      const price = sub.items.data[0]?.price;
      const isYearly = price?.recurring?.interval === 'year';
      const tierName = isYearly ? 'Yearly' : 'Weekly';
      
      // Handle renewal date - current_period_end is a Unix timestamp
      let renewalDate;
      if (sub.current_period_end) {
        renewalDate = new Date(sub.current_period_end * 1000);
      } else {
        // Fallback: calculate from now based on interval
        const daysToAdd = isYearly ? 365 : 7;
        renewalDate = new Date();
        renewalDate.setDate(renewalDate.getDate() + daysToAdd);
      }
      
      const renewalDateFormatted = renewalDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create customer portal link
      const portalLink = await createCustomerPortalLink(customer.id);
      
      if (!portalLink) {
        console.log(`⚠️  Skipping ${customer.email} - could not create portal link`);
        skippedCount++;
        continue;
      }

      // Professional email message (must be under 500 chars for Stripe)
      const description = `Your Reveal AI ${tierName} subscription is active. Next renewal: ${renewalDateFormatted}. Includes unlimited searches, dating app detection, criminal history, vehicle/phone searches, and privacy tools. Manage or cancel: ${portalLink}`;

      if (dryRun) {
        console.log(`📧 Would send email to: ${customer.email}`);
        console.log(`   Subscription: ${tierName} | Renews: ${renewalDateFormatted}`);
        console.log(`   Portal Link: ${portalLink}`);
        console.log('');
      } else {
        // Create a $0 invoice with custom description using send_invoice method
        try {
          // Create invoice with send_invoice collection method
          const invoice = await stripe.invoices.create({
            customer: customer.id,
            description: description,
            collection_method: 'send_invoice',
            days_until_due: 365, // Far in future so it won't be due
            auto_advance: false,
          });

          // Add a $0 line item
          await stripe.invoiceItems.create({
            customer: customer.id,
            invoice: invoice.id,
            amount: 0,
            currency: 'usd',
            description: 'Subscription Status Update',
          });

          // Finalize the invoice
          const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id, {
            auto_advance: false,
          });

          // Send the invoice (this triggers the email)
          await stripe.invoices.sendInvoice(finalizedInvoice.id);

          console.log(`✅ Sent email to: ${customer.email} (Invoice: ${finalizedInvoice.id})`);
          successCount++;

          // Rate limiting - wait 500ms between emails
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (invoiceError) {
          console.error(`❌ Error creating invoice for ${customer.email}:`, invoiceError.message);
          errorCount++;
        }
      }
    } catch (error) {
      console.error(`❌ Error processing subscription ${sub.id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  if (dryRun) {
    console.log(`📊 DRY RUN COMPLETE`);
    console.log(`   Would send: ${allSubscriptions.length - skippedCount} emails`);
    console.log(`   Would skip: ${skippedCount} subscriptions`);
    console.log(`\n💡 To actually send emails, run:`);
    console.log(`   node scripts/email-subscribers-stripe.js --send\n`);
  } else {
    console.log(`✅ EMAIL SEND COMPLETE`);
    console.log(`   ✅ Sent: ${successCount} emails`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`   ⚠️  Skipped: ${skippedCount} subscriptions\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const shouldSend = args.includes('--send');

  await emailAllSubscribersViaStripe(!shouldSend);
}

main().catch(console.error);

