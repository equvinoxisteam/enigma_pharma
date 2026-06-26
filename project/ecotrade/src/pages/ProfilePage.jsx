import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../api/profileAPI';
import { uploadAPI } from '../api/uploadAPI';
import { useToast } from '../contexts/ToastContext';
import { Building2, ShoppingCart, Factory, Save, ExternalLink } from 'lucide-react';
import { countries } from '../data/countries';
import AuthenticatedImage from '../components/AuthenticatedImage';
import OtherTextInput from '../components/ui/OtherTextInput';
import { resolveOtherInArray, resolveTechnologiesWithOther, otherArrayRequiredError } from '../utils/otherOption';
import {
  SERVICE_CATEGORIES,
  SERVICE_CATEGORY_LABELS,
  GMP_CERTIFICATIONS,
  GMP_LABELS,
  THERAPEUTIC_AREAS,
  BATCH_SCALES,
  BATCH_SCALE_LABELS,
  PHARMA_INCOTERMS,
  BUYER_COMPANY_TYPES,
  BUYER_COMPANY_TYPE_LABELS
} from '../config/pharmaTaxonomy';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState('company');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    companyName: '',
    website: '',
    companyLogo: '',
    companyBanner: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    companySize: '',
    gstNumber: '',
    industryVertical: '',
    manufacturingTypes: [],
    yearsInBusiness: 0,
    annualSpending: '',
    procurementTeamSize: '',
    preferredLeadTime: '',
    buyerSettings: {
      defaultCountry: '',
      defaultRegion: '',
      preferredCurrency: 'USD',
      defaultIncoterms: '',
      communicationLanguage: 'English',
      savedShippingAddresses: [],
      billingInfo: {}
    },
    manufacturerSettings: {
      technologies: [],
      materials: [],
      partTypes: [],
      machinery: [],
      regionsServed: [],
      languages: []
    },
    primaryMaterials: [],
    certifications: [],
    gmpCertifications: [],
    therapeuticAreas: [],
    buyerCompanyType: '',
    otherBuyerCompanyType: '',
    otherTechnologyText: '',
    otherCertificationText: '',
    maxDimensions: {
      height: 0,
      width: 0,
      length: 0
    }
  });

  const userType = user?.userType || 'BUYER';
  const isBuyer = userType === 'BUYER' || userType === 'HYBRID';
  const isManufacturer = userType === 'MANUFACTURER' || userType === 'HYBRID';

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileAPI.get();
        const profile = response?.data || user;
        if (!profile) return;
        setFormData({
          fullName: profile.fullName || '',
          email: profile.email || '',
          phoneNumber: profile.phoneNumber || '',
          companyName: profile.companyName || '',
          website: profile.website || '',
          companyLogo: profile.companyLogo || '',
          companyBanner: profile.companyBanner || '',
          address: profile.address || '',
          city: profile.city || '',
          state: profile.state || '',
          zipCode: profile.zipCode || '',
          country: profile.country || '',
          companySize: profile.companySize || '',
          gstNumber: profile.gstNumber || '',
          industryVertical: profile.industryVertical || '',
          manufacturingTypes: profile.serviceCategories || profile.manufacturingTypes || [],
          certifications: profile.gmpCertifications || profile.certifications || [],
          gmpCertifications: profile.gmpCertifications || profile.certifications || [],
          therapeuticAreas: profile.therapeuticAreas || [],
          batchScaleCapacity: profile.batchScaleCapacity || '',
          buyerCompanyType: profile.buyerCompanyType || '',
          otherBuyerCompanyType: '',
          yearsInBusiness: profile.yearsInBusiness || 0,
          annualSpending: profile.annualSpending || '',
          procurementTeamSize: profile.procurementTeamSize || '',
          preferredLeadTime: profile.preferredLeadTime || '',
          buyerSettings: {
            defaultCountry: profile.buyerSettings?.defaultCountry || '',
            defaultRegion: profile.buyerSettings?.defaultRegion || '',
            preferredCurrency: profile.buyerSettings?.preferredCurrency || 'USD',
            defaultIncoterms: profile.buyerSettings?.defaultIncoterms || '',
            communicationLanguage: profile.buyerSettings?.communicationLanguage || 'English',
            savedShippingAddresses: profile.buyerSettings?.savedShippingAddresses || [],
            billingInfo: profile.buyerSettings?.billingInfo || {}
          },
          manufacturerSettings: {
            technologies: profile.manufacturerSettings?.technologies || [],
            materials: profile.manufacturerSettings?.materials || [],
            partTypes: profile.manufacturerSettings?.partTypes || [],
            machinery: profile.manufacturerSettings?.machinery || [],
            regionsServed: profile.manufacturerSettings?.regionsServed || [],
            languages: profile.manufacturerSettings?.languages || ['English']
          },
          primaryMaterials: profile.primaryMaterials || [],
          maxDimensions: profile.maxDimensions || { height: 0, width: 0, length: 0 }
        });
      } catch (error) {
        showError('Failed to fetch profile settings');
      }
    };
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        companyName: user.companyName || '',
        website: user.website || '',
        companyLogo: user.companyLogo || '',
        companyBanner: user.companyBanner || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || '',
        companySize: user.companySize || '',
        gstNumber: user.gstNumber || '',
        industryVertical: user.industryVertical || '',
        manufacturingTypes: user.serviceCategories || user.manufacturingTypes || [],
        yearsInBusiness: user.yearsInBusiness || 0,
        annualSpending: user.annualSpending || '',
        procurementTeamSize: user.procurementTeamSize || '',
        preferredLeadTime: user.preferredLeadTime || '',
        buyerSettings: {
          defaultCountry: user.buyerSettings?.defaultCountry || '',
          defaultRegion: user.buyerSettings?.defaultRegion || '',
          preferredCurrency: user.buyerSettings?.preferredCurrency || 'USD',
          defaultIncoterms: user.buyerSettings?.defaultIncoterms || '',
          communicationLanguage: user.buyerSettings?.communicationLanguage || 'English',
          savedShippingAddresses: user.buyerSettings?.savedShippingAddresses || [],
          billingInfo: user.buyerSettings?.billingInfo || {}
        },
        manufacturerSettings: {
          technologies: user.manufacturerSettings?.technologies || [],
          materials: user.manufacturerSettings?.materials || [],
          partTypes: user.manufacturerSettings?.partTypes || [],
          machinery: user.manufacturerSettings?.machinery || [],
          regionsServed: user.manufacturerSettings?.regionsServed || [],
          languages: user.manufacturerSettings?.languages || ['English']
        },
        primaryMaterials: user.primaryMaterials || [],
        certifications: user.gmpCertifications || user.certifications || [],
        gmpCertifications: user.gmpCertifications || user.certifications || [],
        therapeuticAreas: user.therapeuticAreas || [],
        batchScaleCapacity: user.batchScaleCapacity || '',
        buyerCompanyType: user.buyerCompanyType || '',
        otherBuyerCompanyType: '',
        otherTechnologyText: '',
        otherCertificationText: '',
        maxDimensions: user.maxDimensions || { height: 0, width: 0, length: 0 }
      });
      fetchProfile();
    }
  }, [user, showError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleArrayChange = (fieldPath, value, isChecked) => {
    const path = fieldPath.split('.');
    setFormData((prev) => {
      const next = { ...prev };
      const parentKey = path[0];
      if (path.length === 1) {
        const current = next[parentKey] || [];
        next[parentKey] = isChecked ? [...current, value] : current.filter((item) => item !== value);
        return next;
      }
      const childKey = path[1];
      const parentObj = { ...(next[parentKey] || {}) };
      const current = parentObj[childKey] || [];
      parentObj[childKey] = isChecked ? [...current, value] : current.filter((item) => item !== value);
      next[parentKey] = parentObj;
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const techErr = otherArrayRequiredError(
      formData.manufacturerSettings.technologies,
      formData.otherTechnologyText,
      ['OTHER'],
      'technology'
    );
    if (techErr) {
      showError(techErr);
      return;
    }
    const certErr = otherArrayRequiredError(
      formData.gmpCertifications,
      formData.otherCertificationText,
      ['OTHER'],
      'GMP certification'
    );
    if (certErr) {
      showError(certErr);
      return;
    }

    setLoading(true);

    try {
      const { email, ...profilePayload } = formData;
      const resolvedTechnologies = resolveTechnologiesWithOther(
        profilePayload.manufacturerSettings?.technologies,
        profilePayload.otherTechnologyText
      );
      profilePayload.manufacturingTypes = resolvedTechnologies;
      profilePayload.serviceCategories = resolvedTechnologies;
      profilePayload.manufacturerSettings = {
        ...profilePayload.manufacturerSettings,
        technologies: resolvedTechnologies,
      };
      const resolvedGmp = resolveOtherInArray(
        profilePayload.gmpCertifications,
        profilePayload.otherCertificationText,
        ['OTHER']
      );
      profilePayload.gmpCertifications = resolvedGmp;
      profilePayload.certifications = resolvedGmp;
      delete profilePayload.otherTechnologyText;
      delete profilePayload.otherCertificationText;
      if (profilePayload.buyerCompanyType === 'OTHER' && profilePayload.otherBuyerCompanyType?.trim()) {
        profilePayload.buyerCompanyType = profilePayload.otherBuyerCompanyType.trim();
      }
      delete profilePayload.otherBuyerCompanyType;

      const response = await profileAPI.update(profilePayload);
      if (response.success) {
        await updateUser(response.data);
        showSuccess('Profile updated successfully!');
      }
    } catch (error) {
      let errorMessage = 'Failed to update profile. Please check your information and try again.';
      
      // Provide more specific but user-friendly messages for common validation errors
      const errorData = error.response?.data?.message || '';
      if (errorData.includes('phoneNumber')) {
        errorMessage = 'Please provide a valid phone number.';
      } else if (errorData.includes('billingInfo')) {
        errorMessage = 'There was an issue with your billing information format. Please try again.';
      } else if (errorData.includes('Cast to Object failed')) {
        errorMessage = 'Some data fields are in an incorrect format. Please refresh and try again.';
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (field, file, folder) => {
    if (!file) return;
    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('file', file);
      payload.append('type', 'image');
      payload.append('folder', folder);
      const response = await uploadAPI.uploadFile(payload);
      const url = response?.data?.url || response?.url;
      if (!url) throw new Error('Upload response missing URL');
      setFormData((prev) => ({ ...prev, [field]: url }));

      const saveResponse = await profileAPI.update({ [field]: url });
      if (saveResponse.success) {
        await updateUser(saveResponse.data);
      }

      showSuccess(`${field === 'companyLogo' ? 'Company logo' : 'Company banner'} saved`);
    } catch (error) {
      showError(error.response?.data?.message || `Failed to upload ${field}`);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'company', label: 'Company', icon: Building2, show: true },
    { id: 'buyer', label: 'Buyer Settings', icon: ShoppingCart, show: isBuyer },
    { id: 'manufacturer', label: 'CDMO / Manufacturer Settings', icon: Factory, show: isManufacturer }
  ].filter(tab => tab.show);

  const serviceCategoryOptions = SERVICE_CATEGORIES;
  const certificationOptions = GMP_CERTIFICATIONS;
  const currencyOptions = ['USD', 'EUR', 'GBP', 'INR', 'CNY'];
  const incotermsOptions = PHARMA_INCOTERMS;

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Profile</h1>
        <p className="text-gray-600">Manage your profile settings and preferences</p>
        <Link
          to="/company-profile"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#01364a] text-white rounded-xl text-sm font-bold hover:bg-[#044c66] transition-colors shadow-md"
        >
          <Building2 size={18} />
          Company Profile Page
          <ExternalLink size={14} className="opacity-70" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex space-x-4 sm:space-x-8 min-w-max sm:min-w-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-[#4881F8] text-[#4881F8]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
        {/* Company Tab */}
        {activeTab === 'company' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry / Company Type
                </label>
                <input
                  type="text"
                  name="industryVertical"
                  value={formData.industryVertical}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  placeholder="e.g. Innovator biotech, Generic pharma, CRO"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code *</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
                <AuthenticatedImage
                  src={formData.companyLogo}
                  alt="Company logo"
                  className="h-20 w-20 object-cover rounded border mb-2"
                  fallback={<div className="h-20 w-20 rounded border bg-gray-50 mb-2" />}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload('companyLogo', e.target.files?.[0], 'company-logos')}
                  className="block w-full text-sm text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Banner</label>
                <AuthenticatedImage
                  src={formData.companyBanner}
                  alt="Company banner"
                  className="h-20 w-full object-cover rounded border mb-2"
                  fallback={<div className="h-20 w-full rounded border bg-gray-50 mb-2" />}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleUpload('companyBanner', e.target.files?.[0], 'company-banners')}
                  className="block w-full text-sm text-gray-600"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                >
                  <option value="">Select Country</option>
                  {countries.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Size (employees)
                </label>
                <input
                  type="text"
                  name="companySize"
                  value={formData.companySize}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                />
              </div>

              {(isManufacturer) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Buyer Settings Tab */}
        {activeTab === 'buyer' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Country
                </label>
                <select
                  name="buyerSettings.defaultCountry"
                  value={formData.buyerSettings.defaultCountry}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                >
                  <option value="">Select Country</option>
                  {countries.map(c => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Region
                </label>
                <input
                  type="text"
                  name="buyerSettings.defaultRegion"
                  value={formData.buyerSettings.defaultRegion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  placeholder="e.g., DACH, EU, APAC"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred delivery terms (Incoterms)
                </label>
                <select
                  name="buyerSettings.defaultIncoterms"
                  value={formData.buyerSettings.defaultIncoterms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                >
                  {incotermsOptions.map((term) => (
                    <option key={term.value || 'empty'} value={term.value}>{term.label}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Standard API / CDMO supply chain terms (Incoterms 2020)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred currency
                </label>
                <select
                  name="buyerSettings.preferredCurrency"
                  value={formData.buyerSettings.preferredCurrency}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                >
                  {currencyOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buyer organization type
                </label>
                <select
                  name="buyerCompanyType"
                  value={formData.buyerCompanyType}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                >
                  <option value="">Select (optional)</option>
                  {BUYER_COMPANY_TYPES.map((t) => (
                    <option key={t} value={t}>{BUYER_COMPANY_TYPE_LABELS[t] || t}</option>
                  ))}
                </select>
                {formData.buyerCompanyType === 'OTHER' && (
                  <input
                    type="text"
                    name="otherBuyerCompanyType"
                    value={formData.otherBuyerCompanyType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mt-2 focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                    placeholder="Specify organization type"
                  />
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Spending
                </label>
                <input
                  type="text"
                  name="annualSpending"
                  value={formData.annualSpending}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  placeholder="Estimated annual spend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Procurement Team Size
                </label>
                <input
                  type="text"
                  name="procurementTeamSize"
                  value={formData.procurementTeamSize}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Lead Time
                </label>
                <input
                  type="text"
                  name="preferredLeadTime"
                  value={formData.preferredLeadTime}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  placeholder="e.g., 2-4 weeks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Communication Language
                </label>
                <input
                  type="text"
                  name="buyerSettings.communicationLanguage"
                  value={formData.buyerSettings.communicationLanguage}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                  placeholder="e.g., English, German, French"
                />
              </div>
            </div>
          </div>
        )}

        {/* Manufacturer Settings Tab */}
        {activeTab === 'manufacturer' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Categories
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {serviceCategoryOptions.map((tech) => (
                  <label key={tech} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.manufacturerSettings.technologies || []).includes(tech)}
                      onChange={(e) => {
                        const current = formData.manufacturerSettings.technologies || [];
                        const technologies = e.target.checked
                          ? [...current, tech]
                          : current.filter((t) => t !== tech);
                        setFormData((prev) => ({
                          ...prev,
                          manufacturingTypes: technologies,
                          manufacturerSettings: { ...prev.manufacturerSettings, technologies }
                        }));
                      }}
                      className="w-4 h-4 text-[#4881F8] border-gray-300 rounded focus:ring-[#4881F8]"
                    />
                    <span className="text-sm text-gray-700">{SERVICE_CATEGORY_LABELS[tech] || tech.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
              <OtherTextInput
                show={(formData.manufacturerSettings.technologies || []).includes('OTHER')}
                value={formData.otherTechnologyText}
                onChange={(value) => setFormData((prev) => ({ ...prev, otherTechnologyText: value }))}
                placeholder="Specify other service category"
                className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years in Business
                </label>
                <input
                  type="number"
                  name="yearsInBusiness"
                  value={formData.yearsInBusiness}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Batch Scale Capacity
                </label>
                <select
                  name="batchScaleCapacity"
                  value={formData.batchScaleCapacity}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
                >
                  <option value="">Select batch scale</option>
                  {BATCH_SCALES.map((scale) => (
                    <option key={scale} value={scale}>{BATCH_SCALE_LABELS[scale] || scale}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Therapeutic Areas
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {THERAPEUTIC_AREAS.map((area) => (
                  <label key={area} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.therapeuticAreas || []).includes(area)}
                      onChange={(e) => handleArrayChange('therapeuticAreas', area, e.target.checked)}
                      className="w-4 h-4 text-[#4881F8] border-gray-300 rounded focus:ring-[#4881F8]"
                    />
                    <span className="text-sm text-gray-700">{area}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GMP Certifications
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {certificationOptions.map((cert) => (
                  <label key={cert} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(formData.gmpCertifications || []).includes(cert)}
                      onChange={(e) => handleArrayChange('gmpCertifications', cert, e.target.checked)}
                      className="w-4 h-4 text-[#4881F8] border-gray-300 rounded focus:ring-[#4881F8]"
                    />
                    <span className="text-sm text-gray-700">{GMP_LABELS[cert] || cert.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
              <OtherTextInput
                show={(formData.gmpCertifications || []).includes('OTHER')}
                value={formData.otherCertificationText}
                onChange={(value) => setFormData((prev) => ({ ...prev, otherCertificationText: value }))}
                placeholder="Specify other GMP certification"
                className="w-full mt-3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4881F8] focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-6 py-2 bg-[#4881F8] text-white rounded-lg hover:bg-[#3b6fe0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;

