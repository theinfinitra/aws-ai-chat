'use client';

import { useState } from 'react';
import { quickStarts, getQuickStartsByCategory } from '@/lib/quickStarts';
import { QuickStart } from '@/types/chat';

interface QuickStartGridProps {
  onQuickStart: (prompt: string) => void;
}

const categories = [
  { id: 'all', name: 'All', icon: '🌟' },
  { id: 'general', name: 'General', icon: '💬' },
  { id: 'technical', name: 'Technical', icon: '⚡' },
  { id: 'business', name: 'Business', icon: '📊' },
  { id: 'creative', name: 'Creative', icon: '🎨' },
];

export function QuickStartGrid({ onQuickStart }: QuickStartGridProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const filteredQuickStarts = selectedCategory === 'all' 
    ? quickStarts 
    : getQuickStartsByCategory(selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return '💬';
      case 'technical': return '⚡';
      case 'business': return '📊';
      case 'creative': return '🎨';
      default: return '🌟';
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              selectedCategory === category.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300 hover:bg-primary-50'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Quick Start Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredQuickStarts.map((quickStart) => (
          <button
            key={quickStart.id}
            onClick={() => onQuickStart(quickStart.prompt)}
            className="quick-start-button group"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <span className="text-lg">{getCategoryIcon(quickStart.category)}</span>
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                  {quickStart.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {quickStart.description}
                </p>
                <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 group-hover:bg-gray-100 transition-colors">
                  &ldquo;{quickStart.prompt}&rdquo;
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {filteredQuickStarts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No quick starts found for this category.</p>
        </div>
      )}
    </div>
  );
}
