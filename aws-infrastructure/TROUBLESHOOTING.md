# CloudFormation Troubleshooting Guide

## Common Issues and Solutions

### Lambda Permission SourceArn Patterns

#### ✅ Correct Patterns

**REST API Gateway:**
```yaml
SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiId}/*/*/*"
```

**WebSocket API Gateway:**
```yaml
SourceArn: !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${WebSocketApiId}/*/*"
```

#### ❌ Incorrect Patterns (will cause validation errors)

```yaml
# These will fail validation:
SourceArn: !Sub "${ApiId}/*/POST/chat"           # Missing ARN prefix
SourceArn: !Sub "${ApiId}/*/*"                  # Missing ARN prefix
SourceArn: !Sub "${WebSocketApi}/*/*"           # Missing ARN prefix
```

### Fn::If Function Usage

#### ✅ Correct Usage
```yaml
# Define condition first
Conditions:
  IsProdEnvironment: !Equals [!Ref Environment, prod]

# Use in resources
Value: !If [IsProdEnvironment, "production", "development"]
```

#### ❌ Incorrect Usage
```yaml
# This will fail - nested functions not allowed in Fn::If condition
Value: !If [!Equals [!Ref Environment, prod], "production", "development"]
```

### WebSocket API Routes

#### ✅ Correct Route Keys
- `$connect` - Connection establishment
- `$disconnect` - Connection termination  
- `message` - Custom message route
- `$default` - Default route (optional)

#### ❌ Common Mistakes
- Using REST API route patterns in WebSocket API
- Missing `$` prefix for built-in routes
- Incorrect integration types

### IAM Permissions

#### Required Permissions for WebSocket Lambda
```yaml
- Effect: Allow
  Action:
    - execute-api:ManageConnections
  Resource: 
    - !Sub "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:*/*/*"
```

#### Required Permissions for Bedrock
```yaml
- Effect: Allow
  Action:
    - bedrock:InvokeModel
    - bedrock:InvokeModelWithResponseStream
  Resource: 
    - !Sub "arn:aws:bedrock:${AWS::Region}::foundation-model/${BedrockModelId}"
    - !Sub "arn:aws:bedrock:${AWS::Region}::foundation-model/amazon.nova-*"
```

## Deployment Issues

### Stack Creation Failures

1. **Check IAM Permissions**
   ```bash
   aws sts get-caller-identity --profile your-profile
   ```

2. **Validate Templates**
   ```bash
   make validate PROFILE=your-profile REGION=your-region
   ```

3. **Check Bedrock Model Access**
   ```bash
   aws bedrock list-foundation-models --region your-region --profile your-profile
   ```

### Stack Update Failures

1. **Check for Resource Dependencies**
   - Lambda functions must be created before permissions
   - API Gateway must be deployed before routes

2. **Review CloudFormation Events**
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name aws-ai-chat-backend-dev \
     --profile your-profile \
     --region your-region
   ```

### Lambda Function Issues

1. **Check CloudWatch Logs**
   ```bash
   aws logs describe-log-groups \
     --log-group-name-prefix "/aws/lambda/aws-ai-chat" \
     --profile your-profile \
     --region your-region
   ```

2. **Test Function Directly**
   ```bash
   aws lambda invoke \
     --function-name aws-ai-chat-dev-chat \
     --payload '{"httpMethod":"POST","body":"{\"message\":\"test\"}"}' \
     --profile your-profile \
     --region your-region \
     response.json
   ```

## API Gateway Issues

### CORS Problems

1. **Check OPTIONS Method**
   - Ensure OPTIONS method is configured
   - Verify CORS headers are set correctly

2. **Test CORS Headers**
   ```bash
   curl -X OPTIONS \
     -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     your-api-url
   ```

### WebSocket Connection Issues

1. **Test WebSocket Connection**
   ```javascript
   const ws = new WebSocket('wss://your-websocket-url');
   ws.onopen = () => console.log('Connected');
   ws.onerror = (error) => console.error('Error:', error);
   ```

2. **Check Lambda Logs**
   - Connection events should appear in CloudWatch logs
   - Look for connection/disconnection messages

## Bedrock Issues

### Model Access Denied

1. **Request Model Access**
   - Go to AWS Bedrock Console
   - Navigate to "Model access"
   - Request access to required models

2. **Verify Model Availability**
   ```bash
   aws bedrock list-foundation-models \
     --by-provider amazon \
     --region your-region \
     --profile your-profile
   ```

### Quota Exceeded

1. **Check Service Quotas**
   - Go to AWS Service Quotas Console
   - Search for "Bedrock"
   - Request quota increases if needed

## Debugging Commands

### Useful AWS CLI Commands

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name aws-ai-chat-backend-dev \
  --profile your-profile \
  --region your-region

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name aws-ai-chat-backend-dev \
  --query 'Stacks[0].Outputs' \
  --profile your-profile \
  --region your-region

# Check recent CloudWatch logs
aws logs tail /aws/lambda/aws-ai-chat-dev-chat \
  --follow \
  --profile your-profile \
  --region your-region

# Test API endpoint
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","conversationHistory":[],"sessionId":"test"}' \
  your-api-url
```

### Makefile Commands

```bash
# Validate templates
make validate PROFILE=your-profile REGION=your-region

# Deploy to development
make deploy-dev PROFILE=your-profile REGION=your-region

# Check deployment status
make status PROFILE=your-profile REGION=your-region

# Verify deployment
make verify PROFILE=your-profile REGION=your-region

# Test AWS connectivity
make test-aws PROFILE=your-profile REGION=your-region
```

## Getting Help

1. **Check CloudFormation Events**
   - Look for specific error messages in stack events
   - Check resource creation order

2. **Review CloudWatch Logs**
   - Lambda function logs contain detailed error information
   - API Gateway logs show request/response details

3. **Use AWS Support**
   - For Bedrock access issues
   - For service quota increases
   - For complex deployment problems

4. **Community Resources**
   - AWS CloudFormation documentation
   - AWS Lambda troubleshooting guides
   - API Gateway WebSocket documentation
