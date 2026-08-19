'use client';

import { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, User, Bot, Loader2 } from 'lucide-react';

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error } = useChat({
    onError: (e) => {
      console.error('Chat error:', e);
    }
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    setInput('');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 p-4 rounded-full shadow-lg text-white transition-transform hover:scale-105 z-50 flex items-center justify-center ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        style={{ background: 'var(--color-brand)' }}
        aria-label="Open AI Assistant"
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 w-[380px] max-w-[calc(100vw-3rem)] h-[600px] max-h-[calc(100vh-6rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-50 transition-all origin-bottom-right duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'
        }`}
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-5 py-4 text-white"
          style={{ background: 'var(--color-brand)' }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">Dooars Tutors Assistant</h3>
              <p className="text-white/80 text-xs">Ask me to find a tutor</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#f8fafc] dark:bg-slate-950">
          {messages.length === 0 && (
            <div className="text-center text-slate-500 dark:text-slate-400 mt-10">
              <MessageCircle size={40} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <p className="font-medium text-slate-600 dark:text-slate-300">How can I help you today?</p>
              <p className="text-sm mt-1">Try asking: &quot;Find me a physics tutor under 2000&quot;</p>
            </div>
          )}

          {messages.map((m) => (
            <div 
              key={m.id} 
              className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-slate-200 dark:bg-slate-700' : ''}`}
                   style={m.role === 'user' ? {} : { background: 'var(--color-brand)' }}>
                {m.role === 'user' ? <User size={16} className="text-slate-600 dark:text-slate-300" /> : <Bot size={16} className="text-white" />}
              </div>
              <div 
                className={`p-3 rounded-2xl text-sm shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tr-sm' 
                    : 'text-white rounded-tl-sm'
                }`}
                style={m.role === 'user' ? {} : { background: 'var(--color-brand)' }}
              >
                <div className="whitespace-pre-wrap">{m.parts?.map(p => p.type === 'text' ? p.text : '').join('') || ''}</div>
              </div>
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
               <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--color-brand)' }}>
                 <Bot size={16} className="text-white" />
               </div>
               <div className="p-4 rounded-2xl rounded-tl-sm text-sm shadow-sm text-white flex items-center gap-2" style={{ background: 'var(--color-brand)' }}>
                 <Loader2 size={16} className="animate-spin" /> Thinking...
               </div>
            </div>
          )}
          
          {error && (
            <div className="text-center p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {error.message || 'An error occurred. Please try again.'}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              value={input || ''}
              onChange={handleInputChange}
              placeholder="Ask something..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:border-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              style={{ '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={isLoading || !(input || '').trim()}
              className="absolute right-2 p-2 rounded-full text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ background: 'var(--color-brand)' }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
