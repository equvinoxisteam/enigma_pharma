import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { rfqAPI } from '../api/rfqAPI';
import { uploadAPI } from '../api/uploadAPI';
import CADFileViewer from '../components/CADFileViewer';
import { getStlDimensionsFromFile } from '../utils/stlDimensions';
import { getFileExtension } from '../utils/fileUtils';
import { ArrowLeft, ArrowRight, Upload, X, File, FileText, Save, Box, Info, Send, Shield, Zap, Globe } from 'lucide-react';
import Button from '../components/ui/Button';
import OtherTextInput from '../components/ui/OtherTextInput';
import {
  isOtherValue,
  resolveOtherValue,
  resolveOtherInArray,
  otherRequiredError,
  otherArrayRequiredError,
} from '../utils/otherOption';

const StartRFQPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('workpieces');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const partTypeOptions = ['Gear', 'Pipe', 'Bracket', 'Housing', 'Shaft', 'Bearing', 'Valve', 'Connector', 'Mount', 'Cover', 'Other'];
  const countryOptions = ['India', 'USA', 'Germany', 'China', 'UK', 'Japan', 'France', 'Italy', 'Canada', 'Australia', 'Other'];
  const languageOptions = ['English', 'Hindi', 'German', 'Mandarin', 'French', 'Spanish', 'Japanese'];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isCorporateRFQ: false,
    workpieces: [{
      mainFile: null,
      mainFileName: '',
      mainFileUrl: '',
      extraFiles: [],
      partType: '',
      partTypeOther: '',
      dimensions: {
        length: 0,
        width: 0,
        height: 0,
        diameter: 0
      },
      technology: '',
      technologyOther: '',
      material: '',
      quantity: 1
    }],
    preferredCurrency: user?.buyerSettings?.preferredCurrency || 'USD',
    rfqDeadline: '',
    acceptanceDeadline: '',
    partTrackingId: '',
    requestJustification: '',
    targetDeliveryDate: '',
    shippingTerms: user?.buyerSettings?.defaultIncoterms || 'FOB',
    country: user?.country || '',
    countryOther: '',
    region: user?.buyerSettings?.defaultRegion || '',
    communicationLanguage: user?.buyerSettings?.communicationLanguage || 'English',
    requiredCertificates: [],
    otherCertificateText: '',
    notes: '',
    ndaFile: null,
    ndaFileUrl: ''
  });

  const technologyOptions = ['CNC', 'TURNING', 'MILLING', '3D_PRINTING', 'SHEET_METAL', 'DIE_CASTING', 'INJECTION_MOLDING', 'STAMPING', 'WELDING', 'ASSEMBLY', 'OTHER'];
  const certificationOptions = ['ISO_9001', 'ISO_13485', 'AS9100', 'IATF_16949', 'ROHS', 'OTHER'];
  const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'CNY'];
  const incotermsOptions = ['FOB', 'CIF', 'EXW', 'DDP', 'DAP', 'FCA'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleWorkpieceChange = (index, field, value) => {
    setFormData(prev => {
      const workpieces = [...prev.workpieces];
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        workpieces[index] = {
          ...workpieces[index],
          [parent]: {
            ...workpieces[index][parent],
            [child]: value
          }
        };
      } else {
        workpieces[index] = { ...workpieces[index], [field]: value };
      }
      return { ...prev, workpieces };
    });
  };

  const handleArrayChange = (field, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev[field], value]
        : prev[field].filter(item => item !== value)
    }));
  };

  const handleFileUpload = async (file, type, workpieceIndex = 0) => {
    if (!file) return;

    const maxSize = type === 'nda' ? 10 * 1024 * 1024 : type === 'main' ? 150 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      showError(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      const fileCategory = type === 'nda' ? 'document' : type === 'extra' ? 'extra' : uploadAPI.getFileTypeCategory(file);
      uploadFormData.append('type', fileCategory);

      const response = await uploadAPI.uploadFile(uploadFormData, (percent) => {
        setUploadProgress(percent);
      });
      const fileUrl = response.data?.url || response.url;

      if (type === 'main') {
        let parsedDimensions = null;
        if (getFileExtension(file.name) === 'stl') {
          parsedDimensions = await getStlDimensionsFromFile(file);
        }

        setFormData((prev) => {
          const workpieces = [...prev.workpieces];
          const current = workpieces[workpieceIndex];
          workpieces[workpieceIndex] = {
            ...current,
            mainFileUrl: fileUrl,
            mainFile: file,
            mainFileName: file.name,
            dimensions: parsedDimensions
              ? { ...current.dimensions, ...parsedDimensions }
              : current.dimensions
          };
          return { ...prev, workpieces };
        });
      } else if (type === 'nda') {
        setFormData(prev => ({ ...prev, ndaFileUrl: fileUrl, ndaFile: file }));
      } else {
        const workpieces = [...formData.workpieces];
        workpieces[workpieceIndex].extraFiles.push(fileUrl);
        setFormData(prev => ({ ...prev, workpieces }));
      }

      showSuccess('File uploaded successfully');
    } catch (error) {
      showError('Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveFile = (type, workpieceIndex = 0, fileIndex = null) => {
    if (type === 'main') {
      handleWorkpieceChange(workpieceIndex, 'mainFileUrl', '');
      handleWorkpieceChange(workpieceIndex, 'mainFile', null);
      handleWorkpieceChange(workpieceIndex, 'mainFileName', '');
    } else if (type === 'nda') {
      setFormData(prev => ({ ...prev, ndaFileUrl: '', ndaFile: null }));
    } else {
      const workpieces = [...formData.workpieces];
      workpieces[workpieceIndex].extraFiles.splice(fileIndex, 1);
      setFormData(prev => ({ ...prev, workpieces }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === 'workpieces') {
      const wp = formData.workpieces[0];
      if (!wp.mainFileUrl) {
        showError('Please upload a technical file (STL, STEP, PDF, or 2D drawing) before continuing.');
        return;
      }
      if (!wp.technology) {
        showError('Please select a manufacturing technology.');
        return;
      }
      if (!wp.material?.trim()) {
        showError('Please enter a material grade.');
        return;
      }
      const partTypeErr = otherRequiredError(wp.partType, wp.partTypeOther, 'part type');
      if (partTypeErr) {
        showError(partTypeErr);
        return;
      }
      const techErr = otherRequiredError(wp.technology, wp.technologyOther, 'manufacturing technology');
      if (techErr) {
        showError(techErr);
        return;
      }
      setActiveTab('requirements');
      return;
    }

    if (!formData.rfqDeadline) {
      showError('Please set an RFQ expiry date.');
      return;
    }
    const countryErr = otherRequiredError(formData.country, formData.countryOther, 'country');
    if (countryErr) {
      showError(countryErr);
      return;
    }
    const resolvedCountry = resolveOtherValue(formData.country, formData.countryOther);
    if (!resolvedCountry?.trim()) {
      showError('Please set a destination country in logistics.');
      return;
    }
    const certErr = otherArrayRequiredError(
      formData.requiredCertificates,
      formData.otherCertificateText,
      ['OTHER'],
      'certificate'
    );
    if (certErr) {
      showError(certErr);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: formData.title || `RFQ - ${formData.workpieces[0].technology}`,
        description: formData.description,
        isCorporateRFQ: formData.isCorporateRFQ,
        workpieces: formData.workpieces.map(wp => ({
          mainFile: wp.mainFileUrl,
          extraFiles: wp.extraFiles,
          partType: resolveOtherValue(wp.partType, wp.partTypeOther),
          dimensions: wp.dimensions,
          technology: resolveOtherValue(wp.technology, wp.technologyOther),
          material: wp.material,
          quantity: parseInt(wp.quantity)
        })),
        requirements: {
          preferredCurrency: formData.preferredCurrency,
          rfqDeadline: new Date(formData.rfqDeadline),
          acceptanceDeadline: formData.acceptanceDeadline ? new Date(formData.acceptanceDeadline) : undefined,
          partTrackingId: formData.partTrackingId,
          requestJustification: formData.requestJustification,
          targetDeliveryDate: formData.targetDeliveryDate ? new Date(formData.targetDeliveryDate) : undefined,
          shippingTerms: formData.shippingTerms,
          country: resolvedCountry,
          region: formData.region,
          communicationLanguage: formData.communicationLanguage,
          requiredCertificates: resolveOtherInArray(
            formData.requiredCertificates,
            formData.otherCertificateText,
            ['OTHER']
          ),
          notes: formData.notes
        },
        ndaFile: formData.ndaFileUrl,
        status: 'OPEN_FOR_REQUESTS'
      };

      const response = await rfqAPI.create(payload);
      if (response.success) {
        showSuccess('RFQ created successfully!');
        navigate('/my-rfqs');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-[#01364a] mb-4 font-black uppercase tracking-widest text-[10px]"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
          <h1 className="text-5xl font-black text-[#01364a] tracking-tighter mb-2">Configure RFQ</h1>
          <p className="text-gray-500 font-bold text-lg max-w-lg">Define your project requirements and technical specifications for sourcing.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-[2rem] shadow-xl shadow-blue-900/5">
           <div className="flex -space-x-4">
             {[1,2,3].map(v => <div key={v} className="w-10 h-10 rounded-full border-4 border-white bg-blue-100 flex items-center justify-center text-[10px] font-black">{v}</div>)}
           </div>
           <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Global Sourcing Network Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1 space-y-4">
          <button 
            onClick={() => setActiveTab('workpieces')}
            className={`w-full text-left p-6 rounded-[2rem] transition-all flex items-center justify-between group ${
              activeTab === 'workpieces' ? 'bg-[#01364a] text-white shadow-2xl' : 'bg-white text-gray-400 border border-gray-100 hover:border-blue-100'
            }`}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Step 01</p>
              <h3 className="font-black text-xl tracking-tight">Geometry</h3>
            </div>
            <Box size={20} className={activeTab === 'workpieces' ? 'text-blue-400' : ''} />
          </button>
          
          <button 
            onClick={() => setActiveTab('requirements')}
            className={`w-full text-left p-6 rounded-[2rem] transition-all flex items-center justify-between group ${
              activeTab === 'requirements' ? 'bg-[#01364a] text-white shadow-2xl' : 'bg-white text-gray-400 border border-gray-100 hover:border-blue-100'
            }`}
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-1">Step 02</p>
              <h3 className="font-black text-xl tracking-tight">Logistics</h3>
            </div>
            <Globe size={20} className={activeTab === 'requirements' ? 'text-blue-400' : ''} />
          </button>
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/5 transition-all">
            {activeTab === 'workpieces' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 gap-6">
                   <div>
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        Project Identification <div className="cursor-help"><Info size={12} className="text-gray-200" /></div>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Batch #401 - Medical Housing Components"
                        className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#4881F8] focus:bg-white rounded-2xl text-xl font-black outline-none transition-all shadow-inner"
                      />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Project Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Describe tolerances, finish requirements, application context..."
                        className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-[#4881F8] focus:bg-white rounded-2xl font-bold outline-none transition-all shadow-inner"
                      />
                   </div>
                </div>

                {formData.workpieces.map((wp, index) => (
                  <div key={index} className="space-y-8">
                    <div className="relative group">
                      <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                        Technical Model (STL / STEP / PDF / 2D) <div className="cursor-help" title="Upload CAD or drawing for AI analysis"><Info size={12} className="text-gray-200" /></div>
                      </label>
                      {wp.mainFileUrl ? (
                         <div className="bg-gray-900 rounded-[2.5rem] overflow-hidden relative group/viewer">
                            <CADFileViewer
                              fileUrl={wp.mainFileUrl}
                              fileName={wp.mainFileName || wp.mainFile?.name}
                              height="400px"
                              backgroundColor="#111827"
                            />
                            <button 
                              type="button"
                              onClick={() => handleRemoveFile('main', index)}
                              className="absolute top-6 right-6 p-4 bg-red-500 text-white rounded-2xl opacity-0 group-hover/viewer:opacity-100 transition-all shadow-xl"
                            >
                              <X size={20} />
                            </button>
                         </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-200 hover:border-[#4881F8] bg-gray-50 hover:bg-blue-50/50 rounded-[2.5rem] p-16 text-center transition-all cursor-pointer relative group/upload">
                           <input
                             type="file"
                             accept=".stl,.step,.stp,.pdf,.dxf,.dwg,.png,.jpg,.jpeg,.svg,.iges,.obj,.3mf"
                             onChange={(e) => handleFileUpload(e.target.files[0], 'main', index)}
                             className="absolute inset-0 opacity-0 cursor-pointer"
                           />
                           <div className="flex flex-col items-center gap-4">
                              <div className="w-20 h-20 bg-white rounded-[1.8rem] shadow-xl flex items-center justify-center text-blue-500 group-hover/upload:scale-110 transition-transform">
                                {uploading ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
                              </div>
                              <p className="text-xl font-black text-[#01364a]">Import Geometry or Drawing</p>
                              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">STL, STEP, PDF, DXF, DWG, PNG (MAX 150MB)</p>
                           </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                       {['length', 'width', 'height', 'diameter'].map(dim => (
                         <div key={dim}>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">{dim} (mm)</label>
                            <input
                              type="number"
                              value={wp.dimensions[dim]}
                              onChange={(e) => handleWorkpieceChange(index, `dimensions.${dim}`, parseFloat(e.target.value) || 0)}
                              className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-xl font-black text-center outline-none transition-all"
                            />
                         </div>
                       ))}
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Part Type</label>
                          <select
                            value={wp.partType}
                            onChange={(e) => handleWorkpieceChange(index, 'partType', e.target.value)}
                            className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none appearance-none"
                          >
                            <option value="">Select type</option>
                            {partTypeOptions.map((p) => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <OtherTextInput
                            show={isOtherValue(wp.partType)}
                            value={wp.partTypeOther}
                            onChange={(value) => handleWorkpieceChange(index, 'partTypeOther', value)}
                            placeholder="Enter part type"
                            className="w-full mt-3 px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Quantity</label>
                          <input
                            type="number"
                            min="1"
                            value={wp.quantity}
                            onChange={(e) => handleWorkpieceChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Extra Files (PDF/DWG)</label>
                          <label className="flex items-center justify-center gap-2 px-6 py-5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl font-black text-xs cursor-pointer hover:border-blue-400">
                            <Upload size={16} /> Add files
                            <input type="file" multiple accept=".pdf,.dwg,.dxf,.doc,.docx" className="hidden" onChange={(e) => Array.from(e.target.files).forEach((f) => handleFileUpload(f, 'extra', index))} />
                          </label>
                          {wp.extraFiles?.length > 0 && (
                            <p className="text-xs text-gray-500 mt-2">{wp.extraFiles.length} file(s) attached</p>
                          )}
                       </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                       <div>
                          <label className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                            Manufacturing Tech <div className="cursor-help"><Info size={12} className="text-gray-200" /></div>
                          </label>
                          <select
                            value={wp.technology}
                            onChange={(e) => handleWorkpieceChange(index, 'technology', e.target.value)}
                            className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none transition-all appearance-none"
                          >
                             <option value="">Select Protocol</option>
                             {technologyOptions.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                          </select>
                          <OtherTextInput
                            show={isOtherValue(wp.technology)}
                            value={wp.technologyOther}
                            onChange={(value) => handleWorkpieceChange(index, 'technologyOther', value)}
                            placeholder="Enter manufacturing technology"
                            className="w-full mt-3 px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Material Grade</label>
                          <input
                            type="text"
                            value={wp.material}
                            onChange={(e) => handleWorkpieceChange(index, 'material', e.target.value)}
                            placeholder="e.g. Al6061-T6 / SS304"
                            className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none transition-all"
                          />
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'requirements' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                 <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Currency Preference</label>
                        <select
                          name="preferredCurrency"
                           value={formData.preferredCurrency}
                           onChange={handleChange}
                          className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none transition-all appearance-none"
                        >
                           {currencyOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Incoterms</label>
                        <select
                          name="shippingTerms"
                           value={formData.shippingTerms}
                           onChange={handleChange}
                          className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none transition-all appearance-none"
                        >
                           {incotermsOptions.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Destination Country *</label>
                        <select
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none appearance-none"
                          required
                        >
                          <option value="">Select country</option>
                          {countryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <OtherTextInput
                          show={isOtherValue(formData.country)}
                          value={formData.countryOther}
                          onChange={(value) => setFormData((prev) => ({ ...prev, countryOther: value }))}
                          placeholder="Enter country"
                          className="w-full mt-3 px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Region</label>
                        <input
                          type="text"
                          name="region"
                          value={formData.region}
                          onChange={handleChange}
                          placeholder="e.g. Maharashtra, Bavaria"
                          className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none"
                        />
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Communication Language</label>
                        <select
                          name="communicationLanguage"
                          value={formData.communicationLanguage}
                          onChange={handleChange}
                          className="w-full px-6 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none appearance-none"
                        >
                          {languageOptions.map((l) => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Part Tracking ID</label>
                        <input
                          type="text"
                          name="partTrackingId"
                          value={formData.partTrackingId}
                          onChange={handleChange}
                          placeholder="Internal SKU / project code"
                          className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none"
                        />
                    </div>
                 </div>

                 <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">RFQ Expiry</label>
                        <input
                          type="datetime-local"
                          name="rfqDeadline"
                          value={formData.rfqDeadline}
                          onChange={handleChange}
                          className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none transition-all"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Acceptance Deadline</label>
                        <input
                          type="datetime-local"
                          name="acceptanceDeadline"
                          value={formData.acceptanceDeadline}
                          onChange={handleChange}
                          className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Target Delivery</label>
                        <input
                          type="date"
                          name="targetDeliveryDate"
                          value={formData.targetDeliveryDate}
                          onChange={handleChange}
                          className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none transition-all"
                        />
                    </div>
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Request Justification</label>
                    <textarea
                      name="requestJustification"
                      value={formData.requestJustification}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Why this RFQ is being issued, quality expectations..."
                      className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-bold outline-none"
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Notes for Manufacturers</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Packaging, inspection, or delivery notes..."
                      className="w-full px-8 py-5 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-bold outline-none"
                    />
                 </div>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">NDA Document (optional)</label>
                    {formData.ndaFileUrl ? (
                      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                        <FileText size={20} className="text-blue-500" />
                        <span className="text-sm font-bold flex-1">NDA uploaded</span>
                        <button type="button" onClick={() => handleRemoveFile('nda')} className="text-red-500"><X size={18} /></button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-3 px-8 py-5 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:border-blue-400 font-black text-sm">
                        <Upload size={18} /> Upload NDA (PDF)
                        <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => handleFileUpload(e.target.files[0], 'nda')} />
                      </label>
                    )}
                 </div>

                 <label className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-100 rounded-2xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isCorporateRFQ}
                      onChange={(e) => setFormData((prev) => ({ ...prev, isCorporateRFQ: e.target.checked }))}
                      className="w-5 h-5"
                    />
                    <div>
                      <p className="font-black text-sm text-purple-900">Corporate / Enterprise RFQ</p>
                      <p className="text-xs text-purple-600">Visible only to Enterprise-tier manufacturers with priority matching</p>
                    </div>
                 </label>

                 <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 block">Compliance Certificates</label>
                    <div className="flex flex-wrap gap-3">
                       {certificationOptions.map(cert => (
                         <button
                           key={cert}
                           type="button"
                           onClick={() => handleArrayChange('requiredCertificates', cert, !formData.requiredCertificates.includes(cert))}
                           className={`px-6 py-4 rounded-2xl font-black text-xs transition-all border-2 ${
                             formData.requiredCertificates.includes(cert) ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'
                           }`}
                         >
                           {cert}
                         </button>
                       ))}
                    </div>
                    <OtherTextInput
                      show={formData.requiredCertificates.includes('OTHER')}
                      value={formData.otherCertificateText}
                      onChange={(value) => setFormData((prev) => ({ ...prev, otherCertificateText: value }))}
                      placeholder="Enter certificate name"
                      className="w-full mt-4 px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-blue-400 rounded-2xl font-black outline-none"
                    />
                 </div>
              </div>
            )}

            <div className="mt-12 pt-10 border-t border-gray-50 flex justify-between items-center">
               <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                  <Shield size={14} /> Encrypted Transmission
               </div>
               
               <div className="flex gap-4">
                 {activeTab === 'requirements' && (
                    <button 
                      type="button"
                      onClick={() => setActiveTab('workpieces')}
                      className="px-8 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-all"
                    >
                      Step 01
                    </button>
                 )}
                 
                 <button 
                  type="submit"
                  disabled={loading || uploading}
                  className="px-10 py-5 bg-[#01364a] text-white rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-black transition-all shadow-2xl shadow-blue-900/10"
                 >
                   {activeTab === 'workpieces' ? (
                      <>Next Protocol <ArrowRight size={18} /></>
                   ) : (
                      <>{loading ? 'Initializing Build...' : 'Publish RFQ to Pool'} <Send size={18} /></>
                   )}
                 </button>
               </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
  </svg>
);

export default StartRFQPage;
