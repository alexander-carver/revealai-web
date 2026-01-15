#!/bin/bash
# Setup script for Perplexity API integration

set -e

echo "🔧 Perplexity API Setup"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Perplexity API key is provided
if [ -z "$1" ]; then
  echo -e "${YELLOW}⚠️  Usage: $0 <PERPLEXITY_API_KEY>${NC}"
  echo ""
  echo "Get your API key from: https://www.perplexity.ai/settings/api"
  echo ""
  read -p "Enter your Perplexity API key (or press Ctrl+C to exit): " PERPLEXITY_KEY
else
  PERPLEXITY_KEY="$1"
fi

if [ -z "$PERPLEXITY_KEY" ]; then
  echo "❌ Error: Perplexity API key is required"
  exit 1
fi

echo ""
echo "📦 Adding Perplexity API key to Vercel..."

# Add to Vercel for all environments
echo "  → Adding to Production environment..."
echo "$PERPLEXITY_KEY" | vercel env add PERPLEXITY_API_KEY production --force

echo "  → Adding to Preview environment..."
echo "$PERPLEXITY_KEY" | vercel env add PERPLEXITY_API_KEY preview --force

echo "  → Adding to Development environment..."
echo "$PERPLEXITY_KEY" | vercel env add PERPLEXITY_API_KEY development --force

echo ""
echo "💾 Adding to local .env.local..."

# Add to .env.local if it doesn't exist
if ! grep -q "PERPLEXITY_API_KEY" .env.local 2>/dev/null; then
  echo "PERPLEXITY_API_KEY=$PERPLEXITY_KEY" >> .env.local
  echo -e "${GREEN}✅ Added PERPLEXITY_API_KEY to .env.local${NC}"
else
  # Update existing key
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|PERPLEXITY_API_KEY=.*|PERPLEXITY_API_KEY=$PERPLEXITY_KEY|" .env.local
  else
    # Linux
    sed -i "s|PERPLEXITY_API_KEY=.*|PERPLEXITY_API_KEY=$PERPLEXITY_KEY|" .env.local
  fi
  echo -e "${GREEN}✅ Updated PERPLEXITY_API_KEY in .env.local${NC}"
fi

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "  1. Run Supabase migration: supabase migration up"
echo "  2. Deploy to Vercel: vercel --prod"
echo "  3. Test the search page: npm run dev"

