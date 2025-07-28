'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage } from '@/types/chat';
import { ChatMessage as WebSocketChatMessage } from '@/types/websocket';
import { MessageBubble } from './MessageBubble';
import { ChatInput } from './ChatInput';
import { QuickStartGrid } from './QuickStartGrid';
import { TypingIndicator } from './TypingIndicator';
import { ChatHeader } from './ChatHeader';
import { useChatConnection } from '@/hooks/useChatConnection';

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Generate session ID on mount
  useEffect(() => {
    setSessionId(crypto.randomUUID());
  }, []);

  // Initialize chat connection with streaming support
  const chatConnection = useChatConnection({
    onMessage: (message: WebSocketChatMessage) => {
      // Replace the streaming message with the final one
      setMessages(prev => {
        const withoutStreaming = prev.filter(msg => !msg.isStreaming);
        // Convert websocket message to chat message format
        const finalMessage: ChatMessage = {
          ...message,
          id: message.id || crypto.randomUUID()
        };
        return [...withoutStreaming, finalMessage];
      });
      
      // Set completion state
      setIsStreaming(false);
      setIsLoading(false);
    },
    onStreamingUpdate: (content: string, isComplete: boolean) => {
      // Update the streaming message
      setMessages(prev => prev.map((msg, index) => 
        index === prev.length - 1 && msg.isStreaming
          ? { ...msg, content: content }
          : msg
      ));
      
      if (isComplete) {
        setIsStreaming(false);
        setIsLoading(false);
      }
    },
    onError: (error: string) => {
      console.error('Chat error:', error);
      setIsLoading(false);
      setIsStreaming(false);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
    onLoadingStateChange: (state) => {
      setIsLoading(state === 'sending' || state === 'streaming');
      setIsStreaming(state === 'streaming');
    }
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);

    // Add streaming placeholder for assistant response
    const streamingMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, streamingMessage]);

    // Send message via connection (WebSocket or HTTP streaming)
    try {
      await chatConnection.sendMessage(content.trim(), messages);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Error handling is done in the connection hook
    }
  }, [isLoading, messages, chatConnection]);

  const handleQuickStart = (prompt: string) => {
    sendMessage(prompt);
  };

  const clearChat = () => {
    setMessages([]);
    setSessionId(crypto.randomUUID());
  };

  const showQuickStarts = messages.length === 0;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <ChatHeader onClearChat={clearChat} messageCount={messages.length} />
      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto chat-container px-4 py-6"
      >
        <div className="max-w-4xl mx-auto">
          {showQuickStarts ? (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    AI Chat Assistant
                  </h1>
                  <p className="text-lg text-gray-600">
                    How can I help you today? Choose a quick start or ask me anything.
                  </p>
                </div>
              </div>
              
              <QuickStartGrid onQuickStart={handleQuickStart} />
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              
              {isLoading && !isStreaming && (
                <div className="flex justify-start">
                  <div className="chat-message assistant">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto">
          <ChatInput 
            onSendMessage={sendMessage} 
            disabled={isLoading}
            placeholder={showQuickStarts ? "Ask me anything..." : "Continue the conversation..."}
          />
        </div>
      </div>
    </div>
  );
}
