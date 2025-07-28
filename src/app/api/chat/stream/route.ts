import { NextRequest, NextResponse } from 'next/server';
import { 
  BedrockRuntimeClient, 
  InvokeModelWithResponseStreamCommand
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

// Generic AI assistant system prompt
const SYSTEM_PROMPT = `You are a helpful, knowledgeable, and professional AI assistant. You provide accurate, clear, and useful responses to a wide variety of questions and tasks.

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

// Streaming model invocation
async function invokeModelStream(prompt: string, conversationHistory: ChatMessage[] = []): Promise<ReadableStream> {
  try {
    // Build conversation context with proper role alternation
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];

    // Process conversation history to ensure role alternation
    const processedHistory = conversationHistory.slice(-10);
    let lastRole: 'user' | 'assistant' | null = null;

    for (const msg of processedHistory) {
      // Skip consecutive messages with the same role
      if (msg.role !== lastRole) {
        messages.push({
          role: msg.role,
          content: msg.content
        });
        lastRole = msg.role;
      }
    }

    // Add current prompt, ensuring it follows proper role alternation
    if (lastRole !== 'user') {
      messages.push({
        role: 'user',
        content: prompt
      });
    } else {
      // If the last message was from user, add a minimal assistant acknowledgment
      messages.push({
        role: 'assistant',
        content: 'I understand. Let me help you with that.'
      });
      messages.push({
        role: 'user',
        content: prompt
      });
    }

    // Convert messages to Nova Pro format
    const novaMessages = messages.map(msg => ({
      role: msg.role,
      content: [{ text: msg.content }]
    }));

    const command = new InvokeModelWithResponseStreamCommand({
      modelId: MODEL_ID,
      body: JSON.stringify({
        schemaVersion: 'messages-v1',
        system: [{ text: SYSTEM_PROMPT }],
        messages: novaMessages,
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
    
    if (!response.body) {
      throw new Error('No response body received');
    }

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response.body!) {
            if (chunk.chunk?.bytes) {
              const chunkData = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
              
              // Nova Pro streaming format
              if (chunkData.contentBlockDelta?.delta?.text) {
                const text = chunkData.contentBlockDelta.delta.text;
                controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`));
              } else if (chunkData.messageStop) {
                controller.enqueue(new TextEncoder().encode(`data: [DONE]\n\n`));
                break;
              }
            }
          }
        } catch (error) {
          console.error('Streaming error:', error);
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

  } catch (error) {
    console.error('Model invocation failed:', error);
    throw error;
  }
}

// Handle HEAD requests for streaming capability testing
export async function HEAD() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'X-Streaming-Support': 'true'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, conversationHistory = [] } = body;

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

    // Get streaming response from Bedrock
    const stream = await invokeModelStream(message, conversationHistory);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('AI Chat Stream API Error:', error);
    
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
