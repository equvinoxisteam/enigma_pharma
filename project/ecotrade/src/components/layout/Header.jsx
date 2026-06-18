import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../../contexts/AuthContext";
import {
  Menu,
  X,
  User,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  Package,
  Layers,
  Users,
  Compass,
  Building2
} from "lucide-react";
import Button from "../ui/Button";
import AISearchComponent from "../AISearchComponent";
import AIIcon from "../icons/AIIcon";

const Header = () => {
  const headerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const profileMenuRef = useRef(null);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    setIsAISearchOpen(false);
    
    // Listen for custom trigger from dashboard
    const handleOpenAI = () => setIsAISearchOpen(true);
    window.addEventListener('open-ai-search', handleOpenAI);
    return () => window.removeEventListener('open-ai-search', handleOpenAI);
  }, [location]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = [
    { name: "Marketplace", path: "/products", icon: Layers },
    { name: "RFQ Pool", path: "/rfq-pool", icon: Package },
    { name: "Manufacturers", path: "/manufacturers-pool", icon: Users },
  ];

  return (
    <>
      <header 
        ref={headerRef} 
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          isScrolled ? "bg-white/80 backdrop-blur-lg shadow-sm py-3" : "bg-white py-5"
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            
            {/* Logo Section */}
            <div className="flex items-center gap-8">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 bg-[#4881F8] rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <span className="text-white font-black text-xl">E</span>
                </div>
                <span className="text-2xl font-black text-[#01364a] tracking-tighter">ENIGMA</span>
              </Link>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                      location.pathname === link.path 
                        ? "bg-blue-50 text-blue-600" 
                        : "text-gray-500 hover:text-blue-600 hover:bg-blue-50/50"
                    }`}
                  >
                    <link.icon size={18} className="opacity-70" />
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              
              {/* AI SEARCH TRIGGER */}
              <button
                onClick={() => setIsAISearchOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all group"
              >
                <AIIcon size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">AI Search</span>
              </button>

              <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden lg:block" />

              {/* Auth Section */}
              {isAuthenticated ? (
                <div className="relative group">
                  <button 
                    className="flex items-center gap-2 p-1.5 pr-3 rounded-2xl hover:bg-gray-100 transition-all border border-transparent hover:border-gray-100"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                      {user?.fullName?.charAt(0)}
                    </div>
                    <div className="text-left hidden lg:block">
                      <p className="text-xs font-black text-[#01364a] leading-none mb-1 uppercase tracking-wider">{user?.userType}</p>
                      <p className="text-sm font-medium text-gray-500 max-w-[100px] truncate">{user?.fullName}</p>
                    </div>
                    <ChevronDown size={16} className="text-gray-400" />
                  </button>

                  <div className={`absolute right-0 mt-3 w-64 bg-white rounded-3xl shadow-2xl border border-gray-100 p-3 transition-all transform origin-top-right ${
                    isProfileMenuOpen ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 pointer-events-none translate-y-2"
                  }`}>
                    <div className="p-4 border-b border-gray-50 mb-2">
                       <p className="font-bold text-gray-900 truncate">{user?.fullName}</p>
                       <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <div className="space-y-1">
                      {isAdmin && (
                        <Link to="/admin" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-blue-600 hover:bg-blue-50">
                          <Settings size={18} /> Admin Panel
                        </Link>
                      )}
                      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50">
                        <Compass size={18} /> User Dashboard
                      </Link>
                      <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50">
                        <User size={18} /> My Profile
                      </Link>
                      <Link to="/company-profile" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-gray-600 hover:bg-gray-50">
                        <Building2 size={18} /> Company Profile
                      </Link>
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors">Login</Link>
                  <Link 
                    to="/register" 
                    className="px-6 py-2.5 bg-[#01364a] text-white rounded-xl font-bold text-sm hover:shadow-lg shadow-gray-200 transition-all border border-transparent"
                  >
                    Join Enigma
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button 
                className="lg:hidden p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-white border-t border-gray-100 p-4 animate-in slide-in-from-top duration-200">
            <div className="space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className="flex items-center gap-4 px-6 py-4 rounded-2xl text-lg font-bold text-gray-700 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <link.icon size={22} className="text-blue-500" />
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
      
      {/* AI Search Overlay */}
      {isAISearchOpen && (
        <AISearchComponent onClose={() => setIsAISearchOpen(false)} />
      )}

      {/* Spacer to prevent content from going under the fixed header */}
      <div className="h-[88px]" />
    </>
  );
};

export default Header;