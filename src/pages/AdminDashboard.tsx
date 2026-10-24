import React, { useEffect, useState } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  addDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { JAUNPUR_LOCALITIES } from '../lib/localities';
import { 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  ChevronRight, 
  TrendingUp, 
  AlertTriangle, 
  MapPin, 
  Database, 
  RefreshCw, 
  Plus, 
  Edit3, 
  Trash2, 
  Mail, 
  Search, 
  UserCheck, 
  X, 
  Check, 
  FileText,
  Clock,
  Activity,
  Filter,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CATEGORIES = [
  'Electrician',
  'Plumber',
  'Mechanic',
  'AC Repair',
  'Carpenter',
  'Cleaning',
  'Tutor',
  'Beauty'
];

export const AdminDashboard: React.FC = () => {
  const { user, firebaseUser } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    pendingVerifications: 0,
    demoProvidersCount: 0,
    realProvidersCount: 0,
    auditLogsCount: 0,
  });
  
  const [allProviders, setAllProviders] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [pendingProviders, setPendingProviders] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'providers' | 'coverage' | 'users' | 'import' | 'audit'>('overview');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);

  // Search & Filter state for Provider Management tab
  const [providerSearch, setProviderSearch] = useState('');
  const [filterLocality, setFilterLocality] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'real' | 'demo'>('all');

  // Search & Filter state for Audit Logs tab
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('');

  // Modal State for Add / Edit Provider
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<any>(null);
  const [formData, setFormData] = useState({
    provider_id: '',
    businessName: '',
    name: '',
    phone: '',
    email: '',
    locality: 'Olandganj',
    category: 'Electrician',
    skills: '',
    price: '₹200 (Visit Fee)',
    bio: '',
    workingHours: '9:00 AM - 7:00 PM',
    verificationStatus: 'verified',
    is_real_provider: true,
    isDemo: false,
    contact_enabled: true,
    booking_enabled: true
  });

  // Helper to record administrative actions into Firestore AuditLog collection
  const logAdminAction = async (action: string, targetId: string, targetName: string, details: string) => {
    try {
      const adminEmail = user?.email || firebaseUser?.email || 'durgesh00991@gmail.com';
      const adminUid = user?.uid || firebaseUser?.uid || 'admin';

      await addDoc(collection(db, 'auditLogs'), {
        adminEmail,
        adminUid,
        action,
        targetId,
        targetName,
        details,
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error logging admin action to AuditLog collection:", err);
    }
  };

  // Helper to export AuditLog collection as a formatted CSV file
  const handleExportAuditLogsCSV = () => {
    if (auditLogs.length === 0) {
      alert("No audit logs available to export.");
      return;
    }

    const escapeCSV = (str: any) => {
      if (str === null || str === undefined) return '""';
      const stringified = String(str);
      return `"${stringified.replace(/"/g, '""')}"`;
    };

    const headers = ['Log ID', 'Timestamp', 'Action Type', 'Admin Email', 'Target ID', 'Target Name', 'Details'];
    
    const targetLogs = filteredAuditLogs.length > 0 ? filteredAuditLogs : auditLogs;

    const rows = targetLogs.map(log => [
      escapeCSV(log.id),
      escapeCSV(log.timestamp || (log.createdAt?.seconds ? new Date(log.createdAt.seconds * 1000).toISOString() : '')),
      escapeCSV(log.action),
      escapeCSV(log.adminEmail),
      escapeCSV(log.targetId),
      escapeCSV(log.targetName),
      escapeCSV(log.details)
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `ApnaLocal_AuditLogs_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const providersSnap = await getDocs(collection(db, 'providerProfiles'));
      const bookingsSnap = await getDocs(collection(db, 'bookings'));
      
      let logsList: any[] = [];
      try {
        const logsSnap = await getDocs(collection(db, 'auditLogs'));
        logsList = logsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort descending by timestamp
        logsList.sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime());
      } catch (lErr) {
        console.warn("Audit logs fetch warning:", lErr);
      }

      const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const providersList = providersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const pending = providersList.filter((p: any) => p.verificationStatus === 'pending');
      const demoCount = providersList.filter((p: any) => p.isDemo || p.profile_type === 'DEMO_ONLY' || p.is_real_provider === false).length;
      const realCount = providersList.length - demoCount;

      setStats({
        totalUsers: usersList.length,
        totalProviders: providersList.length,
        totalBookings: bookingsSnap.size,
        pendingVerifications: pending.length,
        demoProvidersCount: demoCount,
        realProvidersCount: realCount,
        auditLogsCount: logsList.length,
      });
      setAllUsers(usersList);
      setPendingProviders(pending);
      setAllProviders(providersList);
      setAuditLogs(logsList);
    } catch (err) {
      console.error("Error loading admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProvider(null);
    setFormData({
      provider_id: `PROV_${Date.now()}`,
      businessName: '',
      name: '',
      phone: '',
      email: '',
      locality: 'Olandganj',
      category: 'Electrician',
      skills: 'Wiring, Switch Repair, Fan Installation',
      price: '₹200 (Visit Fee)',
      bio: '',
      workingHours: '9:00 AM - 7:00 PM',
      verificationStatus: 'verified',
      is_real_provider: true,
      isDemo: false,
      contact_enabled: true,
      booking_enabled: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (provider: any) => {
    setEditingProvider(provider);
    setFormData({
      provider_id: provider.provider_id || provider.id,
      businessName: provider.businessName || provider.display_name || '',
      name: provider.name || provider.sample_name || '',
      phone: provider.phone || provider.public_phone || '',
      email: provider.email || '',
      locality: provider.locality || 'Olandganj',
      category: provider.category || 'Electrician',
      skills: Array.isArray(provider.skills) ? provider.skills.join(', ') : (provider.skills || ''),
      price: provider.price || provider.price_guidance || '₹200',
      bio: provider.bio || '',
      workingHours: provider.workingHours || provider.working_hours || '9:00 AM - 7:00 PM',
      verificationStatus: provider.verificationStatus || 'verified',
      is_real_provider: true,
      isDemo: false,
      contact_enabled: true,
      booking_enabled: true
    });
    setIsModalOpen(true);
  };

  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const docId = editingProvider?.id || editingProvider?.provider_id || formData.provider_id || `PROV_${Date.now()}`;
      const docRef = doc(db, 'providerProfiles', docId);
      const isReplacingDemo = editingProvider?.isDemo || editingProvider?.profile_type === 'DEMO_ONLY';

      const payload = {
        provider_id: docId,
        display_name: formData.businessName,
        businessName: formData.businessName,
        name: formData.name,
        sample_name: formData.name,
        phone: formData.phone,
        public_phone: formData.phone,
        email: formData.email,
        locality: formData.locality,
        category: formData.category,
        skills: formData.skills,
        price: formData.price,
        price_guidance: formData.price,
        bio: formData.bio,
        workingHours: formData.workingHours,
        working_hours: formData.workingHours,
        verificationStatus: formData.verificationStatus,
        verification_status: formData.verificationStatus,
        is_real_provider: true,
        isDemo: false,
        profile_type: 'REAL_VERIFIED',
        contact_enabled: true,
        booking_enabled: true,
        updatedAt: serverTimestamp()
      };

      await setDoc(docRef, payload, { merge: true });

      // Log action into AuditLog
      const actionType = isReplacingDemo ? 'REPLACE_DEMO_SLOT' : (editingProvider ? 'UPDATE_PROVIDER' : 'CREATE_PROVIDER');
      const actionDesc = isReplacingDemo 
        ? `Replaced demo slot with real provider "${formData.businessName}" in ${formData.locality}` 
        : (editingProvider ? `Updated provider details for "${formData.businessName}"` : `Created new real provider "${formData.businessName}" in ${formData.locality}`);
      
      await logAdminAction(actionType, docId, formData.businessName, actionDesc);

      alert(isReplacingDemo ? "Demo slot replaced with real provider successfully!" : (editingProvider ? "Provider updated successfully!" : "New real provider added successfully!"));
      setIsModalOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Error saving provider:", err);
      alert("Failed to save provider. Please try again.");
    }
  };

  const handleDeleteProvider = async (docId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'providerProfiles', docId));
      await logAdminAction('DELETE_PROVIDER', docId, name, `Deleted provider profile "${name}" from directory`);
      alert("Provider removed successfully.");
      await fetchData();
    } catch (err) {
      console.error("Error deleting provider:", err);
    }
  };

  const handleImportDemoDataset = async () => {
    setImporting(true);
    try {
      const res = await fetch('/assets/aistudio/apnalocal_jaunpur_demo_providers_448_0ba92592.json');
      const data = await res.json();
      
      if (!data || !Array.isArray(data.providers)) {
        throw new Error("Invalid JSON dataset format.");
      }

      let importedCount = 0;
      let duplicateOrSkipped = 0;

      for (const p of data.providers) {
        try {
          const docRef = doc(db, 'providerProfiles', p.provider_id);
          await setDoc(docRef, {
            ...p,
            isDemo: true,
            is_real_provider: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          importedCount++;
        } catch (err) {
          console.error(`Error seeding ${p.provider_id}:`, err);
          duplicateOrSkipped++;
        }
      }

      await logAdminAction('IMPORT_DEMO_DATASET', 'SEED_448', 'Jaunpur Demo Seed', `Imported/seeded ${importedCount} demo provider records across 14 localities`);

      setImportReport({
        total: data.providers.length,
        imported: importedCount,
        skipped: duplicateOrSkipped,
        timestamp: new Date().toLocaleString()
      });

      alert(`Successfully imported ${importedCount} demo records into Firestore.`);
      await fetchData();
    } catch (error) {
      console.error("Import Error:", error);
      alert("Failed to import demo dataset.");
    } finally {
      setImporting(false);
    }
  };

  const handleVerify = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      const provObj = allProviders.find(p => (p.id || p.provider_id) === docId);
      const provName = provObj?.businessName || provObj?.display_name || docId;

      await updateDoc(doc(db, 'providerProfiles', docId), {
        verificationStatus: status,
        updatedAt: serverTimestamp()
      });

      // Send email notification
      if (provObj?.email) {
        try {
          await fetch('/api/admin/notify-provider', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerEmail: provObj.email,
              status,
              providerName: provObj.businessName || provObj.display_name || provObj.name || 'Provider'
            })
          });
        } catch (emailErr) {
          console.error("Failed to notify provider via email:", emailErr);
        }
      }

      await logAdminAction(
        status === 'verified' ? 'VERIFY_PROVIDER' : 'REJECT_PROVIDER',
        docId,
        provName,
        `Application status set to ${status.toUpperCase()} for "${provName}"`
      );

      setPendingProviders(prev => prev.filter(p => (p.id || p.provider_id) !== docId));
      setStats(prev => ({ ...prev, pendingVerifications: Math.max(0, prev.pendingVerifications - 1) }));
      await fetchData();
    } catch (error) {
      console.error("Verification Error:", error);
    }
  };

  const chartData = [
    { name: 'Mon', bookings: 12 },
    { name: 'Tue', bookings: 19 },
    { name: 'Wed', bookings: 15 },
    { name: 'Thu', bookings: 22 },
    { name: 'Fri', bookings: 30 },
    { name: 'Sat', bookings: 45 },
    { name: 'Sun', bookings: 38 },
  ];

  // Filtered providers list for Provider Management tab
  const filteredProvidersList = allProviders.filter(p => {
    const searchLower = providerSearch.toLowerCase().trim();
    const nameStr = (p.businessName || p.display_name || p.name || '').toLowerCase();
    const matchesSearch = !searchLower || nameStr.includes(searchLower) || (p.phone || '').includes(searchLower);
    const matchesLocality = !filterLocality || p.locality === filterLocality;
    const matchesCategory = !filterCategory || p.category === filterCategory;
    const isDemo = p.isDemo || p.profile_type === 'DEMO_ONLY' || p.is_real_provider === false;
    const matchesType = filterType === 'all' || (filterType === 'real' && !isDemo) || (filterType === 'demo' && isDemo);
    
    return matchesSearch && matchesLocality && matchesCategory && matchesType;
  });

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const searchLower = logSearch.toLowerCase().trim();
    const matchesSearch = !searchLower || 
      (log.targetName || '').toLowerCase().includes(searchLower) ||
      (log.adminEmail || '').toLowerCase().includes(searchLower) ||
      (log.details || '').toLowerCase().includes(searchLower);
    const matchesAction = !logActionFilter || log.action === logActionFilter;
    
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
            <ShieldCheck size={16} /> District Control Center · Jaunpur, UP
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Platform Admin Portal</h1>
          <p className="text-slate-500 text-sm mt-0.5">Logged-in Admin: <span className="font-bold text-slate-900">{user?.email || firebaseUser?.email || 'durgesh00991@gmail.com'}</span></p>
        </div>

        <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-1">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('providers')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'providers' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Briefcase size={16} /> Manage Providers
          </button>
          <button 
            onClick={() => setActiveTab('coverage')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'coverage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <MapPin size={16} /> Jaunpur Coverage
          </button>
          <button 
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'audit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Activity size={16} /> Audit Logs ({stats.auditLogsCount})
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'users' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={16} /> Users ({stats.totalUsers})
          </button>
          <button 
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all flex items-center gap-1.5 ${activeTab === 'import' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Database size={16} /> Seeder
          </button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {[
          { label: 'Total Providers', value: stats.totalProviders, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Real Verified', value: stats.realProvidersCount, icon: UserCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Demo Placeholders', value: stats.demoProvidersCount, icon: Database, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Audit Logs', value: stats.auditLogsCount, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Registered Users', value: stats.totalUsers, icon: Users, color: 'text-slate-900', bg: 'bg-slate-50' },
          { label: 'Pending Apps', value: stats.pendingVerifications, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <div key={i} className="card p-5 flex items-center gap-3 bg-white shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} shrink-0`}>
              <stat.icon size={20} />
            </div>
            <div>
              <div className="text-xl md:text-2xl font-bold text-slate-900">{stat.value}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp size={20} /> Booking Trends (Jaunpur District)
                </h2>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="bookings" fill="#0f172a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Pending Applications ({pendingProviders.length})</h2>
                <button onClick={() => setActiveTab('providers')} className="text-xs font-bold text-blue-600 hover:underline">View All Providers →</button>
              </div>
              {pendingProviders.length > 0 ? (
                <div className="space-y-3">
                  {pendingProviders.map((provider: any) => (
                    <div key={provider.id || provider.provider_id} className="card p-4 flex items-center justify-between gap-4 bg-white shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                          {(provider.businessName || provider.display_name || 'P').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{provider.businessName || provider.display_name}</div>
                          <div className="text-xs text-slate-500">{provider.category} · {provider.locality}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleVerify(provider.id || provider.provider_id, 'rejected')}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <XCircle size={20} />
                        </button>
                        <button 
                          onClick={() => handleVerify(provider.id || provider.provider_id, 'verified')}
                          className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Verify & Approve"
                        >
                          <CheckCircle size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="card p-12 text-center text-slate-400 font-medium bg-white shadow-sm">
                  No pending verification requests at the moment.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 bg-white shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-500" /> Getting Started
              </h3>
              <ul className="text-xs text-slate-600 space-y-3 list-decimal pl-4">
                <li><strong className="text-slate-900">Seed Data:</strong> Use the "Seeder" tab to import initial demo providers.</li>
                <li><strong className="text-slate-900">Manage Providers:</strong> Approve or reject pending applications in the "Manage Providers" tab.</li>
                <li><strong className="text-slate-900">Monitor Audit:</strong> Check the "Audit Logs" tab for all admin activities.</li>
              </ul>
            </div>

            <div className="card p-6 space-y-3 bg-white shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-2">Quick Actions</h3>
              <button 
                onClick={handleOpenAddModal}
                className="btn-primary w-full h-10 flex items-center justify-center gap-2 text-xs shadow-md"
              >
                <Plus size={16} /> Add Real Provider
              </button>
              <button 
                onClick={() => setActiveTab('providers')}
                className="btn-secondary w-full h-10 flex items-center justify-center gap-2 text-xs"
              >
                <Briefcase size={16} /> Manage Providers
              </button>
              <button 
                onClick={() => setActiveTab('audit')}
                className="w-full h-10 border border-slate-200 rounded-xl font-bold text-slate-700 text-xs hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <Activity size={16} /> View Audit Logs
              </button>
              <button 
                onClick={handleExportAuditLogsCSV}
                className="w-full h-10 border border-purple-200 bg-purple-50 text-purple-900 rounded-xl font-bold text-xs hover:bg-purple-100 transition-colors flex items-center justify-center gap-2"
              >
                <Download size={16} /> Export Logs CSV
              </button>
            </div>

            <div className="card p-6 bg-slate-900 text-white shadow-xl">
              <h3 className="font-bold mb-2 text-sm">Audit Logging Active</h3>
              <p className="text-slate-300 text-xs leading-relaxed">
                All administrative actions are recorded in the <span className="text-emerald-400 font-bold">auditLogs</span> collection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Tab (NEW) */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-600 mb-1">
                <Activity size={16} /> Firebase Collection: auditLogs
              </div>
              <h2 className="text-xl font-bold text-slate-900">Administrative Action Audit Logs</h2>
              <p className="text-slate-500 text-xs mt-1">Complete immutable history of provider verifications, edits, deletions, and dataset seeds.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportAuditLogsCSV}
                className="btn-primary h-11 px-5 flex items-center gap-2 text-xs font-bold shrink-0 shadow-md"
                title="Export Audit Logs as CSV File for Offline Records"
              >
                <Download size={16} /> Export CSV
              </button>
              <button 
                onClick={fetchData}
                className="btn-secondary h-11 px-5 flex items-center gap-2 text-xs font-bold shrink-0"
              >
                <RefreshCw size={16} /> Refresh Logs
              </button>
            </div>
          </div>

          {/* Audit Log Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search logs by admin email, target name, or action details..." 
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900"
              />
            </div>

            <select
              value={logActionFilter}
              onChange={(e) => setLogActionFilter(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            >
              <option value="">All Action Types</option>
              <option value="CREATE_PROVIDER">CREATE_PROVIDER</option>
              <option value="UPDATE_PROVIDER">UPDATE_PROVIDER</option>
              <option value="REPLACE_DEMO_SLOT">REPLACE_DEMO_SLOT</option>
              <option value="DELETE_PROVIDER">DELETE_PROVIDER</option>
              <option value="VERIFY_PROVIDER">VERIFY_PROVIDER</option>
              <option value="REJECT_PROVIDER">REJECT_PROVIDER</option>
              <option value="IMPORT_DEMO_DATASET">IMPORT_DEMO_DATASET</option>
            </select>
          </div>

          {/* Audit Logs Table */}
          <div className="card p-6 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Type</th>
                  <th className="py-3 px-4">Admin Email</th>
                  <th className="py-3 px-4">Target Provider / Item</th>
                  <th className="py-3 px-4">Action Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAuditLogs.length > 0 ? (
                  filteredAuditLogs.map((log: any) => {
                    const isDelete = log.action === 'DELETE_PROVIDER';
                    const isCreate = log.action === 'CREATE_PROVIDER' || log.action === 'REPLACE_DEMO_SLOT';
                    const isVerify = log.action === 'VERIFY_PROVIDER';
                    const isReject = log.action === 'REJECT_PROVIDER';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                            isCreate ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            isVerify ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            isDelete ? 'bg-red-50 text-red-700 border border-red-200' :
                            isReject ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs font-bold text-slate-900">
                          {log.adminEmail || 'durgesh00991@gmail.com'}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {log.targetName || log.targetId || 'Directory Item'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 max-w-md">
                          {log.details || 'Administrative action performed.'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                      {auditLogs.length === 0 ? "No administrative audit logs recorded yet. Perform an action like verifying or adding a provider to see logs here." : "No logs match the current search filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provider Management Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Service Provider Directory Management</h2>
              <p className="text-slate-500 text-xs mt-1">Add, edit, replace demo placeholders with real professionals, or remove providers across Jaunpur.</p>
            </div>
            <button 
              onClick={handleOpenAddModal}
              className="btn-primary h-12 px-6 flex items-center gap-2 text-sm shadow-lg shrink-0"
            >
              <Plus size={18} /> Add Real Provider
            </button>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search by name, business, or phone..." 
                value={providerSearch}
                onChange={(e) => setProviderSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-slate-900"
              />
            </div>

            <select
              value={filterLocality}
              onChange={(e) => setFilterLocality(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            >
              <option value="">All Localities (14)</option>
              {JAUNPUR_LOCALITIES.map(loc => (
                <option key={loc.name} value={loc.name}>{loc.name}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            >
              <option value="">All Categories (8)</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            >
              <option value="all">All Types (Real + Demo)</option>
              <option value="real">Real Providers Only</option>
              <option value="demo">Demo Slots Only</option>
            </select>
          </div>

          {/* Provider List Table */}
          <div className="card p-6 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Provider / Business</th>
                  <th className="py-3 px-4">Locality</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Phone / Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredProvidersList.length > 0 ? (
                  filteredProvidersList.slice(0, 50).map((provider: any) => {
                    const isDemo = provider.isDemo || provider.profile_type === 'DEMO_ONLY' || provider.is_real_provider === false;
                    return (
                      <tr key={provider.id || provider.provider_id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{provider.businessName || provider.display_name}</div>
                          <div className="text-xs text-slate-500">{provider.name || provider.sample_name}</div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-700">{provider.locality}</td>
                        <td className="py-3 px-4 font-medium text-slate-700">{provider.category}</td>
                        <td className="py-3 px-4">
                          {isDemo ? (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                              DEMO SLOT
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                              REAL PROVIDER
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-xs font-mono text-slate-600">
                          {provider.phone || provider.public_phone || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            provider.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {provider.verificationStatus || 'unverified'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                          {isDemo ? (
                            <button 
                              onClick={() => handleOpenEditModal(provider)}
                              className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                              Replace with Real
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleOpenEditModal(provider)}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Edit Details"
                            >
                              <Edit3 size={16} />
                            </button>
                          )}
                          <button 
                            onClick={() => handleDeleteProvider(provider.id || provider.provider_id, provider.businessName || provider.display_name)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Provider"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No matching providers found for selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Coverage Matrix Tab */}
      {activeTab === 'coverage' && (
        <div className="space-y-6">
          <div className="card p-6 bg-white shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Jaunpur District Coverage Matrix</h2>
                <p className="text-slate-500 text-sm">Targeting 5 providers per category across all 14 localities in Jaunpur, UP.</p>
              </div>
              <div className="text-sm font-semibold text-slate-700 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                Total Loaded Providers: <span className="text-blue-600 font-bold">{allProviders.length}</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Locality</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Target Slots</th>
                    <th className="py-3 px-4">Registered</th>
                    <th className="py-3 px-4">Verified Real</th>
                    <th className="py-3 px-4">Vacancies (Open)</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {JAUNPUR_LOCALITIES.map(loc => {
                    return CATEGORIES.slice(0, 4).map(cat => {
                      const matched = allProviders.filter(p => {
                        const skillsText = Array.isArray(p.skills) ? p.skills.join(' ') : (typeof p.skills === 'string' ? p.skills : '');
                        return (p.locality === loc.name || p.locality_id === loc.name) && (p.category === cat || p.category_id === cat || skillsText.toLowerCase().includes(cat.toLowerCase()));
                      });
                      const verifiedReal = matched.filter(p => p.verificationStatus === 'verified' && !p.isDemo && p.is_real_provider !== false);
                      const target = 5;
                      const vacancies = Math.max(0, target - matched.length);

                      return (
                        <tr key={`${loc.name}-${cat}`} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" /> {loc.name}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">{cat}</td>
                          <td className="py-3 px-4 font-semibold text-slate-900">{target}</td>
                          <td className="py-3 px-4 font-semibold text-blue-600">{matched.length}</td>
                          <td className="py-3 px-4 font-semibold text-emerald-600">{verifiedReal.length}</td>
                          <td className="py-3 px-4 font-semibold text-amber-600">{vacancies}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${matched.length >= target ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                              {matched.length >= target ? 'Fully Covered' : 'Demo Slots Active'}
                            </span>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab with Email Verification Status */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="card p-6 bg-white shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Registered System Users ({allUsers.length})</h2>
            <p className="text-slate-500 text-sm mb-6">Track email verification and roles for all registered user accounts.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Display Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Email Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {allUsers.map((u: any) => (
                    <tr key={u.uid || u.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-900">{u.displayName || 'Unnamed User'}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-600">{u.email}</td>
                      <td className="py-3 px-4 font-bold uppercase text-xs text-slate-700">{u.role}</td>
                      <td className="py-3 px-4">
                        {u.emailVerified ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full">Verified</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">Pending Verification</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Dataset Seeder Tab */}
      {activeTab === 'import' && (
        <div className="space-y-6">
          <div className="card p-8 bg-white max-w-3xl mx-auto space-y-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0">
                <Database size={28} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Jaunpur Demo Dataset Importer</h2>
                <p className="text-slate-500 text-sm">Seed all 448 standardized demo provider slots across 14 localities and 8 categories.</p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4 text-sm text-slate-700">
              <h4 className="font-bold text-slate-900">Import Specifications:</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li>Reads attached dataset (`apnalocal_jaunpur_demo_providers_448_0ba92592.json`).</li>
                <li>Preserves exact `provider_id`, `locality_id`, `category_id`, and `slot_number`.</li>
                <li>Fully idempotent: Rerunning safely updates records without duplication.</li>
              </ul>
            </div>

            {importReport && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 text-sm space-y-1">
                <div className="font-bold flex items-center gap-2">
                  <CheckCircle size={18} className="text-emerald-600" /> Import Complete ({importReport.timestamp})
                </div>
                <div>Total Records: <b>{importReport.total}</b></div>
                <div>Imported / Upserted: <b>{importReport.imported}</b></div>
              </div>
            )}

            <button
              onClick={handleImportDemoDataset}
              disabled={importing}
              className="btn-primary w-full h-14 text-base flex items-center justify-center gap-2 shadow-xl"
            >
              {importing ? <RefreshCw size={20} className="animate-spin" /> : <Database size={20} />}
              {importing ? 'Importing 448 Demo Records...' : 'Import / Seed 448 Jaunpur Demo Providers'}
            </button>
          </div>
        </div>
      )}

      {/* Add / Edit Provider Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-bold text-slate-900">
                {editingProvider ? "Edit / Replace Provider Details" : "Add New Real Provider"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProvider} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Business Name *</label>
                  <input 
                    type="text" 
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="e.g. Ramesh Electricals"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Provider Name *</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +91 9876543210"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="provider@example.com"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Locality in Jaunpur *</label>
                  <select
                    value={formData.locality}
                    onChange={(e) => setFormData(prev => ({ ...prev, locality: e.target.value }))}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                  >
                    {JAUNPUR_LOCALITIES.map(loc => (
                      <option key={loc.name} value={loc.name}>{loc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Skills & Services Offered</label>
                <input 
                  type="text" 
                  value={formData.skills}
                  onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                  placeholder="e.g. Wiring, Switchboard Repair, Inverter Service"
                  className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Visiting / Service Fee</label>
                  <input 
                    type="text" 
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="e.g. ₹200 (Visit Fee)"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Working Hours</label>
                  <input 
                    type="text" 
                    value={formData.workingHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, workingHours: e.target.value }))}
                    placeholder="e.g. 9:00 AM - 7:00 PM"
                    className="w-full h-11 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Short Biography / Overview</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Describe provider experience, qualifications, and services..."
                  className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-slate-900"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary h-11 px-5 text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary h-11 px-6 text-sm flex items-center gap-2 shadow-md"
                >
                  <Check size={18} /> Save & Verify Real Provider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
