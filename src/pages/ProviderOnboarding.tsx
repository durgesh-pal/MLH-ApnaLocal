import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Briefcase, MapPin, List, Save, ChevronRight, CheckCircle2 } from 'lucide-react';

const onboardingSchema = z.object({
  businessName: z.string().min(3, 'Business name must be at least 3 characters'),
  bio: z.string().min(20, 'Bio must be at least 20 characters'),
  locality: z.string().min(3, 'Please enter your locality in Jaunpur'),
  skills: z.string().min(3, 'Please list some skills (comma separated)'),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

const ProviderOnboarding: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<OnboardingValues>();

  const onSubmit = async (data: OnboardingValues) => {
    if (!user) return;
    setLoading(true);
    try {
      const skillsArray = data.skills.split(',').map(s => s.trim()).filter(Boolean);
      await updateDoc(doc(db, 'providerProfiles', user.uid), {
        businessName: data.businessName,
        bio: data.bio,
        locality: data.locality,
        skills: skillsArray,
        verificationStatus: 'pending', // Move to pending after onboarding
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (error) {
      console.error("Onboarding Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto card p-12 text-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={48} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Profile Updated!</h2>
        <p className="text-slate-500 mb-8">
          Your profile has been submitted for verification. You can now start receiving requests.
        </p>
        <div className="animate-pulse text-sm text-slate-400">Redirecting to your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Professional Onboarding</h1>
        <p className="text-slate-500 mt-2">Tell us about your business to get started on ApnaLocal.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 md:p-8 space-y-6">
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={16} /> Business Name
            </span>
            <input 
              type="text" 
              {...register('businessName', { required: 'Required' })}
              placeholder="e.g. Verma Electrical Services"
              className="mt-2 w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all"
            />
            {errors.businessName && <p className="mt-1 text-xs text-red-500">{errors.businessName.message}</p>}
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <List size={16} /> Bio / Description
            </span>
            <textarea 
              {...register('bio', { required: 'Required' })}
              placeholder="Tell customers about your experience and services..."
              rows={4}
              className="mt-2 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all"
            />
            {errors.bio && <p className="mt-1 text-xs text-red-500">{errors.bio.message}</p>}
          </label>

          <div className="grid md:grid-cols-2 gap-6">
            <label className="block">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <MapPin size={16} /> Primary Locality
              </span>
              <input 
                type="text" 
                {...register('locality', { required: 'Required' })}
                placeholder="e.g. Line Bazar, Jaunpur"
                className="mt-2 w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all"
              />
              {errors.locality && <p className="mt-1 text-xs text-red-500">{errors.locality.message}</p>}
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Save size={16} /> Skills (comma separated)
              </span>
              <input 
                type="text" 
                {...register('skills', { required: 'Required' })}
                placeholder="Plumbing, Tiling, Pipe Fitting"
                className="mt-2 w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all"
              />
              {errors.skills && <p className="mt-1 text-xs text-red-500">{errors.skills.message}</p>}
            </label>
          </div>

          <div className="pt-4 space-y-4">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Verification Documents</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Save size={20} />
                </div>
                <div className="text-xs font-bold text-slate-900">Aadhar Card / ID</div>
                <input type="file" className="hidden" id="id-upload" />
                <button 
                  type="button" 
                  onClick={() => document.getElementById('id-upload')?.click()}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Upload Image
                </button>
              </div>
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2 hover:border-slate-300 transition-colors">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Save size={20} />
                </div>
                <div className="text-xs font-bold text-slate-900">Trade License (Optional)</div>
                <input type="file" className="hidden" id="license-upload" />
                <button 
                  type="button" 
                  onClick={() => document.getElementById('license-upload')?.click()}
                  className="text-[10px] text-blue-600 font-bold hover:underline"
                >
                  Upload Image
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 italic">
              Verification takes 24-48 hours. Our team in Jaunpur will review your documents.
            </p>
          </div>
        </div>

        <div className="pt-4">
          <button 
            type="submit" 
            disabled={loading}
            className="btn-primary w-full h-14 text-lg flex items-center justify-center gap-2"
          >
            {loading ? 'Submitting...' : (
              <>
                Complete Onboarding <ChevronRight size={20} />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProviderOnboarding;
