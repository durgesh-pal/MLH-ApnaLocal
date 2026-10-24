import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, Sparkles, MapPin, Calendar, Clock, ChevronRight, Users, 
  CheckCircle2, Phone, MessageSquare, ShieldCheck, ArrowUpRight, Zap, 
  Droplet, Wind, Wrench, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useGeolocation } from '../../hooks/useGeolocation';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAppContext } from '../../contexts/AppContext';

const categories = [
  { name: 'Plumbing', icon: '🚰' },
  { name: 'Electrician', icon: '⚡' },
  { name: 'Cleaning', icon: '🧹' },
  { name: 'Carpentry', icon: '🪚' },
  { name: 'AC Repair', icon: '❄️' },
  { name: 'Tutor', icon: '📚' },
  { name: 'Beauty', icon: '💅' },
  { name: 'More', icon: '➕' },
];

// 4 Curated Active Jaunpur Bookings
const defaultActiveBookings = [
  {
    id: 'BK-JNP-9041',
    providerName: 'Suresh Kumar Electricals',
    category: 'Electrician',
    locality: 'Olandganj, Jaunpur',
    status: 'in_progress',
    statusText: 'Tech En Route (8 Mins Away)',
    statusTextHi: 'तकनीशियन रास्ते में है (8 मिनट)',
    scheduledTime: 'Today, 02:30 PM',
    amount: '₹250',
    problem: 'Short circuit repair & main switch box inspection',
    problemHi: 'शॉर्ट सर्किट मरम्मत और मुख्य स्विच बॉक्स जांच',
    phone: '+91 98391 23456',
    icon: Zap,
    statusBadge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
  },
  {
    id: 'BK-JNP-9042',
    providerName: 'Ramesh Vishwakarma AC Care',
    category: 'AC Repair',
    locality: 'Line Bazar, Jaunpur',
    status: 'confirmed',
    statusText: 'Confirmed for Today, 4:00 PM',
    statusTextHi: 'आज शाम 4:00 बजे के लिए कन्फर्म',
    scheduledTime: 'Today, 04:00 PM',
    amount: '₹499',
    problem: 'Split AC deep foam jet washing & gas pressure check',
    problemHi: 'स्प्लिट एसी फोम जेट वाशिंग और गैस प्रेशर चेक',
    phone: '+91 94152 87654',
    icon: Wind,
    statusBadge: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30 font-bold'
  },
  {
    id: 'BK-JNP-9043',
    providerName: 'Amit Plumbing Solutions',
    category: 'Plumber',
    locality: 'Civil Lines, Jaunpur',
    status: 'accepted',
    statusText: 'Assigned & Confirmed',
    statusTextHi: 'पार्टनर द्वारा स्वीकृत व निश्चित',
    scheduledTime: 'Tomorrow, 10:30 AM',
    amount: '₹300',
    problem: 'Overhead tank pipe leakage & bathroom tap replacement',
    problemHi: 'ओवरहेड टैंक पाइप रिसाव और बाथरूम नल बदलना',
    phone: '+91 98380 11223',
    icon: Droplet,
    statusBadge: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 font-bold'
  },
  {
    id: 'BK-JNP-9044',
    providerName: 'Prakash RO & Home Care',
    category: 'Water Purifier',
    locality: 'Shahganj Road, Jaunpur',
    status: 'confirmed',
    statusText: 'Confirmed for Tomorrow',
    statusTextHi: 'कल के लिए कन्फर्म',
    scheduledTime: 'Tomorrow, 02:00 PM',
    amount: '₹350',
    problem: 'RO Filter cartridge change & TDS calibration',
    problemHi: 'आरओ फ़िल्टर कार्ट्रिज बदलना और बफर ट्यूनिंग',
    phone: '+91 91250 99887',
    icon: Wrench,
    statusBadge: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 font-bold'
  }
];

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { language } = useAppContext();
  const { nearestLocality, loading: geoLoading } = useGeolocation();
  const navigate = useNavigate();
  const [activeBookings, setActiveBookings] = useState<any[]>(defaultActiveBookings);

  useEffect(() => {
    const activeUid = user?.uid || 'guest_user';
    try {
      const q = query(
        collection(db, 'bookings'),
        where('customerId', '==', activeUid),
        limit(4)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const userBookings = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id.substring(0, 10).toUpperCase(),
              providerName: data.providerName || 'Local Verified Specialist',
              category: data.category || 'Service Booking',
              locality: data.locality || nearestLocality || 'Jaunpur',
              status: data.status || 'confirmed',
              statusText: data.status === 'in_progress' ? 'Technician En Route' : 'Service Scheduled',
              statusTextHi: data.status === 'in_progress' ? 'तकनीशियन रास्ते में है' : 'सेवा समय निर्धारित',
              scheduledTime: data.scheduledAt ? new Date(data.scheduledAt).toLocaleString() : 'Today, Scheduled',
              amount: data.amount || '₹250',
              problem: data.problemDescription || 'General maintenance check',
              problemHi: data.problemDescription || 'सामान्य मरम्मत जांच',
              phone: data.phone || '+91 98390 00000',
              icon: Zap,
              statusBadge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-bold'
            };
          });
          // Fill up to 4 items using defaults if needed
          const combined = [...userBookings, ...defaultActiveBookings].slice(0, 4);
          setActiveBookings(combined);
        } else {
          setActiveBookings(defaultActiveBookings);
        }
      }, (error) => {
        console.warn("Firestore snapshot listener notice:", error);
        setActiveBookings(defaultActiveBookings);
      });

      return () => unsubscribe();
    } catch (err) {
      setActiveBookings(defaultActiveBookings);
    }
  }, [user, nearestLocality]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
      {/* Search & Location */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">Hello, {user?.displayName?.split(' ')[0] || 'Guest'}!</h1>
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mt-1">
            <MapPin size={14} className="mr-1 text-cyan-500" />
            <span>{geoLoading ? 'Detecting location...' : nearestLocality || 'Jaunpur, Uttar Pradesh'}</span>
          </div>
        </div>
        <div className="relative flex-1 max-w-md">
          <Link to={`/search${nearestLocality ? `?locality=${nearestLocality}` : ''}`} className="block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <div className="w-full h-12 pl-10 pr-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl flex items-center text-slate-400 dark:text-slate-400 shadow-sm cursor-text hover:border-cyan-500/50 transition-colors">
              Aapko kya chahiye?
            </div>
          </Link>
        </div>
      </div>

      {/* AI Assistant Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-cyan-500/20 group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl transition-transform group-hover:scale-110" />
        <div className="relative z-10 md:flex items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono font-bold tracking-wider mb-3">
              <Sparkles size={16} className="text-amber-400" />
              <span>AI POWERED ASSISTANT</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold mb-4 font-display">Describe your problem, let AI find the solution.</h2>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              "Mere kitchen ka nal leak kar raha hai aur mujhe aaj shaam plumber chahiye."
              Describe in Hindi, English or Hinglish.
            </p>
            <Link to="/ai" className="btn-primary w-fit text-sm">
              Ask AI Assistant
            </Link>
          </div>
          <div className="hidden lg:block">
            <div className="w-44 h-44 bg-cyan-500/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-cyan-500/30">
              <Sparkles size={56} className="text-cyan-400 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* 4 ACTIVE BOOKINGS DISPLAY SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-display">
              {language === 'hi' ? '4 सक्रिय बुकिंग्स (Jaunpur)' : '4 Active Bookings'}
            </h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              LIVE DISPATCH
            </span>
          </div>

          <Link 
            to="/bookings" 
            className="text-xs sm:text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 group"
          >
            <span>{language === 'hi' ? 'सभी बुकिंग्स देखें' : 'Manage All Bookings'}</span>
            <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* 4-Card Responsive Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {activeBookings.map((bk) => {
            const IconComp = bk.icon || Zap;
            return (
              <div 
                key={bk.id}
                className="group relative bg-white dark:bg-[#070e1e] border border-slate-200/90 dark:border-white/10 rounded-2xl p-5 shadow-lg hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden"
              >
                {/* Top Accent Gradient Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-blue-600" />

                <div className="space-y-3">
                  {/* Status Badge & ID */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-400 dark:text-slate-500">
                      #{bk.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] border ${bk.statusBadge} flex items-center gap-1`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      <span>{language === 'hi' ? bk.statusTextHi : bk.statusText}</span>
                    </span>
                  </div>

                  {/* Provider Name & Category */}
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0 shadow-sm">
                      <IconComp size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm font-display line-clamp-1 group-hover:text-cyan-500 transition-colors">
                        {bk.providerName}
                      </h3>
                      <p className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1 mt-0.5">
                        <span>{bk.category}</span>
                        <span>•</span>
                        <span className="text-slate-500 dark:text-slate-400 font-normal">{bk.locality}</span>
                      </p>
                    </div>
                  </div>

                  {/* Problem Note */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 p-2.5 rounded-xl border border-slate-100 dark:border-white/5 line-clamp-2 leading-relaxed">
                    {language === 'hi' ? bk.problemHi : bk.problem}
                  </p>

                  {/* Time & Charge */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-1 font-medium">
                      <Clock size={13} className="text-slate-400" />
                      <span>{bk.scheduledTime}</span>
                    </div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                      {bk.amount}
                    </div>
                  </div>
                </div>

                {/* Card Bottom Quick Actions */}
                <div className="pt-3 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <a
                    href={`tel:${bk.phone}`}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                    title="Call Provider"
                  >
                    <Phone size={13} className="text-emerald-500" />
                    <span>Call</span>
                  </a>

                  <button
                    onClick={() => navigate('/chat')}
                    className="flex-1 py-1.5 px-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20 text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                    title="Chat with Tech"
                  >
                    <MessageSquare size={13} />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Categories Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">What do you need?</h2>
          <Link to="/search" className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 flex items-center hover:underline">
            View All <ChevronRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat, i) => (
            <Link 
              key={i} 
              to={`/search?category=${cat.name}`}
              className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 rounded-2xl hover:border-cyan-500 dark:hover:border-cyan-400 hover:shadow-lg dark:hover:shadow-cyan-500/10 transition-all group backdrop-blur-md"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
              <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Community Help */}
      <section className="bg-amber-500/10 dark:bg-amber-950/20 rounded-2xl p-6 border border-amber-500/20 dark:border-amber-500/30 backdrop-blur-md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <Users size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display mb-1">Community Assistance</h2>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
              Need non-emergency help from your neighbors? Or found something? Post it on the community wall.
            </p>
            <Link to="/community" className="text-amber-600 dark:text-amber-400 font-bold text-sm flex items-center hover:underline">
              Go to Community <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerDashboard;
