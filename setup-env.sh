#!/bin/bash

# AI Chat Standalone - Environment Setup Script
# This script copies the generated environment configuration to .env.local

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV=${1:-dev}
GENERATED_FILE=".env.${ENV}.generated"

echo -e "${BLUE}🔧 Setting up environment configuration${NC}"

if [ ! -f "$GENERATED_FILE" ]; then
    echo -e "${YELLOW}⚠️  Generated environment file not found: $GENERATED_FILE${NC}"
    echo "Please run the deployment verification first:"
    echo "  cd aws-infrastructure && make verify PROFILE=your-profile REGION=your-region"
    exit 1
fi

# Backup existing .env.local if it exists
if [ -f ".env.local" ]; then
    echo -e "${YELLOW}📋 Backing up existing .env.local to .env.local.backup${NC}"
    cp .env.local .env.local.backup
fi

# Copy generated file to .env.local
cp "$GENERATED_FILE" .env.local

echo -e "${GREEN}✅ Environment configuration copied to .env.local${NC}"
echo ""
echo -e "${YELLOW}Configuration:${NC}"
cat .env.local
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Install dependencies: npm install"
echo "2. Start development server: npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
