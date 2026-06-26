import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ChevronRight, Zap, Package, Shield } from 'lucide-react';
import AIIcon from './icons/AIIcon';
import { searchAPI } from '../api/searchAPI';
import { Link } from 'react-router-dom';
import { SERVICE_CATEGORY_LABELS } from '../config/pharmaTaxonomy';

const Users = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const UserIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const AISearchModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const searchRef = useRef(null);

  useEffect(() => {
    fetchRecommendations();
    searchRef.current?.focus();
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

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

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-start justify-center sm:pt-16 lg:pt-20 px-2 sm:px-4 bg-[#01364a]/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="w-full max-w-4xl bg-white rounded-t-[2rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-in zoom-in duration-300 relative z-10">
        <div className="p-4 sm:p-6 lg:p-8 border-b border-gray-100">
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
                placeholder="Find CDMO partners by tech and chemical, molecule, or GMP..."
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
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar bg-gray-50/30">
          {!results && !loading && (
            <div className="space-y-10">
              <div>
                <div className="flex items-center gap-3 mb-6 px-1">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <Zap size={22} className="fill-current" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#01364a] tracking-tight">Pharma matches for you</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Based on your CDMO profile & service categories</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.slice(0, 4).map((rfq) => (
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
                          {SERVICE_CATEGORY_LABELS[rfq.pharmaProject?.serviceCategory] || rfq.pharmaProject?.serviceCategory?.replace(/_/g, ' ') || 'Pharma RFQ'}
                        </span>
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider rounded-lg border border-blue-100">
                          {rfq.pharmaProject?.moleculeName || rfq.pharmaProject?.developmentPhase?.replace(/_/g, ' ') || rfq.country || 'Pharma'}
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
                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Users size={18} className="text-[#4881F8]" />
                    <h3 className="font-black text-[#01364a] uppercase tracking-widest text-xs">CDMO Partners</h3>
                  </div>
                  <div className="space-y-3">
                    {results.manufacturers?.map((mfr) => (
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
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 px-2">
                    <Package size={18} className="text-[#4881F8]" />
                    <h3 className="font-black text-[#01364a] uppercase tracking-widest text-xs">Pharma Projects</h3>
                  </div>
                  <div className="space-y-3">
                    {results.rfqs?.map((rfq) => (
                      <Link
                        key={rfq._id}
                        to={`/rfqs-pool/${rfq._id}`}
                        onClick={onClose}
                        className="flex items-center justify-between p-5 rounded-2xl bg-white border border-gray-100 hover:border-[#4881F8] shadow-sm hover:shadow-lg transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                            <Package size={24} />
                          </div>
                          <div>
                            <p className="font-black text-gray-900 group-hover:text-[#4881F8] transition-colors">{rfq.title}</p>
                            <p className="text-xs text-gray-400 font-bold">{rfq.pharmaProject?.moleculeName || rfq.country}</p>
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

        <div className="p-4 sm:p-6 bg-white border-t border-gray-100 flex justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider">Pharma AI Engine</p>
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
