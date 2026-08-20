'use client';

import { useState, useEffect } from 'react';
import { useChat } from '@ai-sdk/react';
import { MessageCircle, X, Send, User, Bot, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [queryCount, setQueryCount] = useState(0);
  const { user } = useAuthStore();
  const pathname = usePathname();
  
  const [dailyLimit, setDailyLimit] = useState(1); // Default to 1 before fetch

  // Fetch dynamic AI limit from backend
  useEffect(() => {
    async function fetchLimit() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${apiUrl}/settings/public`);
        const responseData = await res.json();
        if (responseData.success && responseData.data) {
          setDailyLimit(responseData.data.aiDailyLimit || 1);
        }
      } catch (e) {
        console.error('Failed to fetch AI daily limit', e);
      }
    }
    fetchLimit();
  }, []);

  // Initialize query count from local storage
  useEffect(() => {
    if (user) {
      // Use _id instead of id for MongoDB documents
      const userId = (user as any)._id || (user as any).id || 'unknown';
      const storedData = localStorage.getItem(`ai_queries_${userId}`);
      if (storedData) {
        try {
          const { date, count } = JSON.parse(storedData);
          const today = new Date().toISOString().split('T')[0];
          if (date === today) {
            setQueryCount(count);
          } else {
            // New day, reset count
            setQueryCount(0);
            localStorage.setItem(`ai_queries_${userId}`, JSON.stringify({ date: today, count: 0 }));
          }
        } catch (e) {
          console.error('Error parsing query count', e);
        }
      }
    }
  }, [user]);

  const incrementQueryCount = () => {
    if (user) {
      const userId = (user as any)._id || (user as any).id || 'unknown';
      const today = new Date().toISOString().split('T')[0];
      const newCount = queryCount + 1;
      setQueryCount(newCount);
      localStorage.setItem(`ai_queries_${userId}`, JSON.stringify({ date: today, count: newCount }));
    }
  };

  const { messages, sendMessage, status, error, stop } = useChat({
    onError: (e) => {
      console.error('Chat error:', e);
      // Refund the query count if an error occurs
      if (user) {
        setQueryCount(prev => {
          const newCount = Math.max(0, prev - 1);
          const userId = (user as any)._id || (user as any).id || 'unknown';
          const today = new Date().toISOString().split('T')[0];
          localStorage.setItem(`ai_queries_${userId}`, JSON.stringify({ date: today, count: newCount }));
          return newCount;
        });
      }
    }
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || queryCount >= dailyLimit) return;
    
    sendMessage({ role: 'user', parts: [{ type: 'text', text: input }] });
    incrementQueryCount();
    setInput('');
  };

  // Do not render on admin or dashboard routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard')) {
    return null;
  }

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
              <h3 className="font-semibold text-lg leading-tight">Dooars Tutors Agent</h3>
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
              <p className="text-sm mt-1">Try asking: &quot;Find me a physics tutor in Alipurduar&quot;</p>
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
                <div className="whitespace-pre-wrap">{m.parts ? (m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.text).join('') || '') : (m as any).content}</div>
                {(m.parts || (m as any).toolInvocations)?.map((part: any, index: number) => {
                  const isOurTool = part.type === 'tool-showTutorProfiles' || part.toolName === 'showTutorProfiles' || part.type === 'tool-invocation';
                  if (isOurTool) {
                    let tutors = part.result?.tutors || part.output?.tutors || part.input?.tutors || part.args?.tutors;
                    if (tutors && !Array.isArray(tutors)) {
                      tutors = [tutors];
                    }
                    
                    if (tutors && Array.isArray(tutors) && tutors.length > 0) {
                      return (
                        <div key={index} className="flex flex-col gap-3 mt-3 w-[250px] max-w-full">
                          {tutors.map((tutor: any) => (
                            <div key={tutor.id} className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                              <h4 className="font-semibold text-slate-800 dark:text-slate-100">{tutor.name}</h4>
                              <div className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 flex flex-col gap-1">
                                {tutor.experience ? <p>• {tutor.experience} yrs exp.</p> : null}
                                {tutor.subjects?.length > 0 ? <p className="truncate">• {tutor.subjects.join(', ')}</p> : null}
                                {tutor.location ? <p className="truncate">• {tutor.location}</p> : null}
                              </div>
                              <Link 
                                href={`/profiles/${tutor.id}`}
                                className="mt-3 block w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                              >
                                View Profile
                              </Link>
                            </div>
                          ))}
                        </div>
                      );
                    } else if (part.state === 'result' || part.type === 'tool-result' || !isLoading) {
                      // If the tool finished but there are no tutors, don't show the loading spinner forever
                      return (
                        <div key={`tool-empty-${index}`} className="mt-2 text-sm text-slate-600 dark:text-slate-300 italic">
                          No matching tutors found in the database.
                        </div>
                      );
                    } else {
                      // Fallback for 'call', 'partial-call', or any other intermediate state
                      return (
                        <div key={`tool-load-${index}`} className="mt-2 text-xs text-slate-500 flex items-center gap-2 animate-pulse">
                          <Loader2 size={12} className="animate-spin" /> Fetching tutor profiles...
                        </div>
                      );
                    }
                  } else if (part.type === 'tool-invocation' || part.type?.startsWith('tool-')) {
                     // Catch-all for unknown tools or malformed tool parts
                     return (
                        <div key={`tool-unknown-${index}`} className="mt-2 text-xs text-red-400">
                          [Tool Execution Error: {part.toolName || 'Unknown Tool'}]
                        </div>
                     );
                  }
                  return null;
                })}
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
              {error.message === 'An error occurred.' ? 'The AI provider rejected the request. Please check your API keys in the Vercel/Render dashboard.' : (error.message || 'An error occurred. Please try again.')}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
          {isLoading && (
            <div className="absolute -top-10 left-0 right-0 flex justify-center pointer-events-none">
              <button 
                onClick={(e) => { e.preventDefault(); stop(); }}
                className="bg-slate-800 text-slate-200 hover:bg-slate-700 dark:bg-slate-200 dark:text-slate-800 dark:hover:bg-slate-300 pointer-events-auto px-4 py-1.5 rounded-full text-xs font-medium shadow-md flex items-center gap-2 transition-colors"
              >
                <div className="w-2 h-2 bg-current rounded-sm" /> Stop generating
              </button>
            </div>
          )}
          
          {!user ? (
            <div className="flex flex-col items-center text-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <Lock size={16} className="text-slate-400 mb-2" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Sign in to use the Dooars Tutors Agent</p>
              <div className="flex gap-2 w-full">
                <Link href="/login" className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Log in
                </Link>
                <Link href="/register" className="flex-1 py-2 bg-brand text-white rounded-lg text-xs font-medium hover:bg-brand/90 transition-colors" style={{ background: 'var(--color-brand)' }}>
                  Sign up
                </Link>
              </div>
            </div>
          ) : queryCount >= dailyLimit ? (
            <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/30 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800/50 rounded-xl">
              <p className="text-sm font-medium">Daily Limit Reached</p>
              <p className="text-xs mt-1 opacity-80">You've used your {dailyLimit} free AI {dailyLimit === 1 ? 'query' : 'queries'} for today. Please come back tomorrow!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative flex flex-col gap-2">
              <div className="flex items-center relative">
                <input
                  value={input || ''}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent dark:text-white"
                  style={{ '--tw-ring-color': 'var(--color-brand)' } as React.CSSProperties}
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 p-2 bg-brand text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{ background: 'var(--color-brand)' }}
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="text-[10px] text-center text-slate-400">
                AI Queries remaining today: {Math.max(0, dailyLimit - queryCount)}
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
