#!/bin/bash

# Script to resend failed Stripe webhook events using Stripe CLI
# 
# Usage:
#   STRIPE_SECRET_KEY=sk_live_... ./scripts/resend-webhooks-stripe-cli.sh
# 
# Or login first:
#   stripe login
#   ./scripts/resend-webhooks-stripe-cli.sh

set -e

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Install it with: brew install stripe/stripe-cli/stripe"
    exit 1
fi

# Check if API key is provided
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "⚠️  STRIPE_SECRET_KEY not set. Attempting to use Stripe CLI login..."
    echo "   If this fails, set STRIPE_SECRET_KEY or run: stripe login"
fi

# Webhook endpoint ID
WEBHOOK_ENDPOINT_ID="we_1Sakb9Gjo8o5J3MxLHa4mWFE"

echo "🚀 Fetching failed webhook events..."
echo "📡 Webhook Endpoint: $WEBHOOK_ENDPOINT_ID"
echo ""

# Get failed events using Stripe CLI
# Note: Stripe CLI doesn't have a direct way to list failed events
# We'll need to use the API or dashboard approach

echo "⚠️  Stripe CLI doesn't have a direct command to list all failed events."
echo "   We'll use the Stripe API instead."
echo ""
echo "💡 Alternative: Use Stripe Dashboard → Webhooks → Your webhook → Event deliveries"
echo "   Then manually resend each failed event, or use the Node.js script."
echo ""
echo "📝 To resend a specific event, use:"
echo "   stripe events resend <event_id>"
echo ""

# If we have event IDs, we can resend them
if [ "$1" != "" ]; then
    EVENT_ID="$1"
    echo "🔄 Resending event: $EVENT_ID"
    
    if [ -n "$STRIPE_SECRET_KEY" ]; then
        stripe events resend "$EVENT_ID" --api-key "$STRIPE_SECRET_KEY"
    else
        stripe events resend "$EVENT_ID"
    fi
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully resent: $EVENT_ID"
    else
        echo "❌ Failed to resend: $EVENT_ID"
    fi
else
    echo "📋 To resend all failed events:"
    echo "   1. Get event IDs from Stripe Dashboard"
    echo "   2. Run: ./scripts/resend-webhooks-stripe-cli.sh <event_id>"
    echo "   3. Or use the Node.js script: node scripts/resend-failed-webhooks.js"
fi

