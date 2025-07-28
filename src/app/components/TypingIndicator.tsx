'use client';

export function TypingIndicator() {
  return (
    <div className="flex items-center space-x-2">
      <div className="typing-indicator">
        <div 
          className="typing-dot" 
          style={{ '--delay': '0ms' } as React.CSSProperties}
        />
        <div 
          className="typing-dot" 
          style={{ '--delay': '150ms' } as React.CSSProperties}
        />
        <div 
          className="typing-dot" 
          style={{ '--delay': '300ms' } as React.CSSProperties}
        />
      </div>
      <span className="text-sm text-gray-500">AI is thinking...</span>
    </div>
  );
}
