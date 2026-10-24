import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Star, Shield, Clock, MapPin, Search, MessageSquare, 
  Cpu, Sparkles, Layers, Zap, Eye, Film, CheckCircle2, Award, 
  Wrench, Droplet, Wind, Home, BookOpen, Scissors, Car, ChevronRight,
  ShieldCheck, Mic, ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { collection, query, getDocs, orderBy, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { JAUNPUR_LOCALITIES } from '../lib/localities';
import LocationPicker from '../components/LocationPicker';
import TechHero3D from '../components/TechHero3D';
import TechIllusionVideo from '../components/TechIllusionVideo';
import { useAppContext } from '../contexts/AppContext';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { language, t } = useAppContext();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedLocality, setSelectedLocality] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [heroMode, setHeroMode] = useState<'video' | '3d' | 'classic'>('video');

  // Luxury curated service definitions (fallback & enhanced metadata)
  const defaultCategories = [
    { name: 'Electrician', nameHi: 'इलेक्ट्रीशियन', icon: Zap, count: '120+ Pros', price: '₹150', color: 'from-amber-400 to-yellow-500' },
    { name: 'Plumber', nameHi: 'प्लंबर', icon: Droplet, count: '95+ Pros', price: '₹150', color: 'from-cyan-400 to-blue-500' },
    { name: 'AC Repair', nameHi: 'एसी रिपेयर', icon: Wind, count: '60+ Pros', price: '₹299', color: 'from-sky-400 to-indigo-500' },
    { name: 'Mechanic', nameHi: 'वाहन मैकेनिक', icon: Car, count: '80+ Pros', price: '₹199', color: 'from-rose-400 to-orange-500' },
    { name: 'Carpenter', nameHi: 'कारपेंटर', icon: Wrench, count: '70+ Pros', price: '₹200', color: 'from-amber-500 to-orange-600' },
    { name: 'Cleaning', nameHi: 'सफाई सेवा', icon: Home, count: '50+ Pros', price: '₹249', color: 'from-emerald-400 to-teal-500' },
    { name: 'Tutor', nameHi: 'होम ट्यूटर', icon: BookOpen, count: '110+ Pros', price: '₹400/mo', color: 'from-purple-400 to-indigo-500' },
    { name: 'Beauty', nameHi: 'ब्यूटी व सैलून', icon: Scissors, count: '65+ Pros', price: '₹199', color: 'from-pink-400 to-rose-500' },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const q = query(collection(db, 'serviceCategories'), orderBy('name'));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } else {
          setCategories(defaultCategories);
        }
      } catch (err) {
        setCategories(defaultCategories);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        let q;
        if (selectedLocality) {
          q = query(
            collection(db, 'communityPosts'), 
            where('locality', '==', selectedLocality),
            orderBy('createdAt', 'desc'), 
            limit(3)
          );
        } else {
          q = query(
            collection(db, 'communityPosts'), 
            orderBy('createdAt', 'desc'), 
            limit(3)
          );
        }
        const snapshot = await getDocs(q);
        setRecentRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error fetching recent requests:", err);
      }
    };
    fetchRequests();
  }, [selectedLocality]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    if (selectedLocality) params.set('locality', selectedLocality);
    navigate(`/search?${params.toString()}`);
  };

  const handleCategoryClick = (catName: string) => {
    const params = new URLSearchParams();
    params.set('category', catName);
    if (selectedLocality) params.set('locality', selectedLocality);
    navigate(`/search?${params.toString()}`);
  };

  const handleVideoEndRedirect = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* 1. CINEMATIC LUXURY HERO SECTION */}
      <section className="relative overflow-hidden bg-slate-100 dark:bg-[#030712] text-slate-900 dark:text-white pt-8 pb-16 md:py-20 border-b border-slate-200 dark:border-white/5 transition-colors duration-300">
        {/* Ambient Radial Deep Navy & Electric Cyan Backlight */}
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-cyan-600/10 dark:from-cyan-600/15 via-blue-900/5 dark:via-blue-900/10 to-transparent blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-indigo-600/10 blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-amber-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top Bar: Live Trust Indicator & Mode Switch */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            {/* Subtle Gold / Cyan Verified Trust Seal */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/80 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-semibold backdrop-blur-xl shadow-lg shadow-slate-200/50 dark:shadow-none">
              <Award size={14} className="text-amber-500 dark:text-amber-400" />
              <span>Jaunpur’s #1 Verified Marketplace</span>
              <span className="text-slate-400 font-normal">·</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono text-[11px] font-bold">500+ Experts Active</span>
            </div>

            {/* Cinematic Hero Mode Selector (Segmented Glass Pill) */}
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-900/80 border border-slate-300/80 dark:border-white/10 p-1 rounded-xl text-xs backdrop-blur-xl">
              <button
                onClick={() => setHeroMode('video')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  heroMode === 'video' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Film size={13} />
                <span>3D Illusion Video</span>
              </button>
              <button
                onClick={() => setHeroMode('3d')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  heroMode === '3d' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-md shadow-cyan-500/20' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Cpu size={13} />
                <span>3D Tech Matrix</span>
              </button>
              <button
                onClick={() => setHeroMode('classic')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  heroMode === 'classic' 
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Eye size={13} />
                <span>City View</span>
              </button>
            </div>
          </div>

          {/* Hero Main Content */}
          {heroMode === 'video' ? (
            <div className="space-y-8">
              {/* Hero Title & Subtitle */}
              <div className="text-center max-w-4xl mx-auto space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display leading-[1.08] text-slate-900 dark:text-white">
                  Har Zaroorat Ka <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-amber-600 dark:from-cyan-400 dark:via-teal-300 dark:to-amber-300">
                    World-Class Local Solution.
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
                  {language === 'hi'
                    ? 'जौनपुर के 14 इलाकों में सत्यापित इलेक्ट्रीशियन, प्लंबर, मैकेनिक व अन्य सेवाएं खोजें — सीधे एआई मैचिंग और 3D वेरिफिकेशन के साथ।'
                    : 'Discover vetted electricians, plumbers, appliance mechanics and skilled pros across Jaunpur with instant AI matching.'}
                </p>
              </div>

              {/* Floating Luxury Glassmorphic Search Bar Hub */}
              <div className="max-w-3xl mx-auto">
                <form 
                  onSubmit={handleSearchSubmit}
                  className="p-2 sm:p-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-300/90 dark:border-white/15 backdrop-blur-2xl shadow-xl shadow-slate-300/40 dark:shadow-cyan-950/40 flex flex-col sm:flex-row items-center gap-2.5 transition-all"
                >
                  {/* Text Input */}
                  <div className="relative flex-1 w-full flex items-center">
                    <Search className="absolute left-3.5 text-cyan-500 dark:text-cyan-400 pointer-events-none" size={19} />
                    <input 
                      type="text" 
                      placeholder={language === 'hi' ? 'सेवा का नाम खोजें (जैसे: इलेक्ट्रीशियन, प्लंबर)...' : 'What service do you need in Jaunpur?'}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 pl-11 pr-11 bg-transparent text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none text-sm font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => navigate('/search')}
                      className="absolute right-3 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors cursor-pointer"
                      title="Voice Search"
                    >
                      <Mic size={17} />
                    </button>
                  </div>

                  {/* Locality Selector */}
                  <div className="w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/10 pt-2 sm:pt-0 sm:pl-2.5">
                    <LocationPicker 
                      selectedLocality={selectedLocality} 
                      onLocalityChange={setSelectedLocality} 
                    />
                  </div>

                  {/* Find Button */}
                  <button
                    type="submit"
                    className="btn-primary w-full sm:w-auto h-12 px-6 bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-extrabold text-sm rounded-xl shrink-0 shadow-lg shadow-cyan-500/25"
                  >
                    <span>{language === 'hi' ? 'खोजें' : 'Search Pros'}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>

                {/* Popular Search Chips */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">{language === 'hi' ? 'लोकप्रिय:' : 'Trending:'}</span>
                  {['Electrician', 'Plumber', 'AC Repair', 'Mechanic'].map((term) => (
                    <button
                      key={term}
                      onClick={() => handleCategoryClick(term)}
                      className="px-2.5 py-1 rounded-lg bg-slate-200/70 dark:bg-white/5 hover:bg-slate-300/80 dark:hover:bg-white/10 border border-slate-300/60 dark:border-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-all cursor-pointer"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3D Tech Illusion Video Stage */}
              <div className="max-w-5xl mx-auto pt-2">
                <TechIllusionVideo 
                  durationSeconds={8}
                  onVideoEnd={handleVideoEndRedirect}
                  autoPlay={true}
                  showRedirectCountdown={true}
                />
              </div>
            </div>
          ) : heroMode === '3d' ? (
            /* 3D Tech Matrix View */
            <div className="grid lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-5 space-y-6 text-left">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-semibold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  3D AI Autonomous Dispatch Grid
                </div>

                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight font-display text-slate-900 dark:text-white leading-tight">
                  Har Zaroorat Ka <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-600 dark:from-cyan-400 dark:via-teal-300 dark:to-emerald-400">
                    Local 3D Solution.
                  </span>
                </h1>

                <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                  Real-time 3D telemetry, verified professionals, and instant AI diagnostics across every corner of Jaunpur.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button 
                    onClick={() => navigate('/search')}
                    className="btn-primary bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold h-12 px-7 rounded-xl"
                  >
                    <Search size={16} /> Find Providers
                  </button>
                  <Link 
                    to="/register?role=provider" 
                    className="btn-secondary h-12 px-7 rounded-xl"
                  >
                    Join as Provider
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-7">
                <TechHero3D onExploreClick={() => navigate('/search')} />
              </div>
            </div>
          ) : (
            /* Classic City View */
            <div className="relative rounded-3xl overflow-hidden h-[480px] flex items-center justify-center text-center p-6 border border-white/10">
              <img 
                src="/src/assets/images/hero_jaunpur_1792741417091.jpg" 
                alt="Jaunpur city" 
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs" />
              <div className="relative z-10 max-w-2xl space-y-5">
                <h2 className="text-3xl sm:text-5xl font-black font-display text-white">
                  Serving Every Neighborhood in Jaunpur
                </h2>
                <p className="text-slate-200 text-sm sm:text-base">
                  From Shahi Bridge to Line Bazar, finding skilled local hands has never been easier.
                </p>
                <button
                  onClick={() => navigate('/search')}
                  className="btn-primary mx-auto"
                >
                  <Search size={16} /> Explore Directory
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 2. LIVE METRICS & TRUST STRIP */}
      <section className="py-8 bg-white dark:bg-[#060b17] border-b border-slate-200/80 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { label: language === 'hi' ? 'सत्यापित प्रोवाइडर' : 'Verified Professionals', value: '500+', sub: 'Vetted in Jaunpur' },
              { label: language === 'hi' ? 'संतुष्ट ग्राहक' : 'Satisfied Customers', value: '2,400+', sub: 'Rated 4.8 / 5 Stars' },
              { label: language === 'hi' ? 'कवरेज क्षेत्र' : 'Primary Coverage', value: '14 Localities', sub: 'Across District' },
              { label: language === 'hi' ? 'औसत रिस्पांस समय' : 'Avg. Match Speed', value: '< 15 Mins', sub: 'Instant AI Dispatch' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                <div className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                  <span>{stat.value}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 mt-1">
                  {stat.label}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                  {stat.sub}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. GLOWING SERVICE CATEGORIES CARDS */}
      <section className="py-20 bg-slate-50 dark:bg-[#030712] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-2">
                Curated Marketplace
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
                {language === 'hi' ? 'लोकप्रिय सेवाएं' : 'Premium Service Categories'}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xl">
                Browse on-demand, vetted experts ready to visit your home or business in {selectedLocality || 'Jaunpur'}.
              </p>
            </div>
            <Link 
              to="/search" 
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-cyan-400 hover:underline cursor-pointer group"
            >
              <span>{language === 'hi' ? 'सभी 50+ सेवाएं देखें' : 'View Full Directory'}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {defaultCategories.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <div 
                  key={cat.name}
                  onClick={() => handleCategoryClick(cat.name)}
                  className="group relative bg-white dark:bg-[#070e1e] border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-500/10 dark:hover:shadow-cyan-950/40 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden"
                >
                  {/* Subtle Top-Right Ambient Glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />

                  <div className="space-y-4">
                    {/* Icon Badge */}
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-cyan-400 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-cyan-400 group-hover:to-blue-600 group-hover:text-slate-950 transition-all duration-300 shadow-sm">
                      <IconComp size={22} />
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white font-display group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                        {language === 'hi' ? cat.nameHi : cat.name}
                      </h3>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 flex items-center gap-1.5 font-medium">
                        <span>{cat.count}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">Starts {cat.price}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    <span>Book Expert</span>
                    <ArrowUpRight size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-cyan-500" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. VERIFIED TRUST ROADMAP & PROMISE */}
      <section className="py-20 bg-white dark:bg-[#060b17] border-y border-slate-200/80 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <div className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">
              Trust & Safety Standard
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
              Why Jaunpur Trusts ApnaLocal
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
              We eliminate the uncertainty of unverified street contractors with a four-pillar guarantee.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Government ID Verified',
                desc: 'Every provider undergoes physical Aadhaar & credential checks before onboarding.',
                icon: ShieldCheck,
                color: 'text-cyan-400'
              },
              {
                step: '02',
                title: 'Transparent Pricing',
                desc: 'Clear upfront visiting charges and standardized service rate cards — no surprise billings.',
                icon: CheckCircle2,
                color: 'text-emerald-400'
              },
              {
                step: '03',
                title: 'Locality Proximity',
                desc: 'Matched with nearest experts in Olandganj, Line Bazar or your specific ward for fast arrival.',
                icon: MapPin,
                color: 'text-amber-400'
              },
              {
                step: '04',
                title: 'AI Smart Assistance',
                desc: 'Instant diagnostic chat helps you articulate your problem and find the right specialist.',
                icon: Sparkles,
                color: 'text-indigo-400'
              }
            ].map((feature, i) => (
              <div 
                key={i}
                className="card p-6 bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-600">
                      {feature.step}
                    </span>
                    <feature.icon size={20} className={feature.color} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-display">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LIVE JAUNPUR COMMUNITY WALL */}
      <section className="py-20 bg-slate-50 dark:bg-[#030712] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                Hyperlocal Community Help
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight">
                Nearby Community Requests
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                {selectedLocality 
                  ? `Active service requests posted by neighbors in ${selectedLocality}.` 
                  : 'Real requests posted by residents across Jaunpur.'}
              </p>
            </div>
            <Link 
              to="/community" 
              className="btn-secondary h-11 px-5 rounded-xl text-xs font-bold w-fit"
            >
              <MessageSquare size={16} />
              <span>Open Community Wall</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {recentRequests.length > 0 ? (
              recentRequests.map((req, i) => (
                <div 
                  key={i} 
                  className="card p-6 bg-white dark:bg-[#070e1e] border border-slate-200 dark:border-white/10 flex flex-col justify-between hover:border-cyan-500/40 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold flex items-center gap-1">
                        <MapPin size={12} />
                        {req.locality || 'Jaunpur'}
                      </span>
                      <span className="text-slate-400 text-[11px]">Active</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                      {req.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                      {req.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₹{req.budget || 'Negotiable'}
                    </div>
                    <Link 
                      to={`/community`} 
                      className="text-xs font-bold text-slate-900 dark:text-cyan-300 hover:underline flex items-center gap-1"
                    >
                      <span>Help Out</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 card p-12 text-center bg-white dark:bg-[#070e1e] border border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
                <MessageSquare className="mx-auto text-slate-400 mb-3" size={36} />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  Community Board Active
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                  Need emergency help or want to post a local job request for Jaunpur providers?
                </p>
                <Link to="/community" className="btn-primary mx-auto text-xs py-2 px-5">
                  Post a Request
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. LOCALITIES EXPLORATION FOOTPRINT */}
      <section className="py-16 bg-white dark:bg-[#060b17] border-t border-slate-200/80 dark:border-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">
              Serving All 14 Administrative Localities of Jaunpur
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your locality for instantaneous nearby matching with technicians within 5 kilometers.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-4xl mx-auto">
            {JAUNPUR_LOCALITIES.map((loc) => (
              <button
                key={loc.name}
                onClick={() => {
                  setSelectedLocality(loc.name);
                  navigate(`/search?locality=${encodeURIComponent(loc.name)}`);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  selectedLocality === loc.name
                    ? 'bg-slate-900 text-white dark:bg-cyan-400 dark:text-slate-950 border-transparent shadow-md'
                    : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-cyan-500/40 hover:text-cyan-500'
                }`}
              >
                {loc.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 7. PRE-FOOTER CTA BANNER */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-[#030712] text-white border-t border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-[circle_at_center,rgba(6,182,212,0.1)_0%,transparent_70%] pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-mono font-bold">
            <Sparkles size={14} /> Ready for Seamless Home Services?
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white">
            Experience World-Class Local Reliability Today.
          </h2>
          <p className="text-slate-300 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Join thousands of Jaunpur residents who trust ApnaLocal for everyday repairs, emergencies, and home maintenance.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/search"
              className="btn-primary bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 text-slate-950 font-extrabold px-8 py-3.5 rounded-xl text-sm shadow-xl shadow-cyan-500/20"
            >
              <Search size={16} />
              <span>Find a Local Provider</span>
            </Link>
            <Link
              to="/register?role=provider"
              className="btn-secondary px-8 py-3.5 rounded-xl text-sm font-bold text-white border-white/20 hover:bg-white/10"
            >
              Join as a Certified Partner
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
