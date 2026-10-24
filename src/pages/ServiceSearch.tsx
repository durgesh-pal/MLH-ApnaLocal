import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search as SearchIcon, Filter, Star, MapPin, ChevronRight, ShieldCheck, 
  X, Map as MapIcon, List, AlertTriangle, Mic, MicOff, Volume2, Sparkles,
  Sun, Moon, Languages, Check, RefreshCw
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { JAUNPUR_LOCALITIES } from '../lib/localities';
import ProviderMap from '../components/ProviderMap';
import { useGeolocation } from '../hooks/useGeolocation';
import { useAppContext } from '../contexts/AppContext';

export const ServiceSearch: React.FC = () => {
  const { theme, toggleTheme, language, toggleLanguage, t } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const localityParam = searchParams.get('locality') || '';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedLocality, setSelectedLocality] = useState(localityParam);
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const { nearestLocality, loading: geoLoading } = useGeolocation();

  // Voice Search states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (nearestLocality && !localityParam) {
      setSelectedLocality(nearestLocality);
      updateFilters('locality', nearestLocality);
    }
  }, [nearestLocality]);

  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || '');
    setSelectedLocality(searchParams.get('locality') || '');
  }, [searchParams]);

  useEffect(() => {
    const fetchAndAutoSeedProviders = async () => {
      setLoading(true);
      try {
        let loadedProviders: any[] = [];
        
        try {
          const q = query(collection(db, 'providerProfiles'));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            loadedProviders = snapshot.docs.map(docSnap => {
              const d = docSnap.data();
              return {
                id: docSnap.id,
                ...d,
                businessName: d.businessName || d.display_name || 'Provider',
                name: d.name || d.sample_name || 'Jaunpur Provider',
                category: d.category || 'Service',
                locality: d.locality || 'Jaunpur',
                price: d.price || d.price_guidance || 'Contact for price',
                isDemo: d.isDemo || d.profile_type === 'DEMO_ONLY' || d.is_real_provider === false
              };
            });
          }
        } catch (dbErr) {
          console.warn("Firestore query fallback to dataset:", dbErr);
        }

        // If Firestore is empty or has very few records, fetch and auto-seed the demo records dataset
        if (loadedProviders.length < 100) {
          try {
            const seedRes = await fetch('/assets/aistudio/apnalocal_jaunpur_demo_providers_448_0ba92592.json');
            const seedData = await seedRes.json();
            
            if (seedData && Array.isArray(seedData.providers)) {
              const mappedSeed = seedData.providers.map((p: any) => ({
                id: p.provider_id,
                ...p,
                businessName: p.display_name,
                name: p.sample_name,
                price: p.price_guidance,
                isDemo: true,
                is_real_provider: false
              }));

              const existingIds = new Set(loadedProviders.map(p => p.id || p.provider_id));
              const missingSeed = mappedSeed.filter((p: any) => !existingIds.has(p.id));
              loadedProviders = [...loadedProviders, ...missingSeed];

              setTimeout(async () => {
                for (const p of seedData.providers) {
                  try {
                    await setDoc(doc(db, 'providerProfiles', p.provider_id), {
                      ...p,
                      isDemo: true,
                      is_real_provider: false,
                      updatedAt: serverTimestamp()
                    }, { merge: true });
                  } catch (e) {
                    // Ignore single doc errors
                  }
                }
              }, 100);
            }
          } catch (seedErr) {
            console.error("Error loading demo dataset file:", seedErr);
          }
        }

        setProviders(loadedProviders);
      } catch (err) {
        console.error("Error in fetchAndAutoSeedProviders:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndAutoSeedProviders();
  }, []);

  const updateFilters = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const formatSkillsString = (skills: any): string => {
    if (!skills) return '';
    if (Array.isArray(skills)) return skills.join(' ');
    if (typeof skills === 'string') return skills;
    return String(skills);
  };

  const cleanPrice = (priceStr?: string): string => {
    if (!priceStr) return 'Rs. 150 (Visit)';
    return priceStr
      .replace(/\u20B9/g, 'Rs. ')
      .replace(/[\uFFFD\u0080-\u009F\u0000-\u001F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const normalizeTerm = (term: string): string => {
    const t = (term || '').toLowerCase().trim();
    if (!t) return '';
    if (t.includes('clean') || t.includes('sweep') || t.includes('safai') || t.includes('सफाई') || t.includes('झाड़ू')) return 'cleaning';
    if (t.includes('beaut') || t.includes('buety') || t.includes('salon') || t.includes('parlor') || t.includes('ब्यूटी') || t.includes('सैलून')) return 'beauty';
    if (t.includes('mechan') || t.includes('machanic') || t.includes('bike') || t.includes('car') || t.includes('मैकेनिक') || t.includes('मिस्त्री') || t.includes('गाड़ी')) return 'mechanic';
    if (t.includes('ac') || t.includes('cool') || t.includes('एसी') || t.includes('कूलर')) return 'ac repair';
    if (t.includes('plumb') || t.includes('pipe') || t.includes('tap') || t.includes('nal') || t.includes('नल') || t.includes('पाइप') || t.includes('प्लंबर')) return 'plumber';
    if (t.includes('electr') || t.includes('wire') || t.includes('bijli') || t.includes('बिजली') || t.includes('इलेक्ट्रीशियन') || t.includes('लाइट')) return 'electrician';
    if (t.includes('carpent') || t.includes('wood') || t.includes('furniture') || t.includes('बढ़ई') || t.includes('लकड़ी') || t.includes('फर्नीचर') || t.includes('कारपेंटर')) return 'carpenter';
    if (t.includes('tutor') || t.includes('teach') || t.includes('twitt') || t.includes('study') || t.includes('ट्यूटर') || t.includes('टीचर') || t.includes('शिक्षक') || t.includes('पढ़ाई')) return 'tutor';
    return t;
  };

  // Hindi & English locality mapper for voice input
  const detectLocalityFromVoice = (text: string): string | null => {
    const lower = text.toLowerCase();
    const localityMap: Record<string, string> = {
      'olandganj': 'Olandganj', 'ओलंदगंज': 'Olandganj', 'olanganj': 'Olandganj',
      'civil lines': 'Civil Lines', 'सिविल लाइंस': 'Civil Lines', 'सिविल लाइन': 'Civil Lines',
      'line bazar': 'Line Bazar', 'लाइन बाजार': 'Line Bazar', 'लाइन बजार': 'Line Bazar',
      'husainabad': 'Husainabad', 'हुसैनाबाद': 'Husainabad', 'हुसैन आबाद': 'Husainabad',
      'shahganj': 'Shahganj', 'शाहगंज': 'Shahganj', 'शाह गंज': 'Shahganj',
      'mariahu': 'Mariahu', 'मड़ियाहूं': 'Mariahu', 'मडियाहू': 'Mariahu',
      'kerakat': 'Kerakat', 'केराकत': 'Kerakat',
      'jafrabad': 'Jafrabad', 'जफराबाद': 'Jafrabad', 'zafarabad': 'Jafrabad',
      'machlishahr': 'Machlishahr', 'मछलीशहर': 'Machlishahr', 'machhlishahr': 'Machlishahr',
      'badlapur': 'Badlapur', 'बदलापुर': 'Badlapur',
      'khetasarai': 'Khetasarai', 'खेतासराय': 'Khetasarai',
      'mungra badshahpur': 'Mungra Badshahpur', 'मुंगरा बादशाहपुर': 'Mungra Badshahpur', 'मुंगरा': 'Mungra Badshahpur',
      'jalalpur': 'Jalalpur', 'जलालपुर': 'Jalalpur',
      'gaura badshahpur': 'Gaura Badshahpur', 'गौरा बादशाहपुर': 'Gaura Badshahpur', 'गौरा': 'Gaura Badshahpur'
    };

    for (const [key, val] of Object.entries(localityMap)) {
      if (lower.includes(key)) {
        return val;
      }
    }
    return null;
  };

  // Category mapper from voice input
  const detectCategoryFromVoice = (text: string): string | null => {
    const lower = text.toLowerCase();
    if (lower.includes('electric') || lower.includes('बिजली') || lower.includes('इलेक्ट्रीशियन') || lower.includes('वायरिंग') || lower.includes('लाइट')) return 'Electrician';
    if (lower.includes('plumb') || lower.includes('नल') || lower.includes('प्लंबर') || lower.includes('पाइप') || lower.includes('लीकेज')) return 'Plumber';
    if (lower.includes('mechanic') || lower.includes('मैकेनिक') || lower.includes('मिस्त्री') || lower.includes('बाइक') || lower.includes('गाड़ी') || lower.includes('सर्विस')) return 'Mechanic';
    if (lower.includes('ac') || lower.includes('कूलर') || lower.includes('एसी') || lower.includes('एयर कंडीशनर')) return 'AC Repair';
    if (lower.includes('carpent') || lower.includes('बढ़ई') || lower.includes('फर्नीचर') || lower.includes('लकड़ी') || lower.includes('कारपेंटर')) return 'Carpenter';
    if (lower.includes('clean') || lower.includes('सफाई') || lower.includes('झाड़ू') || lower.includes('पोछा') || lower.includes('स्वीपर')) return 'Cleaning';
    if (lower.includes('tutor') || lower.includes('ट्यूटर') || lower.includes('टीचर') || lower.includes('शिक्षक') || lower.includes('पढ़ाई') || lower.includes('मैथ')) return 'Tutor';
    if (lower.includes('beaut') || lower.includes('ब्यूटी') || lower.includes('सैलून') || lower.includes('पार्लर') || lower.includes('मेकअप') || lower.includes('हेयर')) return 'Beauty';
    return null;
  };

  // Voice Search Handler
  const toggleVoiceSearch = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      setVoiceNotice(t('speechNotSupported', 'Voice search not supported in this browser.'));
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setInterimTranscript('');
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      // Adapt language based on app state
      recognition.lang = language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setInterimTranscript('');
        setVoiceNotice(t('listening', 'Listening... Speak now'));
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setInterimTranscript(currentTranscript);

        if (event.results[0].isFinal) {
          const finalRaw = event.results[0][0].transcript.trim();
          handleVoiceSearchCompletion(finalRaw);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed') {
          setVoiceNotice(t('speechPermissionDenied', 'Microphone access denied.'));
        } else {
          setVoiceNotice(`Speech error: ${event.error}`);
        }
        setTimeout(() => setVoiceNotice(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Failed to initialize speech recognition', err);
      setIsListening(false);
      setVoiceNotice(t('speechPermissionDenied', 'Could not start microphone.'));
      setTimeout(() => setVoiceNotice(null), 4000);
    }
  };

  const handleVoiceSearchCompletion = (spokenText: string) => {
    setIsListening(false);
    setInterimTranscript('');
    
    // 1. Check for Locality
    const detectedLoc = detectLocalityFromVoice(spokenText);
    if (detectedLoc) {
      setSelectedLocality(detectedLoc);
      updateFilters('locality', detectedLoc);
    }

    // 2. Check for Category
    const detectedCat = detectCategoryFromVoice(spokenText);
    if (detectedCat) {
      setSelectedCategory(detectedCat);
      updateFilters('category', detectedCat);
    }

    // 3. Set search term
    let cleaned = spokenText;
    if (detectedLoc) {
      cleaned = cleaned.replace(new RegExp(detectedLoc, 'gi'), '');
    }
    cleaned = cleaned.replace(/chahiye|karo|me|in|ke|liye|ka|dhoondho|khojo|वाला|चाहिए|में|के|लिए/gi, ' ').trim();
    
    const finalSearch = cleaned || detectedCat || spokenText;
    setSearchTerm(finalSearch);

    // Provide friendly confirmation
    const message = language === 'hi' 
      ? `आवाज पहचानी: "${spokenText}" ${detectedCat ? `• श्रेणी: ${detectedCat}` : ''} ${detectedLoc ? `• इलाका: ${detectedLoc}` : ''}`
      : `Voice detected: "${spokenText}" ${detectedCat ? `• ${detectedCat}` : ''} ${detectedLoc ? `• in ${detectedLoc}` : ''}`;
    
    setVoiceNotice(message);
    setTimeout(() => setVoiceNotice(null), 5000);
  };

  const filteredProviders = providers.filter(p => {
    const skillsStr = formatSkillsString(p.skills).toLowerCase();
    const categoryStr = (p.category || '').toLowerCase();
    const searchLower = searchTerm.toLowerCase().trim();
    const searchNormalized = normalizeTerm(searchTerm);

    // Search term matching (fuzzy & synonym aware)
    const matchesSearch = !searchLower ? true : (
      (p.businessName || '').toLowerCase().includes(searchLower) || 
      (p.name || '').toLowerCase().includes(searchLower) ||
      skillsStr.includes(searchLower) ||
      categoryStr.includes(searchLower) ||
      (searchNormalized && categoryStr.includes(searchNormalized)) ||
      (p.locality || '').toLowerCase().includes(searchLower)
    );

    // Category filter matching
    const catLower = selectedCategory.toLowerCase().trim();
    const catNormalized = normalizeTerm(selectedCategory);
    const matchesCategory = !selectedCategory ? true : (
      categoryStr.includes(catLower) ||
      skillsStr.includes(catLower) ||
      (catNormalized && categoryStr.includes(catNormalized)) ||
      (p.category_id || '').toLowerCase() === catLower
    );

    // Locality filter matching (fuzzy)
    const locLower = selectedLocality.toLowerCase().trim();
    const pLocality = (p.locality || '').toLowerCase();
    const pServiceArea = (p.service_area || '').toLowerCase();

    const matchesLocality = !selectedLocality ? true : (
      pLocality.includes(locLower) ||
      pServiceArea.includes(locLower) ||
      locLower.includes(pLocality) ||
      (p.locality_id || '').toLowerCase() === locLower
    );

    return matchesSearch && matchesCategory && matchesLocality;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLocality('');
    setSearchParams({});
    setVoiceNotice(null);
  };

  const handleSuggestionClick = (text: string) => {
    handleVoiceSearchCompletion(text);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Action Bar: Search Title + Dark/Light Mode & Language Toggles */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-1">
            Jaunpur Verified Directory
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight flex items-center gap-2">
            <span>{t('searchTitle', 'Find Local Services in Jaunpur')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            {language === 'hi' 
              ? 'आवाज से बोलकर या लिखकर 14 इलाकों में सत्यापित मिस्त्री और सेवाएं खोजें'
              : 'Search hands-free with voice or text across 14 Jaunpur localities'}
          </p>
        </div>

        {/* Dark/Light & Language Action Pills */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer shadow-xs"
            title={language === 'en' ? 'Switch to Hindi (हिंदी में बदलें)' : 'Switch to English (अंग्रेजी में बदलें)'}
          >
            <Languages size={15} className="text-cyan-600 dark:text-cyan-400" />
            <span>{language === 'en' ? '🇮🇳 हिंदी' : '🇬🇧 English'}</span>
          </button>

          {/* Dark / Light Mode Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all cursor-pointer shadow-xs"
            title={theme === 'dark' ? t('lightMode', 'Switch to Light Mode') : t('darkMode', 'Switch to Dark Mode')}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={15} className="text-amber-400" />
                <span>{t('lightMode', 'Light')}</span>
              </>
            ) : (
              <>
                <Moon size={15} className="text-slate-700" />
                <span>{t('darkMode', 'Dark')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Search Bar Card */}
      <div className="bg-white dark:bg-slate-900 card p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Input + Voice Search Button */}
          <div className="relative flex-1 flex items-center">
            <SearchIcon className="absolute left-4 text-slate-400 dark:text-slate-500 pointer-events-none" size={20} />
            <input 
              type="text" 
              placeholder={t('searchPlaceholder', 'Search by name or skills (e.g. Electrician, Plumber, Cleaner, AC, Mechanic)...')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-13 pl-12 pr-14 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all font-medium text-sm md:text-base"
            />
            
            {/* Voice-to-Text Search Button */}
            <button
              onClick={toggleVoiceSearch}
              className={`absolute right-2.5 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                isListening 
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40 ring-4 ring-red-500/20' 
                  : 'bg-cyan-50 dark:bg-slate-700/80 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-slate-700 border border-cyan-200 dark:border-cyan-500/30'
              }`}
              title={isListening ? t('stopListening', 'Stop') : t('voiceSearchTooltip', 'Search with voice (बोलकर खोजें)')}
              aria-label="Voice Search"
            >
              {isListening ? (
                <div className="relative flex items-center justify-center">
                  <Mic size={19} className="animate-bounce" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-white" />
                </div>
              ) : (
                <Mic size={19} />
              )}
            </button>
          </div>

          {/* Category & Locality Selects */}
          <div className="grid grid-cols-2 sm:flex gap-2.5">
            <select 
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                updateFilters('category', e.target.value);
              }}
              className="h-13 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-medium text-sm appearance-none min-w-[150px] cursor-pointer"
            >
              <option value="">{t('allCategories', 'All Categories')}</option>
              <option value="Electrician">{t('electrician', 'Electrician')}</option>
              <option value="Plumber">{t('plumber', 'Plumber')}</option>
              <option value="Mechanic">{t('mechanic', 'Mechanic')}</option>
              <option value="AC Repair">{t('acRepair', 'AC Repair')}</option>
              <option value="Carpenter">{t('carpenter', 'Carpenter')}</option>
              <option value="Cleaning">{t('cleaning', 'Cleaning')}</option>
              <option value="Tutor">{t('tutor', 'Tutor')}</option>
              <option value="Beauty">{t('beauty', 'Beauty & Salon')}</option>
            </select>

            <select 
              value={selectedLocality}
              onChange={(e) => {
                setSelectedLocality(e.target.value);
                updateFilters('locality', e.target.value);
              }}
              className="h-13 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40 font-medium text-sm appearance-none min-w-[150px] cursor-pointer"
            >
              <option value="">{t('allLocalities', 'All Jaunpur (14 Localities)')}</option>
              {JAUNPUR_LOCALITIES.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>

            {(selectedCategory || selectedLocality || searchTerm) && (
              <button 
                onClick={clearFilters}
                className="btn-secondary h-13 px-4 flex items-center justify-center gap-1.5 border-red-200 dark:border-red-900/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-2xl cursor-pointer text-xs sm:text-sm font-semibold transition-colors"
                title={t('clearFilters', 'Clear All Filters')}
              >
                <X size={17} />
                <span>{t('clear', 'Clear')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Live Listening Waveform / Transcription Display */}
        {isListening && (
          <div className="mt-4 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <div>
                <div className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  {t('listening', 'Listening...')} ({language === 'hi' ? 'हिंदी मोड' : 'English Mode'})
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">
                  {interimTranscript || t('listeningHint', 'Speak e.g. "Electrician in Olandganj" or "नल ठीक करने वाला"')}
                </div>
              </div>
            </div>
            <button
              onClick={toggleVoiceSearch}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              {t('stopListening', 'Stop')}
            </button>
          </div>
        )}

        {/* Voice Recognition Notification / Result Feedback */}
        {voiceNotice && !isListening && (
          <div className="mt-3 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <button 
              onClick={() => setVoiceNotice(null)} 
              className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Hands-Free Voice Quick Suggestions Chips */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 font-medium">
            <Mic size={13} className="text-cyan-500" />
            <span>{t('trySpeaking', 'Quick voice suggestions:')}</span>
          </span>
          <button
            onClick={() => handleSuggestionClick(language === 'hi' ? 'ओलंदगंज में इलेक्ट्रीशियन' : 'Electrician in Olandganj')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors cursor-pointer border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800"
          >
            "{language === 'hi' ? 'ओलंदगंज में इलेक्ट्रीशियन' : 'Electrician in Olandganj'}"
          </button>
          <button
            onClick={() => handleSuggestionClick(language === 'hi' ? 'लाइन बाजार में प्लंबर' : 'Line Bazar me Plumber')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors cursor-pointer border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800"
          >
            "{language === 'hi' ? 'लाइन बाजार में प्लंबर' : 'Line Bazar me Plumber'}"
          </button>
          <button
            onClick={() => handleSuggestionClick(language === 'hi' ? 'हुसैनाबाद में एसी रिपेयर' : 'Car AC Repair Husainabad')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors cursor-pointer border border-transparent hover:border-cyan-200 dark:hover:border-cyan-800"
          >
            "{language === 'hi' ? 'हुसैनाबाद में एसी रिपेयर' : 'Car AC Repair Husainabad'}"
          </button>
        </div>
      </div>

      {/* Results Header: Count & View Switch */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
          {loading ? t('searchingProviders', 'Searching Jaunpur Providers...') : (
            <>
              {filteredProviders.length} {filteredProviders.length === 1 ? t('providerFound', 'Provider found') : t('providersFound', 'Providers found')}
              {selectedLocality && <span className="text-slate-400 font-normal ml-2">{t('inLocality', 'in')} {selectedLocality}</span>}
              {selectedCategory && <span className="text-slate-400 font-normal ml-2">{t('forCategory', 'for')} {selectedCategory}</span>}
            </>
          )}
        </h2>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <button 
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'list' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <List size={16} />
            <span>{t('list', 'List')}</span>
          </button>
          <button 
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs md:text-sm font-bold transition-all cursor-pointer ${
              viewMode === 'map' 
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-cyan-400 shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <MapIcon size={16} />
            <span>{t('map', 'Map')}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {loading ? (
          <div className="grid gap-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="card p-6 h-48 animate-pulse bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl" />
            ))}
          </div>
        ) : viewMode === 'map' ? (
          <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
            <ProviderMap providers={filteredProviders} selectedLocality={selectedLocality} />
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredProviders.length > 0 ? (
              filteredProviders.map((provider) => (
                <Link 
                  key={provider.id || provider.provider_id} 
                  to={`/provider/${provider.provider_id || provider.id}`}
                  className="card p-4 md:p-6 hover:shadow-xl transition-all group flex flex-col md:flex-row gap-6 border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl"
                >
                  <div className="w-full md:w-48 aspect-[4/3] md:aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center">
                    <img 
                      src={provider.photo || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.businessName}`} 
                      alt={provider.businessName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                      <div>
                        {provider.isDemo && (
                          <div className="mb-1.5 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full w-fit border border-amber-200 dark:border-amber-800/60">
                            <AlertTriangle size={12} /> {t('demoProfileNotice', 'DEMO PROFILE — NOT A REAL OR VERIFIED PROVIDER')}
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 transition-colors">
                            {provider.businessName}
                          </h3>
                          {!provider.isDemo && provider.verificationStatus === 'verified' && (
                            <ShieldCheck size={20} className="text-cyan-500" />
                          )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                          {provider.name} · <span className="font-bold text-slate-900 dark:text-slate-200">{provider.category}</span>
                        </p>
                      </div>
                      
                      {/* Rating Badge */}
                      <div className="flex items-center gap-1 bg-slate-900 dark:bg-slate-800 text-white dark:text-cyan-300 px-3 py-1 rounded-full text-sm font-bold w-fit shadow-md border border-slate-700/50">
                        <Star size={14} fill="currentColor" className="text-amber-400" />
                        <span>{provider.rating || t('newBadge', 'New')}</span>
                      </div>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm line-clamp-2">
                      {provider.bio || formatSkillsString(provider.skills)}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-3 border-y border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 text-xs md:text-sm font-medium">
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <MapPin size={14} className="text-slate-500 dark:text-slate-400" />
                        </div>
                        <span>{provider.locality || 'Jaunpur'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xs md:text-sm">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                          <span className="text-emerald-700 dark:text-emerald-400 text-[11px] font-black">₹</span>
                        </div>
                        <span>{cleanPrice(provider.price)}</span>
                      </div>
                      <div className="hidden md:flex items-center gap-2 text-slate-400 text-xs">
                        <span>{provider.reviews || 0} {t('reviews', 'reviews')}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${provider.isDemo ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
                        <span className={`font-medium ${provider.isDemo ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {provider.isDemo ? t('demoSlot', 'Demo Slot (Replace to activate)') : t('availableToday', 'Available Today')}
                        </span>
                      </div>
                      <button className="btn-primary flex items-center gap-2 rounded-xl px-5 py-2 text-xs md:text-sm font-bold shadow-md cursor-pointer">
                        <span>{t('viewProfile', 'View Profile')}</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="card p-12 md:p-16 text-center bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-200 dark:border-slate-700">
                  <SearchIcon size={32} className="text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                  {t('noProvidersTitle', 'No providers found')}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
                  {t('noProvidersDesc', 'Try adjusting your filters, speaking again, or searching in a different locality of Jaunpur.')}
                </p>
                <button 
                  onClick={clearFilters}
                  className="btn-primary rounded-xl px-6 py-2.5 font-bold cursor-pointer"
                >
                  {t('tryDifferentSearch', 'Clear all filters and search again')}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceSearch;
