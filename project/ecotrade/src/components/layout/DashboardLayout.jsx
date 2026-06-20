import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, Bell, LogOut, Settings, HelpCircle, ChevronLeft, ChevronRight, Search, Check, Shield,
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

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 72;
const SIDEBAR_INSET = 12;
const SIDEBAR_GAP = 10;

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

  useEffect(() => {
    localStorage.setItem('sidebarOpen', sidebarOpen.toString());
  }, [sidebarOpen]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const data = await notificationAPI.getUnreadCount();
      setUnreadCount(data.count || 0);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  const handleBellClick = async () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
    if (!showNotifications) {
      setNotificationsLoading(true);
      try {
        const data = await notificationAPI.getAll(1, 10);
        setNotifications(data.data || []);
      } catch { /* ignore */ }
      setNotificationsLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch { /* ignore */ }
  };

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

  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <EnigmaLogo size={48} />
            </div>
            <p className="text-gray-600 mb-6">Please login to access your dashboard</p>
            <button
              onClick={() => setShowLoginModal(true)}
              className="px-6 py-2 rounded-lg text-white font-medium bg-[#4881F8]"
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
    { label: 'My Feed', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: '/profile', icon: UserCircle },
    { label: 'Company Profile', path: '/company-profile', icon: Building2 }
  ];

  const manufacturerMenuItems = [
    { label: 'RFQ Pool', path: '/rfqs-pool', icon: Layers },
    { label: 'Accepted RFQs', path: '/accepted-rfqs', icon: CheckSquare },
    { label: 'Your Invitations', path: '/invitations', icon: Mail },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 }
  ];

  const buyerMenuItems = [
    { label: 'Manufacturer Pool', path: '/manufacturers-pool', icon: Users },
    { label: 'Create RFQ', path: '/start-rfq', icon: PlusCircle },
    { label: 'My RFQs', path: '/my-rfqs', icon: FileStack },
    { label: 'My Manufacturers', path: '/my-manufacturers', icon: Star }
  ];

  const supportMenuItems = [
    { label: 'Pricing', path: '/pricing', icon: CreditCard },
    { label: 'Settings', path: '/settings', icon: Settings },
    { label: 'Help', path: '/help', icon: HelpCircle }
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
        title={item.label}
        className={`
          flex items-center rounded-xl text-sm font-medium transition-all duration-200
          ${sidebarOpen ? 'gap-3 py-2.5 px-3.5' : 'justify-center py-3 px-0'}
          ${active
            ? 'bg-[#4881F8] text-white shadow-md shadow-blue-500/30'
            : 'text-gray-400 hover:bg-white/10 hover:text-white'
          }
        `}
      >
        {sidebarOpen ? (
          <span className="truncate">{item.label}</span>
        ) : (
          <Icon size={20} className="flex-shrink-0" />
        )}
      </Link>
    );
  });

  const renderSection = (title, items, showDivider = false) => (
    <div>
      {sidebarOpen && (
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-3.5">
          {title}
        </p>
      )}
      {!sidebarOpen && showDivider && (
        <div className="border-t border-gray-800 mb-2" />
      )}
      <div className="space-y-0.5">{renderNavLinks(items)}</div>
    </div>
  );

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const sidebarWidth = sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED;
  const mainOffset = isMobile ? 0 : SIDEBAR_INSET + sidebarWidth + SIDEBAR_GAP;

  return (
    <div className="min-h-screen bg-[#f4f6f9] flex overflow-hidden" style={{ height: '100vh' }}>
      {/* Floating Sidebar */}
      <aside
        className={`
          fixed z-40 flex flex-col
          bg-[#0a0a0a] text-white border border-gray-800/80
          shadow-[0_8px_40px_rgba(0,0,0,0.35)]
          rounded-2xl transition-all duration-300 ease-in-out
          ${isMobile
            ? `inset-y-0 left-0 rounded-none border-l-0 border-y-0 w-64 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
            : 'top-3 bottom-3 left-3'
          }
        `}
        style={isMobile ? { height: '100vh' } : { width: sidebarWidth }}
      >
        <div className="h-full flex flex-col overflow-hidden p-3">
          <div className={`flex items-center mb-4 ${sidebarOpen ? 'justify-between px-1' : 'justify-center'}`}>
            <Link to="/dashboard" className="flex items-center min-w-0">
              <EnigmaLogo size={28} showText={sidebarOpen} />
            </Link>
            {!isMobile && sidebarOpen && (
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>

          {!isMobile && !sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="mb-3 p-2 rounded-xl text-gray-500 hover:text-white hover:bg-white/10 transition-colors mx-auto"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}

          <nav className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 scrollbar-thin pr-0.5">
            {renderSection('Common', commonMenuItems)}
            {isManufacturer && renderSection('Manufacturers', manufacturerMenuItems, true)}
            {isBuyer && renderSection('Buyers', buyerMenuItems, true)}
            {renderSection('Support', supportMenuItems, true)}

            {user?.isAdmin && (
              <div>
                {sidebarOpen && (
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 px-3.5">Admin</p>
                )}
                {!sidebarOpen && <div className="h-2 border-t border-gray-800/80 mt-2 pt-2" />}
                <Link
                  to="/admin"
                  title="Admin Panel"
                  className={`flex items-center rounded-xl text-sm font-medium text-amber-400 hover:bg-white/10 transition-colors ${sidebarOpen ? 'gap-3 py-2.5 px-3.5' : 'justify-center py-3'}`}
                >
                  {sidebarOpen ? (
                    <span>Admin Panel</span>
                  ) : (
                    <Shield size={20} className="flex-shrink-0" />
                  )}
                </Link>
              </div>
            )}

            <button
              onClick={handleLogout}
              title="Logout"
              className={`w-full flex items-center rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors ${sidebarOpen ? 'gap-3 py-2.5 px-3.5' : 'justify-center py-3'}`}
            >
              {sidebarOpen ? <span>Logout</span> : <LogOut size={20} className="flex-shrink-0" />}
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col min-w-0 w-full transition-all duration-300"
        style={{
          height: '100vh',
          overflow: 'hidden',
          marginLeft: isMobile ? 0 : mainOffset,
          paddingRight: isMobile ? 0 : SIDEBAR_INSET
        }}
      >
        <header className="bg-white border-b border-gray-200 h-14 sm:h-16 flex items-center justify-between px-3 sm:px-4 lg:px-5 flex-shrink-0 z-30 gap-2 sticky top-0">
          <button
            onClick={toggleSidebar}
            className={`text-gray-600 hover:text-[#4881F8] transition-colors flex-shrink-0 p-1 ${!isMobile && sidebarOpen ? 'invisible w-0 p-0 overflow-hidden' : ''}`}
            title={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {isMobile ? (sidebarOpen ? <X size={22} /> : <Menu size={22} />) : <Menu size={22} />}
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-search'))}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:border-[#4881F8] hover:text-[#4881F8] transition-colors flex-shrink-0"
          >
            <Search size={16} />
            <span className="hidden sm:inline">AI Search</span>
          </button>

          <div className="flex-1 min-w-0" />

          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="relative" ref={notifRef}>
              <button
                onClick={handleBellClick}
                className="relative p-2 rounded-xl text-gray-600 hover:text-[#4881F8] hover:bg-gray-50 transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-1.5rem))] bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
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

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
                className="flex items-center space-x-2 text-gray-700 hover:text-[#4881F8] transition-colors pl-1"
              >
                <AuthenticatedImage
                  src={avatarUrl}
                  alt={displayName}
                  className="w-9 h-9 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                  fallback={
                    <div className="w-9 h-9 rounded-xl bg-[#4881F8] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                      {getUserInitial(user)}
                    </div>
                  }
                />
                {!isMobile && (
                  <div className="text-left hidden sm:block">
                    <span className="font-semibold text-sm block leading-tight">{displayName}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{planLabel}</span>
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-200 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                    <AuthenticatedImage
                      src={avatarUrl}
                      alt={displayName}
                      className="w-10 h-10 rounded-xl object-cover border border-gray-200 flex-shrink-0"
                      fallback={
                        <div className="w-10 h-10 rounded-xl bg-[#4881F8] flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
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
                  <Link to="/profile" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowProfileMenu(false)}>
                    My Profile
                  </Link>
                  <Link to="/company-profile" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowProfileMenu(false)}>
                    Company Profile
                  </Link>
                  <Link to="/settings" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowProfileMenu(false)}>
                    Settings
                  </Link>
                  <Link to="/help" className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50" onClick={() => setShowProfileMenu(false)}>
                    Help
                  </Link>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden w-full min-h-0 px-3 sm:px-4 lg:px-5 py-3 sm:py-4 pb-6 scrollbar-thin">
          <div className="w-full min-w-0">{children}</div>
        </main>
      </div>

      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
      <AISearchComponent />
    </div>
  );
};

export default DashboardLayout;
