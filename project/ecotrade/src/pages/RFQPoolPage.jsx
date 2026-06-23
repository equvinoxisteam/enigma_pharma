import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { useToast } from '../contexts/ToastContext';
import { Search, Filter, MapPin, Calendar, Info, AlertCircle, Zap, Globe, FlaskConical } from 'lucide-react';
import AIIcon from '../components/icons/AIIcon';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature, FEATURE_KEYS, formatRfqLimit, getRfqRequestLimit } from '../config/planFeatures';
import { profileAPI } from '../api/profileAPI';
import {
  SERVICE_CATEGORIES, SERVICE_CATEGORY_LABELS, DEVELOPMENT_PHASES,
  DEVELOPMENT_PHASE_LABELS, GMP_CERTIFICATIONS, GMP_LABELS, labelFor
} from '../config/pharmaTaxonomy';

const RFQPoolPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError } = useToast();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    serviceCategory: [],
    developmentPhase: '',
    country: '',
    region: '',
    gmp: []
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const canRequest = hasFeature(user, FEATURE_KEYS.RFQ_RESPOND);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    fetchRFQs();
  }, [filters, pagination.page]);

  useEffect(() => {
    if (user && user.userType !== 'BUYER') {
      profileAPI.getSubscriptionUsage().then((r) => setUsage(r.data)).catch(() => {});
    }
  }, [user]);

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const response = await rfqAPI.getRFQPool({
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      });
      setRfqs(response.data || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      showError('Failed to load RFQs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const toggleArrayFilter = (field, value) => {
    const current = filters[field] || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    handleFilterChange(field, updated);
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      serviceCategory: [],
      developmentPhase: '',
      country: '',
      region: '',
      gmp: []
    });
  };

  return (
    <div className="w-full py-4 sm:py-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black text-[#01364a] mb-3 tracking-tighter">Pharma RFQ Pool</h1>
          <p className="text-gray-500 font-bold text-lg">Browse active CDMO, API, and formulation sourcing opportunities.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-search'))}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-105 transition-all"
          >
            <AIIcon size={18} />
            AI Smart Search
          </button>
        </div>
      </div>

      {(usage || !canRequest) && (
        <div className={`mb-6 p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
          canRequest && usage?.canRequestRfqs ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div>
            <p className="font-bold text-[#01364a] text-sm">
              Plan: {usage?.planType || user?.subscription?.planType || 'FREE'}
              {usage?.status && usage.status !== 'ACTIVE' && (
                <span className="ml-2 text-amber-700">({usage.status})</span>
              )}
            </p>
            {!canRequest ? (
              <p className="text-sm text-amber-800 mt-1">View-only on Free plan. Upgrade to Standard (20 RFQs/yr), Pro (40), or Enterprise (unlimited) to submit bids.</p>
            ) : usage?.rfqRequestsLimit !== null ? (
              <p className="text-sm text-gray-700 mt-1">
                RFQ bids used: <strong>{usage?.rfqRequestsUsed ?? 0}</strong> / {usage?.rfqRequestsLimit ?? formatRfqLimit(getRfqRequestLimit(user))}
              </p>
            ) : (
              <p className="text-sm text-gray-700 mt-1">Unlimited RFQ bids on your plan.</p>
            )}
          </div>
          {(!canRequest || !usage?.canRequestRfqs) && (
            <Link to="/pricing" className="px-5 py-2.5 bg-[#4881F8] text-white rounded-xl font-bold text-sm text-center shrink-0">
              Upgrade Plan
            </Link>
          )}
        </div>
      )}

      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 mb-8 shadow-2xl shadow-blue-900/5">
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#4881F8] transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by title, molecule, or keywords..."
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-[#4881F8] focus:bg-white rounded-2xl text-lg font-bold outline-none transition-all shadow-inner"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 lg:w-40 flex items-center justify-center gap-3 px-6 py-5 border-2 rounded-2xl font-black transition-all ${
              showFilters ? 'bg-blue-50 border-blue-100 text-[#4881F8]' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <Filter size={20} /> {showFilters ? 'Hide Filters' : 'Advanced'}
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4 duration-300 border-t border-gray-50 pt-6 mt-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                Development Phase <Info size={12} className="text-gray-300" />
              </label>
              <select
                value={filters.developmentPhase}
                onChange={(e) => handleFilterChange('developmentPhase', e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-[#01364a] focus:border-[#4881F8] outline-none transition-all"
              >
                <option value="">All Phases</option>
                {DEVELOPMENT_PHASES.map((phase) => (
                  <option key={phase} value={phase}>{DEVELOPMENT_PHASE_LABELS[phase]}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Country</label>
              <input
                type="text"
                placeholder="e.g. India, USA"
                value={filters.country}
                onChange={(e) => handleFilterChange('country', e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-[#01364a] focus:border-[#4881F8] outline-none transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Service Categories</label>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleArrayFilter('serviceCategory', cat)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${
                      filters.serviceCategory.includes(cat)
                        ? 'bg-[#4881F8] border-[#4881F8] text-white'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {SERVICE_CATEGORY_LABELS[cat] || cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Required GMP</label>
              <div className="flex flex-wrap gap-2">
                {GMP_CERTIFICATIONS.map((cert) => (
                  <button
                    key={cert}
                    type="button"
                    onClick={() => toggleArrayFilter('gmp', cert)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${
                      filters.gmp.includes(cert)
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {GMP_LABELS[cert] || cert}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <button type="button" onClick={clearFilters} className="text-sm font-bold text-[#4881F8] hover:underline">
                Clear all filters
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-8 animate-pulse">
              <div className="h-6 bg-gray-100 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-50 rounded w-1/4" />
            </div>
          ))
        ) : rfqs.length > 0 ? (
          rfqs.map((rfq) => {
            const pp = rfq.pharmaProject || {};
            return (
              <div
                key={rfq._id}
                className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="px-3 py-1 bg-blue-50 text-[#4881F8] text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
                      {labelFor(SERVICE_CATEGORY_LABELS, pp.serviceCategory)}
                    </span>
                    {pp.developmentPhase && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-purple-100">
                        {labelFor(DEVELOPMENT_PHASE_LABELS, pp.developmentPhase)}
                      </span>
                    )}
                    <span className="px-3 py-1 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-100">
                      RFQ #{rfq._id.toString().slice(-6)}
                    </span>
                    {rfq.isCorporateRFQ && (
                      <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-purple-100">
                        Corporate RFQ
                      </span>
                    )}
                    {rfq.matchScore != null && (
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-green-100">
                        {rfq.matchScore}% Match
                      </span>
                    )}
                  </div>
                  <h3 className="text-2xl font-black text-[#01364a] mb-2 group-hover:text-[#4881F8] transition-colors">{rfq.title}</h3>
                  {pp.moleculeName && (
                    <p className="text-sm font-semibold text-gray-600 mb-2 flex items-center gap-2">
                      <FlaskConical size={14} /> {pp.moleculeName}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 font-bold">
                    <div className="flex items-center gap-2"><MapPin size={16} /> {rfq.country}</div>
                    <div className="flex items-center gap-2"><Globe size={16} /> {rfq.region || 'Global'}</div>
                    <div className="flex items-center gap-2"><Calendar size={16} /> Ends {rfq.rfqDeadline ? new Date(rfq.rfqDeadline).toLocaleDateString() : 'TBD'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <Link
                    to={`/rfqs-pool/${rfq._id}`}
                    className="flex-1 md:flex-none px-8 py-4 bg-gray-50 hover:bg-gray-100 text-[#01364a] rounded-2xl font-black text-sm transition-all"
                  >
                    View Details
                  </Link>
                  {canRequest ? (
                    <Link
                      to={`/rfqs-pool/${rfq._id}?request=true`}
                      className="flex-1 md:flex-none px-8 py-4 bg-[#01364a] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/10 hover:bg-black transition-all"
                    >
                      Submit Bid
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/pricing')}
                      className="flex-1 md:flex-none px-8 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-sm flex items-center justify-center gap-2 opacity-80"
                    >
                      Upgrade to Bid <Zap size={14} className="fill-current" />
                    </button>
                  )}
                </div>

                {!canRequest && (
                  <div className="absolute top-4 right-8 flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    <AlertCircle size={12} /> Standard+ Required
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <h2 className="text-2xl font-black text-gray-400">No matching RFQs found</h2>
            <p className="text-gray-400 font-bold">Try adjusting your filters or use AI Search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RFQPoolPage;
