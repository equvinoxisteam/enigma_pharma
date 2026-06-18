import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Menu, X, Bell, User, LogOut, Settings, HelpCircle, ChevronLeft, ChevronRight, Search, Check, Shield,
  LayoutDashboard, UserCircle, Building2, Layers, CheckSquare, Mail, BarChart3, Users, PlusCircle, FileStack, Star, CreditCard
} from 'lucide-react';
import { getEffectivePlanType } from '../../config/planFeatures';
import { useAuth } from '../../contexts/AuthContext';
import { notificationAPI } from '../../api/notificationAPI';
import LoginModal from '../auth/LoginModal';
import AISearchComponent from '../AISearchComponent';
import EnigmaLogo from '../EnigmaLogo';
import { getUserDisplayName, getUserAvatarUrl, getUserInitial } from '../../utils/userDisplay';
import AuthenticatedImage from '../AuthenticatedImage';

const DashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? saved === 'true' : true;
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Handle responsive behavior
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch (err) {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000); // poll every 30s
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Load notifications when bell clicked
  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
    if (!showNotifications) {
      setNotificationsLoading(true);
      try {
        const data = await notificationAPI.getAll(1, 10);
        setNotifications(data.data || []);
      } catch { }
      setNotificationsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // If not authenticated, show login modal
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <EnigmaLogo size={48} />
            </div>
            <p className="text-gray-600 mb-6">Please login to access your dashboard</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: '#4881F8' }}
            >
              Login
            </button>
          </div>
        </div>
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => navigate('/dashboard')}
        />
      </>
    );
  }

  const userType = user?.userType || 'BUYER';
  const isManufacturer = userType === 'MANUFACTURER' || userType === 'HYBRID';
  const isBuyer = userType === 'BUYER' || userType === 'HYBRID';
  const displayName = getUserDisplayName(user);
  const avatarUrl = getUserAvatarUrl(user);
  const planLabel = userType === 'BUYER' ? 'BUYER FREE' : getEffectivePlanType(user);

  const commonMenuItems = [
    { label: 'My Feed', path: '/dashboard', icon: LayoutDashboard, hint: 'Dashboard overview and activity' },
    { label: 'My Profile', path: '/profile', icon: UserCircle, hint: 'Company and account details' },
    { label: 'Company Profile', path: '/company-profile', icon: Building2, hint: 'Public company page, gallery and documents' }
  ];

  const manufacturerMenuItems = [
    { label: 'RFQ Pool', path: '/rfqs-pool', icon: Layers, hint: 'Browse open buyer requests' },
    { label: 'Accepted RFQs', path: '/accepted-rfqs', icon: CheckSquare, hint: 'RFQs you are working on' },
    { label: 'Your Invitations', path: '/invitations', icon: Mail, hint: 'Direct buyer invitations' },
    { label: 'Analytics Dashboard', path: '/analytics', icon: BarChart3, hint: 'Performance and pipeline metrics' }
  ];

  const buyerMenuItems = [
    { label: 'Manufacturer Pool', path: '/manufacturers-pool', icon: Users, hint: 'Discover and compare suppliers' },
    { label: 'Create RFQ', path: '/start-rfq', icon: PlusCircle, hint: 'Publish a new sourcing request' },
    { label: 'My RFQs', path: '/my-rfqs', icon: FileStack, hint: 'Track your active requests' },
    { label: 'My Manufacturers', path: '/my-manufacturers', icon: Star, hint: 'Saved and starred suppliers' }
  ];

  const supportMenuItems = [
    { label: 'Pricing', path: '/pricing', icon: CreditCard, hint: 'Plans and upgrade options' },
    { label: 'Settings', path: '/settings', icon: Settings, hint: 'Notifications and preferences' },
    { label: 'Help', path: '/help', icon: HelpCircle, hint: 'Guides and support' }
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const renderNavLinks = (items) => items.map((item) => {
    const Icon = item.icon;
    const active = isActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        title={item.hint}
        className={`
          flex items-center gap-3 py-2.5 rounded-lg transition-colors text-sm font-medium
          ${sidebarOpen ? 'px-4' : 'px-2 justify-center'}
          ${active
            ? 'bg-[#4881F8] text-white'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
          }
        `}
      >
        <Icon size={18} className="flex-shrink-0" />
        {sidebarOpen && <span className="truncate">{item.label}</span>}
      </Link>
    );
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden" style={{ height: '100vh' }}>
      {/* Sidebar */}
      <aside
        className={`
          fixed md:fixed inset-y-0 left-0 z-40
          bg-black text-white
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64' : 'w-20'}
          ${isMobile ? (sidebarOpen ? 'translate-x-0' : '-translate-x-full') : ''}
        `}
        style={{ height: '100vh' }}
      >
        <div className="h-full flex flex-col overflow-hidden">
          {/* Logo Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between min-h-[64px] flex-shrink-0">
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center w-full hover:bg-gray-800 rounded-lg p-2 transition-colors group"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <div className={`flex items-center w-full ${sidebarOpen ? 'justify-start' : 'justify-center'}`}>
                <EnigmaLogo size={32} showText={sidebarOpen} />
              </div>
            </button>
          </div>

          {/* Menu Items - Scrollable */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 scrollbar-thin" style={{ maxHeight: 'calc(100vh - 64px)' }}>
            {/* Common Section */}
            <div>
              {sidebarOpen && (
                <p className="text-xs uppercase text-gray-500 mb-3 px-2 whitespace-nowrap">COMMON</p>
              )}
              {!sidebarOpen && (
                <div className="h-4"></div>
              )}
              <div className="space-y-1">{renderNavLinks(commonMenuItems)}</div>
            </div>

            {/* For Manufacturers Section */}
            {isManufacturer && (
              <div>
                {sidebarOpen && (
                  <p className="text-xs uppercase text-gray-500 mb-3 px-2 whitespace-nowrap">FOR MANUFACTURERS</p>
                )}
                {!sidebarOpen && (
                  <div className="h-4"></div>
                )}
                <div className="space-y-1">{renderNavLinks(manufacturerMenuItems)}</div>
              </div>
            )}

            {/* For Buyers Section */}
            {isBuyer && (
              <div>
                {sidebarOpen && (
                  <p className="text-xs uppercase text-gray-500 mb-3 px-2 whitespace-nowrap">FOR BUYERS</p>
                )}
                {!sidebarOpen && (
                  <div className="h-4"></div>
                )}
                <div className="space-y-1">{renderNavLinks(buyerMenuItems)}</div>
              </div>
            )}

            {/* Support Section */}
            <div>
              {sidebarOpen && (
                <p className="text-xs uppercase text-gray-500 mb-3 px-2 whitespace-nowrap">SUPPORT</p>
              )}
              {!sidebarOpen && (
                <div className="h-4"></div>
              )}
              <div className="space-y-1">
                {renderNavLinks(supportMenuItems)}
                {user?.isAdmin && (
                  <Link
                    to="/admin"
                    title="Admin panel"
                    className={`flex items-center gap-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-amber-300 hover:bg-gray-800 hover:text-amber-200 ${sidebarOpen ? 'px-4' : 'px-2 justify-center'}`}
                  >
                    <Shield size={18} className="flex-shrink-0" />
                    {sidebarOpen && <span>Admin Panel</span>}
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className={`w-full flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors ${sidebarOpen ? 'px-4' : 'px-2 justify-center'}`}
                  title="Sign out of your account"
                >
                  <LogOut size={18} className="flex-shrink-0" />
                  {sidebarOpen && <span>Logout</span>}
                </button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isMobile 
            ? 'ml-0' 
            : sidebarOpen 
              ? 'md:ml-64' 
              : 'md:ml-20'
        }`}
        style={{ height: '100vh', overflow: 'hidden' }}
      >
        {/* Top Navbar */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-3 sm:px-4 md:px-6 flex-shrink-0 z-30 gap-2">
          <button
            onClick={toggleSidebar}
            className="text-gray-600 hover:text-[#4881F8] transition-colors flex-shrink-0"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobile ? (sidebarOpen ? <X size={24} /> : <Menu size={24} />) : (sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />)}
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-search'))}
            className="flex items-center gap-2 px-2 sm:px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:border-[#4881F8] hover:text-[#4881F8] transition-colors flex-shrink-0"
            title="Search manufacturers and RFQs with AI"
          >
            <Search size={16} />
            <span className="hidden sm:inline">AI Search</span>
          </button>

          <div className="flex-1 min-w-0" />

          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={handleBellClick}
                className="relative text-gray-600 hover:text-[#4881F8] transition-colors"
              >
                <Bell size={24} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-xs text-[#4881F8] hover:underline flex items-center gap-1"
                      >
                        <Check size={12} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
                    ) : notifications.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No notifications yet</div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif._id}
                          onClick={() => {
                            if (notif.link) navigate(notif.link);
                            setShowNotifications(false);
                          }}
                          className={`px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                        >
                          <p className="text-sm font-medium text-gray-800">{notif.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                className="flex items-center space-x-2 text-gray-700 hover:text-[#4881F8] transition-colors"
              >
                <AuthenticatedImage
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200 flex-shrink-0"
                  fallback={
                    <div className="w-8 h-8 rounded-full bg-[#4881F8] flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {getUserInitial(user)}
                    </div>
                  }
                />
                {!isMobile && (
                  <div className="text-left">
                    <span className="font-medium block leading-tight">{displayName}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{planLabel}</span>
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <AuthenticatedImage
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200 flex-shrink-0"
                      fallback={
                        <div className="w-10 h-10 rounded-full bg-[#4881F8] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
                          {getUserInitial(user)}
                        </div>
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">{displayName}</p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#4881F8]/10 text-[#4881F8] font-medium">
                        {user?.userType || 'BUYER'} · {planLabel}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <User size={14} className="inline mr-2" />My Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings size={14} className="inline mr-2" />Settings
                  </Link>
                  <Link
                    to="/help"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <HelpCircle size={14} className="inline mr-2" />Help
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut size={14} className="inline mr-2" />Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white p-4 md:p-6 scrollbar-thin" style={{ maxHeight: 'calc(100vh - 64px)' }}>
          {children}
        </main>
      </div>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <AISearchComponent />
    </div>
  );
};

export default DashboardLayout;

