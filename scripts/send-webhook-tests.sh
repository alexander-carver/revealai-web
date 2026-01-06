#!/bin/bash

# Send test webhook events to verify webhook is working
# This script uses Stripe CLI to send test events

echo "🧪 Testing Stripe Webhook with Multiple Events"
echo "=============================================="
echo ""

WEBHOOK_URL="https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook"

# Check if Stripe CLI is available
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Install with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

echo "📤 Sending test events to webhook..."
echo "Webhook URL: $WEBHOOK_URL"
echo ""

# Test 1: checkout.session.completed
echo "1️⃣  Testing checkout.session.completed..."
if stripe trigger checkout.session.completed 2>&1 | grep -q "success\|triggered"; then
    echo "   ✅ Event sent successfully"
else
    echo "   ⚠️  Event may have failed - check Stripe Dashboard"
fi
echo ""

# Wait a moment between events
sleep 2

# Test 2: customer.subscription.updated
echo "2️⃣  Testing customer.subscription.updated..."
if stripe trigger customer.subscription.updated 2>&1 | grep -q "success\|triggered"; then
    echo "   ✅ Event sent successfully"
else
    echo "   ⚠️  Event may have failed - check Stripe Dashboard"
fi
echo ""

sleep 2

# Test 3: customer.subscription.deleted (canceled subscription)
echo "3️⃣  Testing customer.subscription.deleted (CANCELED subscription)..."
if stripe trigger customer.subscription.deleted 2>&1 | grep -q "success\|triggered"; then
    echo "   ✅ Canceled subscription event sent successfully"
else
    echo "   ⚠️  Event may have failed - check Stripe Dashboard"
fi
echo ""

sleep 2

# Test 4: customer.subscription.created
echo "4️⃣  Testing customer.subscription.created..."
if stripe trigger customer.subscription.created 2>&1 | grep -q "success\|triggered"; then
    echo "   ✅ Event sent successfully"
else
    echo "   ⚠️  Event may have failed - check Stripe Dashboard"
fi
echo ""

echo "✅ All test events sent!"
echo ""
echo "📊 Next Steps:"
echo "   1. Check Stripe Dashboard → Developers → Webhooks → Event deliveries"
echo "   2. Check Supabase Dashboard → Edge Functions → stripe-webhook → Logs"
echo "   3. Verify subscriptions table in Supabase for updates"
echo ""
echo "💡 Tip: Look for events with status 'Succeeded' in Stripe Dashboard"

