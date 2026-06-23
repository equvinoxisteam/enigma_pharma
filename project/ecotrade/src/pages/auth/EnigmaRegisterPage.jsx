import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authAPI } from '../../api/authAPI';
import { useToast } from '../../contexts/ToastContext';
import { countries } from '../../data/countries';
import OtherTextInput from '../../components/ui/OtherTextInput';
import {
  resolveOtherInArray,
} from '../../utils/otherOption';

const EnigmaRegisterPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showSuccess, showError } = useToast();
  const role = searchParams.get('role') || 'BUYER';
  const isBuyer = role === 'BUYER';
  const isManufacturer = role === 'MANUFACTURER';
  const isHybrid = role === 'HYBRID';

  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    phoneCode: '+91',
    country: 'India',
    
    // Company Info
    companyName: '',
    website: '',
    gstNumber: '',
    
    // Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    
    // Manufacturer fields
    manufacturingTypes: [],
    companySize: '',
    yearsInBusiness: '',
    maxDimensions: { height: '', width: '', length: '' },
    primaryMaterials: [],
    certifications: [],
    otherManufacturingType: '',
    otherMaterial: '',
    otherCertification: '',
    
    // Buyer fields
    industryVertical: '',
    annualSpending: '',
    procurementTeamSize: '',
    preferredLeadTime: ''
  });

  const manufacturingTypesOptions = [
    'API_MANUFACTURING', 'API_INTERMEDIATES', 'FORMULATION_DEVELOPMENT', 'CLINICAL_TRIAL_MFG',
    'COMMERCIAL_CDMO', 'BIOLOGICS_BIOSIMILARS', 'HPAPI_ONCOLOGY', 'FILL_FINISH', 'OTHER'
  ];

  const materialOptions = [
    'Aluminum', 'Steel', 'Stainless Steel', 'Brass', 'Copper', 
    'Titanium', 'Plastic/Polymers', 'Composites', 'Others'
  ];

  const certificationOptions = [
    'WHO_GMP', 'US_FDA_CGMP', 'EU_GMP', 'ISO_13485', 'PIC_S', 'ISO_9001', 'OTHER'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const handleDimensionChange = (dimension, value) => {
    setFormData(prev => ({
      ...prev,
      maxDimensions: {
        ...prev.maxDimensions,
        [dimension]: value
      }
    }));
  };

  // Password validation rules
  const validatePassword = (password) => {
    const rules = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    return rules;
  };

  const getPasswordStrength = (password) => {
    if (!password) return 0;
    const rules = validatePassword(password);
    const passedRules = Object.values(rules).filter(Boolean).length;
    return (passedRules / 5) * 100;
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email';
      
      // Comprehensive password validation
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else {
        const passwordRules = validatePassword(formData.password);
        if (!passwordRules.minLength) {
          newErrors.password = 'Password must be at least 8 characters long';
        } else if (!passwordRules.hasUpperCase) {
          newErrors.password = 'Password must contain at least one uppercase letter';
        } else if (!passwordRules.hasLowerCase) {
          newErrors.password = 'Password must contain at least one lowercase letter';
        } else if (!passwordRules.hasNumber) {
          newErrors.password = 'Password must contain at least one number';
        } else if (!passwordRules.hasSpecialChar) {
          newErrors.password = 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)';
        }
      }
      
      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
      else if (!/^\d{7,15}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Invalid phone number';
    }
    
    if (step === 2) {
      if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'Zip code is required';
      else if (!/^[0-9]{5,6}$/.test(formData.zipCode)) newErrors.zipCode = 'Invalid zip code';
      
      // Manufacturing types are required only for manufacturer-capable roles
      if ((isManufacturer || isHybrid) && formData.manufacturingTypes.length === 0) {
        newErrors.manufacturingTypes = 'Select at least one manufacturing type';
      }
      if (formData.manufacturingTypes.includes('OTHER') && !formData.otherManufacturingType.trim()) {
        newErrors.otherManufacturingType = 'Please specify manufacturing type';
      }
      if (formData.primaryMaterials.includes('Others') && !formData.otherMaterial.trim()) {
        newErrors.otherMaterial = 'Please specify material';
      }
      if (formData.certifications.includes('OTHER') && !formData.otherCertification.trim()) {
        newErrors.otherCertification = 'Please specify certification';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      const fullPhoneNumber = `${formData.phoneCode}${formData.phoneNumber}`;
      const payload = {
        ...formData,
        fullName: formData.fullName.trim(),
        phoneNumber: fullPhoneNumber,
        userType: role,
        manufacturingTypes: resolveOtherInArray(
          formData.manufacturingTypes,
          formData.otherManufacturingType,
          ['OTHER']
        ),
        serviceCategories: resolveOtherInArray(
          formData.manufacturingTypes,
          formData.otherManufacturingType,
          ['OTHER']
        ),
        gmpCertifications: resolveOtherInArray(
          formData.certifications,
          formData.otherCertification,
          ['OTHER']
        ),
        primaryMaterials: resolveOtherInArray(
          formData.primaryMaterials,
          formData.otherMaterial,
          ['Others']
        ),
        certifications: resolveOtherInArray(
          formData.certifications,
          formData.otherCertification,
          ['OTHER']
        ),
        maxDimensions: {
          height: parseFloat(formData.maxDimensions.height) || 0,
          width: parseFloat(formData.maxDimensions.width) || 0,
          length: parseFloat(formData.maxDimensions.length) || 0
        }
      };

      // Keep payload role-specific to avoid accidental validation issues
      if (isBuyer) {
        payload.manufacturingTypes = [];
      }
      
      const response = await authAPI.register(payload);
      
      if (response) {
        showSuccess(response.message || 'Registration successful! Please check your email to verify your account.');
        navigate('/verify-email', {
          state: { email: formData.email }
        });
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalSteps = 2;

  const roleLabel = role === 'BUYER' ? 'Buyer' : role === 'MANUFACTURER' ? 'Manufacturer' : 'Hybrid';

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 sm:py-10 bg-[#f4f7fb] text-[#01364a]" style={{ fontFamily: "'Inter',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .reg-input { width:100%; padding:0.75rem 1rem; background:#fafbfd; border:1px solid rgba(1,54,74,0.14); border-radius:12px; color:#01364a; font-size:0.9rem; outline:none; transition:all 0.2s; box-sizing:border-box; }
        .reg-input:focus { border-color:#4881F8; background:#fff; box-shadow:0 0 0 3px rgba(72,129,248,0.12); }
        .reg-input::placeholder { color:rgba(1,54,74,0.35); }
        .reg-label { display:block; color:#01364a; font-size:0.82rem; font-weight:600; margin-bottom:0.4rem; }
        .reg-error { color:#dc2626; font-size:0.78rem; margin-top:0.3rem; }
        .reg-section-title { color:#01364a; font-size:1.2rem; font-weight:800; margin-bottom:1.25rem; }
        .reg-check { accent-color:#4881F8; width:15px; height:15px; cursor:pointer; }
        select.reg-input option { background:#fff; color:#01364a; }
        @keyframes spin { to { transform:rotate(360deg); } }
      `}</style>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <img src="/enigma-logo.svg" alt="Enigma" style={{ height: '52px', width: 'auto', margin: '0 auto' }} />
          </div>
          <button type="button" onClick={() => navigate('/role-selection')} style={{ color:'#4881F8', background:'none', border:'none', cursor:'pointer', fontSize:'0.875rem', fontWeight:600, marginBottom:'1rem' }}>
            ← Back to role selection
          </button>
          
          <h1 style={{ color:'#01364a', fontSize:'clamp(1.5rem,3vw,2rem)', fontWeight:800, marginBottom:'0.4rem', letterSpacing:'-0.015em' }}>
            Sign up as <span style={{ color:'#4881F8' }}>{roleLabel}</span>
          </h1>
          <p style={{ color:'rgba(1,54,74,0.55)', fontSize:'0.9rem' }}>Complete your registration to get started</p>
        </div>

        {/* Progress Steps */}
        <div style={{ display:'flex', alignItems:'center', gap:'0', marginBottom:'2rem', justifyContent:'center' }}>
          {[...Array(totalSteps)].map((_, i) => (
            <React.Fragment key={i}>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: i+1 <= currentStep ? 'linear-gradient(135deg,#4881F8,#6366f1)' : '#eef2f7', border: i+1 <= currentStep ? 'none' : '1px solid rgba(1,54,74,0.12)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'0.85rem', color: i+1 <= currentStep ? '#fff' : 'rgba(1,54,74,0.45)', transition:'all 0.3s' }}>{i+1}</div>
                <span style={{ color: i+1 <= currentStep ? '#01364a' : 'rgba(1,54,74,0.4)', fontSize:'0.7rem', marginTop:'0.35rem', fontWeight:500 }}>{['Basic Info','Company'][i] || 'Extra'}</span>
              </div>
              {i < totalSteps - 1 && <div style={{ flex:1, height:'2px', background: i+1 < currentStep ? '#4881F8' : 'rgba(1,54,74,0.1)', margin:'0 0.75rem', marginBottom:'1.4rem', transition:'background 0.3s' }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-8 lg:p-10 bg-white border border-[#01364a]/10 rounded-[20px] shadow-xl shadow-[#01364a]/5">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="reg-section-title">Basic Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="reg-label">Title</label>
                  <select name="title" value={formData.title} onChange={handleChange} className="reg-input">
                    <option value="">Select</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                  </select>
                </div>

                <div>
                  <label className="reg-label">Full Name *</label>
                  <input type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                    className="reg-input" style={{ borderColor: errors.fullName ? 'rgba(248,113,113,0.7)' : '' }} required />
                  {errors.fullName && <p className="reg-error">{errors.fullName}</p>}
                </div>

                <div>
                  <label className="reg-label">Email *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange}
                    className="reg-input" style={{ borderColor: errors.email ? 'rgba(248,113,113,0.7)' : '' }} required />
                  {errors.email && <p className="reg-error">{errors.email}</p>}
                </div>

                <div>
                  <label className="reg-label">Phone Number *</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <select 
                      name="phoneCode" 
                      value={formData.phoneCode} 
                      onChange={handleChange}
                      className="reg-input"
                      style={{ width: '100px', flexShrink: 0 }}
                    >
                      {countries.map(c => (
                        <option key={`${c.iso}-${c.code}`} value={c.code}>
                          {c.iso} {c.code}
                        </option>
                      ))}
                    </select>
                    <input 
                      type="tel" 
                      name="phoneNumber" 
                      value={formData.phoneNumber} 
                      onChange={handleChange}
                      className="reg-input" 
                      style={{ borderColor: errors.phoneNumber ? 'rgba(248,113,113,0.7)' : '' }}
                      placeholder="Mobile number" 
                      required 
                    />
                  </div>
                  {errors.phoneNumber && <p className="reg-error">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label className="reg-label">Password *</label>
                  <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password}
                    onChange={handleChange} className="reg-input" style={{ borderColor: errors.password ? 'rgba(248,113,113,0.7)' : '' }} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ marginTop: '0.35rem', background: 'none', border: 'none', color: '#4881F8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}>
                    {showPassword ? 'Hide password' : 'Show password'}
                  </button>
                  {formData.password && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.25rem' }}>
                        {[1,2,3,4,5].map(i => {
                          const s = Object.values(validatePassword(formData.password)).filter(Boolean).length;
                          const c = s < 2 ? '#ef4444' : s < 4 ? '#eab308' : '#22c55e';
                          return <div key={i} style={{ flex:1, height:'3px', borderRadius:'2px', background: i <= s ? c : 'rgba(1,54,74,0.12)', transition:'background 0.3s' }} />;
                        })}
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:'2px', marginTop:'0.4rem' }}>
                        {[[formData.password.length >= 8,'8+ characters'],[/[A-Z]/.test(formData.password),'Uppercase'],[/[a-z]/.test(formData.password),'Lowercase'],[/\d/.test(formData.password),'Number'],[/[!@#$%^&*(),.?":{}|<>]/.test(formData.password),'Special char']].map(([ok,label]) => (
                          <span key={label} style={{ color: ok ? '#22c55e' : 'rgba(1,54,74,0.4)', fontSize:'0.72rem' }}>{ok ? '✓' : '○'} {label}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {errors.password && <p className="reg-error">{errors.password}</p>}
                </div>

                <div>
                  <label className="reg-label">Confirm Password *</label>
                  <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword}
                    onChange={handleChange} className="reg-input" style={{ borderColor: errors.confirmPassword ? 'rgba(248,113,113,0.7)' : formData.confirmPassword && formData.password === formData.confirmPassword ? 'rgba(34,197,94,0.5)' : '' }} required />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ marginTop: '0.35rem', background: 'none', border: 'none', color: '#4881F8', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, padding: 0 }}>
                    {showConfirmPassword ? 'Hide password' : 'Show password'}
                  </button>
                  {formData.confirmPassword && (
                    <p style={{ color: formData.password === formData.confirmPassword ? '#22c55e' : 'rgba(248,113,113,0.9)', fontSize: '0.78rem', marginTop: '0.3rem' }}>
                      {formData.password === formData.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                  {errors.confirmPassword && <p className="reg-error">{errors.confirmPassword}</p>}
                </div>

                <div>
                  <label className="reg-label">Country</label>
                  <select 
                    name="country" 
                    value={formData.country} 
                    onChange={handleChange} 
                    className="reg-input"
                  >
                    {countries.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Company & Address */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="reg-section-title">Company & Address Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="reg-label">Company Name *</label>
                  <input type="text" name="companyName" value={formData.companyName} onChange={handleChange}
                    className="reg-input" style={{ borderColor: errors.companyName ? 'rgba(248,113,113,0.7)' : '' }} required />
                  {errors.companyName && <p className="reg-error">{errors.companyName}</p>}
                </div>

                <div>
                  <label className="reg-label">Website</label>
                  <input type="url" name="website" value={formData.website} onChange={handleChange}
                    placeholder="Enter the Website if any" className="reg-input" />
                </div>

                <div>
                  <label className="reg-label">Company GST/VAT Number</label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    placeholder="e.g. 29ABCDE1234F1Z5 (15-character GSTIN)"
                    className="reg-input"
                  />
                  <p className="reg-error" style={{ color: 'rgba(255,255,255,0.35)', marginTop: '0.35rem' }}>
                    Optional. Indian GST format: 2-digit state + 10-char PAN + entity + Z + checksum.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="reg-label">Address *</label>
                  <input type="text" name="address" value={formData.address} onChange={handleChange}
                    className="reg-input" style={{ borderColor: errors.address ? 'rgba(248,113,113,0.7)' : '' }} required />
                  {errors.address && <p className="reg-error">{errors.address}</p>}
                </div>

                <div>
                  <label className="reg-label">City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange}
                    className="reg-input" style={{ borderColor: errors.city ? 'rgba(248,113,113,0.7)' : '' }} required />
                  {errors.city && <p className="reg-error">{errors.city}</p>}
                </div>

                <div>
                  <label className="reg-label">State *</label>
                  <input type="text" name="state" value={formData.state} onChange={handleChange}
                    className="reg-input" style={{ borderColor: errors.state ? 'rgba(248,113,113,0.7)' : '' }} required />
                  {errors.state && <p className="reg-error">{errors.state}</p>}
                </div>

                <div>
                  <label className="reg-label">Zip Code *</label>
                  <input type="text" name="zipCode" value={formData.zipCode} onChange={handleChange}
                    className="reg-input" style={{ borderColor: errors.zipCode ? 'rgba(248,113,113,0.7)' : '' }} required />
                  {errors.zipCode && <p className="reg-error">{errors.zipCode}</p>}
                </div>
              </div>

              {/* Manufacturing Capabilities */}
              {!isBuyer && (
              <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ color:'rgba(255,255,255,0.85)', fontSize:'1rem', fontWeight:600, marginBottom:'1.25rem' }}>Manufacturing Capabilities</h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="reg-label">Manufacturing Types * (Select at least one)</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {manufacturingTypesOptions.map((type) => (
                      <label key={type} style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:'0.85rem' }}>
                        <input type="checkbox" checked={formData.manufacturingTypes.includes(type)}
                          onChange={() => handleArrayChange('manufacturingTypes', type)} className="reg-check" />
                        {type.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                  {errors.manufacturingTypes && <p className="reg-error">{errors.manufacturingTypes}</p>}
                  <OtherTextInput
                    show={formData.manufacturingTypes.includes('OTHER')}
                    value={formData.otherManufacturingType}
                    onChange={(value) => setFormData((prev) => ({ ...prev, otherManufacturingType: value }))}
                    placeholder="Specify manufacturing type"
                    className="reg-input mt-3"
                  />
                  {errors.otherManufacturingType && <p className="reg-error">{errors.otherManufacturingType}</p>}
                </div>

                <div className="grid md:grid-cols-3 gap-4" style={{ marginBottom: '1.5rem' }}>
                  <div>
                    <label className="reg-label">Max Height (mm)</label>
                    <input type="number" value={formData.maxDimensions.height}
                      onChange={(e) => handleDimensionChange('height', e.target.value)} className="reg-input" />
                  </div>
                  <div>
                    <label className="reg-label">Max Width (mm)</label>
                    <input type="number" value={formData.maxDimensions.width}
                      onChange={(e) => handleDimensionChange('width', e.target.value)} className="reg-input" />
                  </div>
                  <div>
                    <label className="reg-label">Max Length (mm)</label>
                    <input type="number" value={formData.maxDimensions.length}
                      onChange={(e) => handleDimensionChange('length', e.target.value)} className="reg-input" />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="reg-label">Primary Materials</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {materialOptions.map((material) => (
                      <label key={material} style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:'0.85rem' }}>
                        <input type="checkbox" checked={formData.primaryMaterials.includes(material)}
                          onChange={() => handleArrayChange('primaryMaterials', material)} className="reg-check" />
                        {material}
                      </label>
                    ))}
                  </div>
                  <OtherTextInput
                    show={formData.primaryMaterials.includes('Others')}
                    value={formData.otherMaterial}
                    onChange={(value) => setFormData((prev) => ({ ...prev, otherMaterial: value }))}
                    placeholder="Specify material"
                    className="reg-input mt-3"
                  />
                  {errors.otherMaterial && <p className="reg-error">{errors.otherMaterial}</p>}
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="reg-label">Certifications</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {certificationOptions.map((cert) => (
                      <label key={cert} style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', color:'rgba(255,255,255,0.7)', fontSize:'0.85rem' }}>
                        <input type="checkbox" checked={formData.certifications.includes(cert)}
                          onChange={() => handleArrayChange('certifications', cert)} className="reg-check" />
                        {cert.replace('_', ' ')}
                      </label>
                    ))}
                  </div>
                  <OtherTextInput
                    show={formData.certifications.includes('OTHER')}
                    value={formData.otherCertification}
                    onChange={(value) => setFormData((prev) => ({ ...prev, otherCertification: value }))}
                    placeholder="Specify certification"
                    className="reg-input mt-3"
                  />
                  {errors.otherCertification && <p className="reg-error">{errors.otherCertification}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="reg-label">Company Size (employees)</label>
                    <input type="text" name="companySize" value={formData.companySize}
                      onChange={handleChange} className="reg-input" />
                  </div>
                  <div>
                    <label className="reg-label">Years in Business</label>
                    <input type="number" name="yearsInBusiness" value={formData.yearsInBusiness}
                      onChange={handleChange} className="reg-input" />
                  </div>
                </div>
              </div>
              )}

              {/* Buyer Information */}
              {(isBuyer || isHybrid) && (
              <div style={{ marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ color:'rgba(255,255,255,0.85)', fontSize:'1rem', fontWeight:600, marginBottom:'1.25rem' }}>Buyer Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="reg-label">Industry Vertical</label>
                    <input type="text" name="industryVertical" value={formData.industryVertical} onChange={handleChange}
                      placeholder="e.g., Automotive, Aerospace" className="reg-input" />
                  </div>
                  <div>
                    <label className="reg-label">Annual Spending</label>
                    <input type="text" name="annualSpending" value={formData.annualSpending} onChange={handleChange}
                      placeholder="Estimated annual spend" className="reg-input" />
                  </div>
                  <div>
                    <label className="reg-label">Procurement Team Size</label>
                    <input type="text" name="procurementTeamSize" value={formData.procurementTeamSize} onChange={handleChange} className="reg-input" />
                  </div>
                  <div>
                    <label className="reg-label">Preferred Lead Time</label>
                    <input type="text" name="preferredLeadTime" value={formData.preferredLeadTime} onChange={handleChange}
                      placeholder="e.g., 2-4 weeks" className="reg-input" />
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:'2rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(255,255,255,0.08)', alignItems:'center' }}>
            <button type="button" onClick={handleBack} disabled={currentStep === 1}
              style={{ padding:'0.7rem 1.5rem', borderRadius:'10px', border:'1px solid rgba(255,255,255,0.15)', background:'transparent', color: currentStep === 1 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)', cursor: currentStep === 1 ? 'not-allowed' : 'pointer', fontSize:'0.9rem', fontWeight:500, transition:'all 0.2s' }}>
              Back
            </button>
            {currentStep < totalSteps ? (
              <button type="button" onClick={handleNext}
                style={{ padding:'0.7rem 2rem', borderRadius:'10px', background:'linear-gradient(135deg,#4881F8,#6366f1)', border:'none', color:'#fff', fontSize:'0.9rem', fontWeight:600, cursor:'pointer', transition:'opacity 0.2s' }}>
                Next →
              </button>
            ) : (
              <button type="submit" disabled={isSubmitting}
                style={{ padding:'0.7rem 2rem', borderRadius:'10px', background:'linear-gradient(135deg,#4881F8,#6366f1)', border:'none', color:'#fff', fontSize:'0.9rem', fontWeight:600, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.6 : 1, display:'flex', alignItems:'center', gap:'0.5rem' }}>
                {isSubmitting ? <><span style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} /> Submitting...</> : 'Create Account'}
              </button>
            )}
          </div>
        </form>
        <div style={{ textAlign:'center', marginTop:'1.5rem' }}>
          <p style={{ color:'rgba(1,54,74,0.55)', fontSize:'0.875rem' }}>Already have an account? <button type="button" onClick={() => navigate('/login')} style={{ color:'#4881F8', fontWeight:600, background:'none', border:'none', cursor:'pointer', fontSize:'inherit' }}>Sign in</button></p>
        </div>
      </div>
    </div>
  );
};

export default EnigmaRegisterPage;

