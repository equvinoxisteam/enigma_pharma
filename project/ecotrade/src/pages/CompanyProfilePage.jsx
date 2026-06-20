import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Eye,
  Pencil,
  Save,
  Upload,
  X,
  FileText,
  Presentation,
  ImagePlus,
  ExternalLink,
  Globe,
  MapPin,
  Factory,
  Loader2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { profileAPI } from '../api/profileAPI';
import { uploadAPI } from '../api/uploadAPI';
import AuthenticatedImage from '../components/AuthenticatedImage';
import { normalizeFileUrl } from '../utils/fileUtils';

const MAX_COMPANY_IMAGES = 5;
const MAX_COMPANY_DOC_BYTES = 5 * 1024 * 1024;

const CompanyProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState('edit');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    description: '',
    companyLogo: '',
    companyBanner: '',
    country: '',
    companySize: '',
    industryVertical: '',
    facilityPhotos: [],
    companyPresentationUrl: '',
    companyBrochurePdfUrl: '',
    companyProfilePdfUrl: ''
  });

  const isManufacturer = user?.userType === 'MANUFACTURER' || user?.userType === 'HYBRID';

  useEffect(() => {
    const load = async () => {
      try {
        const response = await profileAPI.get();
        const profile = response?.data || user;
        setFormData({
          companyName: profile.companyName || '',
          website: profile.website || '',
          description: profile.description || '',
          companyLogo: profile.companyLogo || '',
          companyBanner: profile.companyBanner || '',
          country: profile.country || '',
          companySize: profile.companySize || '',
          industryVertical: profile.industryVertical || '',
          facilityPhotos: profile.facilityPhotos || [],
          companyPresentationUrl: profile.companyPresentationUrl || '',
          companyBrochurePdfUrl: profile.companyBrochurePdfUrl || '',
          companyProfilePdfUrl: profile.companyProfilePdfUrl || ''
        });
      } catch {
        showError('Failed to load company profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showError, user]);

  const uploadAsset = async (file, folder, { maxBytes } = {}) => {
    if (maxBytes && file.size > maxBytes) {
      throw new Error(`File must be ${maxBytes / (1024 * 1024)}MB or smaller`);
    }
    const payload = new FormData();
    payload.append('file', file);
    payload.append('folder', folder);
    const response = await uploadAPI.uploadFile(payload, undefined, { folder });
    const url = response?.data?.url || response?.url;
    if (!url) throw new Error('Upload failed');
    return url;
  };

  const handleDocumentUpload = async (field, file, folder) => {
    if (!file) return;
    setUploadingField(field);
    try {
      const url = await uploadAsset(file, folder, { maxBytes: MAX_COMPANY_DOC_BYTES });
      setFormData((prev) => ({ ...prev, [field]: url }));
      showSuccess('File uploaded — save to apply');
    } catch (error) {
      showError(error.message || error.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingField('');
    }
  };

  const handleImageAdd = async (file) => {
    if (!file) return;
    if (formData.facilityPhotos.length >= MAX_COMPANY_IMAGES) {
      showError(`You can upload up to ${MAX_COMPANY_IMAGES} company images`);
      return;
    }
    setUploadingField('facilityPhotos');
    try {
      const url = await uploadAsset(file, 'company-images');
      setFormData((prev) => ({
        ...prev,
        facilityPhotos: [...prev.facilityPhotos, url]
      }));
      showSuccess('Image added — save to apply');
    } catch (error) {
      showError(error.response?.data?.message || 'Image upload failed');
    } finally {
      setUploadingField('');
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      facilityPhotos: prev.facilityPhotos.filter((_, i) => i !== index)
    }));
  };

  const clearDocument = (field) => {
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        companyName: formData.companyName,
        website: formData.website,
        description: formData.description,
        facilityPhotos: formData.facilityPhotos.slice(0, MAX_COMPANY_IMAGES),
        companyPresentationUrl: formData.companyPresentationUrl,
        companyBrochurePdfUrl: formData.companyBrochurePdfUrl,
        companyProfilePdfUrl: formData.companyProfilePdfUrl
      };
      const response = await profileAPI.update(payload);
      if (response.success) {
        await updateUser(response.data);
        showSuccess('Company profile saved');
        setMode('preview');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  const fileNameFromUrl = (url) => {
    if (!url) return '';
    try {
      const parts = url.split('/');
      return decodeURIComponent(parts[parts.length - 1].split('?')[0]);
    } catch {
      return 'Document';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-[#4881F8]" size={40} />
      </div>
    );
  }

  return (
    <div className="w-full pb-8 sm:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 text-gray-400 hover:text-[#01364a] mb-3 text-xs font-black uppercase tracking-widest"
          >
            <ArrowLeft size={14} />
            Back to Profile
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-[#01364a]">Company Profile</h1>
          <p className="text-gray-500 font-medium mt-1">
            Update how your company appears to other users on Enigma
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('edit')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'edit' ? 'bg-[#4881F8] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Pencil size={16} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setMode('preview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
              mode === 'preview' ? 'bg-[#4881F8] text-white shadow-lg shadow-blue-500/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Eye size={16} />
            Preview
          </button>
          {isManufacturer && user?._id && (
            <Link
              to={`/manufacturer/${user._id}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#01364a] text-white hover:bg-[#044c66] transition-all"
            >
              <ExternalLink size={16} />
              Live Public Page
            </Link>
          )}
        </div>
      </div>

      {mode === 'edit' ? (
        <div className="space-y-6">
          <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm">
            <h2 className="text-lg font-black text-[#01364a] mb-6 flex items-center gap-2">
              <Building2 size={20} className="text-[#4881F8]" />
              About Your Company
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Company Description</label>
                <textarea
                  rows={5}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your company, capabilities, and what makes you unique..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#4881F8] focus:border-transparent resize-y min-h-[120px]"
                />
              </div>
              <p className="text-xs text-gray-400">
                Logo and banner are managed on the{' '}
                <Link to="/profile" className="text-[#4881F8] font-semibold hover:underline">main profile page</Link>.
              </p>
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
              <h2 className="text-lg font-black text-[#01364a] flex items-center gap-2">
                <ImagePlus size={20} className="text-[#4881F8]" />
                Company Images
              </h2>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {formData.facilityPhotos.length} / {MAX_COMPANY_IMAGES}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {formData.facilityPhotos.map((url, index) => (
                <div key={url + index} className="relative group aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                  <AuthenticatedImage
                    src={url}
                    alt={`Company ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {formData.facilityPhotos.length < MAX_COMPANY_IMAGES && (
                <label className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#4881F8] hover:bg-blue-50/50 transition-all">
                  {uploadingField === 'facilityPhotos' ? (
                    <Loader2 className="animate-spin text-[#4881F8]" size={24} />
                  ) : (
                    <>
                      <Upload size={24} className="text-gray-400" />
                      <span className="text-xs font-bold text-gray-500">Add Image</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingField === 'facilityPhotos'}
                    onChange={(e) => {
                      handleImageAdd(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-8 shadow-sm">
            <h2 className="text-lg font-black text-[#01364a] mb-2">Documents & Presentations</h2>
            <p className="text-sm text-gray-500 mb-6">PDF and PowerPoint files only. Maximum file size: <strong>5 MB</strong> each.</p>
            <div className="space-y-5">
              <DocumentUploadRow
                label="Company Presentation (PPT)"
                hint="PowerPoint deck about your company (max 5 MB)"
                accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                icon={Presentation}
                fileUrl={formData.companyPresentationUrl}
                uploading={uploadingField === 'companyPresentationUrl'}
                onUpload={(file) => handleDocumentUpload('companyPresentationUrl', file, 'company-documents')}
                onClear={() => clearDocument('companyPresentationUrl')}
                fileName={fileNameFromUrl(formData.companyPresentationUrl)}
              />
              <DocumentUploadRow
                label="Company Brochure (PDF)"
                hint="General company brochure or catalog (max 5 MB)"
                accept=".pdf,application/pdf"
                icon={FileText}
                fileUrl={formData.companyBrochurePdfUrl}
                uploading={uploadingField === 'companyBrochurePdfUrl'}
                onUpload={(file) => handleDocumentUpload('companyBrochurePdfUrl', file, 'company-documents')}
                onClear={() => clearDocument('companyBrochurePdfUrl')}
                fileName={fileNameFromUrl(formData.companyBrochurePdfUrl)}
              />
              <DocumentUploadRow
                label="Company Profile (PDF)"
                hint="Detailed company profile document (max 5 MB)"
                accept=".pdf,application/pdf"
                icon={FileText}
                fileUrl={formData.companyProfilePdfUrl}
                uploading={uploadingField === 'companyProfilePdfUrl'}
                onUpload={(file) => handleDocumentUpload('companyProfilePdfUrl', file, 'company-documents')}
                onClear={() => clearDocument('companyProfilePdfUrl')}
                fileName={fileNameFromUrl(formData.companyProfilePdfUrl)}
              />
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3.5 bg-[#4881F8] text-white rounded-xl font-bold hover:bg-[#3a6fd6] disabled:opacity-60 transition-all shadow-lg shadow-blue-500/20"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Company Profile
            </button>
          </div>
        </div>
      ) : (
        <CompanyProfilePreview profile={{ ...formData, ...user }} isManufacturer={isManufacturer} />
      )}
    </div>
  );
};

const DocumentUploadRow = ({
  label,
  hint,
  accept,
  icon: Icon,
  fileUrl,
  uploading,
  onUpload,
  onClear,
  fileName
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 bg-gray-50 rounded-2xl border border-gray-100">
    <div className="flex items-start gap-3 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 text-[#4881F8]">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="font-bold text-[#01364a]">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{hint}</p>
        {fileUrl && (
          <p className="text-xs text-emerald-600 font-semibold mt-2 truncate">{fileName || 'Uploaded'}</p>
        )}
      </div>
    </div>
    <div className="flex items-center gap-2 flex-shrink-0">
      {fileUrl && (
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
        >
          Remove
        </button>
      )}
      <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-bold text-[#01364a] cursor-pointer hover:border-[#4881F8] transition-all">
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {fileUrl ? 'Replace' : 'Upload'}
        <input
          type="file"
          accept={accept}
          className="hidden"
          disabled={uploading}
          onChange={(e) => {
            onUpload(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </label>
    </div>
  </div>
);

const CompanyProfilePreview = ({ profile, isManufacturer }) => {
  const docs = [
    { label: 'Company Presentation', url: profile.companyPresentationUrl, type: 'ppt' },
    { label: 'Company Brochure', url: profile.companyBrochurePdfUrl, type: 'pdf' },
    { label: 'Company Profile', url: profile.companyProfilePdfUrl, type: 'pdf' }
  ].filter((d) => d.url);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-xl shadow-blue-900/5">
      <div className="relative h-40 sm:h-56 bg-gradient-to-br from-[#01364a] via-[#044c66] to-[#4881F8]">
        {profile.companyBanner ? (
          <AuthenticatedImage src={profile.companyBanner} alt="Banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Globe size={120} className="text-white" />
          </div>
        )}
      </div>

      <div className="px-4 sm:px-8 pb-8 -mt-12 sm:-mt-16 relative">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-end">
          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto sm:mx-0 flex-shrink-0 bg-white p-2 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {profile.companyLogo ? (
              <AuthenticatedImage src={profile.companyLogo} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="w-full h-full bg-blue-50 rounded-xl flex items-center justify-center text-[#01364a]">
                <Factory size={40} />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left pb-2 flex-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#01364a]">{profile.companyName || 'Your Company'}</h2>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-sm font-bold text-gray-500">
              {profile.country && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-[#4881F8]" />
                  {profile.country}
                </span>
              )}
              {profile.companySize && <span>{profile.companySize} employees</span>}
              {profile.industryVertical && <span>{profile.industryVertical}</span>}
              {profile.website && (
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#4881F8] hover:underline"
                >
                  <Globe size={14} />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          <section>
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">About</h3>
            <p className="text-gray-600 font-medium leading-relaxed">
              {profile.description || 'No company description added yet.'}
            </p>
          </section>

          {profile.facilityPhotos?.length > 0 && (
            <section>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Company Gallery</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {profile.facilityPhotos.map((url, i) => (
                  <div key={url + i} className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100">
                    <AuthenticatedImage src={url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {docs.length > 0 && (
            <section>
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {docs.map((doc) => (
                  <a
                    key={doc.label}
                    href={normalizeFileUrl(doc.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-[#4881F8] hover:bg-blue-50/30 transition-all group"
                  >
                    {doc.type === 'ppt' ? (
                      <Presentation size={22} className="text-orange-500 flex-shrink-0" />
                    ) : (
                      <FileText size={22} className="text-red-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-[#01364a] text-sm truncate">{doc.label}</p>
                      <p className="text-xs text-[#4881F8] font-semibold group-hover:underline">Download</p>
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          {isManufacturer && (
            <p className="text-sm text-gray-400 font-medium italic border-t border-gray-100 pt-6">
              Technical capabilities and certifications appear on your public manufacturer profile from Manufacturer Settings.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
