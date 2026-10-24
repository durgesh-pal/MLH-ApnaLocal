import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, Bot, Loader2, AlertCircle, ChevronRight, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste! I am your ApnaLocal AI assistant. Describe the problem you are facing in Jaunpur, and I will help you find the right professional.' }
  ]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [modelType, setModelType] = useState<'complex' | 'general' | 'fast'>('general');
  const [useMaps, setUseMaps] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Phase 1: Understand problem if it's the first message or if it looks like a request
      if (messages.length < 3 && !userMessage.toLowerCase().includes('search') && !userMessage.toLowerCase().includes('map')) {
        const understandRes = await fetch('/api/ai/understand-problem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: userMessage }),
        });
        const analysisData = await understandRes.json();
        setAnalysis(analysisData);
        
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: analysisData.follow_up_question || "I understand. Let me help you find the best professional for this." 
        }]);
      } else {
        // Phase 2: General chat with model selection and grounding
        const chatRes = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: userMessage,
            history: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
            modelType,
            useMaps
          }),
        });
        const chatData = await chatRes.json();
        setMessages(prev => [...prev, { role: 'model', text: chatData.text }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!analysis?.problem_summary && !input) return;
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: analysis?.problem_summary || input }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        setMessages(prev => [...prev, { role: 'model', text: "I've generated a visualization of your problem to help the provider understand better:" }]);
      } else {
        setMessages(prev => [...prev, { role: 'model', text: data.error || 'I could not generate an image at this time.' }]);
      }
    } catch (error) {
      console.error("Image Gen Error:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-10rem)] flex flex-col md:flex-row gap-6 animate-in fade-in duration-500 px-4 sm:px-6 pt-4">
      {/* Settings Panel (Left) */}
      <div className="hidden lg:flex flex-col w-64 gap-6 shrink-0">
        <div className="card p-6 space-y-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Model Selection</h3>
            <div className="space-y-2">
              {[
                { id: 'complex', label: 'Argon (Complex)', icon: '🧠' },
                { id: 'general', label: 'Flash (General)', icon: '⚡' },
                { id: 'fast', label: 'Lite (Fast)', icon: '🚀' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setModelType(m.id as any)}
                  className={`w-full text-left p-3 rounded-xl text-sm font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    modelType === m.id 
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold border-cyan-400 shadow-sm' 
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                  }`}
                >
                  <span>{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Grounding Tools</h3>
            <button
              onClick={() => setUseMaps(!useMaps)}
              className={`w-full p-3 rounded-xl text-sm font-bold flex items-center justify-between border transition-all cursor-pointer ${
                useMaps 
                  ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800' 
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-100 dark:border-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-cyan-500" />
                <span>Maps Mode</span>
              </div>
              <div className={`w-8 h-4 rounded-full relative transition-colors ${useMaps ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${useMaps ? 'left-4.5' : 'left-0.5'}`} />
              </div>
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 italic">
              {useMaps ? 'Using Google Maps for location data' : 'Using Google Search for information'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 card flex flex-col h-full bg-white dark:bg-slate-900 shadow-xl border-slate-200/80 dark:border-white/10">
        <div className="p-4 border-b border-slate-100 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
              <Sparkles size={20} />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white font-display">ApnaLocal AI</h1>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider font-mono">
                {modelType === 'complex' ? 'Deep Reasoning Active' : 'Online · Jaunpur Assistant'}
              </p>
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-slate-900 dark:bg-white/10 text-white'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className="space-y-2">
                  <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md' : 'bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-tl-none shadow-xs border border-slate-200/50 dark:border-white/5'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                  {i === messages.length - 1 && msg.role === 'model' && generatedImageUrl && (
                    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-md max-w-sm animate-in zoom-in duration-300">
                      <img src={generatedImageUrl} alt="AI Generated visualization" className="w-full h-auto" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-white/10 text-white flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 rounded-tl-none flex items-center gap-2 shadow-sm border border-slate-200/50 dark:border-white/5">
                  <Loader2 size={16} className="animate-spin text-cyan-500" />
                  <span className="text-sm text-slate-500 dark:text-slate-400 font-medium italic">Gemini is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={useMaps ? "Ask about locations or directions in Jaunpur..." : "Describe your problem..."}
              className="w-full h-14 pl-4 pr-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-sm"
            />
            <div className="absolute right-2 top-2 flex gap-2">
              <button 
                onClick={handleGenerateImage}
                disabled={(!analysis?.problem_summary && !input) || isGeneratingImage}
                className="w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 cursor-pointer"
                title="Visualize problem with AI"
              >
                {isGeneratingImage ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              </button>
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md cursor-pointer"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-2 font-mono font-medium uppercase tracking-widest">
            {modelType.toUpperCase()} MODEL · {useMaps ? 'MAPS' : 'SEARCH'} GROUNDING ENABLED
          </p>
        </div>
      </div>

      {/* Analysis Sidebar (Right) */}
      {analysis && (
        <div className="w-full md:w-80 space-y-6 shrink-0">
          <div className="card p-6 border border-slate-200/80 dark:border-white/10 shadow-lg bg-white dark:bg-slate-900">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold mb-4 font-display">
              <AlertCircle size={18} className="text-amber-500" />
              <h2>Smart Analysis</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Suggested Category</label>
                <div className="mt-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-white/5 rounded-lg text-sm font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  {analysis.category}
                  <ChevronRight size={14} className="text-cyan-500" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Urgency</label>
                <div className={`mt-1 px-3 py-2 rounded-lg text-sm font-bold capitalize ${
                  analysis.urgency === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                  analysis.urgency === 'normal' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                  'bg-slate-50 text-slate-600 border-slate-100'
                }`}>
                  {analysis.urgency}
                </div>
              </div>

              {analysis.preferred_time && (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preferred Time</label>
                  <p className="text-sm font-medium text-slate-700 mt-1">{analysis.preferred_time}</p>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-slate-100 space-y-3">
                <Link 
                  to={`/search?category=${analysis.category}`} 
                  className="btn-primary w-full text-center flex items-center justify-center gap-2 shadow-sm"
                >
                  Match Providers <ChevronRight size={16} />
                </Link>
                
                <button 
                  onClick={async () => {
                    if (!user || !analysis) return;
                    try {
                      const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
                      const { db } = await import('../lib/firebase');
                      
                      await addDoc(collection(db, 'communityPosts'), {
                        userId: user.uid,
                        userName: user.displayName,
                        type: 'service-request',
                        title: `Need: ${analysis.category} in Jaunpur`,
                        content: analysis.problem_summary,
                        urgency: analysis.urgency,
                        locality: 'Jaunpur',
                        imageUrl: generatedImageUrl,
                        status: 'active',
                        aiAnalysis: analysis,
                        createdAt: serverTimestamp(),
                      });
                      alert('Broadcasted to Community Wall!');
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Users size={16} className="text-cyan-500" /> Broadcast to Community
                </button>
              </div>
              
              <button 
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="w-full text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                {isGeneratingImage ? 'Generating Image...' : 'Try AI Visualization ✨'}
              </button>
            </div>
          </div>

          <div className="card p-6 bg-slate-900 text-white shadow-xl">
            <h3 className="font-bold mb-2 flex items-center gap-2">
              <Bot size={16} />
              AI Insights
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              We are using {modelType} model with {useMaps ? 'Maps' : 'Search'} grounding to provide the most accurate hyperlocal information for Jaunpur.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;
