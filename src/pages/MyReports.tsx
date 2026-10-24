import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { FileText, Calendar, MapPin, Download, Eye, Search, Filter, ShieldCheck, Clock4, X } from 'lucide-react';
import { format } from 'date-fns';
import ServiceReportModal from '../components/ServiceReportModal';
import { Link } from 'react-router-dom';

const MyReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeReport, setActiveReport] = useState<any>(null);

  useEffect(() => {
    const activeUid = user?.uid || 'guest_user';
    // Fetch completed bookings as consultation reports
    const q = query(
      collection(db, 'bookings'),
      where('customerId', '==', activeUid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      })).filter((b: any) => b.status === 'completed' || b.reportGenerated);

      setReports(docs);
      setLoading(false);
    }, (error) => {
      console.warn("MyReports snapshot warning:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const filteredReports = reports.filter(r => {
    const matchesCategory = selectedCategory 
      ? (r.providerCategory || '').toLowerCase().includes(selectedCategory.toLowerCase()) 
      : true;

    const matchesSearch = (r.problemDescription || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.providerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (r.locality || '').toLowerCase().includes(searchTerm.toLowerCase());

    const reportDateStr = r.scheduledAt || r.createdAt;
    const reportDate = reportDateStr ? new Date(reportDateStr) : null;

    let matchesDateRange = true;
    if (startDate && reportDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      if (reportDate < start) matchesDateRange = false;
    }
    if (endDate && reportDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      if (reportDate > end) matchesDateRange = false;
    }

    return matchesCategory && matchesSearch && matchesDateRange;
  });

  const handleClearFilters = () => {
    setSelectedCategory('');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-500 font-medium">Loading your consultation reports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 font-display">
            <FileText size={30} className="text-cyan-500" /> My Consultation Reports
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Access verified professional consultation summaries, advice, and service histories across Jaunpur.</p>
        </div>
        <div className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
          <Filter size={15} className="text-cyan-500" />
          <span>{filteredReports.length} of {reports.length} {reports.length === 1 ? 'Report' : 'Reports'} Shown</span>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="card p-6 bg-white dark:bg-slate-900 shadow-sm space-y-4 border border-slate-200/80 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
            <input 
              type="text" 
              placeholder="Search problem, provider..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-11 pl-12 pr-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-medium text-sm"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium text-sm"
            >
              <option value="">All Categories</option>
              <option value="Electrician">Electrician</option>
              <option value="Plumber">Plumber</option>
              <option value="Mechanic">Mechanic</option>
              <option value="AC Repair">AC Repair and Maintenance</option>
              <option value="Carpenter">Carpenter</option>
              <option value="Cleaning">Home & Office Cleaning</option>
              <option value="Tutor">Tutor / Private Teacher</option>
              <option value="Beauty">Beauty and Salon Services</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Calendar size={16} />
            </div>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Start Date"
              className="w-full h-11 pl-10 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium text-sm"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
              <Calendar size={16} />
            </div>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="End Date"
              className="w-full h-11 pl-10 pr-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 font-medium text-sm"
            />
          </div>
        </div>

        {(selectedCategory || startDate || endDate || searchTerm) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/10 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Filters active</span>
            <button 
              onClick={handleClearFilters}
              className="text-rose-600 dark:text-rose-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <X size={14} /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Reports List */}
      <div className="grid gap-6">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => (
            <div key={report.id} className="card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-lg transition-all bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10">
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1 font-mono">
                    <ShieldCheck size={14} /> Provider Approved
                  </span>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500 font-bold">
                    REP-{report.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Calendar size={14} className="text-cyan-500" /> {report.scheduledAt ? format(new Date(report.scheduledAt), 'PP') : 'Recent'}
                  </span>
                  {report.providerCategory && (
                    <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md text-xs font-semibold">
                      {report.providerCategory}
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white font-display">{report.problemDescription || 'Professional Consultation'}</h3>

                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-300 font-medium">
                  <div>Provider: <span className="text-slate-900 dark:text-white font-bold">{report.providerName || 'Local Specialist'}</span></div>
                  <div className="flex items-center gap-1">
                    <MapPin size={16} className="text-cyan-500" />
                    <span>{report.locality || 'Jaunpur'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-white/10">
                <button 
                  onClick={() => setActiveReport(report)}
                  className="btn-secondary flex items-center gap-2 h-11 px-5 text-sm"
                >
                  <Eye size={16} /> View Details
                </button>
                <button 
                  onClick={() => setActiveReport(report)}
                  className="btn-primary flex items-center gap-2 h-11 px-5 text-sm shadow-sm"
                >
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="card p-16 text-center bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl">
            <div className="w-20 h-20 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm text-slate-400 dark:text-slate-500">
              <Clock4 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white font-display mb-2">No matching consultation reports found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm mx-auto text-sm">Try adjusting your date range or category filters to view your service histories.</p>
            <button onClick={handleClearFilters} className="btn-primary mx-auto">Reset Filters</button>
          </div>
        )}
      </div>

      {activeReport && (
        <ServiceReportModal booking={activeReport} onClose={() => setActiveReport(null)} />
      )}
    </div>
  );
};

export default MyReports;
