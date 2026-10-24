import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2, ChevronUp } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const FloatingChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste! I am your ApnaLocal AI assistant. How can I help you find electricians, plumbers, or services in Jaunpur today?' }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const chatRes = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          history: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
          modelType: 'general',
          useMaps: false
        }),
      });
      const chatData = await chatRes.json();
      setMessages(prev => [...prev, { role: 'model', text: chatData.text || 'I am here to help with Jaunpur local services!' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered a connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-6 z-50">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white p-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all flex items-center gap-3 group animate-bounce hover:animate-none"
          title="Open AI Chatbot"
        >
          <Sparkles className="w-6 h-6 text-emerald-400" />
          <span className="font-bold text-sm hidden sm:inline pr-1">Ask AI Assistant</span>
        </button>
      )}

      {/* Chat Window Popup */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[380px] h-[520px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-xl">
          {/* Header */}
          <div className="p-4 bg-slate-900 dark:bg-slate-950 text-white flex items-center justify-between border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Sparkles size={18} />
              </div>
              <div>
                <h3 className="font-bold text-sm font-display">ApnaLocal AI Chat</h3>
                <p className="text-[10px] text-cyan-400 font-mono font-medium">Online · Jaunpur Assistant</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-100 dark:border-white/5 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
            {['AC Repair Olandganj', 'Plumber Civil Lines', 'Electrician Shahganj', 'Best Tutor'].map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => setInput(suggestion)}
                className="text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer font-medium"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-900 dark:bg-white/10 text-white'}`}>
                    {msg.role === 'user' ? <User size={13} /> : <Bot size={13} />}
                  </div>
                  <div className={`p-3 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-medium rounded-tr-none shadow-sm' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-white/5 rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <div className="w-7 h-7 rounded-full bg-slate-900 dark:bg-white/10 text-white flex items-center justify-center shrink-0">
                    <Bot size={13} />
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-tl-none flex items-center gap-2 border border-slate-200/50 dark:border-white/5">
                    <Loader2 size={13} className="animate-spin text-cyan-500" />
                    <span className="text-xs text-slate-400 font-medium">Gemini is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t border-slate-100 dark:border-white/10 bg-white dark:bg-slate-900">
            <div className="relative">
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about Jaunpur services..."
                className="w-full h-11 pl-3 pr-12 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-1.5 top-1.5 w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Send size={14} />
              </button>
            </div>
            <div className="text-[9px] text-slate-400 dark:text-slate-500 text-center mt-2 uppercase tracking-wider font-mono font-medium">
              Powered by Gemini 2.5 Flash
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingChatWidget;
