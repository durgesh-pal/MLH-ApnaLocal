import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Search, Calendar, FileText, Users, User, LogOut, Sparkles, Mail, CheckCircle2, AlertCircle, Sun, Moon, Languages, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { auth } from '../../lib/firebase';
import { signOut, sendEmailVerification } from 'firebase/auth';
import FloatingChatWidget from '../FloatingChatWidget';
import { useAppContext } from '../../contexts/AppContext';

const Layout: React.FC = () => {
  const { user, firebaseUser, isAdmin, isEmailVerified } = useAuth();
  const { theme, toggleTheme, language, toggleLanguage, t } = useAppContext();
  const location = useLocation();
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const navItems = [
    { label: t('home', 'Home'), icon: Home, path: '/dashboard', roles: ['customer', 'provider', 'admin'] },
    { label: t('services', 'Services'), icon: Search, path: '/search', roles: ['customer', 'provider', 'admin'] },
    { label: t('aiChat', 'AI Chat'), icon: Sparkles, path: '/ai', roles: ['customer', 'provider', 'admin'] },
    { label: t('bookings', 'Bookings'), icon: Calendar, path: '/bookings', roles: ['customer', 'provider', 'admin'] },
    { label: t('reports', 'Reports'), icon: FileText, path: '/reports', roles: ['customer', 'provider', 'admin'] },
    { label: t('community', 'Community'), icon: Users, path: '/community', roles: ['customer', 'provider', 'admin'] },
  ];

  if (isAdmin) {
    navItems.push({ label: t('adminPortal', 'Admin Portal'), icon: User, path: '/admin', roles: ['admin'] });
  }

  const handleLogout = () => signOut(auth);

  const handleResendVerification = async () => {
    if (!firebaseUser) return;
    setResendingEmail(true);
    try {
      await sendEmailVerification(firebaseUser);
      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 5000);
    } catch (err) {
      console.error("Error sending verification email:", err);
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      {/* Floating Glassmorphic Header */}
      <header className="sticky top-0 z-40 w-full px-3 sm:px-6 pt-3 pb-2 backdrop-blur-xl bg-white/70 dark:bg-[#030712]/80 border-b border-slate-200/60 dark:border-white/5 transition-all">
        <div className="max-w-7xl mx-auto h-14 md:h-16 flex items-center justify-between gap-4">
          {/* Brand Logo with Luxury Accent */}
          <Link to="/" className="group flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-900 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-extrabold text-lg tracking-tight font-display">A</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display flex items-center gap-1.5">
                ApnaLocal
                <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  JAUNPUR
                </span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.path} 
                  to={item.path}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive 
                      ? 'bg-slate-900 text-white dark:bg-white/10 dark:text-cyan-300 shadow-xs' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  <item.icon size={15} className={isActive ? 'text-cyan-400' : 'opacity-70'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Action Hub */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-cyan-500/40 transition-all cursor-pointer shadow-xs"
              title={language === 'en' ? 'Switch to Hindi (हिंदी)' : 'Switch to English'}
            >
              <Languages size={13} className="text-cyan-500" />
              <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white hover:border-cyan-500/40 transition-all cursor-pointer shadow-xs text-xs font-semibold"
              title={theme === 'dark' ? t('lightMode', 'Switch to Light Mode') : t('darkMode', 'Switch to Dark Mode')}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={15} className="text-amber-400" />
                  <span className="hidden lg:inline">{t('lightMode', 'Light')}</span>
                </>
              ) : (
                <>
                  <Moon size={15} className="text-slate-700" />
                  <span className="hidden lg:inline">{t('darkMode', 'Dark')}</span>
                </>
              )}
            </button>

            {/* User Account / Auth */}
            {user ? (
              <div className="flex items-center gap-2.5 pl-1">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 py-1 px-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-cyan-500/30 transition-all"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center uppercase">
                    {user.displayName?.[0] || 'U'}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-slate-800 dark:text-slate-200">
                    {user.displayName?.split(' ')[0]}
                  </span>
                </Link>
                <button 
                  onClick={handleLogout} 
                  className="p-2 text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                  title={t('logout', 'Sign Out')}
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <Link 
                to="/dashboard" 
                className="btn-primary text-xs sm:text-sm py-2 px-4 shadow-md shadow-cyan-500/20"
              >
                {t('dashboard', 'Dashboard')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Email Verification Banner */}
      {firebaseUser && !isEmailVerified && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 z-20 shadow-sm">
          <div className="flex items-center gap-2 max-w-3xl">
            <AlertCircle size={15} />
            <span>Email Verification Required: Please verify your email ({firebaseUser.email}) for full account security.</span>
          </div>
          <button 
            onClick={handleResendVerification}
            disabled={resendingEmail || emailSent}
            className="bg-slate-950 text-white px-3 py-1 rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 text-[11px] font-bold"
          >
            {emailSent ? 'Verification Sent!' : (resendingEmail ? 'Sending...' : 'Resend Link')}
          </button>
        </div>
      )}

      {/* Main App Content Viewport */}
      <main className="flex-1 w-full pb-20 md:pb-12">
        <Outlet />
      </main>

      {/* Floating Gemini Chatbot Widget */}
      <FloatingChatWidget />

      {/* Luxury Footer */}
      <footer className="bg-white dark:bg-[#02050e] border-t border-slate-200 dark:border-white/5 py-14 mt-auto transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  A
                </div>
                <span className="text-xl font-extrabold text-slate-900 dark:text-white font-display">ApnaLocal</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm max-w-sm leading-relaxed">
                Jaunpur's premier hyperlocal services marketplace. Connecting homeowners, residents, and businesses with vetted local technicians with AI matching precision.
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Shield size={14} />
                <span>100% ID & Skill Verified Local Technicians</span>
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-mono">
                Explore
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/search" className="hover:text-cyan-500 transition-colors">Find Providers</Link></li>
                <li><Link to="/search?category=Electrician" className="hover:text-cyan-500 transition-colors">Electricians</Link></li>
                <li><Link to="/search?category=Plumber" className="hover:text-cyan-500 transition-colors">Plumbers</Link></li>
                <li><Link to="/search?category=AC+Repair" className="hover:text-cyan-500 transition-colors">AC Repair</Link></li>
                <li><Link to="/community" className="hover:text-cyan-500 transition-colors">Community Help</Link></li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-mono">
                Localities
              </h4>
              <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
                <li><Link to="/search?locality=Olandganj" className="hover:text-cyan-500 transition-colors">Olandganj</Link></li>
                <li><Link to="/search?locality=Line+Bazar" className="hover:text-cyan-500 transition-colors">Line Bazar</Link></li>
                <li><Link to="/search?locality=Civil+Lines" className="hover:text-cyan-500 transition-colors">Civil Lines</Link></li>
                <li><Link to="/search?locality=Shahganj" className="hover:text-cyan-500 transition-colors">Shahganj</Link></li>
                <li><Link to="/search?locality=Badlapur" className="hover:text-cyan-500 transition-colors">Badlapur</Link></li>
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4 font-mono">
                Join the Network
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you an electrician, plumber, mechanic or technician in Jaunpur? Register as a verified service partner today.
              </p>
              <Link
                to="/register?role=provider"
                className="btn-primary w-fit text-xs px-4 py-2"
              >
                Register as Provider
              </Link>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-500">
            <div>© 2026 ApnaLocal Technologies. All rights reserved. Crafted for Jaunpur, Uttar Pradesh.</div>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="hover:underline">Privacy</Link>
              <Link to="/terms" className="hover:underline">Terms</Link>
              <Link to="/support" className="hover:underline">Support</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Floating Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#030712]/90 backdrop-blur-xl border-t border-slate-200/80 dark:border-white/10 h-16 flex items-center justify-around z-40 transition-colors">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={`flex flex-col items-center gap-1 p-1.5 transition-colors ${isActive ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}
            >
              <item.icon size={19} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
