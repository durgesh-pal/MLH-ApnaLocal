import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, MapPin, ShieldCheck, Clock, Check, MessageSquare, Phone, Calendar, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

const cleanPrice = (priceStr?: string): string => {
  if (!priceStr) return 'Indicative range; confirm with provider';
  return priceStr
    .replace(/\u20B9/g, 'Rs. ')
    .replace(/[\uFFFD\u0080-\u009F\u0000-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const ProviderProfile: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [provider, setProvider] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    const fetchProvider = async () => {
      setLoading(true);
      try {
        if (!id) return;
        // Try direct doc fetch by ID
        const docRef = doc(db, 'providerProfiles', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProvider({ id: docSnap.id, ...docSnap.data() });
        } else {
          // Try querying by provider_id
          const q = query(collection(db, 'providerProfiles'), where('provider_id', '==', id));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const found = querySnap.docs[0];
            setProvider({ id: found.id, ...found.data() });
          } else {
            // Fallback mock for demo testing
            setProvider({
              id: id || 'DEMO0001',
              businessName: 'Demo Provider Profile - Jaunpur',
              name: 'FICTIONAL DEMO ONLY',
              category: 'Electrician',
              locality: 'Olandganj',
              rating: 'New',
              reviews: 0,
              price: 'Indicative ₹150–₹500',
              bio: 'Fictional sample listing for Jaunpur. Replace with genuine provider details before launch.',
              skills: ['Switchboard repair', 'Fan installation', 'Basic wiring'],
              workingHours: 'To be configured',
              isDemo: true,
              profile_type: 'DEMO_ONLY',
              verification_status: 'not_verified_demo',
              contact_enabled: false,
              booking_enabled: false
            });
          }
        }
      } catch (err) {
        console.error("Error fetching provider:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [id]);

  const handleMessage = async () => {
    if (provider?.isDemo || provider?.profile_type === 'DEMO_ONLY' || !provider?.contact_enabled) {
      alert("DEMO PROFILE — NOT A REAL OR VERIFIED PROVIDER. Contact is disabled for demo slots until replaced with genuine provider details.");
      return;
    }
    
    const activeUid = user?.uid || 'guest_user';
    setIsStartingChat(true);
    try {
      const q = query(
        collection(db, 'conversations'),
        where('participants', 'array-contains', activeUid)
      );
      
      const snapshot = await getDocs(q);
      const existingConv = snapshot.docs.find(doc => doc.data().participants.includes(id));

      if (existingConv) {
        navigate(`/chat/${existingConv.id}`);
      } else {
        const newConv = await addDoc(collection(db, 'conversations'), {
          participants: [activeUid, id],
          lastMessage: '',
          updatedAt: serverTimestamp()
        });
        navigate(`/chat/${newConv.id}`);
      }
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setIsStartingChat(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  const isDemo = provider?.isDemo || provider?.profile_type === 'DEMO_ONLY' || provider?.is_real_provider === false;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 py-8">
      {/* Prominent Demo Banner */}
      {isDemo && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 md:p-6 flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-amber-900 text-base md:text-lg">DEMO PROFILE — NOT A REAL OR VERIFIED PROVIDER</h3>
            <p className="text-amber-800 text-xs md:text-sm leading-relaxed">
              This is a fictional placeholder slot in Jaunpur ({provider?.locality || 'Jaunpur'}). Phone numbers, emails, and ratings are not genuine. Contact and booking are disabled until replaced with consented real provider details by the administrator.
            </p>
            {isAdmin && (
              <div className="pt-2">
                <Link to="/admin" className="text-xs font-bold text-amber-900 underline hover:text-amber-950">
                  Go to Admin Coverage & Replace Workflow →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Header */}
      <div className="card p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start bg-white shadow-xl border-slate-200">
        <div className="w-full md:w-48 aspect-square rounded-2xl overflow-hidden bg-slate-100 shrink-0 shadow-inner flex items-center justify-center">
          <img 
            src={provider?.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider?.businessName || 'Provider'}`} 
            alt={provider?.businessName} 
            className="w-full h-full object-cover" 
          />
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{provider?.businessName || provider?.display_name}</h1>
                {!isDemo && <ShieldCheck size={24} className="text-blue-600" />}
              </div>
              <p className="text-slate-500 text-base md:text-lg font-medium">{provider?.name || provider?.sample_name || 'Jaunpur Provider'} · {provider?.category}</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-lg text-sm font-bold">
              <Star size={16} fill="currentColor" />
              <span>{provider?.rating || 'New'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin size={18} className="text-slate-400" />
              <span>{provider?.locality || 'Jaunpur District'}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock size={18} className="text-slate-400" />
              <span>{provider?.workingHours || provider?.working_hours || 'Configurable'}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            {isDemo ? (
              <div className="bg-slate-100 text-slate-500 px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 cursor-not-allowed">
                <Calendar size={18} /> Booking Disabled (Demo Slot)
              </div>
            ) : (
              <Link to={`/book/${provider?.id}`} className="btn-primary flex items-center gap-2 h-12 px-8">
                <Calendar size={20} /> Book Now
              </Link>
            )}

            <button 
              onClick={handleMessage}
              disabled={isStartingChat || isDemo}
              className={`btn-secondary flex items-center gap-2 h-12 px-6 ${isDemo ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isStartingChat ? <Loader2 size={20} className="animate-spin" /> : <MessageSquare size={20} />}
              Message
            </button>
            <button 
              disabled={isDemo}
              className={`btn-secondary flex items-center justify-center w-12 h-12 p-0 ${isDemo ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Phone size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-8">
          <section className="card p-6 bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-900">About Provider</h2>
            <p className="text-slate-600 leading-relaxed text-base">
              {provider?.bio || 'Fictional sample listing for Jaunpur. Replace with genuine provider details before launch.'}
            </p>
          </section>

          <section className="card p-6 bg-white space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Skills & Services Offered</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(typeof provider?.skills === 'string' ? provider.skills.split('|').map((s: string) => s.trim()) : (provider?.skills || ['General Service'])).map((skill: string, i: number) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Check size={14} />
                  </div>
                  <span className="text-slate-700 font-medium text-sm">{skill}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Pricing & Info */}
        <div className="space-y-6">
          <div className="card p-6 space-y-4 bg-white">
            <h3 className="font-bold text-slate-900">Service Pricing</h3>
            <div className="text-2xl font-bold text-slate-900">{cleanPrice(provider?.price || provider?.price_guidance)}</div>
            <p className="text-xs text-slate-500">Final price will be confirmed after visit/inspection.</p>
            <div className="pt-4 border-t border-slate-100">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Check size={16} className="text-emerald-500" /> Jaunpur Local Coverage
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <Check size={16} className="text-emerald-500" /> Transparent Consultation
                </li>
              </ul>
            </div>
          </div>

          {isDemo && (
            <div className="card p-6 bg-amber-50 border border-amber-200 text-amber-900">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                <AlertTriangle size={18} /> Admin Action Required
              </h3>
              <p className="text-xs leading-relaxed text-amber-800">
                To launch this service slot in Jaunpur, replace this demo profile with a verified local professional's consented details in the admin portal.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;
