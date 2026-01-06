#!/bin/bash

# Test Stripe Webhook Events
# This script sends test events to the Supabase webhook endpoint

WEBHOOK_URL="https://ddoginuyioiatbpfemxr.supabase.co/functions/v1/stripe-webhook"

echo "🧪 Testing Stripe Webhook Events"
echo "================================"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Install with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Check if logged in
if ! stripe config --list &> /dev/null; then
    echo "⚠️  Not logged into Stripe CLI. Run: stripe login"
    exit 1
fi

echo "📤 Sending test events to: $WEBHOOK_URL"
echo ""

# Test 1: checkout.session.completed
echo "1️⃣  Testing checkout.session.completed event..."
stripe trigger checkout.session.completed
echo "✅ Sent checkout.session.completed"
echo ""

# Test 2: customer.subscription.updated
echo "2️⃣  Testing customer.subscription.updated event..."
stripe trigger customer.subscription.updated
echo "✅ Sent customer.subscription.updated"
echo ""

# Test 3: customer.subscription.deleted
echo "3️⃣  Testing customer.subscription.deleted event..."
stripe trigger customer.subscription.deleted
echo "✅ Sent customer.subscription.deleted"
echo ""

echo "✅ All test events sent!"
echo ""
echo "📊 Check webhook delivery status:"
echo "   Stripe Dashboard → Developers → Webhooks → [Your webhook] → Event deliveries"
echo ""
echo "📋 Check Supabase logs:"
echo "   Supabase Dashboard → Edge Functions → stripe-webhook → Logs"

