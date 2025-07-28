# AI Chat Standalone - Deployment Guide

This guide walks you through deploying the AI Chat Standalone application to AWS.

## Prerequisites

### AWS Account Setup
1. **AWS Account** with administrative access
2. **AWS CLI** installed and configured
3. **Bedrock Access** - Request access to Amazon Nova Pro model
4. **Appropriate IAM Permissions** for CloudFormation, Lambda, API Gateway, and Bedrock

### Local Development Setup
1. **Node.js 18+** installed
2. **Git** for version control
3. **Make** utility (usually pre-installed on macOS/Linux)

## Step-by-Step Deployment

### 1. Enable Bedrock Model Access

Before deploying, ensure you have access to the required Bedrock model:

```bash
# Check available models in your region
aws bedrock list-foundation-models --region us-east-1

# If Amazon Nova Pro is not available, request access via AWS Console:
# 1. Go to AWS Bedrock Console
# 2. Navigate to "Model access"
# 3. Request access to "Amazon Nova Pro"
```

### 2. Configure AWS CLI

Ensure your AWS CLI is configured with appropriate credentials:

```bash
aws configure list
aws sts get-caller-identity
```

### 3. Clone and Setup Project

```bash
git clone <your-repository-url>
cd aws-ai-chat
npm install
```

### 4. Configure Parameters

Update the parameter files in `aws-infrastructure/parameters/`:

#### Development Backend (`dev-backend.json`)
```json
[
  {
    "ParameterKey": "Environment",
    "ParameterValue": "dev"
  },
  {
    "ParameterKey": "ProjectName",
    "ParameterValue": "aws-ai-chat"
  },
  {
    "ParameterKey": "BedrockModelId",
    "ParameterValue": "amazon.nova-pro-v1:0"
  },
  {
    "ParameterKey": "AllowedOrigins",
    "ParameterValue": "http://localhost:3000,https://localhost:3000"
  }
]
```

#### Production Backend (`prod-backend.json`)
Update the `AllowedOrigins` with your production domain:
```json
{
  "ParameterKey": "AllowedOrigins",
  "ParameterValue": "https://your-domain.com,https://www.your-domain.com"
}
```

### 5. Deploy Backend Infrastructure

```bash
cd aws-infrastructure

# Deploy to development
make deploy-dev

# Or deploy to production
make deploy-prod
```

This will create:
- Lambda function for chat processing
- API Gateway with CORS configuration
- IAM roles and policies
- CloudWatch log groups

### 6. Get API Gateway URL

After successful deployment, get the API Gateway URL:

```bash
# For development
aws cloudformation describe-stacks \
  --stack-name aws-ai-chat-backend-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text

# For production
aws cloudformation describe-stacks \
  --stack-name aws-ai-chat-backend-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
  --output text
```

### 7. Configure Frontend Environment

Create and configure your environment file:

```bash
# For development
cp .env.local.example .env.local

# Update .env.local with the API Gateway URL from step 6
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
```

### 8. Test Local Development

```bash
npm run dev
```

Visit `http://localhost:3000` and test the chat functionality.

### 9. Deploy Frontend (Optional - Amplify)

If you want to deploy the frontend to AWS Amplify:

#### Update Frontend Parameters

Edit `parameters/dev-frontend.json` or `parameters/prod-frontend.json`:

```json
[
  {
    "ParameterKey": "GitHubRepository",
    "ParameterValue": "https://github.com/yourusername/aws-ai-chat"
  },
  {
    "ParameterKey": "GitHubToken",
    "ParameterValue": "your-github-personal-access-token"
  },
  {
    "ParameterKey": "CustomDomain",
    "ParameterValue": "chat.yourdomain.com"
  }
]
```

#### Deploy Frontend Stack

```bash
# Deploy frontend to development
aws cloudformation deploy \
  --template-file frontend.yaml \
  --stack-name aws-ai-chat-frontend-dev \
  --parameter-overrides file://parameters/dev-frontend.json \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Or use the Makefile (after updating it to include frontend deployment)
```

## Verification and Testing

### 1. Test API Endpoint

```bash
# Test the chat API directly
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/dev/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, how are you?",
    "conversationHistory": [],
    "sessionId": "test-session"
  }'
```

### 2. Check CloudWatch Logs

Monitor the Lambda function logs:

```bash
aws logs describe-log-groups --log-group-name-prefix "/aws/lambda/aws-ai-chat"

# Tail logs in real-time
aws logs tail /aws/lambda/aws-ai-chat-dev-chat --follow
```

### 3. Test Frontend

1. Open your application URL
2. Try the quick start prompts
3. Test custom messages
4. Verify responsive design on mobile

## Monitoring and Maintenance

### CloudWatch Dashboards

Create a dashboard to monitor:
- Lambda invocations and errors
- API Gateway requests and latency
- Bedrock token usage

### Cost Monitoring

Set up billing alerts for:
- Lambda execution costs
- Bedrock token usage
- API Gateway requests

### Security Best Practices

1. **API Rate Limiting**: Implement throttling in API Gateway
2. **Content Filtering**: Enhance the basic filtering in the Lambda function
3. **Authentication**: Add API keys or Cognito authentication for production
4. **CORS**: Restrict origins to your specific domains

## Troubleshooting

### Common Deployment Issues

#### 1. CloudFormation Stack Creation Failed

```bash
# Check stack events
aws cloudformation describe-stack-events --stack-name aws-ai-chat-backend-dev

# Common fixes:
# - Check IAM permissions
# - Verify Bedrock model access
# - Ensure unique resource names
```

#### 2. Lambda Function Errors

```bash
# Check function logs
aws logs tail /aws/lambda/aws-ai-chat-dev-chat --follow

# Common issues:
# - Bedrock model not accessible
# - Timeout issues (increase timeout in CloudFormation)
# - Memory issues (increase memory allocation)
```

#### 3. CORS Issues

- Verify API Gateway CORS configuration
- Check that your frontend domain is in AllowedOrigins
- Test with browser developer tools

#### 4. Frontend Build Issues

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

### Rollback Procedures

#### Backend Rollback

```bash
# List stack events to identify issues
aws cloudformation describe-stack-events --stack-name aws-ai-chat-backend-dev

# Delete and redeploy if needed
aws cloudformation delete-stack --stack-name aws-ai-chat-backend-dev
make deploy-dev
```

#### Frontend Rollback

```bash
# Revert to previous Amplify deployment
aws amplify list-apps
aws amplify get-app --app-id your-app-id
# Use Amplify console to revert to previous deployment
```

## Production Considerations

### Security Enhancements

1. **API Authentication**: Implement API keys or Cognito
2. **Rate Limiting**: Add throttling policies
3. **Content Filtering**: Enhance safety measures
4. **Monitoring**: Set up comprehensive logging and alerting

### Performance Optimization

1. **Lambda Configuration**: Optimize memory and timeout settings
2. **API Gateway Caching**: Enable response caching
3. **Frontend Optimization**: Implement CDN and compression

### Scaling Considerations

1. **Lambda Concurrency**: Monitor and adjust reserved concurrency
2. **API Gateway Limits**: Understand and plan for rate limits
3. **Bedrock Quotas**: Monitor token usage and request quotas

## Support and Maintenance

### Regular Tasks

1. **Monitor Costs**: Review AWS billing regularly
2. **Update Dependencies**: Keep packages up to date
3. **Security Patches**: Apply security updates promptly
4. **Performance Review**: Monitor and optimize performance

### Backup and Recovery

1. **Code Repository**: Ensure code is backed up in version control
2. **Infrastructure as Code**: CloudFormation templates serve as backup
3. **Configuration**: Document all configuration changes

For additional support, refer to the main README.md file or create an issue in the repository.
