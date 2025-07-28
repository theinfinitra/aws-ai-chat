#!/bin/bash

# AI Chat Standalone - Deployment Verification Script
# This script verifies that the deployment was successful

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
ENV=${ENV:-dev}
PROFILE=${PROFILE:-default}
REGION=${REGION:-us-east-1}
PROJECT_NAME="aws-ai-chat"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env)
      ENV="$2"
      shift 2
      ;;
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --region)
      REGION="$2"
      shift 2
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

STACK_NAME="${PROJECT_NAME}-backend-${ENV}"

echo -e "${BLUE}🔍 Verifying AI Chat Standalone Deployment${NC}"
echo -e "Environment: ${GREEN}${ENV}${NC}"
echo -e "Profile: ${GREEN}${PROFILE}${NC}"
echo -e "Region: ${GREEN}${REGION}${NC}"
echo ""

# Check if stack exists and is in good state
echo -e "${YELLOW}Checking stack status...${NC}"
STACK_STATUS=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --query 'Stacks[0].StackStatus' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$STACK_STATUS" = "NOT_FOUND" ]; then
  echo -e "${RED}❌ Stack not found: $STACK_NAME${NC}"
  exit 1
elif [ "$STACK_STATUS" != "CREATE_COMPLETE" ] && [ "$STACK_STATUS" != "UPDATE_COMPLETE" ]; then
  echo -e "${RED}❌ Stack is in bad state: $STACK_STATUS${NC}"
  exit 1
else
  echo -e "${GREEN}✅ Stack status: $STACK_STATUS${NC}"
fi

# Get stack outputs
echo -e "${YELLOW}Getting API endpoints...${NC}"
REST_API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text 2>/dev/null || echo "")

WEBSOCKET_API_URL=$(aws cloudformation describe-stacks \
  --stack-name "$STACK_NAME" \
  --profile "$PROFILE" \
  --region "$REGION" \
  --query 'Stacks[0].Outputs[?OutputKey==`WebSocketApiUrl`].OutputValue' \
  --output text 2>/dev/null || echo "")

if [ -z "$REST_API_URL" ]; then
  echo -e "${RED}❌ REST API URL not found${NC}"
  exit 1
else
  echo -e "${GREEN}✅ REST API URL: $REST_API_URL${NC}"
fi

if [ -z "$WEBSOCKET_API_URL" ]; then
  echo -e "${RED}❌ WebSocket API URL not found${NC}"
  exit 1
else
  echo -e "${GREEN}✅ WebSocket API URL: $WEBSOCKET_API_URL${NC}"
fi

# Test REST API endpoint
echo -e "${YELLOW}Testing REST API endpoint...${NC}"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, this is a test","conversationHistory":[],"sessionId":"test-session"}' \
  "$REST_API_URL" || echo "000")

if [ "$HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ REST API is responding correctly${NC}"
elif [ "$HTTP_STATUS" = "000" ]; then
  echo -e "${RED}❌ Failed to connect to REST API${NC}"
else
  echo -e "${YELLOW}⚠️  REST API returned HTTP $HTTP_STATUS (may need Bedrock access)${NC}"
fi

# Test streaming endpoint
echo -e "${YELLOW}Testing streaming endpoint...${NC}"
STREAM_HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
  -X HEAD \
  "${REST_API_URL/\/chat/\/stream}" || echo "000")

if [ "$STREAM_HTTP_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Streaming endpoint is available${NC}"
else
  echo -e "${YELLOW}⚠️  Streaming endpoint returned HTTP $STREAM_HTTP_STATUS${NC}"
fi

# Generate environment configuration
echo -e "${YELLOW}Generating environment configuration...${NC}"

# Remove /chat suffix from REST API URL for NEXT_PUBLIC_API_URL
BASE_API_URL="${REST_API_URL%/chat}"

cat > "../.env.${ENV}.generated" << EOF
# Generated environment configuration for ${ENV}
# Copy these values to your .env.local file

# AWS Configuration
AWS_REGION=${REGION}
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# API Configuration
NEXT_PUBLIC_API_URL=${BASE_API_URL}
NEXT_PUBLIC_WEBSOCKET_URL=${WEBSOCKET_API_URL}

# Environment
NODE_ENV=$([ "$ENV" = "prod" ] && echo "production" || echo "development")
EOF

echo -e "${GREEN}✅ Environment configuration saved to .env.${ENV}.generated${NC}"
echo ""
echo -e "${BLUE}🎉 Deployment verification complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Copy the generated environment file:"
echo "   cp .env.${ENV}.generated ../.env.local"
echo ""
echo "2. Install dependencies and start the development server:"
echo "   cd .. && npm install && npm run dev"
echo ""
echo "3. Open http://localhost:3000 to test the chat application"
echo ""
echo -e "${YELLOW}API Endpoints:${NC}"
echo "REST API: $REST_API_URL"
echo "WebSocket API: $WEBSOCKET_API_URL"
