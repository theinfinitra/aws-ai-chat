import { NextRequest, NextResponse } from 'next/server';
import { 
  BedrockRuntimeClient, 
  InvokeModelCommand
} from '@aws-sdk/client-bedrock-runtime';
import { fromIni } from '@aws-sdk/credential-providers';

// Initialize Bedrock client with environment-specific credentials
const createBedrockClient = () => {
  const baseConfig = {
    region: process.env.AWS_REGION || 'us-east-1'
  };

  // For local development, use profile if specified
  if (process.env.NODE_ENV === 'development' && process.env.AWS_PROFILE) {
    return new BedrockRuntimeClient({
      ...baseConfig,
      credentials: fromIni({
        profile: process.env.AWS_PROFILE
      })
    });
  }

  // For production, use IAM role or default credentials
  return new BedrockRuntimeClient(baseConfig);
};

const bedrockClient = createBedrockClient();

// Configuration
const MODEL_ID = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  sessionId?: string;
}

// Basic content filtering
async function applyBasicFiltering(content: string): Promise<{ isBlocked: boolean; reason?: string }> {
  const blockedPatterns = [
    /\b(spam|inappropriate|offensive)\b/i,
    // Add more patterns as needed
  ];
  
  for (const pattern of blockedPatterns) {
    if (pattern.test(content)) {
      return {
        isBlocked: true,
        reason: 'Content contains inappropriate language',
      };
    }
  }
  
  return { isBlocked: false };
}

// Direct model invocation
async function invokeModel(prompt: string, conversationHistory: ChatMessage[] = []): Promise<string> {
  try {
    // Generic AI assistant system prompt
    const systemPrompt = `You are a helpful, knowledgeable, and professional AI assistant. You provide accurate, clear, and useful responses to a wide variety of questions and tasks.

## Your Capabilities:
- Answer questions on diverse topics including technology, science, business, arts, and general knowledge
- Help with problem-solving and analysis
- Assist with writing, editing, and creative tasks
- Provide explanations and tutorials
- Offer guidance on learning and skill development
- Help with coding and technical questions
- Support business and professional tasks

## Response Guidelines:
1. **Be Helpful**: Provide comprehensive and actionable responses
2. **Be Accurate**: Only provide information you're confident about
3. **Be Clear**: Use clear language appropriate for the user's level
4. **Be Professional**: Maintain a friendly but professional tone
5. **Be Concise**: Provide thorough answers without unnecessary verbosity
6. **Be Safe**: Avoid harmful, inappropriate, or misleading content

## Response Format:
- Use markdown formatting for better readability
- Include code blocks for technical examples
- Use bullet points and numbered lists when appropriate
- Structure longer responses with clear headings

You should be conversational and engaging while maintaining professionalism. If you're unsure about something, acknowledge the uncertainty and suggest ways the user might find more specific information.`;

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      body: JSON.stringify({
        schemaVersion: 'messages-v1',
        system: [{ text: systemPrompt }],
        messages: [
          // Include recent conversation history for context
          ...conversationHistory.slice(-5).map(msg => ({
            role: msg.role,
            content: [{ text: msg.content }]
          })),
          {
            role: 'user',
            content: [{ text: prompt }]
          }
        ],
        inferenceConfig: {
          maxTokens: 2000,
          temperature: 0.7,
          topP: 0.9
        }
      }),
      contentType: 'application/json',
      accept: 'application/json',
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    return responseBody.output.message.content[0].text;
  } catch (error) {
    console.error('Model invocation failed:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationHistory = [], sessionId } = body;

    // Validate input
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { error: 'Message is too long. Please keep it under 4000 characters.' },
        { status: 400 }
      );
    }

    // Apply basic filtering
    const filterResult = await applyBasicFiltering(message);
    if (filterResult.isBlocked) {
      return NextResponse.json(
        { 
          error: 'Content blocked by safety guidelines',
          reason: filterResult.reason,
          blocked: true 
        },
        { status: 400 }
      );
    }

    // Get response from Bedrock
    const response = await invokeModel(message, conversationHistory);

    // Apply basic filtering to response
    const responseFilterResult = await applyBasicFiltering(response);
    if (responseFilterResult.isBlocked) {
      return NextResponse.json(
        { 
          error: 'Response blocked by safety guidelines',
          blocked: true 
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || crypto.randomUUID(),
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'I apologize, but I encountered an error processing your request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}
