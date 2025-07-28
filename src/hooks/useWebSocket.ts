'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ServerMessage, ClientMessage, ConnectionState, StreamingState } from '@/types/websocket';

interface UseWebSocketOptions {
  autoConnect?: boolean;
  onMessage?: (message: ServerMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
  reconnectAttempts?: number;
  reconnectInterval?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    autoConnect = false,
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectAttempts = 3,
    reconnectInterval = 3000
  } = options;

  // State
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
  const [streamingState, setStreamingState] = useState<StreamingState>({
    isStreaming: false,
    currentMessage: '',
    chunkCount: 0,
    sessionId: ''
  });

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectCountRef = useRef(0);
  const mountedRef = useRef(true);

  // Derived state
  const isConnected = connectionState === 'connected';

  // Connect function
  const connect = useCallback(() => {
    if (!url) {
      setConnectionState('error');
      return;
    }

    // Don't connect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN || 
        wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }
    
    setConnectionState('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        
        setConnectionState('connected');
        reconnectCountRef.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        
        try {
          const message: ServerMessage = JSON.parse(event.data);
          
          // Update streaming state
          if (message.type === 'chunk') {
            setStreamingState(prev => ({
              ...prev,
              isStreaming: true,
              currentMessage: prev.currentMessage + (message.content || ''),
              chunkCount: prev.chunkCount + 1
            }));
          } else if (message.type === 'complete') {
            setStreamingState(prev => ({
              ...prev,
              isStreaming: false
            }));
          } else if (message.type === 'error') {
            onError?.(message.error || 'Server error');
          }

          onMessage?.(message);
        } catch {
          onError?.('Failed to parse message');
        }
      };

      ws.onclose = (event) => {
        if (!mountedRef.current) return;
        
        wsRef.current = null;
        setConnectionState('disconnected');
        
        // Better error reporting for immediate disconnections
        if (event.code === 1006) {
          onError?.('WebSocket connection failed: Server rejected connection (check Lambda logs)');
        } else if (event.code !== 1000) {
          onError?.(event.reason || `WebSocket closed with code: ${event.code}`);
        }
        
        onDisconnect?.();

        // Auto-reconnect logic
        if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          const delay = reconnectInterval * Math.pow(2, reconnectCountRef.current);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) {
              reconnectCountRef.current++;
              connect();
            }
          }, delay);
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        
        setConnectionState('error');
        onError?.('WebSocket connection failed');
      };

    } catch (error) {
      setConnectionState('error');
      onError?.(error instanceof Error ? error.message : 'Connection failed');
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectAttempts, reconnectInterval]);

  // Disconnect function
  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Close WebSocket if it exists and is not already closed
    if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
      wsRef.current.close(1000, 'Client disconnect');
    }
    
    wsRef.current = null;
    setConnectionState('disconnected');
    setStreamingState({
      isStreaming: false,
      currentMessage: '',
      chunkCount: 0,
      sessionId: ''
    });
  }, []);

  // Send message function
  const sendMessage = useCallback((message: ClientMessage) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      onError?.('WebSocket not connected');
      return false;
    }

    try {
      const messageStr = JSON.stringify(message);
      wsRef.current.send(messageStr);
      return true;
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Failed to send message');
      return false;
    }
  }, [onError]);

  // Auto-connect effect
  useEffect(() => {
    mountedRef.current = true;
    
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close(1000, 'Component unmount');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount/unmount

  return {
    connectionState,
    isConnected,
    streamingState,
    connect,
    disconnect,
    sendMessage
  };
}
