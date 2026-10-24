import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, onSnapshot, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { CommunityPost } from '../types';
import { Users, Plus, MapPin, Tag, Clock, Send, X, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const typeColors: Record<string, string> = {
  recommendation: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  'lost-found': 'text-amber-600 bg-amber-50 border-amber-100',
  help: 'text-blue-600 bg-blue-50 border-blue-100',
  announcement: 'text-slate-600 bg-slate-50 border-slate-100',
  'service-request': 'text-purple-600 bg-purple-50 border-purple-100',
};

const Community: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'help' as any, locality: 'Jaunpur', imageUrl: '' });

  const handleMessageCustomer = async (post: any) => {
    if (!user) return;
    try {
      const { collection, query, where, getDocs, addDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../lib/firebase');
      
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', user.uid)
      );
      
      const snapshot = await getDocs(q);
      const existingConv = snapshot.docs.find(doc => doc.data().participants.includes(post.userId));

      if (existingConv) {
        navigate(`/chat/${existingConv.id}`);
      } else {
        const newConv = await addDoc(collection(db, 'conversations'), {
          participants: [user.uid, post.userId],
          lastMessage: `Regarding your request: ${post.title}`,
          updatedAt: serverTimestamp(),
          relatedId: post.id,
          relatedType: 'service-request'
        });
        navigate(`/chat/${newConv.id}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'communityPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.title || !formData.content) return;

    try {
      await addDoc(collection(db, 'communityPosts'), {
        userId: user.uid,
        userName: user.displayName,
        ...formData,
        createdAt: serverTimestamp(),
      });
      setIsPosting(false);
      setFormData({ title: '', content: '', type: 'help', locality: 'Jaunpur', imageUrl: '' });
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleGenerateImage = async () => {
    if (!formData.content) return;
    setIsGeneratingImage(true);
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: `${formData.title} ${formData.content}` }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setFormData(prev => ({ ...prev, imageUrl: data.imageUrl }));
      } else {
        alert(data.error || 'Image generation failed');
      }
    } catch (error) {
      console.error("Image Gen Error:", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-6 pt-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 font-display">
            <Users size={30} className="text-cyan-500" /> Neighborhood Wall
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Community assistance and notices for Jaunpur, UP.</p>
        </div>
        <button 
          onClick={() => setIsPosting(true)}
          className="btn-primary flex items-center justify-center gap-2 h-12 px-6 shadow-md"
        >
          <Plus size={20} /> Create Post
        </button>
      </div>

      {/* Post Creation Modal-like Overlay */}
      {isPosting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="card w-full max-w-2xl p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-200 shadow-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display">Create Community Post</h2>
              <button onClick={() => setIsPosting(false)} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Type of Post</label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {['help', 'recommendation', 'lost-found', 'announcement'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: t })}
                          className={`px-3 py-2 rounded-lg text-[10px] font-bold capitalize border transition-all ${
                            formData.type === t ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-white text-slate-500 border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          {t.replace('-', ' & ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Title</label>
                    <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Need help with shifting furniture"
                      className="mt-2 w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Content</label>
                    <textarea 
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Describe what you need or want to share..."
                      rows={4}
                      className="mt-2 w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Visual Asset (Optional)</label>
                  <div className="aspect-square bg-slate-50 dark:bg-slate-800/60 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 flex flex-col items-center justify-center p-4 text-center group relative overflow-hidden">
                    {formData.imageUrl ? (
                      <>
                        <img src={formData.imageUrl} alt="Generated" className="absolute inset-0 w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, imageUrl: '' })}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <Sparkles size={32} className="text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="text-xs text-slate-400 font-medium px-4">
                          No visual added. Use AI to generate an illustration for your post.
                        </p>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateImage}
                    disabled={!formData.content || isGeneratingImage}
                    className="w-full h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
                  >
                    {isGeneratingImage ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="text-amber-500" />}
                    {formData.imageUrl ? 'Regenerate with AI' : 'Generate Visual with AI'}
                  </button>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center uppercase tracking-widest font-mono font-bold">
                    Powered by Gemini Nano Banana 2.1
                  </p>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsPosting(false)} className="btn-secondary flex-1 h-14">Cancel</button>
                <button type="submit" className="btn-primary flex-1 h-14 flex items-center justify-center gap-2 shadow-lg">
                  <Send size={18} /> Publish Post
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Posts List */}
      <div className="space-y-6 pb-12">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">Loading community wall...</div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="card hover:border-cyan-500/40 dark:hover:border-cyan-500/40 transition-all overflow-hidden flex flex-col md:flex-row group bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10">
              {post.imageUrl && (
                <div className="w-full md:w-64 lg:w-80 shrink-0 bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                   <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-6 md:p-8 space-y-4 flex-1">
                <div className="flex items-center justify-between gap-4">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${typeColors[post.type] || typeColors.announcement}`}>
                    {post.type.replace('-', ' & ')}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500 font-medium">
                    <Clock size={12} />
                    <span>{post.createdAt ? format(new Date(post.createdAt?.toDate ? post.createdAt.toDate() : post.createdAt), 'MMM d, h:mm a') : 'Just now'}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-2">{post.title}</h3>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">{post.content}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-600 dark:bg-cyan-500 text-white dark:text-slate-950 flex items-center justify-center font-bold text-xs">
                      {post.userName?.substring(0, 2).toUpperCase() || post.userId.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {post.userName || 'Neighbor'} in {post.locality}
                    </div>
                  </div>
                  {post.type === 'service-request' && user?.role === 'provider' && post.userId !== user?.uid ? (
                    <button 
                      onClick={() => handleMessageCustomer(post)}
                      className="btn-primary h-9 px-4 text-xs flex items-center gap-2 shadow-sm"
                    >
                      <Sparkles size={14} /> Bid for Service
                    </button>
                  ) : (
                    <button className="text-slate-900 dark:text-cyan-400 text-xs font-bold hover:underline flex items-center gap-1 transition-all cursor-pointer">
                      Reply <Send size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-20 text-center bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10">
            <div className="w-20 h-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-600 border border-slate-100 dark:border-white/5">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-2">The wall is quiet...</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed">
              Be the first to share something with your neighbors in Jaunpur. Recommendations, help requests, or local news are welcome!
            </p>
            <button onClick={() => setIsPosting(true)} className="btn-primary shadow-lg mx-auto">Create the First Post</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
