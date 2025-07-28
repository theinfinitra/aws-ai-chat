'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { ServerMessage, ClientMessage, ChatMessage } from '@/types/websocket';

type LoadingState = 'idle' | 'sending' | 'connecting' | 'streaming' | 'complete';
type ConnectionType = 'websocket' | 'http';

interface UseChatConnectionOptions {
  onMessage?: (message: ChatMessage) => void;
  onStreamingUpdate?: (content: string, isComplete: boolean) => void;
  onError?: (error: string) => void;
  onLoadingStateChange?: (state: LoadingState) => void;
}

export function useChatConnection(options: UseChatConnectionOptions = {}) {
  const { onMessage, onStreamingUpdate, onError, onLoadingStateChange } = options;
  
  // Connection state
  const [connectionType, setConnectionType] = useState<ConnectionType>('websocket');
  const [isConnected, setIsConnected] = useState(false);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [sessionId, setSessionId] = useState<string>('');
  
  // Refs for HTTP fallback
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingContentRef = useRef<string>('');
  
  // Initialize session ID
  useEffect(() => {
    if (!sessionId) {
      setSessionId(`chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    }
  }, [sessionId]);

  // WebSocket connection
  const websocketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || '';
  
  const {
    connectionState: wsConnectionState,
    isConnected: wsIsConnected,
    connect: wsConnect,
    disconnect: wsDisconnect,
    sendMessage: wsSendMessage
  } = useWebSocket(websocketUrl, {
    autoConnect: false, // We'll manage connection manually
    onMessage: (message: ServerMessage) => {
      if (message.type === 'chunk' && message.content) {
        streamingContentRef.current += message.content;
        onStreamingUpdate?.(streamingContentRef.current, false);
      } else if (message.type === 'complete') {
        onStreamingUpdate?.(streamingContentRef.current, true);
        setLoadingState('complete');
        
        // Create final message
        const finalMessage: ChatMessage = {
          role: 'assistant',
          content: streamingContentRef.current,
          timestamp: new Date().toISOString(),
          isStreaming: false
        };
        onMessage?.(finalMessage);
        
        // Reset streaming content
        streamingContentRef.current = '';
        setLoadingState('idle');
      } else if (message.type === 'error') {
        onError?.(message.error || 'Server error');
        setLoadingState('idle');
      }
    },
    onConnect: () => {
      setIsConnected(true);
      setConnectionType('websocket');
    },
    onDisconnect: () => {
      setIsConnected(false);
    },
    onError: () => {
      setConnectionType('http');
      setIsConnected(false);
    }
  });

  // Initialize connection (try WebSocket first)
  const initializeConnection = useCallback(async () => {
    if (!websocketUrl) {
      // No WebSocket URL provided, use HTTP only
      setConnectionType('http');
      setIsConnected(true);
      return;
    }

    try {
      // Try WebSocket first - but don't trigger loading states for initialization
      await wsConnect();
      
      // Wait a moment to see if connection succeeds
      setTimeout(() => {
        if (wsConnectionState === 'connected') {
          setConnectionType('websocket');
          setIsConnected(true);
        } else if (wsConnectionState === 'error' || wsConnectionState === 'disconnected') {
          setConnectionType('http');
          setIsConnected(true); // HTTP is always "connected"
        }
      }, 2000);
      
    } catch {
      setConnectionType('http');
      setIsConnected(true); // HTTP is always "connected"
    }
  }, [wsConnect, wsConnectionState, websocketUrl]);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();
  }, [initializeConnection]);

  // Update loading state callback
  useEffect(() => {
    onLoadingStateChange?.(loadingState);
  }, [loadingState, onLoadingStateChange]);

  // HTTP streaming fallback
  const attemptStreamingResponse = useCallback(async (
    message: string, 
    conversationHistory: ChatMessage[]
  ): Promise<void> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory,
          sessionId
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      streamingContentRef.current = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              onStreamingUpdate?.(streamingContentRef.current, true);
              setLoadingState('complete');
              
              // Create final message
              const finalMessage: ChatMessage = {
                role: 'assistant',
                content: streamingContentRef.current,
                timestamp: new Date().toISOString(),
                isStreaming: false
              };
              onMessage?.(finalMessage);
              
              // Reset streaming content
              streamingContentRef.current = '';
              setLoadingState('idle');
              return;
            }
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                streamingContentRef.current += parsed.text;
                onStreamingUpdate?.(streamingContentRef.current, false);
              }
            } catch {
              // Ignore parsing errors for individual chunks
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return; // Request was cancelled
      }
      
      console.error('HTTP streaming error:', error);
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [sessionId, onMessage, onStreamingUpdate]);

  // Send message via HTTP
  const sendViaHTTP = useCallback(async (
    message: string,
    conversationHistory: ChatMessage[]
  ): Promise<void> => {
    try {
      await attemptStreamingResponse(message, conversationHistory);
    } catch (error) {
      console.error('HTTP request failed:', error);
      onError?.('I apologize, but I encountered an error processing your request. Please try again.');
      setLoadingState('idle');
    }
  }, [attemptStreamingResponse, onError]);

  // Main send message function
  const sendMessage = useCallback(async (
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<void> => {
    if (loadingState !== 'idle') {
      return; // Already processing a message
    }

    setLoadingState('sending');
    streamingContentRef.current = '';

    if (connectionType === 'websocket' && wsIsConnected) {
      // Try WebSocket first
      try {
        setLoadingState('streaming');
        
        const clientMessage: ClientMessage = {
          action: 'message',
          message: message,
          sessionId: sessionId,
          conversationHistory: conversationHistory,
          timestamp: new Date().toISOString()
        };

        const success = wsSendMessage(clientMessage);
        if (!success) {
          throw new Error('Failed to send WebSocket message');
        }
        
        // WebSocket message sent successfully
        // Response will be handled by the onMessage callback
        
      } catch (error) {
        console.log('WebSocket send failed, falling back to HTTP:', error);
        setConnectionType('http');
        await sendViaHTTP(message, conversationHistory);
      }
    } else {
      // Use HTTP streaming
      await sendViaHTTP(message, conversationHistory);
    }
  }, [
    loadingState,
    connectionType,
    wsIsConnected,
    sessionId,
    wsSendMessage,
    sendViaHTTP
  ]);

  // Stop current message
  const stopMessage = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setLoadingState('idle');
    streamingContentRef.current = '';
  }, []);

  return {
    // Connection info (for debugging - not exposed to UI)
    connectionType,
    isConnected,
    loadingState,
    sessionId,
    
    // Main functions
    sendMessage,
    stopMessage,
    
    // Connection management
    reconnect: initializeConnection
  };
}
