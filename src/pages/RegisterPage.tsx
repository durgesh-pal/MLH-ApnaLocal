import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Briefcase, ChevronRight } from 'lucide-react';
import { UserRole } from '../types';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-white flex items-center justify-center p-4 transition-colors">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <Link to="/" className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">ApnaLocal</Link>
          <h2 className="text-2xl font-bold mt-4 font-display">Choose Your Role</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">How would you like to use ApnaLocal in Jaunpur?</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button 
            onClick={() => handleRoleSelect('customer')}
            className="group card p-8 text-left bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500 dark:hover:border-cyan-400 transition-all cursor-pointer shadow-sm hover:shadow-xl dark:hover:shadow-cyan-500/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white mb-6 group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-600 group-hover:text-slate-950 transition-all shadow-xs">
              <User size={30} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-2">I am a Customer</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">I want to find and book local service providers in my area.</p>
            <div className="flex items-center text-slate-900 dark:text-cyan-400 font-bold text-sm">
              Get Started <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          <button 
            onClick={() => handleRoleSelect('provider')}
            className="group card p-8 text-left bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 hover:border-cyan-500 dark:hover:border-cyan-400 transition-all cursor-pointer shadow-sm hover:shadow-xl dark:hover:shadow-cyan-500/10"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white mb-6 group-hover:bg-gradient-to-r group-hover:from-cyan-500 group-hover:to-blue-600 group-hover:text-slate-950 transition-all shadow-xs">
              <Briefcase size={30} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-2">I am a Provider</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">I want to offer my services and grow my business locally.</p>
            <div className="flex items-center text-slate-900 dark:text-cyan-400 font-bold text-sm">
              Join as Provider <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <p className="text-center text-slate-500 dark:text-slate-400 text-sm mt-12">
          Want to explore directly? {' '}
          <Link to="/dashboard" className="text-slate-900 dark:text-cyan-400 font-bold hover:underline">
            Go to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
