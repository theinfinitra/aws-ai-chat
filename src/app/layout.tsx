import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Chat Assistant',
  description: 'Intelligent AI assistant for your questions and tasks',
  keywords: 'AI chat, assistant, artificial intelligence, help',
  openGraph: {
    title: 'AI Chat Assistant',
    description: 'Intelligent AI assistant for your questions and tasks',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Chat Assistant',
    description: 'Intelligent AI assistant for your questions and tasks',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
