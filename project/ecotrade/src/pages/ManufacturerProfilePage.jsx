import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../contexts/ToastContext';
import { ArrowLeft, ArrowRight, MapPin, Star, Shield, Factory, CheckCircle, Mail, Settings, Zap, Play, ExternalLink, Globe, Award, Lock, FileText, Presentation, ImageIcon } from 'lucide-react';
import { profileAPI } from '../api/profileAPI';
import { hasFeature, FEATURE_KEYS, PLAN_TYPES, getEffectivePlanType } from '../config/planFeatures';
import { normalizeFileUrl } from '../utils/fileUtils';
import { SERVICE_CATEGORY_LABELS, GMP_LABELS, BATCH_SCALE_LABELS } from '../config/pharmaTaxonomy';
import AuthenticatedImage from '../components/AuthenticatedImage';

const ManufacturerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useToast();
  const [manufacturer, setManufacturer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileAPI.getPublicManufacturerProfile(id);
        const profile = response?.data || {};
        
        // Check if anonymization is needed (Free plan)
        const planType = getEffectivePlanType(profile);
        const isFree = planType === PLAN_TYPES.FREE;

        setManufacturer({
          ...profile,
          planType,
          isFree,
          // Anonymization logic
          displayName: isFree ? 'Enigma Pharma Partner' : (profile.companyName || 'CDMO Partner'),
          displayLogo: isFree ? null : profile.companyLogo,
          displayBanner: isFree ? null : profile.companyBanner,
          displayDescription: isFree ? 'This manufacturer is part of the Enigma network. To view full credentials and identity, please contact them through an RFQ.' : (profile.description || 'No description provided.'),
          
          rating: profile?.manufacturerSettings?.rating || 0,
          reviewCount: profile?.manufacturerSettings?.reviewCount || 0,
          completedRFQs: profile?.manufacturerSettings?.completedProjects || 0,
          facilityPhotos: isFree ? [] : (profile.facilityPhotos || []),
          companyPresentationUrl: isFree ? '' : (profile.companyPresentationUrl || ''),
          companyBrochurePdfUrl: isFree ? '' : (profile.companyBrochurePdfUrl || ''),
          companyProfilePdfUrl: isFree ? '' : (profile.companyProfilePdfUrl || ''),
          serviceCategories: isFree ? [] : (profile?.serviceCategories || profile?.manufacturerSettings?.technologies || profile?.manufacturingTypes || []),
          therapeuticAreas: isFree ? [] : (profile?.therapeuticAreas || []),
          batchScaleCapacity: isFree ? '' : (profile?.batchScaleCapacity || ''),
          gmpCertifications: isFree ? [] : (profile?.gmpCertifications || profile?.certifications || []),
          certifications: isFree ? [] : (profile?.gmpCertifications || profile?.certifications || []),
          website: profile?.website || ''
        });
      } catch (error) {
        showError('Failed to load manufacturer profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id, showError]);

  if (loading) return (
    <div className="w-full p-8 sm:p-12 space-y-8 animate-pulse">
      <div className="h-64 bg-gray-100 rounded-[3rem]"></div>
      <div className="h-20 bg-gray-50 rounded-2xl w-1/2"></div>
    </div>
  );

  if (!manufacturer) return (
    <div className="w-full text-center py-16 sm:py-20 bg-gray-50 rounded-2xl sm:rounded-[3rem] mt-6 sm:mt-10">
      <h2 className="text-3xl font-black text-[#01364a] mb-4">Manufacturer Not Found</h2>
      <button onClick={() => navigate(-1)} className="px-8 py-3 bg-[#4881F8] text-white rounded-2xl font-bold">Return to Pool</button>
    </div>
  );

  const isVerified = !manufacturer.isFree && (hasFeature(manufacturer, FEATURE_KEYS.VERIFIED_BADGE) || manufacturer.manufacturerSettings?.isVerified);
  const showCapacity = !manufacturer.isFree && hasFeature(manufacturer, FEATURE_KEYS.CAPACITY_DISPLAY);
  const showDocuments = !manufacturer.isFree && hasFeature(manufacturer, FEATURE_KEYS.DOCUMENTS_DISPLAY);

  return (
    <div className="w-full pb-8 sm:pb-12 pt-4 sm:pt-6">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-[#01364a] mb-10 transition-all font-black uppercase tracking-widest text-xs"
      >
        <ArrowLeft size={16} />
        Back to Research
      </button>

      {/* Hero Section */}
      <div className="relative mb-12 group">
        <div className={`h-40 sm:h-56 lg:h-64 rounded-2xl sm:rounded-[3.5rem] overflow-hidden shadow-2xl transition-all duration-700 ${!manufacturer.displayBanner ? 'bg-gradient-to-br from-[#01364a] via-[#044c66] to-[#4881F8]' : ''}`}>
          {manufacturer.displayBanner ? (
            <img src={manufacturer.displayBanner} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
          ) : (
             <div className="w-full h-full flex items-center justify-center opacity-10">
                <Globe size={300} className="text-white" />
             </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-8 px-2 sm:px-0 sm:absolute sm:-bottom-16 sm:left-6 lg:left-12 -mt-12 sm:mt-0">
           <div className="w-24 h-24 sm:w-36 sm:h-36 lg:w-44 lg:h-44 mx-auto sm:mx-0 flex-shrink-0 bg-white p-3 sm:p-4 rounded-2xl sm:rounded-[2.5rem] shadow-2xl border border-gray-100 relative group/logo overflow-hidden">
             <div className="w-full h-full bg-blue-50 rounded-[2rem] flex items-center justify-center overflow-hidden">
                {manufacturer.displayLogo ? (
                  <img src={manufacturer.displayLogo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-[#01364a] transition-all">
                    {manufacturer.isFree ? <Lock size={48} className="opacity-20" /> : <Factory size={48} />}
                  </div>
                )}
             </div>
             {manufacturer.isFree && (
               <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                 <Lock size={20} className="text-blue-600" />
               </div>
             )}
           </div>

           <div className="pb-0 sm:pb-4 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-3">
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-[#01364a] tracking-tighter leading-tight sm:leading-none">{manufacturer.displayName}</h1>
                {isVerified && (
                  <div className="bg-[#4881F8] text-white p-2 rounded-2xl shadow-xl shadow-blue-500/30 border-4 border-white" title="Verified Professional">
                    <Shield size={24} className="fill-current" />
                  </div>
                )}
                {manufacturer.isFree && (
                   <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">
                     Free Tier Account
                   </span>
                )}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-sm font-bold text-gray-500">
                <div className="flex items-center gap-2"><MapPin size={18} className="text-[#4881F8]" /> {manufacturer.country}</div>
                {!manufacturer.isFree && manufacturer.website && (
                  <a
                    href={manufacturer.website.startsWith('http') ? manufacturer.website : `https://${manufacturer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[#4881F8] hover:underline"
                  >
                    <Globe size={16} /> Website
                  </a>
                )}
                {showCapacity && (
                  <div className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border animate-pulse ${
                    manufacturer.manufacturerSettings?.capacityStatus === 'FULL' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  }`}>
                    <Zap size={14} className="fill-current" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {manufacturer.manufacturerSettings?.capacityStatus || 'OPEN'} Capacity
                    </span>
                  </div>
                )}
              </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-10 mt-8 sm:mt-20 lg:mt-24">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-white border border-gray-100 rounded-2xl sm:rounded-[3rem] p-5 sm:p-8 lg:p-10 shadow-2xl shadow-blue-900/5">
            <h2 className="text-2xl font-black text-[#01364a] mb-6 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ArrowRight size={20} /></div>
              Industrial Profile
            </h2>
            <p className="text-lg text-gray-600 font-bold leading-relaxed mb-10">{manufacturer.displayDescription}</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-[1.8rem] p-6 text-center">
                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Company Size</p>
                 <p className="text-2xl font-black text-[#01364a]">{manufacturer.companySize || '0-50'}</p>
              </div>
              <div className="bg-gray-50 rounded-[1.8rem] p-6 text-center text-[#4881F8]">
                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Success Rate</p>
                 <p className="text-2xl font-black">{manufacturer.rating > 0 ? `${(manufacturer.rating * 20).toFixed(0)}%` : '98%'}</p>
              </div>
              <div className="bg-gray-50 rounded-[1.8rem] p-6 text-center text-emerald-600">
                 <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Completed</p>
                 <p className="text-2xl font-black">{manufacturer.completedRFQs}+ RFQs</p>
              </div>
            </div>
          </section>

          {!manufacturer.isFree && manufacturer.facilityPhotos?.length > 0 && (
            <section className="bg-white border border-gray-100 rounded-2xl sm:rounded-[3rem] p-5 sm:p-8 lg:p-10 shadow-2xl shadow-blue-900/5">
              <h2 className="text-2xl font-black text-[#01364a] mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><ImageIcon size={20} /></div>
                Company Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {manufacturer.facilityPhotos.map((url, i) => (
                  <div key={url + i} className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100">
                    <AuthenticatedImage src={url} alt={`Facility ${i + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {!manufacturer.isFree && showDocuments && (manufacturer.companyPresentationUrl || manufacturer.companyBrochurePdfUrl || manufacturer.companyProfilePdfUrl) && (
            <section className="bg-white border border-gray-100 rounded-2xl sm:rounded-[3rem] p-5 sm:p-8 lg:p-10 shadow-2xl shadow-blue-900/5">
              <h2 className="text-2xl font-black text-[#01364a] mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><FileText size={20} /></div>
                Company Documents
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {manufacturer.companyPresentationUrl && (
                  <a href={normalizeFileUrl(manufacturer.companyPresentationUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#4881F8] transition-all group">
                    <Presentation size={28} className="text-orange-500 flex-shrink-0" />
                    <div>
                      <p className="font-black text-[#01364a] text-sm">Presentation</p>
                      <p className="text-xs text-[#4881F8] font-bold group-hover:underline">Download PPT</p>
                    </div>
                  </a>
                )}
                {manufacturer.companyBrochurePdfUrl && (
                  <a href={normalizeFileUrl(manufacturer.companyBrochurePdfUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#4881F8] transition-all group">
                    <FileText size={28} className="text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-black text-[#01364a] text-sm">Brochure</p>
                      <p className="text-xs text-[#4881F8] font-bold group-hover:underline">Download PDF</p>
                    </div>
                  </a>
                )}
                {manufacturer.companyProfilePdfUrl && (
                  <a href={normalizeFileUrl(manufacturer.companyProfilePdfUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#4881F8] transition-all group">
                    <FileText size={28} className="text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-black text-[#01364a] text-sm">Company Profile</p>
                      <p className="text-xs text-[#4881F8] font-bold group-hover:underline">Download PDF</p>
                    </div>
                  </a>
                )}
              </div>
            </section>
          )}

          {!manufacturer.isFree && (
          <section className="bg-white border border-gray-100 rounded-2xl sm:rounded-[3rem] p-5 sm:p-8 lg:p-10 shadow-2xl shadow-blue-900/5">
             <h2 className="text-2xl font-black text-[#01364a] mb-8">CDMO Capabilities</h2>
             
             <div className="mb-8">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Service Categories</h3>
               <div className="flex flex-wrap gap-3">
                 {(manufacturer.serviceCategories || []).map((tech, i) => (
                   <span key={i} className="px-6 py-3 bg-blue-50 text-[#01364a] font-black rounded-2xl text-sm border border-blue-100 hover:scale-105 transition-transform">
                     {SERVICE_CATEGORY_LABELS[tech] || String(tech).replace(/_/g, ' ')}
                   </span>
                 ))}
               </div>
             </div>

             {manufacturer.therapeuticAreas?.length > 0 && (
             <div className="mb-8">
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Therapeutic Areas</h3>
               <div className="flex flex-wrap gap-2">
                 {manufacturer.therapeuticAreas.map((area, i) => (
                   <span key={i} className="px-4 py-2 bg-gray-50 text-gray-600 font-bold rounded-xl text-sm border border-gray-100">
                     {area}
                   </span>
                 ))}
               </div>
             </div>
             )}

             {manufacturer.batchScaleCapacity && (
             <div>
               <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                 <Settings size={16} /> Batch Scale Capacity
               </h3>
               <p className="p-4 bg-gray-50 rounded-2xl font-bold text-[#01364a]">
                 {BATCH_SCALE_LABELS[manufacturer.batchScaleCapacity] || manufacturer.batchScaleCapacity}
               </p>
             </div>
             )}
          </section>
          )}

          {showDocuments && manufacturer.facilityPhotos?.length > 0 && (
             <section className="bg-white border border-gray-100 rounded-2xl sm:rounded-[3rem] p-5 sm:p-8 shadow-2xl shadow-blue-900/5">
                <h2 className="text-2xl font-black text-[#01364a] mb-6 flex items-center gap-3">
                  <ImageIcon size={22} className="text-[#4881F8]" />
                  Facility Gallery
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {manufacturer.facilityPhotos.map((photo, i) => (
                    <AuthenticatedImage key={i} src={photo} alt={`Facility ${i + 1}`} className="w-full aspect-square object-cover rounded-2xl border border-gray-100" />
                  ))}
                </div>
             </section>
          )}

          {manufacturer.isFree && (
            <section className="bg-blue-50 border border-blue-100 rounded-2xl p-8 text-center">
              <Lock size={32} className="mx-auto text-blue-400 mb-4" />
              <p className="font-bold text-[#01364a]">This manufacturer is on the Enigma Free plan.</p>
              <p className="text-sm text-gray-600 mt-2">Full profile, gallery, PPT, PDF and capacity are visible on paid plans.</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
           {!manufacturer.isFree && (
           <section className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-2xl shadow-blue-900/5">
              <h2 className="text-xl font-black text-[#01364a] mb-6 flex items-center gap-2">
                <Award size={20} className="text-[#4881F8]" />
                Compliance
              </h2>
              <div className="space-y-4">
                {(manufacturer.gmpCertifications || []).map((c, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <Shield size={20} className="text-emerald-500 fill-emerald-500/10" />
                    <span className="font-black text-emerald-800 text-sm tracking-tight">{GMP_LABELS[c] || c.replace(/_/g, ' ')}</span>
                  </div>
                ))}
                {(manufacturer.gmpCertifications || []).length === 0 && (
                  <p className="text-center py-6 text-gray-400 font-bold italic">No public certs listed</p>
                )}
              </div>
           </section>
           )}

           <div className="bg-[#4881F8] rounded-[3rem] p-10 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
              <div className="relative z-10">
                 <h2 className="text-2xl font-black mb-4">Request Match</h2>
                 <p className="text-blue-50 font-bold text-sm leading-relaxed mb-8 opacity-90">
                    Start a conversation with this manufacturer to discuss project timelines and technical feasibility.
                 </p>
                 <button className="w-full py-5 bg-white text-[#4881F8] rounded-2xl font-black text-sm flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-xl">
                   <MessageSquare size={18} /> Send Message
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const MessageSquare = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
  </svg>
);

export default ManufacturerProfilePage;
