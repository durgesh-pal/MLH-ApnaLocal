import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { APIProvider } from '@vis.gl/react-google-maps';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ProviderOnboarding from './pages/ProviderOnboarding';
import ServiceSearch from './pages/ServiceSearch';
import ProviderProfile from './pages/ProviderProfile';
import AIAssistant from './pages/AIAssistant';
import BookingFlow from './pages/BookingFlow';
import MyBookings from './pages/MyBookings';
import MyReports from './pages/MyReports';
import Community from './pages/Community';
import ChatPage from './pages/ChatPage';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/layout/Layout';
import { OfflineIndicator } from './components/OfflineIndicator';
import { seedJaunpurProviders } from './lib/seedJaunpurData';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (user && allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const QuotaBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleQuota = () => setShow(true);
    window.addEventListener('gmp-quota-exceeded', handleQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuota);
  }, []);

  if (!show) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-[100] shadow-sm">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
      <button 
        onClick={() => setShow(false)}
        className="ml-4 text-amber-900/50 hover:text-amber-900 font-bold"
      >
        ×
      </button>
    </div>
  );
};

const AppContent = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/dashboard" replace />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/search" element={<ServiceSearch />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/chat/:chatId" element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } />
        <Route path="/provider/:id" element={<ProviderProfile />} />
        <Route path="/book/:providerId" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <BookingFlow />
          </ProtectedRoute>
        } />
        <Route path="/bookings" element={
          <ProtectedRoute>
            <MyBookings />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute>
            <MyReports />
          </ProtectedRoute>
        } />
        <Route path="/community" element={<Community />} />
        <Route path="/onboarding" element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderOnboarding />
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
};

import { AppProvider } from './contexts/AppContext';

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  useEffect(() => {
    seedJaunpurProviders();
  }, []);

  return (
    <APIProvider apiKey={apiKey} language="en" region="IN">
      <AppProvider>
        <AuthProvider>
          <BrowserRouter>
            <QuotaBanner />
            <OfflineIndicator />
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </AppProvider>
    </APIProvider>
  );
}

export default App;

