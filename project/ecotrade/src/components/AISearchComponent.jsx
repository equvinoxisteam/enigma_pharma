import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, ArrowRight, User, FileText, Upload, Globe, Package, Zap, ChevronRight, Shield } from 'lucide-react';
import AIIcon from './icons/AIIcon';
import { searchAPI } from '../api/searchAPI';
import { uploadAPI } from '../api/uploadAPI';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { hasFullAISearch, canUseAI } from '../config/planFeatures';

const AISearchModal = ({ onClose }) => {
  const { user } = useAuth();
  const fullAI = hasFullAISearch(user);
  const aiAllowed = canUseAI(user);
  const [activeTab, setActiveTab] = useState('text');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const searchRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchRecommendations();
    searchRef.current?.focus();
    
    // Close on escape
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const fetchRecommendations = async () => {
    try {
      const resp = await searchAPI.getRecommendations();
      setRecommendations(resp.data || []);
    } catch (err) {
      console.error('Failed to fetch recommendations', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResults(null);
    try {
      const resp = await searchAPI.aiSearch(query);
      setResults(resp.data);
    } catch (err) {
      console.error('AI Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!fullAI) {
      setResults({
        suggestions: 'Document-based matching requires Standard plan or higher. Upgrade for full AI CDMO matching.',
        rfqs: [],
        manufacturers: [],
        isLimitedAI: true
      });
      return;
    }

    setIsUploading(true);
    setResults(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadAPI.uploadFile(formData);

      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ');
      const searchQuery = `pharma CDMO ${baseName} API formulation GMP`;
      const resp = await searchAPI.aiSearch(searchQuery);
      setResults({
        ...resp.data,
        suggestions: `Analyzed ${file.name} — matched CDMO partners by service category and GMP certifications.`,
        modelFile: file.name
      });
    } catch (err) {
      console.error('Model match failed', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-start justify-center sm:pt-16 lg:pt-20 px-2 sm:px-4 bg-[#01364a]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="w-full max-w-4xl bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in zoom-in duration-300 relative z-10">
        
        {/* Tabs */}
        <div className="flex bg-gray-50 border-b border-gray-100 p-1.5 sm:p-2 gap-1">
          <button 
            onClick={() => setActiveTab('text')}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'text' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <AIIcon size={16} /> <span className="truncate">AI Search</span>
          </button>
          <button 
            onClick={() => fullAI ? setActiveTab('model') : null}
            className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-black transition-all ${
              activeTab === 'model' ? 'bg-white text-blue-600 shadow-sm' : fullAI ? 'text-gray-400 hover:text-gray-600' : 'text-gray-300 cursor-not-allowed'
            }`}
            title={fullAI ? 'Upload NDA or product spec PDF for CDMO matching' : 'Upgrade to Standard+ for document-based matching'}
          >
            <FileText size={16} /> <span className="truncate">PDF Match{!fullAI && ' 🔒'}</span>
          </button>
        </div>

        {/* Search Header */}
        <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-100">
          {activeTab === 'text' ? (
            <form onSubmit={handleSearch} className="flex flex-col sm:block sm:relative gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-4 sm:left-6 flex items-center pointer-events-none">
                  {loading ? <Loader2 className="animate-spin text-[#4881F8]" size={22} /> : <Search className="text-[#4881F8]" size={22} />}
                </div>
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find manufacturers by tech, material..."
                  className="w-full pl-12 sm:pl-16 pr-4 sm:pr-36 py-4 sm:py-6 bg-gray-50 border-2 border-transparent focus:border-[#4881F8] focus:bg-white rounded-2xl sm:rounded-[1.8rem] text-base sm:text-xl lg:text-2xl outline-none transition-all font-bold tracking-tight shadow-inner"
                />
                <div className="hidden sm:block absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                   <button 
                    type="submit"
                    className="bg-[#01364a] hover:bg-black text-white px-4 sm:px-8 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all shadow-xl active:scale-95"
                   >
                     Search AI
                   </button>
                </div>
              </div>
              <button 
                type="submit"
                className="sm:hidden w-full bg-[#01364a] hover:bg-black text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95"
              >
                Search AI
              </button>
            </form>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer border-2 border-dashed border-gray-200 hover:border-[#4881F8] bg-gray-50 hover:bg-blue-50/50 rounded-2xl sm:rounded-[2.5rem] p-6 sm:p-12 text-center transition-all relative overflow-hidden"
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept=".stl,.obj,.step"
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in">
                  <Loader2 className="animate-spin text-[#4881F8]" size={64} />
                  <div>
                    <p className="text-xl font-black text-[#01364a]">Analyzing Geometry...</p>
                    <p className="text-sm text-gray-500 font-bold">Matching service category and GMP requirements</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <Upload size={32} />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-[#01364a]">Upload project document</p>
                    <p className="text-sm text-gray-400 font-bold">Drag and drop NDA or product spec PDFs to find matching CDMO partners</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-gray-50/30">
          {!results && !loading && !isUploading && (
            <div className="space-y-10">
              {/* Recommendations Section */}
              <div>
                <div className="flex items-center gap-3 mb-6 px-1">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Zap size={22} className="fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#01364a] tracking-tight">Smart Matches for You</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Based on your factory profile</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 4).map(rfq => (
                    <Link 
                      key={rfq._id} 
                      to={`/rfqs-pool/${rfq._id}`}
                      onClick={onClose}
                      className="p-6 rounded-[1.8rem] bg-white border border-gray-100 hover:border-[#4881F8] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
                    >
                      <div className="flex justify-between items-start mb-4">
                         <h4 className="font-black text-lg text-gray-900 group-hover:text-[#4881F8] transition-colors line-clamp-1">{rfq.title}</h4>
                         <ChevronRight size={18} className="text-gray-300 group-hover:text-[#4881F8] transition-all" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-gray-50 text-gray-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-gray-100">
                          {rfq.pharmaProject?.serviceCategory?.replace(/_/g, ' ') || 'Pharma RFQ'}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-100">
                          {rfq.workpieces?.[0]?.material || 'Steel'}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {results && (
             <div className="space-y-10 animate-in slide-in-from-bottom-5 duration-500">
               {results.suggestions && (
                 <div className="p-8 bg-gradient-to-br from-[#01364a] to-blue-900 rounded-[2rem] text-white overflow-hidden relative">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                          <AIIcon className="text-blue-200" size={20} />
                        </div>
                        <h4 className="font-black text-lg">AI Analysis</h4>
                      </div>
                      <p className="text-lg font-bold leading-snug text-blue-50 opacity-90">{results.suggestions}</p>
                    </div>
                 </div>
               )}

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Manufacturers Found */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 px-2">
                      <Users size={18} className="text-[#4881F8]" />
                      <h3 className="font-black text-[#01364a] uppercase tracking-widest text-xs">Top Rated Suppliers</h3>
                    </div>
                    <div className="space-y-3">
                      {results.manufacturers?.map(mfr => (
                        <Link 
                         key={mfr._id} 
                         to={`/manufacturer/${mfr._id}`}
                         onClick={onClose}
                         className="flex items-center justify-between p-5 rounded-2xl bg-white border border-gray-100 hover:border-[#4881F8] shadow-sm hover:shadow-lg transition-all"
                        >
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                               <UserIcon className="text-gray-400" size={24} />
                             </div>
                             <div>
                               <div className="flex items-center gap-2">
                                 <p className="font-black text-gray-900">{mfr.companyName}</p>
                                 {mfr.isVerified && <Shield size={14} className="text-blue-600 fill-blue-600" />}
                               </div>
                               <p className="text-xs text-gray-400 font-bold">{mfr.country}</p>
                             </div>
                           </div>
                           {mfr.matchScore && (
                             <div className="text-right">
                               <p className="text-[#4881F8] font-black text-lg">{mfr.matchScore}%</p>
                               <p className="text-[10px] text-gray-300 font-black uppercase">Match</p>
                             </div>
                           )}
                        </Link>
                      ))}
                    </div>
                 </div>

                 {/* RFQs Found */}
                 <div className="space-y-4">
                   <div className="flex items-center gap-2 px-2">
                     <Package size={18} className="text-[#4881F8]" />
                     <h3 className="font-black text-[#01364a] uppercase tracking-widest text-xs">Relevant Projects</h3>
                   </div>
                   <div className="space-y-3">
                     {results.rfqs?.map(rfq => (
                       <Link 
                        key={rfq._id} 
                        to={`/rfqs-pool/${rfq._id}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-5 rounded-2xl bg-white border border-gray-100 hover:border-[#4881F8] shadow-sm hover:shadow-lg transition-all group"
                       >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                              <FileText size={24} />
                            </div>
                            <div>
                              <p className="font-black text-gray-900 group-hover:text-[#4881F8] transition-colors">{rfq.title}</p>
                              <p className="text-xs text-gray-400 font-bold">{rfq.country}</p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-gray-300 group-hover:text-[#4881F8] transition-all" />
                       </Link>
                     ))}
                   </div>
                 </div>
               </div>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex justify-between items-center gap-3">
           <div className="flex items-center gap-2">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
             <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Neural Engine Stable</p>
           </div>
           <button 
            onClick={onClose} 
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-black text-sm transition-all shadow-inner"
           >
             Dismiss
           </button>
        </div>
      </div>
    </div>
  );
};

const Box = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
    <polyline points="3.29 7 12 12 20.71 7"></polyline>
    <line x1="12" y1="22" x2="12" y2="12"></line>
  </svg>
);

const Users = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const UserIcon = ({ size, className }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const AISearchComponent = () => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-ai-search', handleOpen);
        return () => window.removeEventListener('open-ai-search', handleOpen);
    }, []);

    if (!isOpen) return null;

    return <AISearchModal onClose={() => setIsOpen(false)} />;
};

export default AISearchComponent;
