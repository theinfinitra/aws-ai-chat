'use client';

import { ChatInterface } from './components/ChatInterface';

export default function Home() {
  return (
    <div className="h-screen overflow-hidden" style={{ height: '100dvh' }}>
      <ChatInterface />
    </div>
  );
}
