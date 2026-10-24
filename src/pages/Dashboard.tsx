import React from 'react';
import { useAuth } from '../hooks/useAuth';
import CustomerDashboard from '../components/dashboard/CustomerDashboard';
import ProviderDashboard from '../components/dashboard/ProviderDashboard';
import AdminDashboard from '../pages/AdminDashboard';

const Dashboard: React.FC = () => {
  const { user, isAdmin, isProvider, isCustomer } = useAuth();

  if (isAdmin) return <AdminDashboard />;
  if (isProvider) return <ProviderDashboard />;
  return <CustomerDashboard />;
};

export default Dashboard;
