#!/bin/bash

# Find Duplicate Stripe Subscriptions using Stripe CLI
# Usage: ./scripts/find-duplicates-stripe-cli.sh

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Finding Duplicate Stripe Subscriptions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found!"
    echo ""
    echo "Install with:"
    echo "  brew install stripe/stripe-cli/stripe"
    echo ""
    echo "Then login:"
    echo "  stripe login"
    echo ""
    exit 1
fi

# Get all active subscriptions
echo "📊 Fetching all active subscriptions..."
stripe subscriptions list --status active --limit 100 > /tmp/stripe_subs.json

# Extract customer emails
echo "🔍 Analyzing for duplicates..."
echo ""

# This is a simplified version - for full analysis, use the Node.js script
stripe customers list --limit 100 | grep -E "email|id" | while read -r line; do
    if [[ $line == *"email:"* ]]; then
        email=$(echo "$line" | sed 's/.*email: //' | sed 's/,//')
        echo "Checking: $email"
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 For detailed duplicate analysis with Supabase integration:"
echo "   node scripts/fix-duplicate-accounts.js"
echo ""
echo "📋 Quick Commands:"
echo ""
echo "  # Find specific customer"
echo "  stripe customers list --email EMAIL"
echo ""
echo "  # List customer's subscriptions"
echo "  stripe subscriptions list --customer CUSTOMER_ID"
echo ""
echo "  # Cancel a subscription"
echo "  stripe subscriptions cancel SUBSCRIPTION_ID"
echo ""

