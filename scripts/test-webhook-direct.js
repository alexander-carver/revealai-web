#!/usr/bin/env node

/**
 * Direct Webhook Test Script
 * Sends test webhook events directly to the Supabase webhook endpoint
 * 
 * This simulates Stripe webhook events for testing
 */

require('dotenv').config({ path: '.env.local' });

const https = require('https');
const crypto = require('crypto');

const WEBHOOK_URL = 'https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!WEBHOOK_SECRET) {
  console.error('❌ STRIPE_WEBHOOK_SECRET not found in .env.local');
  process.exit(1);
}

// Sample test events
const testEvents = [
  {
    name: 'checkout.session.completed',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_' + Date.now(),
        object: 'checkout.session',
        payment_status: 'paid',
        customer: 'cus_test_' + Date.now(),
        customer_email: 'test@example.com',
        subscription: 'sub_test_' + Date.now(),
        metadata: {
          userId: 'test-user-id',
          plan: 'yearly'
        }
      }
    }
  },
  {
    name: 'customer.subscription.deleted',
    type: 'customer.subscription.deleted',
    data: {
      object: {
        id: 'sub_test_' + Date.now(),
        object: 'subscription',
        status: 'canceled',
        customer: 'cus_test_' + Date.now(),
        current_period_end: Math.floor(Date.now() / 1000) + 86400,
        items: {
          data: [{
            price: {
              id: 'price_test',
              product: 'prod_test'
            }
          }]
        }
      }
    }
  }
];

function signPayload(payload, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload, 'utf8');
  return hmac.digest('hex');
}

function sendWebhookEvent(event) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      id: 'evt_test_' + Date.now(),
      object: 'event',
      type: event.type,
      data: event.data,
      created: Math.floor(Date.now() / 1000)
    });

    const signature = signPayload(payload, WEBHOOK_SECRET);
    const timestamp = Math.floor(Date.now() / 1000);
    const signedPayload = `${timestamp}.${payload}`;
    const stripeSignature = `t=${timestamp},v1=${signature},v0=test`;

    const url = new URL(WEBHOOK_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(signedPayload),
        'stripe-signature': stripeSignature,
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`   ✅ ${event.name} - Success (${res.statusCode})`);
          resolve({ success: true, status: res.statusCode, data });
        } else {
          console.log(`   ❌ ${event.name} - Failed (${res.statusCode})`);
          console.log(`   Response: ${data}`);
          reject({ success: false, status: res.statusCode, data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   ❌ ${event.name} - Error: ${error.message}`);
      reject(error);
    });

    req.write(signedPayload);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Stripe Webhook Events');
  console.log('================================');
  console.log(`Webhook URL: ${WEBHOOK_URL}`);
  console.log('');

  for (let i = 0; i < testEvents.length; i++) {
    const event = testEvents[i];
    console.log(`${i + 1}️⃣  Testing ${event.name}...`);
    
    try {
      await sendWebhookEvent(event);
      // Wait between events
      if (i < testEvents.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`   Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('✅ Test events sent!');
  console.log('');
  console.log('📊 Check results:');
  console.log('   - Stripe Dashboard → Webhooks → Event deliveries');
  console.log('   - Supabase Dashboard → Edge Functions → stripe-webhook → Logs');
}

runTests().catch(console.error);

