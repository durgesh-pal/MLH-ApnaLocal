import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Calendar, MessageSquare, IndianRupee, CheckCircle2, AlertCircle, ChevronRight, UserCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const ProviderDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.displayName?.split(' ')[0]}!</h1>
          <p className="text-slate-500 text-sm mt-1">Manage your business and bookings today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/onboarding" className="btn-secondary flex items-center gap-2">
            Edit Profile
          </Link>
          <button className="btn-primary">Go Online</button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Today Jobs', value: '0', icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'New Requests', value: '0', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Completed', value: '12', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Earnings', value: '₹4,500', icon: IndianRupee, color: 'text-slate-900', bg: 'bg-slate-50' },
        ].map((stat, i) => (
          <div key={i} className="card p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Verification Banner */}
      <section className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800 rounded-full -mr-10 -mt-10 opacity-50 blur-2xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 shrink-0">
              <UserCheck size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Profile Verification</h3>
              <p className="text-slate-400 text-sm">Verify your profile to get 3x more bookings and a "Verified" badge.</p>
            </div>
          </div>
          <button className="btn-primary bg-white text-slate-900 hover:bg-slate-100 whitespace-nowrap">
            Submit Documents
          </button>
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Requests */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">New Service Requests</h2>
            <Link to="/bookings" className="text-sm font-semibold text-slate-900 hover:underline flex items-center">
              See All <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Briefcase size={28} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">No new requests</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto">
              When customers in your area request your services, they will appear here.
            </p>
          </div>
        </div>

        {/* Messaging & Copilot */}
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">AI Copilot</h2>
            <div className="card p-6 bg-slate-900 text-white space-y-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Smart Draft</span>
              </div>
              <p className="text-sm text-slate-400">
                Paste a customer's query to generate a professional Hinglish response.
              </p>
              <textarea 
                placeholder="e.g. Mere ghar ka AC thanda nahi kar raha hai..."
                id="copilot-input"
                className="w-full bg-slate-800 border-none rounded-xl p-3 text-sm focus:ring-1 focus:ring-emerald-400 outline-none h-24"
              />
              <button 
                onClick={async () => {
                  const input = document.getElementById('copilot-input') as HTMLTextAreaElement;
                  const btn = document.getElementById('copilot-btn') as HTMLButtonElement;
                  if (!input.value) return;
                  
                  btn.disabled = true;
                  btn.innerHTML = '<div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Drafting...';
                  
                  try {
                    const res = await fetch('/api/ai/copilot-draft', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        customerMessage: input.value,
                        serviceType: 'General Service'
                      }),
                    });
                    const data = await res.json();
                    input.value = data.draft;
                  } catch (err) {
                    console.error(err);
                  } finally {
                    btn.disabled = false;
                    btn.innerHTML = 'Generate Response';
                  }
                }}
                id="copilot-btn"
                className="w-full btn-primary bg-emerald-500 hover:bg-emerald-600 border-none text-slate-900 h-10 text-xs font-bold"
              >
                Generate Response
              </button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-900">Recent Chats</h2>
          <div className="card divide-y divide-slate-100">
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <MessageSquare size={28} />
              </div>
              <p className="text-slate-500 text-sm">No active conversations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;
