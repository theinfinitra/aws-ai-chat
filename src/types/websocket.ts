/**
 * WebSocket message types for AI Chat
 */

// Message sent from client to server
export interface ClientMessage {
  action: 'sendMessage' | 'message';
  message: string;
  sessionId: string;
  conversationHistory: ChatMessage[];
  timestamp: string;
}

// Messages received from server
export interface ServerMessage {
  type: 'chunk' | 'complete' | 'error';
  content?: string;
  error?: string;
  sessionId?: string;
  timestamp?: string;
}

// Chat message structure (matches existing interface)
export interface ChatMessage {
  id?: string; // Optional for websocket messages, required for UI messages
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

// WebSocket connection states
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocket hook options
export interface WebSocketOptions {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onMessage?: (message: ServerMessage) => void;
  onError?: (error: string) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// Streaming state for managing real-time content
export interface StreamingState {
  isStreaming: boolean;
  currentMessage: string;
  chunkCount: number;
  sessionId: string;
}
