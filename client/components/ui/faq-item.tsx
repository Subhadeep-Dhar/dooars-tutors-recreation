'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div 
      style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} 
      className="transition-all overflow-hidden group hover:-translate-y-1 md:hover:-translate-y-1"
    >
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full text-left p-6 md:pb-3 flex justify-between items-start md:cursor-default md:pointer-events-none cursor-pointer pointer-events-auto"
      >
        <h3 className="font-bold mb-0 md:mb-3 text-base" style={{ color: 'var(--text-primary)' }}>{question}</h3>
        <ChevronDown 
          size={20} 
          className="md:hidden mt-0.5 ml-4 shrink-0 transition-transform duration-200" 
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none', color: 'var(--text-muted)' }} 
        />
      </button>
      <div className={`px-6 pb-6 pt-2 md:pt-0 ${isOpen ? 'block' : 'hidden'} md:block`}>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          {answer}
        </p>
      </div>
    </div>
  );
}
