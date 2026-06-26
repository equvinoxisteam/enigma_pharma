import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Search } from 'lucide-react';
import AIIcon from '../components/icons/AIIcon';
import { rfqAPI } from '../api/rfqAPI';
import { searchAPI } from '../api/searchAPI';
import { getUserDisplayName } from '../utils/userDisplay';

const StatCard = ({ label, value, hint, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="text-left w-full bg-white rounded-2xl border border-gray-200/80 p-5 hover:border-[#4881F8] hover:shadow-md hover:shadow-blue-500/5 transition-all group"
  >
    <p className="text-3xl font-bold text-[#01364a] mb-1 tabular-nums">{value}</p>
    <p className="text-sm font-semibold text-gray-800">{label}</p>
    {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    <span className="inline-block mt-3 text-xs font-medium text-[#4881F8] opacity-0 group-hover:opacity-100 transition-opacity">
      View details →
    </span>
  </button>
);

const QuickLink = ({ to, title, description }) => (
  <Link
    to={to}
    className="block p-5 bg-white rounded-2xl border border-gray-200/80 hover:border-[#4881F8] hover:shadow-md transition-all"
  >
    <h3 className="font-semibold text-[#01364a] mb-1">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
  </Link>
);

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
    const token = localStorage.getItem('token') || user?.token;
    if (!token) return;
    fetchDashboardData();
  }, [userType, user?.token]);

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
        const myRFQs = await rfqAPI.getMyRFQs();
        const rfqs = myRFQs.data || [];

        nextKpis.activeRFQs = rfqs.filter((r) => !['CLOSED', 'CANCELLED', 'EXPIRED'].includes(r.status)).length;
        nextKpis.awaitingSupplier = rfqs.filter((r) => r.status === 'REQUESTS_PENDING').length;
        nextKpis.inProduction = rfqs.filter((r) => r.status === 'IN_PRODUCTION').length;
        nextKpis.awaitingConfirmation = rfqs.filter((r) => r.status === 'SHIPPED').length;

        setRecentRequests(rfqs.filter((r) => r.status === 'REQUESTS_PENDING').slice(0, 5));
      }

      if (isManufacturer) {
        const [poolResult, acceptedResult, myResult] = await Promise.allSettled([
          rfqAPI.getRFQPool({ page: 1, limit: 1 }),
          rfqAPI.getAcceptedRFQs(),
          rfqAPI.getMyRFQs()
        ]);
        const pool = poolResult.status === 'fulfilled' ? poolResult.value : { pagination: { total: 0 }, data: [] };
        const accepted = acceptedResult.status === 'fulfilled' ? acceptedResult.value : { data: [] };
        const myRFQs = myResult.status === 'fulfilled' ? myResult.value : { data: [] };

        nextKpis.matchingRFQs = pool.pagination?.total || 0;
        nextKpis.requestedRFQs = myRFQs.data?.filter((r) =>
          r.status === 'REQUESTS_PENDING' || r.status === 'OPEN_FOR_REQUESTS'
        ).length || 0;
        nextKpis.acceptedRFQs = accepted.data?.length || 0;
        nextKpis.inProductionJobs = accepted.data?.filter((r) => r.status === 'IN_PRODUCTION').length || 0;

        try {
          const matching = await searchAPI.getRecommendations();
          setNewMatchingRFQs(matching.data || []);
        } catch {
          const poolData = await rfqAPI.getRFQPool({ page: 1, limit: 5 });
          setNewMatchingRFQs(poolData.data || []);
        }
      }
      setKpis(nextKpis);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const roleLabel = {
    BUYER: 'Buyer',
    MANUFACTURER: 'Manufacturer',
    HYBRID: 'Hybrid · Buyer & Seller'
  }[userType] || 'Buyer';

  const roleHint = {
    BUYER: 'Create pharma RFQs, discover CDMO partners, and track projects.',
    MANUFACTURER: 'Browse the pharma RFQ pool, submit bids, and manage CDMO production.',
    HYBRID: 'Run buyer and seller workflows from one account.'
  }[userType];

  const handleKPIClick = (filter) => {
    if (isBuyer && ['active', 'REQUESTS_PENDING', 'IN_PRODUCTION', 'SHIPPED'].includes(filter)) {
      navigate('/my-rfqs', { state: { filter } });
      return;
    }
    if (filter === 'matching') navigate('/rfqs-pool');
    else if (filter === 'accepted') navigate('/accepted-rfqs');
    else if (filter === 'requested') navigate('/my-rfqs');
    else if (filter === 'IN_PRODUCTION') navigate('/accepted-rfqs');
  };

  const buyerStats = [
    { label: 'Active Pharma RFQs', value: kpis.activeRFQs, hint: 'Open sourcing projects', filter: 'active' },
    { label: 'Awaiting CDMO Selection', value: kpis.awaitingSupplier, hint: 'Bids under review', filter: 'REQUESTS_PENDING' },
    { label: 'In CDMO Production', value: kpis.inProduction, hint: 'Manufacturing in progress', filter: 'IN_PRODUCTION' },
    { label: 'Awaiting Delivery Confirm', value: kpis.awaitingConfirmation, hint: 'Shipped — confirm receipt', filter: 'SHIPPED' }
  ];

  const manufacturerStats = [
    { label: 'Pharma RFQ Matches', value: kpis.matchingRFQs, hint: 'Projects in the pool', filter: 'matching' },
    { label: 'Bids Submitted', value: kpis.requestedRFQs, hint: 'Awaiting buyer response', filter: 'requested' },
    { label: 'Accepted Projects', value: kpis.acceptedRFQs, hint: 'Active CDMO engagements', filter: 'accepted' },
    { label: 'In Production', value: kpis.inProductionJobs, hint: 'Current manufacturing', filter: 'IN_PRODUCTION' }
  ];

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* Welcome */}
      <section className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#4881F8] mb-2">My Feed</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#01364a] mb-2">
              Welcome back, {getUserDisplayName(user)}
            </h1>
            <p className="text-gray-500 text-sm sm:text-base max-w-xl">{roleHint}</p>
          </div>
          <span className="self-start px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide bg-[#4881F8]/10 text-[#4881F8] border border-[#4881F8]/20">
            {roleLabel}
          </span>
        </div>
      </section>

      {/* AI Search */}
      <section
        onClick={() => window.dispatchEvent(new CustomEvent('open-ai-search'))}
        className="cursor-pointer group"
      >
        <div className="bg-gradient-to-br from-[#01364a] to-[#044c66] rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-900/10 hover:shadow-xl transition-shadow">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AIIcon size={16} className="text-blue-200" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-200">AI Matchmaking</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Find CDMO partners or pharma projects instantly</h2>
              <p className="text-blue-100/80 text-sm max-w-lg">
                Describe your molecule, service category, or GMP needs — Enigma Pharma AI finds the best CDMO matches.
              </p>
            </div>
            <button
              type="button"
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-[#01364a] rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors shrink-0"
            >
              <Search size={18} />
              Open AI Search
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(isBuyer && isManufacturer ? 8 : 4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse h-28" />
          ))}
        </div>
      ) : (
        <>
          {isBuyer && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">
                {isManufacturer ? 'Buyer Activity' : 'Your RFQs'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {buyerStats.map((stat) => (
                  <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    hint={stat.hint}
                    onClick={() => handleKPIClick(stat.filter)}
                  />
                ))}
              </div>
            </section>
          )}

          {isManufacturer && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">
                {isBuyer ? 'Seller Activity' : 'Your Pipeline'}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {manufacturerStats.map((stat) => (
                  <StatCard
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    hint={stat.hint}
                    onClick={() => handleKPIClick(stat.filter)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Recent buyer requests */}
      {isBuyer && recentRequests.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#01364a]">New CDMO bids</h2>
            <Link to="/my-rfqs" className="text-sm font-medium text-[#4881F8] hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {recentRequests.map((rfq) => (
              <Link
                key={rfq._id}
                to={`/my-rfqs/${rfq._id}?tab=requests`}
                className="flex items-center justify-between py-4 first:pt-0 last:pb-0 hover:text-[#4881F8] transition-colors group"
              >
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-[#4881F8]">{rfq.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">RFQ #{rfq._id.toString().slice(-6)} · Review requests</p>
                </div>
                <ArrowRight size={16} className="text-gray-300 group-hover:text-[#4881F8] shrink-0" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* AI recommendations for manufacturers */}
      {isManufacturer && newMatchingRFQs.length > 0 && (
        <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-[#01364a]">Recommended for you</h2>
              <p className="text-xs text-gray-500 mt-0.5">Based on your CDMO service categories</p>
            </div>
            <Link to="/rfqs-pool" className="text-sm font-medium text-[#4881F8] hover:underline flex items-center gap-1">
              Browse pool <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {newMatchingRFQs.slice(0, 3).map((rfq) => (
              <Link
                key={rfq._id}
                to={`/rfqs-pool/${rfq._id}`}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:border-[#4881F8] hover:bg-blue-50/30 transition-all"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#4881F8]">
                  {(rfq.pharmaProject?.serviceCategory || 'CDMO').replace(/_/g, ' ')}
                </span>
                <p className="font-semibold text-gray-900 mt-2 truncate">{rfq.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {rfq.pharmaProject?.moleculeName || rfq.pharmaProject?.developmentPhase?.replace(/_/g, ' ') || 'Pharma project'} · {rfq.country}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick actions */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 px-1">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isBuyer && (
            <QuickLink to="/start-rfq" title="Create New RFQ" description="Publish a sourcing request to the pool" />
          )}
          {isManufacturer && (
            <QuickLink to="/rfqs-pool" title="Browse Pharma RFQ Pool" description="Find projects matching your CDMO capabilities" />
          )}
          {isManufacturer && (
            <QuickLink to="/analytics" title="View Analytics" description="Track performance and pipeline metrics" />
          )}
          <QuickLink to="/company-profile" title="Company Profile" description="Update your public page, gallery and documents" />
          <QuickLink to="/profile" title="Account Settings" description="Edit company info and preferences" />
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
