import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Calendar, Clock, MapPin, AlertCircle, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';

const bookingSchema = z.object({
  problemDescription: z.string().min(10, 'Please describe your problem in at least 10 characters'),
  address: z.string().min(5, 'Please provide a full address'),
  scheduledDate: z.string().min(1, 'Please select a date'),
  scheduledTime: z.string().min(1, 'Please select a time'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const BookingFlow: React.FC = () => {
  const { providerId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, watch } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      scheduledDate: new Date().toISOString().split('T')[0],
    }
  });

  const onSubmit = async (data: BookingFormValues) => {
    if (!providerId) return;
    setLoading(true);
    try {
      const scheduledAt = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      await addDoc(collection(db, 'bookings'), {
        customerId: user?.uid || 'guest_user',
        providerId: providerId,
        status: 'pending',
        problemDescription: data.problemDescription,
        address: data.address,
        scheduledAt: scheduledAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setSuccess(true);
      setTimeout(() => navigate('/bookings'), 3000);
    } catch (error) {
      console.error("Booking Error:", error);
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
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Booking Requested!</h2>
        <p className="text-slate-500 mb-8">
          Your service request has been sent to the provider. You'll be notified when they accept.
        </p>
        <div className="animate-pulse text-sm text-slate-400">Redirecting to your bookings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900">Book Service</h1>
        <p className="text-slate-500 mt-2">Complete the details below to request a service.</p>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between px-4">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
              step >= s ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {s}
            </div>
            {s === 1 && (
              <div className={`flex-1 h-1 mx-4 rounded-full transition-colors ${
                step > 1 ? 'bg-slate-900' : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="card p-6 md:p-8 space-y-6 animate-in slide-in-from-right duration-300">
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Describe the problem</span>
                <textarea 
                  {...register('problemDescription')}
                  placeholder="e.g. My kitchen tap is leaking and water is dripping constantly..."
                  rows={5}
                  className="mt-2 w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all"
                />
                {errors.problemDescription && <p className="mt-1 text-xs text-red-500 font-medium">{errors.problemDescription.message}</p>}
              </label>
            </div>
            <button 
              type="button" 
              onClick={() => setStep(2)}
              disabled={!watch('problemDescription') || watch('problemDescription').length < 10}
              className="btn-primary w-full h-14 text-lg flex items-center justify-center gap-2"
            >
              Next Step <ChevronRight size={20} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card p-6 md:p-8 space-y-6 animate-in slide-in-from-right duration-300">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Calendar size={16} /> Preferred Date
                  </span>
                  <input 
                    type="date" 
                    {...register('scheduledDate')}
                    className="mt-2 w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all"
                  />
                  {errors.scheduledDate && <p className="mt-1 text-xs text-red-500 font-medium">{errors.scheduledDate.message}</p>}
                </label>
              </div>
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Clock size={16} /> Preferred Time
                  </span>
                  <select 
                    {...register('scheduledTime')}
                    className="mt-2 w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all"
                  >
                    <option value="">Select a slot</option>
                    <option value="09:00">09:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="13:00">01:00 PM</option>
                    <option value="15:00">03:00 PM</option>
                    <option value="17:00">05:00 PM</option>
                  </select>
                  {errors.scheduledTime && <p className="mt-1 text-xs text-red-500 font-medium">{errors.scheduledTime.message}</p>}
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={16} /> Service Address
                </span>
                <input 
                  type="text" 
                  {...register('address')}
                  placeholder="Street, Locality, House No."
                  className="mt-2 w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 transition-all"
                />
                {errors.address && <p className="mt-1 text-xs text-red-500 font-medium">{errors.address.message}</p>}
              </label>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 leading-relaxed">
                The provider will review your request and confirm the final time and price estimate. You can pay directly after the service is completed.
              </p>
            </div>

            <div className="flex gap-4">
              <button 
                type="button" 
                onClick={() => setStep(1)}
                className="btn-secondary flex-1 h-14"
              >
                Back
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="btn-primary flex-[2] h-14 text-lg flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default BookingFlow;
