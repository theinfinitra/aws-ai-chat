# AWS AI Chat

A clean, modern AI chat application with AWS backend infrastructure. Features a Next.js frontend with quick-start prompts and AWS Bedrock integration for intelligent responses.

## Features

- 🤖 **AI-Powered Chat** - Powered by AWS Bedrock (Amazon Nova Pro)
- ⚡ **Real-time Streaming** - Live response streaming with WebSocket and HTTP fallback
- 🚀 **Quick Start Prompts** - Pre-built prompts for common use cases
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile
- 🔄 **Adaptive Connection** - WebSocket-first with HTTP streaming fallback
- 🎨 **Modern UI** - Clean, professional interface with Tailwind CSS
- 🔒 **Content Filtering** - Basic safety guidelines and content moderation
- ☁️ **AWS Infrastructure** - Scalable backend with Lambda and API Gateway
- 🌍 **Multi-Region Support** - Deploy to any supported AWS region
- 🚀 **Easy Deployment** - One-command deployment with CloudFormation

## Architecture

### Frontend
- **Next.js 15** with React 19
- **Tailwind CSS** for styling
- **TypeScript** for type safety
- **React Markdown** for rich text rendering
- **Framer Motion** for animations

### Backend
- **AWS Lambda** for serverless compute
- **API Gateway** for REST API
- **AWS Bedrock** for AI model inference
- **CloudFormation** for infrastructure as code

## Quick Start

### Prerequisites

1. **AWS Account** with Bedrock access enabled
2. **AWS CLI** configured with appropriate permissions
3. **Node.js 18+** installed
4. **Git** for version control

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd aws-ai-chat
npm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your AWS configuration
```

### 3. Deploy Backend Infrastructure

```bash
cd aws-infrastructure

# Deploy to development (replace with your AWS profile and region)
make deploy-dev PROFILE=my-aws-profile REGION=us-east-1

# Or deploy to production
make deploy-prod PROFILE=my-aws-profile REGION=us-west-2
```

**Required Parameters:**
- `PROFILE` - Your AWS CLI profile name
- `REGION` - AWS region (us-east-1, us-west-2, eu-west-1, ap-southeast-1)

This will:
- Create Lambda function for chat API
- Create WebSocket Lambda function for real-time streaming
- Set up REST API Gateway with CORS and streaming support
- Set up WebSocket API Gateway for real-time connections
- Configure IAM roles and permissions
- Output both REST API and WebSocket API URLs

### 4. Verify Deployment and Setup Environment

After successful deployment, verify and generate your environment configuration:

```bash
cd aws-infrastructure
make verify PROFILE=my-aws-profile REGION=us-east-1
```

This will:
- Test both REST and WebSocket API endpoints
- Generate `.env.dev.generated` with the correct URLs
- Verify the deployment is working

### 5. Configure Frontend

Copy the generated environment configuration:

```bash
# From the project root
./setup-env.sh dev
```

Or manually copy the generated file:
```bash
cp .env.dev.generated .env.local
```

Your `.env.local` should look like:
```bash
# AWS Configuration
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# API Configuration  
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-id.execute-api.us-east-1.amazonaws.com/dev

# Environment
NODE_ENV=development
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see your AI chat application!

**Note**: The application will automatically attempt to use WebSocket for real-time streaming. If WebSocket connection fails, it will seamlessly fall back to HTTP streaming. Both connection types provide the same user experience.

## Deployment

### Development Environment

```bash
cd aws-infrastructure
make deploy-dev PROFILE=my-aws-profile REGION=us-east-1
```

### Production Environment

```bash
cd aws-infrastructure
make deploy-prod PROFILE=my-aws-profile REGION=us-west-2
```

**Available Commands:**
- `make deploy-dev PROFILE=<profile> REGION=<region>` - Deploy to development
- `make deploy-prod PROFILE=<profile> REGION=<region>` - Deploy to production  
- `make status PROFILE=<profile> REGION=<region>` - Check stack status
- `make validate PROFILE=<profile> REGION=<region>` - Validate templates
- `make test-aws PROFILE=<profile> REGION=<region>` - Test AWS connectivity

### Frontend Deployment (Amplify)

The CloudFormation templates include AWS Amplify setup for hosting:

1. Update `parameters/prod-frontend.json` with your GitHub repository
2. Deploy frontend stack: `make deploy-prod`
3. Amplify will automatically build and deploy your app

## Configuration

### Environment Variables

#### Development (.env.local)
```bash
AWS_REGION=us-east-1
AWS_PROFILE=your-aws-profile
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
```

#### Production (Amplify Environment Variables)
```bash
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
NEXT_PUBLIC_API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/prod
```

### AWS Permissions

Your AWS user/role needs the following permissions:
- CloudFormation full access
- Lambda full access
- API Gateway full access
- IAM role creation
- Bedrock model access
- Amplify (for frontend deployment)

### Bedrock Model Access

Ensure you have access to the Amazon Nova Pro model in your AWS region:
1. Go to AWS Bedrock console
2. Navigate to "Model access"
3. Request access to "Amazon Nova Pro"

## Customization

### Quick Start Prompts

Edit `src/lib/quickStarts.ts` to customize the quick start prompts:

```typescript
export const quickStarts: QuickStart[] = [
  {
    id: 'custom-prompt',
    title: 'Your Custom Prompt',
    description: 'Description of what this prompt does',
    prompt: 'The actual prompt text',
    category: 'general' // or 'technical', 'business', 'creative'
  },
  // ... more prompts
];
```

### AI Assistant Personality

Modify the system prompt in `src/app/api/chat/route.ts` or the Lambda function to customize the AI's personality and capabilities.

### Styling

The app uses Tailwind CSS. Key customization points:
- `tailwind.config.js` - Theme colors and extensions
- `src/app/globals.css` - Global styles and component classes
- Component files - Individual component styling

## Project Structure

```
aws-ai-chat/
├── src/
│   ├── app/
│   │   ├── api/chat/          # Chat API route
│   │   ├── components/        # React components
│   │   ├── globals.css        # Global styles
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Main page
│   ├── lib/
│   │   └── quickStarts.ts     # Quick start prompts
│   └── types/
│       └── chat.ts            # TypeScript types
├── aws-infrastructure/
│   ├── backend.yaml           # Backend CloudFormation
│   ├── frontend.yaml          # Frontend CloudFormation
│   ├── parameters/            # Environment parameters
│   └── Makefile              # Deployment commands
└── package.json
```

## Available Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

### Infrastructure
```bash
make deploy-dev      # Deploy to development
make deploy-prod     # Deploy to production
make status          # Check stack status
make clean           # Clean temporary files
```

## Troubleshooting

### Common Issues

1. **Bedrock Access Denied**
   - Ensure you have requested access to Amazon Nova Pro in Bedrock console
   - Check your AWS region supports the model

2. **CORS Errors**
   - Verify API Gateway CORS configuration
   - Check that your frontend URL is in allowed origins

3. **Lambda Timeout**
   - Increase timeout in CloudFormation template
   - Check CloudWatch logs for specific errors

4. **Build Failures**
   - Ensure Node.js version is 18+
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

### Logs and Monitoring

- **Lambda Logs**: CloudWatch Logs → `/aws/lambda/aws-ai-chat-{env}-chat`
- **API Gateway Logs**: CloudWatch Logs → API Gateway execution logs
- **Frontend Logs**: Browser developer console

## Security Considerations

- Content filtering is implemented but basic - consider enhanced filtering for production
- API has no authentication - add API keys or Cognito for production use
- CORS is configured for development - restrict origins for production
- Monitor usage to prevent abuse
- **Environment files (.env*) are excluded from git** - never commit sensitive credentials
- Use the verification script to check: `./scripts/verify-gitignore.sh`

## Cost Optimization

- Lambda is pay-per-request
- Bedrock charges per token
- API Gateway charges per request
- Consider implementing request throttling for cost control

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Run `./scripts/verify-gitignore.sh` to ensure no sensitive files are committed
6. Submit a pull request

### Security Guidelines

- Never commit environment files (`.env*` except `.env.example`)
- Keep AWS credentials out of the repository
- Use the provided `.gitignore` which excludes sensitive files
- Run the verification script before committing: `./scripts/verify-gitignore.sh`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review AWS CloudWatch logs
3. Open an issue in the repository
