import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc,
  setDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Send, ArrowLeft, User, Loader2, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: any;
  updatedAt: any;
  otherUser?: any;
}

const ChatPage: React.FC = () => {
  const { chatId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentChat, setCurrentChat] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeUid = user?.uid || 'guest_user';

    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', activeUid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convs: Conversation[] = [];
      for (const d of snapshot.docs) {
        const data = d.data();
        const otherUserId = data.participants.find((p: string) => p !== activeUid);
        
        // Fetch other user profile
        let otherUser = null;
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          otherUser = userDoc.exists() ? userDoc.data() : { displayName: 'Unknown User' };
        }

        convs.push({
          id: d.id,
          ...data,
          otherUser
        } as Conversation);
      }
      setConversations(convs);
      setLoading(false);

      if (chatId) {
        const selected = convs.find(c => c.id === chatId);
        if (selected) setCurrentChat(selected);
      }
    }, (error) => {
      console.warn("Chat conversations listener warning:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, chatId]);

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setCurrentChat(null);
      return;
    }

    const q = query(
      collection(db, 'conversations', chatId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })) as Message[];
      setMessages(msgs);
      scrollToBottom();
    }, (error) => {
      console.warn("Chat messages listener warning:", error);
    });

    return () => unsubscribe();
  }, [chatId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !chatId) return;

    const activeUid = user?.uid || 'guest_user';
    const text = inputText.trim();
    setInputText('');

    try {
      await addDoc(collection(db, 'conversations', chatId, 'messages'), {
        senderId: activeUid,
        text,
        createdAt: serverTimestamp()
      });

      await updateDoc(doc(db, 'conversations', chatId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-10rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-10rem)] flex gap-6 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
      {/* Sidebar: Conversations List */}
      <div className={`w-full md:w-80 flex-col border-r border-slate-100 ${chatId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare size={20} />
            Messages
          </h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs">Start a conversation from a provider's profile.</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className={`w-full p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors border-b border-slate-50 ${
                  chatId === conv.id ? 'bg-slate-50 border-r-4 border-r-slate-900' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                  {conv.otherUser?.photoURL ? (
                    <img src={conv.otherUser.photoURL} className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <User size={24} className="text-slate-400" />
                  )}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-bold text-slate-900 truncate">
                    {conv.otherUser?.displayName || conv.otherUser?.businessName || 'User'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {conv.lastMessage || 'Start chatting...'}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!chatId ? 'hidden md:flex items-center justify-center bg-slate-50/30' : 'flex'}`}>
        {chatId && currentChat ? (
          <>
            <div className="p-4 border-b border-slate-100 flex items-center gap-4 bg-white sticky top-0 z-10">
              <button onClick={() => navigate('/chat')} className="md:hidden p-2 hover:bg-slate-100 rounded-lg">
                <ArrowLeft size={20} />
              </button>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                {currentChat.otherUser?.photoURL ? (
                  <img src={currentChat.otherUser.photoURL} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
              <div>
                <h2 className="font-bold text-slate-900 leading-none">
                  {currentChat.otherUser?.displayName || currentChat.otherUser?.businessName || 'Chat'}
                </h2>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mt-1">Online</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {messages.map((msg, i) => {
                const isMe = msg.senderId === (user?.uid || 'guest_user');
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl shadow-sm ${
                      isMe 
                        ? 'bg-slate-900 text-white rounded-tr-none' 
                        : 'bg-white text-slate-900 rounded-tl-none border border-slate-100'
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                      <div className={`text-[9px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                        {msg.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 h-12 px-4 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-lg shadow-slate-900/10"
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="text-center space-y-4 max-w-sm">
            <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto text-slate-300">
              <MessageSquare size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Your Conversations</h3>
              <p className="text-slate-500 text-sm">Select a chat from the left or contact a provider to start messaging.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
