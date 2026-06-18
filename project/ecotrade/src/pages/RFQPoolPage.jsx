import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { rfqAPI } from '../api/rfqAPI';
import { useToast } from '../contexts/ToastContext';
import { Search, Filter, FileText, MapPin, Calendar, Eye, Box, Info, ChevronRight, AlertCircle, Shield, Zap, Globe } from 'lucide-react';
import AIIcon from '../components/icons/AIIcon';
import { useAuth } from '../contexts/AuthContext';
import { hasFeature, FEATURE_KEYS } from '../config/planFeatures';
import Button from '../components/ui/Button';
import CADFileViewer from '../components/CADFileViewer';
import { getWorkpieceFileUrl } from '../utils/fileUtils';
import OtherTextInput from '../components/ui/OtherTextInput';
import { isOtherValue, resolveOtherValue, resolveTechnologiesWithOther } from '../utils/otherOption';

const RFQPoolPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [rfqs, setRfqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    partType: '',
    partTypeOther: '',
    technologies: [],
    technologyOther: '',
    country: '',
    region: '',
    certifications: [],
    material: '',
    quantity: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  const canRequest = hasFeature(user, FEATURE_KEYS.RFQ_RESPOND);

  const technologyOptions = ['CNC', 'TURNING', 'MILLING', '3D_PRINTING', 'SHEET_METAL', 'DIE_CASTING', 'INJECTION_MOLDING', 'STAMPING', 'WELDING', 'ASSEMBLY', 'OTHER'];
  const partTypeOptions = ['Gear', 'Pipe', 'Bracket', 'Housing', 'Shaft', 'Bearing', 'Valve', 'Connector', 'Mount', 'Cover', 'Other'];

  useEffect(() => {
    fetchRFQs();
  }, [filters, pagination.page]);

  const fetchRFQs = async () => {
    setLoading(true);
    try {
      const response = await rfqAPI.getRFQPool({
        ...filters,
        partType: resolveOtherValue(filters.partType, filters.partTypeOther),
        technologies: resolveTechnologiesWithOther(filters.technologies, filters.technologyOther),
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

  const handleTechnologyToggle = (tech) => {
    const current = filters.technologies || [];
    const updated = current.includes(tech)
      ? current.filter(t => t !== tech)
      : [...current, tech];
    handleFilterChange('technologies', updated);
  };

  const clearFilters = () => {
    setFilters({
      keyword: '',
      partType: '',
      partTypeOther: '',
      technologies: [],
      technologyOther: '',
      country: '',
      region: '',
      certifications: [],
      material: '',
      quantity: ''
    });
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <h1 className="text-5xl font-black text-[#01364a] mb-3 tracking-tighter">RFQ Pool</h1>
          <p className="text-gray-500 font-bold text-lg">Browse thousands of active manufacturing opportunities worldwide.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-ai-search'))}
            className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 hover:scale-105 transition-all"
          >
            <AIIcon size={18} />
            AI Smart Search
          </button>
          <button 
             onClick={() => window.dispatchEvent(new CustomEvent('open-ai-search'))}
             className="flex items-center gap-3 px-8 py-4 bg-[#01364a] text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-900/10 hover:scale-105 transition-all"
          >
            <Box size={18} />
            Model Match (STL)
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] p-6 mb-8 shadow-2xl shadow-blue-900/5">
        <div className="flex flex-col lg:flex-row items-center gap-4 mb-6">
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-[#4881F8] transition-colors" size={20} />
            <input
              type="text"
              placeholder="Search by keywords (e.g. Copper, Stainless, Automotive)..."
              value={filters.keyword}
              onChange={(e) => handleFilterChange('keyword', e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-[#4881F8] focus:bg-white rounded-2xl text-lg font-bold outline-none transition-all shadow-inner"
            />
          </div>
          <div className="flex w-full lg:w-auto gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex-1 lg:w-40 flex items-center justify-center gap-3 px-6 py-5 border-2 rounded-2xl font-black transition-all ${
                showFilters ? 'bg-blue-50 border-blue-100 text-[#4881F8]' : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
              }`}
            >
              <Filter size={20} /> {showFilters ? 'Hide Filters' : 'Advanced'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300 border-t border-gray-50 pt-6 mt-6">
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                 Part Type <div title="Specify the functional category"><Info size={12} className="text-gray-300" /></div>
              </label>
              <select
                value={filters.partType}
                onChange={(e) => handleFilterChange('partType', e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-[#01364a] focus:border-[#4881F8] outline-none transition-all"
              >
                <option value="">All Part Types</option>
                {partTypeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <OtherTextInput
                show={isOtherValue(filters.partType)}
                value={filters.partTypeOther}
                onChange={(value) => handleFilterChange('partTypeOther', value)}
                placeholder="Enter part type"
                required={false}
                className="w-full mt-3 px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-[#01364a] focus:border-[#4881F8] outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                 Material
              </label>
              <input
                type="text"
                placeholder="e.g. Aluminum 6061"
                value={filters.material}
                onChange={(e) => handleFilterChange('material', e.target.value)}
                className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-[#01364a] focus:border-[#4881F8] outline-none transition-all"
              />
            </div>

            <div className="lg:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                 Manufacturing Skills
              </label>
              <div className="flex flex-wrap gap-2">
                {technologyOptions.map(tech => (
                  <button
                    key={tech}
                    onClick={() => handleTechnologyToggle(tech)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border-2 ${
                      filters.technologies.includes(tech)
                        ? 'bg-[#4881F8] border-[#4881F8] text-white'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-200'
                    }`}
                  >
                    {tech.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              <OtherTextInput
                show={filters.technologies.includes('OTHER')}
                value={filters.technologyOther}
                onChange={(value) => handleFilterChange('technologyOther', value)}
                placeholder="Enter manufacturing technology"
                required={false}
                className="w-full mt-3 px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-xl font-bold text-[#01364a] focus:border-[#4881F8] outline-none transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* RFQ List */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {loading ? (
          Array(5).fill(0).map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-8 animate-pulse">
              <div className="h-6 bg-gray-100 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-50 rounded w-1/4"></div>
            </div>
          ))
        ) : rfqs.length > 0 ? (
          rfqs.map((rfq) => (
            <div 
              key={rfq._id}
              className="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 hover:shadow-2xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300"
            >
              {rfq.workpieces?.[0] && getWorkpieceFileUrl(rfq.workpieces[0]) && (
                <div className="w-full lg:w-52 h-44 rounded-2xl overflow-hidden border border-gray-100 flex-shrink-0 bg-gray-900">
                  <CADFileViewer
                    workpiece={rfq.workpieces[0]}
                    height="176px"
                    backgroundColor="#111827"
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-blue-50 text-[#4881F8] text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-100">
                    {rfq.workpieces?.[0]?.technology || 'CNC'}
                  </span>
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
                    Submit Request
                  </Link>
                ) : (
                  <button
                    onClick={() => navigate('/pricing')}
                    className="flex-1 md:flex-none px-8 py-4 bg-gray-100 text-gray-400 rounded-2xl font-black text-sm flex items-center justify-center gap-2 opacity-80"
                  >
                    Upgrade to Request <Zap size={14} className="fill-current" />
                  </button>
                )}
              </div>
              
              {/* Feature Tip for non-paid */}
              {!canRequest && (
                <div className="absolute top-4 right-8 flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest">
                  <AlertCircle size={12} /> Standard+ Required
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <h2 className="text-2xl font-black text-gray-400">No matching RFQs found</h2>
            <p className="text-gray-400 font-bold">Try adjusting your filters or use our AI Search</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RFQPoolPage;
