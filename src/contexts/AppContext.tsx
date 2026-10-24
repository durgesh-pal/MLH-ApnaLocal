import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';
export type Language = 'en' | 'hi';

interface AppContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Nav & General
    home: 'Home',
    services: 'Services',
    aiChat: 'AI Chat',
    bookings: 'Bookings',
    reports: 'Reports',
    community: 'Community',
    adminPortal: 'Admin Portal',
    login: 'Login',
    logout: 'Logout',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    switchLang: 'हिंदी',
    langLabel: 'English',

    // Service Search
    searchTitle: 'Find Local Services in Jaunpur',
    searchPlaceholder: 'Search by name or skills (e.g. Electrician, Plumber, Cleaner, AC, Mechanic)...',
    voiceSearchTooltip: 'Search with voice (English or Hindi)',
    listening: 'Listening...',
    listeningHint: 'Speak e.g. "Electrician in Olandganj" or "नल ठीक करने वाला"',
    speechNotSupported: 'Speech recognition is not supported in this browser.',
    speechPermissionDenied: 'Microphone permission denied. Please allow mic access.',
    stopListening: 'Stop',
    voiceDetected: 'Detected speech',
    
    // Filters & Categories
    allCategories: 'All Categories',
    allLocalities: 'All Jaunpur (14 Localities)',
    electrician: 'Electrician',
    plumber: 'Plumber',
    mechanic: 'Mechanic',
    acRepair: 'AC Repair',
    carpenter: 'Carpenter',
    cleaning: 'Cleaning',
    tutor: 'Tutor',
    beauty: 'Beauty & Salon',
    
    // View & Actions
    list: 'List',
    map: 'Map',
    clearFilters: 'Clear All',
    clear: 'Clear',
    providersFound: 'providers found',
    providerFound: 'provider found',
    searchingProviders: 'Searching Jaunpur Providers...',
    inLocality: 'in',
    forCategory: 'for',
    availableToday: 'Available Today',
    demoSlot: 'Demo Slot (Replace to activate)',
    demoProfileNotice: 'DEMO PROFILE — NOT A REAL OR VERIFIED PROVIDER',
    viewProfile: 'View Profile',
    reviews: 'reviews',
    newBadge: 'New',
    noProvidersTitle: 'No providers found',
    noProvidersDesc: 'Try adjusting your filters, speaking again, or searching in a different locality of Jaunpur.',
    tryDifferentSearch: 'Clear all filters and search again',

    // Voice quick suggestions
    trySpeaking: 'Quick voice suggestions:',
    suggest1: 'Electrician in Olandganj',
    suggest2: 'Line Bazar me Plumber',
    suggest3: 'Car AC Repair Husainabad'
  },
  hi: {
    // Nav & General
    home: 'होम',
    services: 'सेवाएं',
    aiChat: 'एआई चैट',
    bookings: 'मेरी बुकिंग्स',
    reports: 'रिपोर्ट्स',
    community: 'कम्युनिटी',
    adminPortal: 'एडमिन पोर्टल',
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    switchLang: 'English',
    langLabel: 'हिंदी',

    // Service Search
    searchTitle: 'जौनपुर में स्थानीय सेवाएं खोजें',
    searchPlaceholder: 'नाम या सेवा खोजें (जैसे: इलेक्ट्रीशियन, प्लंबर, सफाई, एसी, मैकेनिक)...',
    voiceSearchTooltip: 'आवाज से बोलकर खोजें (हिंदी या अंग्रेजी)',
    listening: 'सुन रहे हैं...',
    listeningHint: 'बोलिए जैसे: "ओलंदगंज में इलेक्ट्रीशियन" या "नल ठीक करने वाला"',
    speechNotSupported: 'इस ब्राउज़र में वॉइस सर्च समर्थित नहीं है।',
    speechPermissionDenied: 'माइक्रोफोन की अनुमति नहीं मिली। कृपया अनुमति दें।',
    stopListening: 'रोकें',
    voiceDetected: 'पहचानी गई आवाज',

    // Filters & Categories
    allCategories: 'सभी श्रेणियां',
    allLocalities: 'सम्पूर्ण जौनपुर (14 इलाके)',
    electrician: 'इलेक्ट्रीशियन (बिजली)',
    plumber: 'प्लंबर (नल व पाइप)',
    mechanic: 'मैकेनिक (वाहन)',
    acRepair: 'एसी रिपेयर',
    carpenter: 'कारपेंटर (बढ़ई)',
    cleaning: 'सफाई सेवा',
    tutor: 'ट्यूटर (शिक्षक)',
    beauty: 'ब्यूटी व सैलून',

    // View & Actions
    list: 'सूची',
    map: 'नक्शा',
    clearFilters: 'फिल्टर हटाएं',
    clear: 'हटाएं',
    providersFound: 'प्रोवाइडर मिले',
    providerFound: 'प्रोवाइडर मिला',
    searchingProviders: 'जौनपुर के प्रोवाइडर खोज रहे हैं...',
    inLocality: 'में',
    forCategory: 'हेतु',
    availableToday: 'आज उपलब्ध',
    demoSlot: 'डेमो स्लॉट (सक्रिय करने हेतु बदलें)',
    demoProfileNotice: 'डेमो प्रोफाइल — यह वास्तविक या सत्यापित प्रोवाइडर नहीं है',
    viewProfile: 'प्रोफाइल देखें',
    reviews: 'समीक्षाएं',
    newBadge: 'नया',
    noProvidersTitle: 'कोई सेवा प्रदाता नहीं मिला',
    noProvidersDesc: 'कृपया अपने फिल्टर बदलें, दोबारा बोलकर खोजें, या जौनपुर के किसी अन्य इलाके में खोजें।',
    tryDifferentSearch: 'सभी फिल्टर हटाएं और पुनः खोजें',

    // Voice quick suggestions
    trySpeaking: 'आवाज से बोलने के सुझाव:',
    suggest1: 'ओलंदगंज में इलेक्ट्रीशियन',
    suggest2: 'लाइन बाजार में प्लंबर',
    suggest3: 'हुसैनाबाद में एसी रिपेयर'
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('apnalocal_theme') as Theme;
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('apnalocal_lang') as Language;
    return (saved === 'hi' || saved === 'en') ? saved : 'en';
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.add('dark');
      body.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('apnalocal_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('apnalocal_lang', language);
  }, [language]);

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language];
    if (langDict && langDict[key]) {
      return langDict[key];
    }
    // Fallback to English dictionary
    if (translations.en[key]) {
      return translations.en[key];
    }
    return fallback || key;
  };

  return (
    <AppContext.Provider value={{
      theme,
      language,
      toggleTheme,
      setTheme,
      toggleLanguage,
      setLanguage,
      t
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
