import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { rfqAPI } from '../api/rfqAPI';
import { uploadAPI } from '../api/uploadAPI';
import {
  SERVICE_CATEGORIES, SERVICE_CATEGORY_LABELS, DEVELOPMENT_PHASES, DEVELOPMENT_PHASE_LABELS,
  GMP_CERTIFICATIONS, GMP_LABELS, LICENSE_TYPES, DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS,
  THERAPEUTIC_AREAS, BATCH_SCALES, BATCH_SCALE_LABELS
} from '../config/pharmaTaxonomy';

const StartRFQPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('project');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    isCorporateRFQ: false,
    pharmaProject: {
      serviceCategory: '',
      serviceCategoryOther: '',
      moleculeName: '',
      developmentPhase: 'PHASE_II',
      therapeuticArea: '',
      targetMarkets: [],
      batchScale: 'NOT_SPECIFIED',
      annualVolume: ''
    },
    documents: [],
    regulatory: {
      requiredGmp: [],
      requiredLicenses: [],
      dmfReferences: '',
      stabilityRequired: false
    },
    preferredCurrency: user?.buyerSettings?.preferredCurrency || 'USD',
    rfqDeadline: '',
    targetDeliveryDate: '',
    shippingTerms: user?.buyerSettings?.defaultIncoterms || 'FOB',
    country: user?.country || 'India',
    region: user?.buyerSettings?.defaultRegion || '',
    communicationLanguage: user?.buyerSettings?.communicationLanguage || 'English',
    notes: '',
    ndaFileUrl: ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleProjectChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      pharmaProject: { ...prev.pharmaProject, [field]: value }
    }));
  };

  const toggleArray = (parent, field, value) => {
    setFormData((prev) => {
      const current = prev[parent][field] || [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      return { ...prev, [parent]: { ...prev[parent], [field]: next } };
    });
  };

  const uploadFile = async (file, onDone) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showError('File must be under 10MB');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'document');
      const res = await uploadAPI.uploadSingle(fd);
      onDone(res.url || res.data?.url, file.name);
    } catch {
      showError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const addDocument = (file) => {
    uploadFile(file, (url, name) => {
      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, { docType: 'PRODUCT_SPEC', fileUrl: url, fileName: name }]
      }));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (activeTab === 'project') {
      if (!formData.title.trim()) return showError('Project title is required');
      if (!formData.pharmaProject.serviceCategory) return showError('Select a service category');
      setActiveTab('regulatory');
      return;
    }

    if (activeTab === 'regulatory') {
      if (!formData.ndaFileUrl) return showError('NDA/CDA document is required');
      setActiveTab('commercial');
      return;
    }

    if (!formData.rfqDeadline) return showError('RFQ deadline is required');

    setLoading(true);
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        status: 'OPEN_FOR_REQUESTS',
        ndaFile: formData.ndaFileUrl,
        isCorporateRFQ: formData.isCorporateRFQ,
        pharmaProject: {
          ...formData.pharmaProject,
          serviceCategoryOther: formData.pharmaProject.serviceCategory === 'OTHER'
            ? formData.pharmaProject.serviceCategoryOther : ''
        },
        documents: formData.documents,
        regulatory: formData.regulatory,
        requirements: {
          preferredCurrency: formData.preferredCurrency,
          rfqDeadline: formData.rfqDeadline,
          targetDeliveryDate: formData.targetDeliveryDate || undefined,
          shippingTerms: formData.shippingTerms,
          country: formData.country,
          region: formData.region,
          communicationLanguage: formData.communicationLanguage,
          notes: formData.notes
        }
      };

      const res = await rfqAPI.create(payload);
      if (res.success) {
        showSuccess('Pharma RFQ published successfully');
        navigate(`/my-rfqs/${res.data._id}`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to create RFQ');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'project', label: 'Project' },
    { id: 'regulatory', label: 'Regulatory & NDA' },
    { id: 'commercial', label: 'Commercial' }
  ];

  return (
    <div className="w-full py-6 max-w-4xl mx-auto">
      <button type="button" onClick={() => navigate(-1)} className="text-sm font-semibold text-gray-500 hover:text-[#4881F8] mb-6">
        ← Back
      </button>
      <h1 className="text-3xl font-black text-[#01364a] mb-2">Create Pharma RFQ</h1>
      <p className="text-gray-500 mb-8">Publish a sourcing project for API, CDMO, or clinical manufacturing partners.</p>

      <div className="flex gap-4 border-b border-gray-200 mb-8">
        {tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
            className={`pb-3 text-sm font-bold border-b-2 ${activeTab === t.id ? 'border-[#4881F8] text-[#4881F8]' : 'border-transparent text-gray-400'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
        {activeTab === 'project' && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-1">Project title *</label>
              <input className="w-full border rounded-xl px-4 py-3" value={formData.title}
                onChange={(e) => handleChange(e)} name="title" placeholder="e.g. Commercial API – Atorvastatin intermediate" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Service category *</label>
              <select className="w-full border rounded-xl px-4 py-3" value={formData.pharmaProject.serviceCategory}
                onChange={(e) => handleProjectChange('serviceCategory', e.target.value)}>
                <option value="">Select category</option>
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{SERVICE_CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Molecule / product name</label>
                <input className="w-full border rounded-xl px-4 py-3" value={formData.pharmaProject.moleculeName}
                  onChange={(e) => handleProjectChange('moleculeName', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Development phase</label>
                <select className="w-full border rounded-xl px-4 py-3" value={formData.pharmaProject.developmentPhase}
                  onChange={(e) => handleProjectChange('developmentPhase', e.target.value)}>
                  {DEVELOPMENT_PHASES.map((p) => (
                    <option key={p} value={p}>{DEVELOPMENT_PHASE_LABELS[p]}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Therapeutic area</label>
              <select className="w-full border rounded-xl px-4 py-3" value={formData.pharmaProject.therapeuticArea}
                onChange={(e) => handleProjectChange('therapeuticArea', e.target.value)}>
                <option value="">Select</option>
                {THERAPEUTIC_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Target markets</label>
              <div className="flex flex-wrap gap-2">
                {['US', 'EU', 'IN', 'UK', 'ROW'].map((m) => (
                  <label key={m} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2 cursor-pointer">
                    <input type="checkbox" checked={formData.pharmaProject.targetMarkets.includes(m)}
                      onChange={() => toggleArray('pharmaProject', 'targetMarkets', m)} />
                    {m}
                  </label>
                ))}
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Batch scale</label>
                <select className="w-full border rounded-xl px-4 py-3" value={formData.pharmaProject.batchScale}
                  onChange={(e) => handleProjectChange('batchScale', e.target.value)}>
                  {BATCH_SCALES.map((b) => <option key={b} value={b}>{BATCH_SCALE_LABELS[b]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Annual volume</label>
                <input className="w-full border rounded-xl px-4 py-3" placeholder="e.g. 500 kg/year"
                  value={formData.pharmaProject.annualVolume}
                  onChange={(e) => handleProjectChange('annualVolume', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Project description</label>
              <textarea className="w-full border rounded-xl px-4 py-3 h-28" value={formData.description}
                onChange={handleChange} name="description" placeholder="Scope, impurity profile, timeline notes..." />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Supporting documents (PDF)</label>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => addDocument(e.target.files?.[0])} />
              <ul className="mt-2 space-y-1 text-sm text-[#4881F8]">
                {formData.documents.map((d, i) => (
                  <li key={i}>{d.fileName || d.fileUrl}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        {activeTab === 'regulatory' && (
          <>
            <div>
              <label className="block text-sm font-semibold mb-2">Required GMP certifications</label>
              <div className="flex flex-wrap gap-2">
                {GMP_CERTIFICATIONS.map((g) => (
                  <label key={g} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                    <input type="checkbox" checked={formData.regulatory.requiredGmp.includes(g)}
                      onChange={() => toggleArray('regulatory', 'requiredGmp', g)} />
                    {GMP_LABELS[g]}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Required supplier licenses</label>
              <div className="flex flex-wrap gap-2">
                {LICENSE_TYPES.map((l) => (
                  <label key={l} className="flex items-center gap-2 text-sm border rounded-lg px-3 py-2">
                    <input type="checkbox" checked={formData.regulatory.requiredLicenses.includes(l)}
                      onChange={() => toggleArray('regulatory', 'requiredLicenses', l)} />
                    {l.replace(/_/g, ' ')}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">DMF / CEP references</label>
              <input className="w-full border rounded-xl px-4 py-3" value={formData.regulatory.dmfReferences}
                onChange={(e) => setFormData((p) => ({ ...p, regulatory: { ...p.regulatory, dmfReferences: e.target.value } }))} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.regulatory.stabilityRequired}
                onChange={(e) => setFormData((p) => ({ ...p, regulatory: { ...p.regulatory, stabilityRequired: e.target.checked } }))} />
              Stability studies required
            </label>
            <div className="border-2 border-dashed border-[#4881F8]/40 rounded-xl p-6 bg-blue-50/50">
              <label className="block text-sm font-bold text-[#01364a] mb-2">NDA / CDA document * (required)</label>
              <input type="file" accept=".pdf" onChange={(e) => {
                uploadFile(e.target.files?.[0], (url) => setFormData((p) => ({ ...p, ndaFileUrl: url })));
              }} />
              {formData.ndaFileUrl && <p className="text-sm text-green-600 mt-2">NDA uploaded ✓</p>}
            </div>
          </>
        )}

        {activeTab === 'commercial' && (
          <>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">RFQ deadline *</label>
                <input type="date" className="w-full border rounded-xl px-4 py-3" value={formData.rfqDeadline}
                  onChange={handleChange} name="rfqDeadline" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Target delivery</label>
                <input type="date" className="w-full border rounded-xl px-4 py-3" value={formData.targetDeliveryDate}
                  onChange={handleChange} name="targetDeliveryDate" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Country</label>
                <input className="w-full border rounded-xl px-4 py-3" value={formData.country}
                  onChange={handleChange} name="country" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Incoterms</label>
                <select className="w-full border rounded-xl px-4 py-3" value={formData.shippingTerms}
                  onChange={handleChange} name="shippingTerms">
                  {['FOB', 'CIF', 'EXW', 'DDP', 'DAP', 'FCA'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={formData.isCorporateRFQ} onChange={handleChange} name="isCorporateRFQ" />
              Corporate / enterprise RFQ (Enterprise CDMOs only)
            </label>
          </>
        )}

        <div className="flex justify-between pt-4">
          {activeTab !== 'project' && (
            <button type="button" className="px-6 py-3 border rounded-xl font-semibold"
              onClick={() => setActiveTab(activeTab === 'commercial' ? 'regulatory' : 'project')}>
              Back
            </button>
          )}
          <button type="submit" disabled={loading || uploading}
            className="ml-auto px-8 py-3 bg-[#4881F8] text-white rounded-xl font-bold disabled:opacity-50">
            {loading ? 'Publishing...' : activeTab === 'commercial' ? 'Publish RFQ' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default StartRFQPage;
