import { QuickStart } from '@/types/chat';

export const quickStarts: QuickStart[] = [
  {
    id: 'explain-concept',
    title: 'Explain a Complex Topic',
    description: 'Get clear explanations of difficult concepts',
    prompt: 'Can you explain quantum computing in simple terms?',
    category: 'general'
  },
  {
    id: 'code-review',
    title: 'Code Review & Optimization',
    description: 'Get feedback on your code and suggestions for improvement',
    prompt: 'Can you review this JavaScript function and suggest improvements?',
    category: 'technical'
  },
  {
    id: 'business-strategy',
    title: 'Business Strategy Help',
    description: 'Get insights on business decisions and planning',
    prompt: 'What are the key factors to consider when launching a new product?',
    category: 'business'
  },
  {
    id: 'creative-writing',
    title: 'Creative Writing Assistant',
    description: 'Help with writing, brainstorming, and creative projects',
    prompt: 'Help me brainstorm ideas for a short story about time travel',
    category: 'creative'
  },
  {
    id: 'problem-solving',
    title: 'Problem Solving',
    description: 'Work through challenges step by step',
    prompt: 'I need help breaking down a complex problem into manageable steps',
    category: 'general'
  },
  {
    id: 'learning-plan',
    title: 'Create Learning Plan',
    description: 'Get structured learning paths for new skills',
    prompt: 'Create a 30-day learning plan for Python programming',
    category: 'technical'
  },
  {
    id: 'data-analysis',
    title: 'Data Analysis Help',
    description: 'Assistance with data interpretation and insights',
    prompt: 'How can I analyze customer feedback data to identify trends?',
    category: 'technical'
  },
  {
    id: 'presentation-tips',
    title: 'Presentation & Communication',
    description: 'Improve your presentation and communication skills',
    prompt: 'Give me tips for delivering an engaging technical presentation',
    category: 'business'
  }
];

export const getQuickStartsByCategory = (category?: string): QuickStart[] => {
  if (!category) return quickStarts;
  return quickStarts.filter(qs => qs.category === category);
};

export const getRandomQuickStarts = (count: number = 4): QuickStart[] => {
  const shuffled = [...quickStarts].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
