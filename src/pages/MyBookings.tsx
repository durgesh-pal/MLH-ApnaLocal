import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Booking, BookingStatus } from '../types';
import { Calendar, Clock, MapPin, CheckCircle2, XCircle, Clock4, MessageSquare, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import ServiceReportModal from '../components/ServiceReportModal';

const statusColors: Record<BookingStatus, string> = {
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  accepted: 'bg-blue-50 text-blue-600 border-blue-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',
  reschedule_requested: 'bg-purple-50 text-purple-600 border-purple-100',
  confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  in_progress: 'bg-blue-50 text-blue-600 border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-slate-50 text-slate-400 border-slate-100',
  disputed: 'bg-red-100 text-red-700 border-red-200',
};

const MyBookings: React.FC = () => {
  const { user, isProvider, isCustomer } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportBooking, setReportBooking] = useState<any>(null);

  useEffect(() => {
    const activeUid = user?.uid || 'guest_user';
    const field = isProvider ? 'providerId' : 'customerId';
    const q = query(collection(db, 'bookings'), where(field, '==', activeUid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking));
      setBookings(docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    }, (error) => {
      console.warn("MyBookings snapshot warning:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user, isProvider]);

  const updateStatus = async (bookingId: string, status: BookingStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading bookings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 px-4 sm:px-6 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-display">My Bookings & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your service bookings and access official consultation/service reports.</p>
        </div>
        <div className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 px-3 py-1 bg-cyan-500/10 rounded-full border border-cyan-500/20">{bookings.length} total</div>
      </div>

      <div className="space-y-4">
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <div key={booking.id} className="card p-6 flex flex-col md:flex-row gap-6 bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-xs hover:border-cyan-500/40 transition-all">
              <div className="flex-1 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusColors[booking.status]}`}>
                    {booking.status.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    Requested on {format(new Date(booking.createdAt), 'MMM d, h:mm a')}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 font-display">
                  {booking.problemDescription}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-cyan-500" />
                    <span>{format(new Date(booking.scheduledAt), 'EEEE, MMM d')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-cyan-500" />
                    <span>{format(new Date(booking.scheduledAt), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <MapPin size={16} className="text-cyan-500 shrink-0" />
                    <span className="truncate">{booking.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    {booking.status === 'completed' && (
                      <button 
                        onClick={() => setReportBooking(booking)}
                        className="btn-primary h-10 px-4 flex items-center gap-2 text-sm shadow-sm"
                      >
                        <FileText size={16} /> View Service Report ✨
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {isProvider && booking.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => updateStatus(booking.id, 'rejected')}
                          className="btn-secondary h-10 px-4 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-100 dark:border-red-900/50 flex items-center gap-2"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                        <button 
                          onClick={() => updateStatus(booking.id, 'accepted')}
                          className="btn-primary h-10 px-4 flex items-center gap-2"
                        >
                          <CheckCircle2 size={16} /> Accept
                        </button>
                      </>
                    )}
                    {isProvider && booking.status === 'accepted' && (
                      <button 
                        onClick={() => updateStatus(booking.id, 'completed')}
                        className="btn-primary h-10 px-4 flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Mark Completed
                      </button>
                    )}
                    {isCustomer && booking.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(booking.id, 'cancelled')}
                        className="btn-secondary h-10 px-4 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <XCircle size={16} /> Cancel
                      </button>
                    )}
                    <Link to={`/chat`} className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <MessageSquare size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-12 text-center bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10">
            <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 dark:text-slate-500">
              <Clock4 size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white font-display mb-2">No bookings yet</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">When you schedule or receive service requests, they will appear here.</p>
            <Link to="/search" className="btn-primary inline-flex">Browse Services</Link>
          </div>
        )}
      </div>

      {reportBooking && (
        <ServiceReportModal booking={reportBooking} onClose={() => setReportBooking(null)} />
      )}
    </div>
  );
};

export default MyBookings;
