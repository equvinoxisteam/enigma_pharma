import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, Factory, CheckCircle, BarChart3, PlusCircle, 
  Clock, Package, Users, TrendingUp, AlertCircle, ArrowRight,
  Sparkles, Zap, Search
} from 'lucide-react';
import { rfqAPI } from '../api/rfqAPI';
import { searchAPI } from '../api/searchAPI';
import { getUserDisplayName } from '../utils/userDisplay';

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userType = user?.userType || 'BUYER';
  const isManufacturer = userType === 'MANUFACTURER' || userType === 'HYBRID';
  const isBuyer = userType === 'BUYER' || userType === 'HYBRID';

  const [kpis, setKpis] = useState({
    activeRFQs: 0,
    awaitingSupplier: 0,
    inProduction: 0,
    awaitingConfirmation: 0,
    matchingRFQs: 0,
    requestedRFQs: 0,
    acceptedRFQs: 0,
    inProductionJobs: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentRequests, setRecentRequests] = useState([]);
  const [newMatchingRFQs, setNewMatchingRFQs] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, [userType]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const nextKpis = {
        activeRFQs: 0,
        awaitingSupplier: 0,
        inProduction: 0,
        awaitingConfirmation: 0,
        matchingRFQs: 0,
        requestedRFQs: 0,
        acceptedRFQs: 0,
        inProductionJobs: 0
      };
      
      if (isBuyer) {
        // Fetch buyer KPIs
        const myRFQs = await rfqAPI.getMyRFQs();
        const rfqs = myRFQs.data || [];
        
        nextKpis.activeRFQs = rfqs.filter(r => !['CLOSED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length;
        nextKpis.awaitingSupplier = rfqs.filter(r => r.status === 'REQUESTS_PENDING').length;
        nextKpis.inProduction = rfqs.filter(r => r.status === 'IN_PRODUCTION').length;
        nextKpis.awaitingConfirmation = rfqs.filter(r => r.status === 'SHIPPED').length;

        // Get RFQs with new requests
        const rfqsWithRequests = rfqs.filter(r => r.status === 'REQUESTS_PENDING');
        setRecentRequests(rfqsWithRequests.slice(0, 5));
      }

      if (isManufacturer) {
        // Fetch manufacturer KPIs
        const [poolResult, acceptedResult, myResult] = await Promise.allSettled([
          rfqAPI.getRFQPool({ page: 1, limit: 1 }),
          rfqAPI.getAcceptedRFQs(),
          rfqAPI.getMyRFQs()
        ]);
        const pool = poolResult.status === 'fulfilled' ? poolResult.value : { pagination: { total: 0 }, data: [] };
        const accepted = acceptedResult.status === 'fulfilled' ? acceptedResult.value : { data: [] };
        const myRFQs = myResult.status === 'fulfilled' ? myResult.value : { data: [] };

        const requestedCount = myRFQs.data?.filter(r => 
          r.status === 'REQUESTS_PENDING' || r.status === 'OPEN_FOR_REQUESTS'
        ).length || 0;

        nextKpis.matchingRFQs = pool.pagination?.total || 0;
        nextKpis.requestedRFQs = requestedCount;
        nextKpis.acceptedRFQs = accepted.data?.length || 0;
        nextKpis.inProductionJobs = accepted.data?.filter(r => r.status === 'IN_PRODUCTION').length || 0;

        // Get AI Recommendations
        try {
          const matching = await searchAPI.getRecommendations();
          setNewMatchingRFQs(matching.data || []);
        } catch (err) {
          console.error("AI Recommendations failed:", err);
          const pool = await rfqAPI.getRFQPool({ page: 1, limit: 5 });
          setNewMatchingRFQs(pool.data || []);
        }
      }
      setKpis(nextKpis);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRolePill = () => {
    const roleMap = {
      'BUYER': { label: 'Buyer', color: 'bg-blue-100 text-blue-800' },
      'MANUFACTURER': { label: 'Seller (Manufacturer)', color: 'bg-green-100 text-green-800' },
      'HYBRID': { label: 'Hybrid (Buyer + Seller)', color: 'bg-purple-100 text-purple-800' }
    };
    const role = roleMap[userType] || roleMap['BUYER'];
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${role.color}`}>
        {role.label}
      </span>
    );
  };

  const handleKPIClick = (filter) => {
    if (isBuyer) {
      navigate('/my-rfqs', { state: { filter } });
    } else {
      if (filter === 'matching') {
        navigate('/rfqs-pool');
      } else if (filter === 'accepted') {
        navigate('/accepted-rfqs');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {getUserDisplayName(user)}!</h1>
          {getRolePill()}
        </div>
        <p className="text-gray-600 font-medium opacity-80">
          {userType === 'BUYER' && 'Create and manage RFQs, discover suppliers, and track fulfillment from one place.'}
          {userType === 'MANUFACTURER' && 'Find matching RFQs, submit requests, manage accepted jobs, and grow your seller pipeline.'}
          {userType === 'HYBRID' && 'Use both buyer and seller workflows under one account, including RFQ creation and RFQ response.'}
        </p>
      </div>

      {/* AI Search Common Section */}
      <div 
        onClick={() => window.dispatchEvent(new CustomEvent('open-ai-search'))}
        className="relative group mb-10 cursor-pointer"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white border border-gray-100 rounded-[2.5rem] p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden shadow-2xl shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300">
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <div className="px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                AI Matchmaking Active
              </div>
              <Sparkles size={18} className="text-yellow-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-[#01364a] mb-3 tracking-tighter leading-tight sm:leading-none">Find anything with Enigma AI</h2>
            <p className="text-gray-500 font-bold text-base sm:text-lg max-w-xl">
              Describe precisely what you need—from specialized CNC materials to custom job batches. Our AI does the extraction and discovery for you instantly.
            </p>
          </div>
          
          <button 
            className="w-full md:w-auto px-10 py-5 bg-[#01364a] text-white rounded-[1.8rem] font-black text-lg flex items-center justify-center gap-4 hover:shadow-2xl hover:shadow-blue-950/20 transition-all group border-b-4 border-blue-950 active:border-b-0 active:translate-y-1"
          >
            <Search size={24} className="group-hover:rotate-12 transition-transform" />
            AI Search
          </button>
          
          <div className="absolute right-[-20px] bottom-[-20px] opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
            <Sparkles size={240} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-4"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isBuyer && (
            <>
              <div 
                onClick={() => handleKPIClick('active')}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <FileText className="text-[#4881F8]" size={32} />
                  <span className="text-2xl font-bold">{kpis.activeRFQs}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Active RFQs</h3>
                <p className="text-xs text-gray-500 mt-1">Non-closed RFQs</p>
              </div>
              <div 
                onClick={() => handleKPIClick('REQUESTS_PENDING')}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <Clock className="text-[#4881F8]" size={32} />
                  <span className="text-2xl font-bold">{kpis.awaitingSupplier}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Awaiting Supplier Selection</h3>
                <p className="text-xs text-gray-500 mt-1">RFQs with pending requests</p>
              </div>
              <div 
                onClick={() => handleKPIClick('IN_PRODUCTION')}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <Factory className="text-[#4881F8]" size={32} />
                  <span className="text-2xl font-bold">{kpis.inProduction}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">In Production</h3>
                <p className="text-xs text-gray-500 mt-1">RFQs being manufactured</p>
              </div>
              <div 
                onClick={() => handleKPIClick('SHIPPED')}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <Package className="text-[#4881F8]" size={32} />
                  <span className="text-2xl font-bold">{kpis.awaitingConfirmation}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Awaiting Confirmation</h3>
                <p className="text-xs text-gray-500 mt-1">Deliveries to confirm</p>
              </div>
            </>
          )}
          {isManufacturer && (
            <>
              <div 
                onClick={() => handleKPIClick('matching')}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <FileText className="text-[#4881F8]" size={32} />
                  <span className="text-2xl font-bold">{kpis.matchingRFQs}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Matching RFQs</h3>
                <p className="text-xs text-gray-500 mt-1">RFQs matching your profile</p>
              </div>
              <div 
                onClick={() => handleKPIClick('requested')}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <Clock className="text-[#4881F8]" size={32} />
                  <span className="text-2xl font-bold">{kpis.requestedRFQs}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">RFQs Requested</h3>
                <p className="text-xs text-gray-500 mt-1">Pending buyer decision</p>
              </div>
              <div 
                onClick={() => handleKPIClick('accepted')}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <CheckCircle className="text-[#4881F8]" size={32} />
                  <span className="text-2xl font-bold">{kpis.acceptedRFQs}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">Accepted RFQs</h3>
                <p className="text-xs text-gray-500 mt-1">Active jobs</p>
              </div>
              <div 
                onClick={() => handleKPIClick('IN_PRODUCTION')}
                className="bg-white border border-gray-200 rounded-lg p-6 cursor-pointer hover:border-[#4881F8] hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <Factory className="text-[#4881F8]" size={32} />
                  <span className="text-2xl font-bold">{kpis.inProductionJobs}</span>
                </div>
                <h3 className="text-sm font-medium text-gray-600">In Production</h3>
                <p className="text-xs text-gray-500 mt-1">Jobs being manufactured</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Recent Activity Lists */}
      {isBuyer && recentRequests.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">New RFQ Requests</h2>
            <Link 
              to="/my-rfqs" 
              className="text-sm text-[#4881F8] hover:underline flex items-center"
            >
              View all <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentRequests.map((rfq) => (
              <Link
                key={rfq._id}
                to={`/my-rfqs/${rfq._id}?tab=requests`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-[#4881F8] hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{rfq.title}</h3>
                    <p className="text-sm text-gray-600">RFQ #{rfq._id.toString().slice(-6)}</p>
                  </div>
                  <div className="flex items-center text-sm text-[#4881F8]">
                    <AlertCircle size={16} className="mr-1" />
                    New requests
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {isManufacturer && newMatchingRFQs.length > 0 && (
        <div className="bg-gradient-to-br from-[#01364a] to-[#044c66] rounded-3xl p-8 mb-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                  <Sparkles className="text-yellow-400" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">AI Tailored for You</h2>
                  <p className="text-blue-200 text-sm font-medium">Smart matches based on your factory capabilities</p>
                </div>
              </div>
              <Link 
                to="/rfqs-pool" 
                className="px-6 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-white/10"
              >
                Explore All <ArrowRight size={16} />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {newMatchingRFQs.slice(0, 3).map((rfq) => (
                <Link
                  key={rfq._id}
                  to={`/rfqs-pool/${rfq._id}`}
                  className="block p-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:-translate-y-1"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-500/30">
                      {rfq.workpieces?.[0]?.technology?.replace('_', ' ') || 'SMART MATCH'}
                    </span>
                    <Zap size={14} className="text-yellow-400 fill-yellow-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1 truncate">{rfq.title}</h3>
                  <p className="text-xs text-blue-200 mb-4 line-clamp-1">
                    {rfq.workpieces?.[0]?.material} • {rfq.country}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-bold text-blue-300/60 uppercase">
                    <span>RFQ #{rfq._id.toString().slice(-6)}</span>
                    <span className="flex items-center gap-1 text-white">View <ArrowRight size={12} /></span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isBuyer && (
            <Link
              to="/start-rfq"
              className="p-4 border border-gray-200 rounded-lg hover:border-[#4881F8] hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center mb-2">
                <PlusCircle className="text-[#4881F8] mr-2" size={20} />
                <h3 className="font-medium">Create New RFQ</h3>
              </div>
              <p className="text-sm text-gray-600">Start a new request for quotation</p>
            </Link>
          )}
          {isManufacturer && (
            <Link
              to="/rfqs-pool"
              className="p-4 border border-gray-200 rounded-lg hover:border-[#4881F8] hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center mb-2">
                <FileText className="text-[#4881F8] mr-2" size={20} />
                <h3 className="font-medium">Browse RFQ Pool</h3>
              </div>
              <p className="text-sm text-gray-600">Find RFQs matching your capabilities</p>
            </Link>
          )}
          {isManufacturer && (
            <Link
              to="/analytics"
              className="p-4 border border-gray-200 rounded-lg hover:border-[#4881F8] hover:bg-blue-50 transition-colors"
            >
              <div className="flex items-center mb-2">
                <BarChart3 className="text-[#4881F8] mr-2" size={20} />
                <h3 className="font-medium">View Analytics</h3>
              </div>
              <p className="text-sm text-gray-600">Track your performance metrics</p>
            </Link>
          )}
          <Link
            to="/profile"
            className="p-4 border border-gray-200 rounded-lg hover:border-[#4881F8] hover:bg-blue-50 transition-colors"
          >
            <div className="flex items-center mb-2">
              <Users className="text-[#4881F8] mr-2" size={20} />
              <h3 className="font-medium">Update Profile</h3>
            </div>
            <p className="text-sm text-gray-600">Complete your profile information</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

