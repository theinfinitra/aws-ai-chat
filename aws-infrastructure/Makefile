# AI Chat Standalone - AWS Infrastructure Makefile
# Multi-region, multi-profile deployment orchestrator
# 
# Usage:
#   make deploy-dev PROFILE=my-profile REGION=us-east-1
#   make deploy-prod PROFILE=my-profile REGION=us-east-1
#   make validate PROFILE=my-profile REGION=us-east-1

# Default values (can be overridden)
ENV ?= dev
PROFILE ?= default
REGION ?= us-east-1

# Configuration
PROJECT_NAME = aws-ai-chat
STACK_PREFIX = $(PROJECT_NAME)

# Validation
VALID_ENVS := dev prod
VALID_REGIONS := us-east-1 us-west-2 eu-west-1 ap-southeast-1

# Stack names
BACKEND_STACK = $(STACK_PREFIX)-backend-$(ENV)
FRONTEND_STACK = $(STACK_PREFIX)-frontend-$(ENV)

# Colors for output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
PURPLE := \033[0;35m
NC := \033[0m

.PHONY: help validate-params validate deploy-dev deploy-prod status clean test-aws

help:
	@echo "$(BLUE)🚀 AI Chat Standalone - AWS Infrastructure$(NC)"
	@echo ""
	@echo "$(YELLOW)Required Parameters:$(NC)"
	@echo "  PROFILE  - AWS CLI profile name"
	@echo "  REGION   - AWS region (us-east-1, us-west-2, eu-west-1, ap-southeast-1)"
	@echo ""
	@echo "$(YELLOW)Optional Parameters:$(NC)"
	@echo "  ENV      - Environment (dev, prod) [default: dev]"
	@echo ""
	@echo "$(YELLOW)Available Commands:$(NC)"
	@echo "  $(GREEN)deploy-dev$(NC)       - Deploy to development environment"
	@echo "  $(GREEN)deploy-prod$(NC)      - Deploy to production environment"
	@echo "  $(GREEN)validate$(NC)         - Validate CloudFormation templates"
	@echo "  $(GREEN)status$(NC)           - Show stack status"
	@echo "  $(GREEN)clean$(NC)            - Clean up temporary files"
	@echo "  $(GREEN)test-aws$(NC)         - Test AWS connectivity"
	@echo "  $(GREEN)verify$(NC)           - Verify deployment and generate config"
	@echo ""
	@echo "$(YELLOW)Examples:$(NC)"
	@echo "  make deploy-dev PROFILE=my-profile REGION=us-east-1"
	@echo "  make deploy-prod PROFILE=prod-profile REGION=us-west-2"
	@echo "  make status PROFILE=my-profile REGION=us-east-1"
	@echo ""
	@echo "$(YELLOW)Prerequisites:$(NC)"
	@echo "  - AWS CLI configured with specified profile"
	@echo "  - Bedrock model access enabled in your AWS account"
	@echo "  - Appropriate IAM permissions for CloudFormation, Lambda, API Gateway"
	@echo ""

# Parameter validation
validate-params:
	@if [ "$(PROFILE)" = "default" ]; then \
		echo "$(RED)❌ Error: PROFILE parameter is required$(NC)"; \
		echo "$(YELLOW)Usage: make <target> PROFILE=your-aws-profile REGION=your-region$(NC)"; \
		exit 1; \
	fi
	@if ! echo "$(VALID_ENVS)" | grep -wq "$(ENV)"; then \
		echo "$(RED)❌ Error: Invalid ENV '$(ENV)'. Valid values: $(VALID_ENVS)$(NC)"; \
		exit 1; \
	fi
	@if ! echo "$(VALID_REGIONS)" | grep -wq "$(REGION)"; then \
		echo "$(RED)❌ Error: Invalid REGION '$(REGION)'. Valid values: $(VALID_REGIONS)$(NC)"; \
		exit 1; \
	fi

# Test AWS connectivity
test-aws: validate-params
	@echo "$(BLUE)🔗 Testing AWS connectivity$(NC)"
	@echo "Profile: $(PROFILE), Region: $(REGION)"
	@aws sts get-caller-identity --profile $(PROFILE) --region $(REGION) --output table
	@echo "$(GREEN)✅ AWS connectivity successful$(NC)"

# Validate CloudFormation templates
validate: validate-params
	@echo "$(YELLOW)Validating CloudFormation templates...$(NC)"
	@aws cloudformation validate-template \
		--template-body file://backend.yaml \
		--profile $(PROFILE) \
		--region $(REGION)
	@echo "$(GREEN)✅ Backend template is valid$(NC)"
	@aws cloudformation validate-template \
		--template-body file://frontend.yaml \
		--profile $(PROFILE) \
		--region $(REGION)
	@echo "$(GREEN)✅ Frontend template is valid$(NC)"

# Development deployment
deploy-dev: ENV=dev
deploy-dev: validate-params
	@$(MAKE) validate PROFILE=$(PROFILE) REGION=$(REGION)
	@echo "$(BLUE)🚀 Deploying AI Chat to Development Environment$(NC)"
	@echo "$(YELLOW)Profile: $(PROFILE), Region: $(REGION)$(NC)"
	@echo "$(YELLOW)Step 1: Deploying backend stack...$(NC)"
	@aws cloudformation deploy \
		--template-file backend.yaml \
		--stack-name $(BACKEND_STACK) \
		--parameter-overrides file://parameters/dev-backend.json \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
		--profile $(PROFILE) \
		--region $(REGION) \
		--tags Environment=development Project=$(PROJECT_NAME)
	@echo "$(GREEN)✅ Backend deployment complete!$(NC)"
	@echo "$(YELLOW)Step 2: Getting API endpoints...$(NC)"
	@$(MAKE) get-api-url ENV=dev PROFILE=$(PROFILE) REGION=$(REGION)
	@echo "$(GREEN)✅ Development deployment complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "1. Update your .env.local file with the API URLs above"
	@echo "2. Set NEXT_PUBLIC_API_URL to the REST API URL (without /chat)"
	@echo "3. Set NEXT_PUBLIC_WEBSOCKET_URL to the WebSocket API URL"
	@echo "4. Run 'npm run dev' to start the development server"
	@echo "5. Test the chat functionality"

# Production deployment
deploy-prod: ENV=prod
deploy-prod: validate-params
	@echo "$(RED)⚠️  PRODUCTION DEPLOYMENT$(NC)"
	@echo "$(YELLOW)Profile: $(PROFILE), Region: $(REGION)$(NC)"
	@echo "$(RED)This will deploy to PRODUCTION. Continue? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	@$(MAKE) validate PROFILE=$(PROFILE) REGION=$(REGION)
	@echo "$(BLUE)🚀 Deploying AI Chat to Production Environment$(NC)"
	@echo "$(YELLOW)Step 1: Deploying backend stack...$(NC)"
	@aws cloudformation deploy \
		--template-file backend.yaml \
		--stack-name $(BACKEND_STACK) \
		--parameter-overrides file://parameters/prod-backend.json \
		--capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
		--profile $(PROFILE) \
		--region $(REGION) \
		--tags Environment=production Project=$(PROJECT_NAME)
	@echo "$(GREEN)✅ Backend deployment complete!$(NC)"
	@echo "$(YELLOW)Step 2: Getting API endpoints...$(NC)"
	@$(MAKE) get-api-url ENV=prod PROFILE=$(PROFILE) REGION=$(REGION)
	@echo "$(GREEN)✅ Production deployment complete!$(NC)"

# Get API Gateway URLs
get-api-url: validate-params
	@echo "$(BLUE)API Endpoints:$(NC)"
	@echo "REST API:"
	@aws cloudformation describe-stacks \
		--stack-name $(BACKEND_STACK) \
		--profile $(PROFILE) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
		--output text 2>/dev/null || echo "  Stack not found or no outputs available"
	@echo ""
	@echo "WebSocket API:"
	@aws cloudformation describe-stacks \
		--stack-name $(BACKEND_STACK) \
		--profile $(PROFILE) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[?OutputKey==`WebSocketApiUrl`].OutputValue' \
		--output text 2>/dev/null || echo "  Stack not found or no outputs available"

# Show stack status
status: validate-params
	@echo "$(BLUE)📊 Stack Status ($(ENV) environment):$(NC)"
	@echo "Profile: $(PROFILE), Region: $(REGION)"
	@echo ""
	@echo "$(YELLOW)Backend Stack:$(NC)"
	@aws cloudformation describe-stacks \
		--stack-name $(BACKEND_STACK) \
		--profile $(PROFILE) \
		--region $(REGION) \
		--query 'Stacks[0].{Status:StackStatus,Created:CreationTime,Updated:LastUpdatedTime}' \
		--output table 2>/dev/null || echo "  Not deployed"
	@echo ""
	@echo "$(YELLOW)Stack Outputs:$(NC)"
	@aws cloudformation describe-stacks \
		--stack-name $(BACKEND_STACK) \
		--profile $(PROFILE) \
		--region $(REGION) \
		--query 'Stacks[0].Outputs[*].{Key:OutputKey,Value:OutputValue,Description:Description}' \
		--output table 2>/dev/null || echo "  No outputs available"

# Clean up temporary files
clean:
	@echo "$(YELLOW)Cleaning up temporary files...$(NC)"
	@rm -rf dist/
	@rm -f *.zip
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

# Delete stacks (with confirmation)
delete: validate-params
	@echo "$(RED)⚠️  WARNING: This will DELETE the $(ENV) environment stacks$(NC)"
	@echo "$(YELLOW)Profile: $(PROFILE), Region: $(REGION)$(NC)"
	@echo "$(RED)Type 'DELETE' to confirm:$(NC)" && read ans && [ "$$ans" = "DELETE" ]
	@echo "$(YELLOW)Deleting backend stack...$(NC)"
	@aws cloudformation delete-stack \
		--stack-name $(BACKEND_STACK) \
		--profile $(PROFILE) \
		--region $(REGION)
	@echo "$(GREEN)✅ Stack deletion initiated$(NC)"
	@echo "$(YELLOW)Monitor deletion progress with: make status$(NC)"

# Show configuration
show-config: validate-params
	@echo "$(BLUE)⚙️  Current Configuration$(NC)"
	@echo "Environment: $(GREEN)$(ENV)$(NC)"
	@echo "Profile:     $(GREEN)$(PROFILE)$(NC)"
	@echo "Region:      $(GREEN)$(REGION)$(NC)"
	@echo "Backend Stack: $(GREEN)$(BACKEND_STACK)$(NC)"
	@echo ""

# Verify deployment and generate environment config
verify: validate-params
	@echo "$(BLUE)🔍 Verifying deployment and generating configuration...$(NC)"
	@./scripts/verify-deployment.sh --env $(ENV) --profile $(PROFILE) --region $(REGION)
