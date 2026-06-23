import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Search, Filter, Factory, MapPin, Star, Mail, Eye, Shield, CheckCircle, Zap, ChevronRight, Info, Award, Lock, Globe } from 'lucide-react';
import AIIcon from '../components/icons/AIIcon';
import { hasFeature, FEATURE_KEYS, PLAN_TYPES, getEffectivePlanType } from '../config/planFeatures';
import { invitationAPI } from '../api/invitationAPI';
import { rfqAPI } from '../api/rfqAPI';
import { searchAPI } from '../api/searchAPI';
import Button from '../components/ui/Button';

const ManufacturersPoolPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: '',
    partType: '',
    technologies: [],
    country: '',
    region: '',
    certifications: [],
    companySize: '',
    material: '',
    machinery: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState(null);
  const [availableRFQs, setAvailableRFQs] = useState([]);

  const technologyOptions = ['CNC', 'TURNING', 'MILLING', '3D_PRINTING', 'SHEET_METAL', 'DIE_CASTING', 'INJECTION_MOLDING', 'STAMPING', 'WELDING', 'ASSEMBLY', 'OTHER'];
  const partTypeOptions = ['Gear', 'Pipe', 'Bracket', 'Housing', 'Shaft', 'Bearing', 'Valve', 'Connector', 'Mount', 'Cover', 'Other'];
  const companySizeOptions = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

  useEffect(() => {
    fetchManufacturers();
    if (showInviteModal) {
      fetchAvailableRFQs();
    }
  }, [filters, showInviteModal]);

  const fetchManufacturers = async () => {
    setLoading(true);
    try {
      const response = await searchAPI.searchManufacturers({
        ...filters,
        page: 1,
        limit: 100
      });
      
      const rawManufacturers = response.data || [];
      
      // Implementation: Enterprise Sorting & Free Anonymization
      const processed = rawManufacturers.map(mfr => {
        const plan = getEffectivePlanType(mfr);
        const isFree = plan === PLAN_TYPES.FREE;
        return {
          ...mfr,
          planType: plan,
          isFree,
          displayName: isFree ? 'Enigma Pharma CDMO' : (mfr.companyName || 'Unknown'),
          displayLogo: isFree ? null : mfr.companyLogo,
          displayCountry: mfr.country || 'International',
          isPremium: plan !== PLAN_TYPES.FREE
        };
      }).sort((a, b) => {
        // Enterprise accounts always first
        if (a.planType === PLAN_TYPES.ENTERPRISE && b.planType !== PLAN_TYPES.ENTERPRISE) return -1;
        if (b.planType === PLAN_TYPES.ENTERPRISE && a.planType !== PLAN_TYPES.ENTERPRISE) return 1;
        // Then Pro
        if (a.planType === PLAN_TYPES.PRO && b.planType !== PLAN_TYPES.PRO) return -1;
        if (b.planType === PLAN_TYPES.PRO && a.planType !== PLAN_TYPES.PRO) return 1;
        return 0;
      });

      setManufacturers(processed);
    } catch (error) {
      showError('Failed to load manufacturers');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRFQs = async () => {
    try {
      const response = await rfqAPI.getMyRFQs({ status: 'OPEN_FOR_REQUESTS' });
      setAvailableRFQs(response.data || []);
    } catch (error) {
      console.error('Failed to load RFQs:', error);
    }
  };

  const handleInvite = async (rfqId) => {
    if (!selectedManufacturer) return;
    try {
      await invitationAPI.create({
        rfqId,
        manufacturerId: selectedManufacturer._id,
        message: `We would like to invite you to quote on this RFQ.`
      });
      showSuccess('Invitation sent successfully!');
      setShowInviteModal(false);
      setSelectedManufacturer(null);
    } catch (error) {
      showError('Failed to send invitation');
    }
  };

  const handleTechnologyToggle = (tech) => {
    const current = filters.technologies || [];
    const updated = current.includes(tech) ? current.filter(t => t !== tech) : [...current, tech];
    setFilters(prev => ({ ...prev, technologies: updated }));
  };

  return (
    <div className="w-full py-4 sm:py-6">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <div className="flex items-center gap-3 mb-4">
             <div className="px-5 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                Supply Chain Verified
             </div>
             <CheckCircle size={18} className="text-emerald-500" />
          </div>
          <h1 className="text-6xl font-black text-[#01364a] tracking-tighter mb-4">CDMO Discovery</h1>
          <p className="text-gray-400 font-bold text-xl max-w-2xl">Connect with GMP-certified CDMO partners for API, formulation, and biologics manufacturing.</p>
        </div>
        
        <div className="bg-[#01364a] text-white p-8 rounded-[3rem] shadow-2xl flex items-center gap-6 group hover:bg-black transition-all cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-ai-search'))}>
           <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 group-hover:rotate-12 transition-transform">
             <AIIcon size={28} />
           </div>
           <div>
             <p className="font-black text-lg tracking-tight">AI Source Engine</p>
             <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Neural Matching Active</p>
           </div>
           <ChevronRight size={24} className="opacity-30 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Advanced Search & Filtering */}
      <div className="bg-white border border-gray-50 rounded-[3rem] p-8 mb-12 shadow-2xl shadow-blue-900/5">
        <div className="flex flex-col lg:flex-row items-center gap-6 mb-8">
           <div className="flex-1 w-full relative group">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4881F8] transition-colors" size={24} />
              <input
                type="text"
                placeholder="Search by service category, GMP cert, or company name..."
                value={filters.keyword}
                onChange={(e) => setFilters({...filters, keyword: e.target.value})}
                className="w-full pl-20 pr-10 py-7 bg-gray-50 border-2 border-transparent focus:border-[#4881F8] focus:bg-white rounded-[2rem] text-xl font-bold outline-none transition-all shadow-inner"
              />
           </div>
           <div className="flex w-full lg:w-auto gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-10 py-7 rounded-[2rem] font-black text-sm flex items-center justify-center gap-4 transition-all shadow-xl hover:-translate-y-1 ${
                  showFilters ? 'bg-blue-50 text-[#4881F8]' : 'bg-white text-gray-500 border border-gray-100'
                }`}
              >
                <Filter size={20} /> Advanced Audit
              </button>
           </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-8 border-t border-gray-50 animate-in fade-in slide-in-from-top-2">
             <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Regional Anchor</label>
                <input
                  type="text"
                  placeholder="e.g. Germany / APAC"
                  value={filters.country}
                  onChange={(e) => setFilters({...filters, country: e.target.value})}
                  className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-bold outline-none"
                />
             </div>
             <div className="lg:col-span-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Manufacturing Protocols</label>
                <div className="flex flex-wrap gap-2">
                  {technologyOptions.slice(0, 8).map(tech => (
                    <button
                      key={tech}
                      onClick={() => handleTechnologyToggle(tech)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${
                        filters.technologies.includes(tech) ? 'bg-[#4881F8] text-white shadow-xl shadow-blue-500/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
             </div>
             <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block">Facility Size</label>
                <select 
                   value={filters.companySize}
                   onChange={(e) => setFilters({...filters, companySize: e.target.value})}
                   className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-bold outline-none"
                >
                   <option value="">Any Size</option>
                   {companySizeOptions.map(o => <option key={o} value={o}>{o} Employees</option>)}
                </select>
             </div>
          </div>
        )}
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => <div key={i} className="h-96 bg-gray-50 rounded-[3rem] animate-pulse"></div>)
        ) : (
          manufacturers.map((mfr) => {
            const hasVerifiedPlan = hasFeature(mfr, FEATURE_KEYS.VERIFIED_BADGE) || mfr.manufacturerSettings?.isVerified;
            const hasCapacityPlan = hasFeature(mfr, FEATURE_KEYS.CAPACITY_DISPLAY);
            const isEnterprise = mfr.planType === PLAN_TYPES.ENTERPRISE;

            return (
              <div 
                key={mfr._id}
                className={`relative flex flex-col bg-white border rounded-[3rem] p-8 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-2 group ${
                  isEnterprise ? 'border-4 border-[#4881F8]/20 ring-8 ring-blue-50/50' : 'border-gray-50'
                }`}
              >
                {/* Ranking Badge */}
                {isEnterprise && (
                  <div className="absolute top-0 right-0 px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-bl-3xl shadow-xl flex items-center gap-2">
                    <Award size={14} /> Enterprise Partner
                  </div>
                )}
                
                {/* Profile Header */}
                <div className="flex items-start justify-between mb-8">
                   <div className="w-20 h-20 rounded-[1.8rem] bg-blue-50 p-3 border border-blue-100 flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                      {mfr.displayLogo ? (
                        <img src={mfr.displayLogo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        mfr.isFree ? <Lock className="text-[#01364a] opacity-10" size={32} /> : <Factory className="text-[#4881F8]" size={32} />
                      )}
                      
                      {mfr.isFree && (
                        <div className="absolute inset-0 bg-blue-900/5 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Lock size={16} className="text-[#01364a]" />
                        </div>
                      )}
                   </div>
                   
                   <div className="flex gap-2">
                      {hasVerifiedPlan && (
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                          <Shield size={20} className="fill-current" />
                        </div>
                      )}
                      {hasCapacityPlan && (
                        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 animate-pulse">
                          <Zap size={20} className="fill-current" />
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex-1">
                   <h3 className="text-3xl font-black text-[#01364a] tracking-tight mb-2 group-hover:text-[#4881F8] transition-colors">{mfr.displayName}</h3>
                   <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">
                      <div className="flex items-center gap-2"><MapPin size={14} className="text-[#4881F8]" /> {mfr.displayCountry}</div>
                      {mfr.isPremium && <div className="flex items-center gap-2"><Star size={14} className="text-yellow-400 fill-current" /> {mfr.manufacturerSettings?.rating || '4.9'}</div>}
                   </div>
                   
                   <div className="flex flex-wrap gap-2 mb-8">
                      {(mfr.manufacturerSettings?.technologies || []).slice(0, 2).map((t, idx) => (
                        <span key={idx} className="px-4 py-1.5 bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-gray-100">
                          {t.replace('_', ' ')}
                        </span>
                      ))}
                      {(mfr.manufacturerSettings?.technologies || []).length > 2 && (
                         <span className="px-4 py-1.5 bg-blue-50 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg">+{(mfr.manufacturerSettings?.technologies || []).length - 2} More</span>
                      )}
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                   <Link 
                    to={`/manufacturer/${mfr._id}`}
                    className="w-full py-5 bg-[#01364a] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-blue-900/10 hover:bg-black transition-all"
                   >
                     Inspect Profile <ChevronRight size={18} />
                   </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
};

export default ManufacturersPoolPage;
