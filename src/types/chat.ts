export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export interface QuickStart {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'general' | 'technical' | 'business' | 'creative';
}

export interface ChatRequest {
  message: string;
  conversationHistory?: ChatMessage[];
  sessionId?: string;
}

export interface ChatResponse {
  response: string;
  timestamp: string;
  sessionId: string;
  error?: string;
  blocked?: boolean;
}
