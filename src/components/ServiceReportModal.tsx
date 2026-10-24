import React from 'react';
import { X, Printer, ShieldCheck, MapPin, CheckCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface ServiceReportModalProps {
  booking: any;
  onClose: () => void;
}

const ServiceReportModal: React.FC<ServiceReportModalProps> = ({ booking, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 sticky top-z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Official Service Report</h2>
              <p className="text-xs text-slate-500">ApnaLocal Verified Documentation · Jaunpur, UP</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handlePrint}
              className="btn-secondary flex items-center gap-2 h-10 px-4 text-sm"
            >
              <Printer size={16} /> Print / PDF
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-200/50 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 print:p-0">
          {/* Header Info */}
          <div className="flex justify-between items-start border-b border-slate-100 pb-6">
            <div>
              <h3 className="text-2xl font-black text-slate-900">ApnaLocal</h3>
              <p className="text-slate-500 text-sm">Har Zaroorat Ka Local Solution</p>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Report ID</div>
              <div className="font-mono text-sm font-bold text-slate-900">REP-{booking.id?.slice(0, 8).toUpperCase() || 'AL-2026'}</div>
              <div className="text-xs text-slate-500 mt-1">{format(new Date(), 'PPP')}</div>
            </div>
          </div>

          {/* Parties */}
          <div className="grid md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Service Provider</div>
              <div className="font-bold text-slate-900 text-lg flex items-center gap-2">
                {booking.providerName || 'Local Expert'}
                <ShieldCheck size={16} className="text-blue-600" />
              </div>
              <p className="text-slate-600 text-sm">{booking.providerCategory || 'Home Services'} Specialist</p>
              <div className="flex items-center gap-1 text-slate-500 text-xs mt-2">
                <MapPin size={14} /> {booking.locality || 'Jaunpur'}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Customer & Location</div>
              <div className="font-bold text-slate-900 text-lg">{booking.customerName || 'Valued Resident'}</div>
              <p className="text-slate-600 text-sm mt-1">{booking.address}</p>
              <div className="text-xs text-slate-500 mt-2">
                Scheduled: {booking.scheduledAt ? format(new Date(booking.scheduledAt), 'PPp') : 'Immediate'}
              </div>
            </div>
          </div>

          {/* Problem & Advice */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Problem Diagnosis & Provider Advice</h4>
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
              <div className="text-xs font-bold text-blue-800 uppercase">Customer Issue Description</div>
              <p className="text-slate-700 text-sm font-medium">{booking.problemDescription}</p>
              <div className="text-xs font-bold text-blue-800 uppercase pt-2">Expert Recommendation / Advice</div>
              <p className="text-slate-700 text-sm">
                "Inspection completed successfully. The root cause was identified and repaired according to industry standards. Recommended regular maintenance every 6 months to prevent recurrence."
              </p>
            </div>
          </div>

          {/* Work Done */}
          <div className="space-y-4">
            <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-2">Action Taken & Services Rendered</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-slate-700 text-sm">
                <CheckCircle size={16} className="text-emerald-500" /> Thorough diagnostic testing and safety check
              </li>
              <li className="flex items-center gap-2 text-slate-700 text-sm">
                <CheckCircle size={16} className="text-emerald-500" /> Professional repair / installation completed
              </li>
              <li className="flex items-center gap-2 text-slate-700 text-sm">
                <CheckCircle size={16} className="text-emerald-500" /> Post-service clean-up and quality assurance check
              </li>
            </ul>
          </div>

          {/* Cost Summary */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center text-slate-600 text-sm">
              <span>Service Visit Fee</span>
              <span>₹200</span>
            </div>
            <div className="flex justify-between items-center text-slate-600 text-sm">
              <span>Labor & Parts</span>
              <span>₹350</span>
            </div>
            <div className="flex justify-between items-center text-slate-900 font-bold text-lg pt-3 border-t border-slate-200">
              <span>Total Settled Amount</span>
              <span className="text-emerald-600">₹550 (Verified)</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-4 bg-emerald-50 text-emerald-900 rounded-xl text-xs flex items-center justify-between">
            <span>Verified service report issued by ApnaLocal platform, Jaunpur.</span>
            <span className="font-bold">Status: COMPLETED</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceReportModal;
