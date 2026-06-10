import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Users, LogOut, Menu, X, ChevronRight, 
  BarChart3, Home, ChevronLeft, 
  User, DollarSign, Eye, ArrowUpCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchDashboardStats, fetchAllUsers } from '../../store/slices/adminSlice';
import AdminCustomers from './AdminCustomers';
import AdminUpgradeRequests from './AdminUpgradeRequests';
import Button from '../../components/ui/Button';

const AdminTab = {
  DASHBOARD: 'dashboard',
  CUSTOMERS: 'customers',
  UPGRADES: 'upgrades',
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState(AdminTab.DASHBOARD);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout, isAdmin, isInitialized } = useAuth();
  const { users } = useSelector(state => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (isInitialized && user && isAdmin) {
      dispatch(fetchDashboardStats());
      dispatch(fetchAllUsers());
    }
  }, [user, isAdmin, isInitialized, dispatch]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { key: AdminTab.DASHBOARD, label: 'Overview', icon: BarChart3 },
    { key: AdminTab.UPGRADES, label: 'Upgrade Requests', icon: ArrowUpCircle },
    { key: AdminTab.CUSTOMERS, label: 'Manage Users', icon: Users },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case AdminTab.DASHBOARD:
        return <AdminDashboardContent onTabChange={setActiveTab} />;
      case AdminTab.CUSTOMERS:
        return <AdminCustomers />;
      case AdminTab.UPGRADES:
        return <AdminUpgradeRequests />;
      default:
        return <AdminDashboardContent onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="flex bg-[#06091a] min-h-screen font-['Inter'] text-white">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 bg-[#0d1433] border-r border-white/5 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        } ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white">E</span>
              </div>
              {sidebarOpen && <span className="font-bold text-xl tracking-tight">ENIGMA</span>}
            </div>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} className="text-gray-400">
                <X size={20} />
              </button>
            )}
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.key
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                {sidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5 space-y-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-all text-sm"
            >
              <Home size={18} />
              {sidebarOpen && <span>User Site</span>}
            </button>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm"
            >
              <LogOut size={18} />
              {sidebarOpen && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} ${isMobile ? 'ml-0' : ''}`}>
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#06091a]/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-400">
                <Menu size={24} />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white capitalize">{activeTab}</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
              {user?.fullName?.charAt(0)}
            </div>
          </div>
        </header>

        <div className="p-8">
          {renderTabContent()}
        </div>
      </main>
    </div>
  );
};

const AdminDashboardContent = ({ onTabChange }) => {
  const { stats, loading } = useSelector(state => state.admin);

  if (loading || !stats) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'blue' },
    { label: 'Manufacturers', value: stats.totalManufacturers, icon: User, color: 'emerald' },
    { label: 'Buyers', value: stats.totalBuyers, icon: Home, color: 'purple' },
    { label: 'Pending Upgrades', value: stats.pendingUpgradeRequests, icon: ArrowUpCircle, color: 'orange' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-[#0d1433] p-6 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gray-900 group-hover:bg-blue-600/20 transition-colors`}>
                <stat.icon className="text-blue-500" size={24} />
              </div>
            </div>
            <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
            <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0d1433] p-8 rounded-3xl border border-white/5">
          <h3 className="text-xl font-bold mb-6">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => onTabChange(AdminTab.UPGRADES)}
              className="p-6 rounded-2xl bg-white/5 hover:bg-orange-600 border border-white/5 transition-all text-left group"
            >
              <ArrowUpCircle className="mb-3 text-orange-500 group-hover:text-white" size={28} />
              <p className="font-bold">Upgrade Requests</p>
              <p className="text-xs text-gray-500 group-hover:text-white/70 mt-1">{stats.pendingUpgradeRequests} pending approvals</p>
            </button>
            <button 
              onClick={() => onTabChange(AdminTab.CUSTOMERS)}
              className="p-6 rounded-2xl bg-white/5 hover:bg-blue-600 border border-white/5 transition-all text-left group"
            >
              <Users className="mb-3 text-blue-500 group-hover:text-white" size={28} />
              <p className="font-bold">Manage Users</p>
              <p className="text-xs text-gray-500 group-hover:text-white/70 mt-1">Review and upgrade accounts</p>
            </button>
            <button 
              onClick={() => onTabChange(AdminTab.UPGRADES)}
              className="p-6 rounded-2xl bg-white/5 hover:bg-emerald-600 border border-white/5 transition-all text-left group"
            >
              <DollarSign className="mb-3 text-emerald-500 group-hover:text-white" size={28} />
              <p className="font-bold">Plan Upgrades</p>
              <p className="text-xs text-gray-500 group-hover:text-white/70 mt-1">Review payment & upgrade requests</p>
            </button>
          </div>
        </div>

        <div className="bg-[#0d1433] p-8 rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center mb-4">
            <BarChart3 className="text-blue-500" size={32} />
          </div>
          <h3 className="text-xl font-bold">Platform Status</h3>
          <p className="text-gray-500 mt-2 text-sm max-w-xs">All systems operational. Payments are being handled externally as per the new manual workflow.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;