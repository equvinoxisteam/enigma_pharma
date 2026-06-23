const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    enum: ['Mr', 'Mrs', 'Ms', 'Dr', ''],
    default: ''
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please add a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  phoneNumber: {
    type: String,
    required: true
  },
  
  // User Role
  userType: {
    type: String,
    enum: ['BUYER', 'MANUFACTURER', 'HYBRID'],
    required: true
  },
  
  // Company Information
  companyName: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    default: ''
  },
  companyLogo: {
    type: String,
    default: ''
  },
  companyBanner: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  companyPresentationUrl: {
    type: String,
    default: ''
  },
  companyBrochurePdfUrl: {
    type: String,
    default: ''
  },
  companyProfilePdfUrl: {
    type: String,
    default: ''
  },
  gstNumber: {
    type: String,
    default: ''
  },
  
  // Address
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true,
    match: [/^[0-9]{5,6}$/, 'Please add a valid zip code']
  },
  country: {
    type: String,
    default: 'India'
  },
  
  // Manufacturer Specific Fields
  manufacturingTypes: [{
    type: String
  }],
  serviceCategories: [{
    type: String
  }],
  gmpCertifications: [{
    type: String
  }],
  licenseDocuments: [{
    label: { type: String, default: '' },
    fileUrl: { type: String, default: '' }
  }],
  batchScaleCapacity: {
    type: String,
    default: ''
  },
  buyerCompanyType: {
    type: String,
    default: ''
  },
  therapeuticAreas: [{
    type: String
  }],
  companySize: {
    type: String,
    default: ''
  },
  yearsInBusiness: {
    type: Number,
    default: 0
  },
  facilityPhotos: [{
    type: String // URLs to S3
  }],
  maxDimensions: {
    height: { type: Number, default: 0 },
    width: { type: Number, default: 0 },
    length: { type: Number, default: 0 }
  },
  primaryMaterials: [{
    type: String
  }],
  certifications: [{
    type: String
  }],
  manufacturerStatus: {
    type: String,
    enum: ['PENDING_REVIEW', 'ACTIVE', 'SUSPENDED'],
    default: 'PENDING_REVIEW'
  },
  profileCompleteness: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Buyer Specific Fields
  industryVertical: {
    type: String,
    default: ''
  },
  annualSpending: {
    type: String,
    default: ''
  },
  procurementTeamSize: {
    type: String,
    default: ''
  },
  preferredLeadTime: {
    type: String,
    default: ''
  },
  
  // Buyer Settings (Profile defaults)
  buyerSettings: {
    defaultCountry: { type: String, default: '' },
    defaultRegion: { type: String, default: '' },
    preferredCurrency: { type: String, default: 'USD' },
    defaultIncoterms: { type: String, default: 'FOB' },
    communicationLanguage: { type: String, default: 'English' },
    savedShippingAddresses: [{
      name: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      isDefault: { type: Boolean, default: false }
    }],
    billingInfo: {
      companyName: String,
      taxId: String,
      address: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  
  // Manufacturer Settings (Profile)
  manufacturerSettings: {
    technologies: [{
      type: String,
      enum: ['CNC', 'TURNING', 'MILLING', '3D_PRINTING', 'SHEET_METAL', 'DIE_CASTING', 'INJECTION_MOLDING', 'STAMPING', 'WELDING', 'ASSEMBLY', 'OTHER']
    }],
    materials: [{
      type: String
    }],
    partTypes: [{
      type: String // Tags
    }],
    machinery: [{
      type: String // Tags
    }],
    regionsServed: [{
      type: String
    }],
    languages: [{
      type: String
    }],
    capacityStatus: {
      type: String,
      enum: ['OPEN', 'HIGH_DEMAND', 'FULL'],
      default: 'OPEN'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    videoSlides: [{
      url: String,
      title: String
    }]
  },
  
  // Saved/Starred Manufacturers (for Buyers)
  savedManufacturers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Email Verification
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  
  // Password Reset
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['ACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED'],
    default: 'PENDING_VERIFICATION'
  },
  
  // Admin Flag
  isAdmin: {
    type: Boolean,
    default: false
  },

  // Subscription/Plan
  subscription: {
    planType: {
      type: String,
      enum: ['BUYER_FREE', 'FREE', 'STANDARD', 'PRO', 'ENTERPRISE'],
      default: 'FREE'
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'PENDING', 'CANCELLED', 'PAUSED', 'DEACTIVATED'],
      default: 'ACTIVE'
    },
    amountPaid: {
      type: Number,
      default: 0
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'YEARLY', 'NONE'],
      default: 'YEARLY'
    },
    startsAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: {
      type: Date,
      default: null
    },
    lastPaymentId: {
      type: String,
      default: ''
    },
    lastOrderId: {
      type: String,
      default: ''
    },
    pendingPlanType: {
      type: String,
      enum: ['BUYER_FREE', 'FREE', 'STANDARD', 'PRO', 'ENTERPRISE'],
      default: null
    },
    pendingPlanEffectiveAt: {
      type: Date,
      default: null
    },
    pausedAt: {
      type: Date,
      default: null
    },
    deactivatedAt: {
      type: Date,
      default: null
    }
  },

  // Account security
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },

  // Notification preferences
  notificationSettings: {
    email: {
      rfqRequests: { type: Boolean, default: true },
      invitations: { type: Boolean, default: true },
      statusChanges: { type: Boolean, default: true },
      chatMessages: { type: Boolean, default: true },
      shipments: { type: Boolean, default: true }
    },
    inApp: {
      rfqRequests: { type: Boolean, default: true },
      invitations: { type: Boolean, default: true },
      statusChanges: { type: Boolean, default: true },
      chatMessages: { type: Boolean, default: true },
      shipments: { type: Boolean, default: true }
    }
  },

  // UI/User preferences
  preferences: {
    currency: { type: String, default: 'USD' },
    language: { type: String, default: 'English' },
    timezone: { type: String, default: 'UTC' },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'light' }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Indexes for search
userSchema.index({ companyName: 'text', fullName: 'text' }); // Text search
userSchema.index({ userType: 1, manufacturerStatus: 1 });
userSchema.index({ 'manufacturerSettings.technologies': 1 });
userSchema.index({ 'manufacturerSettings.materials': 1 });
userSchema.index({ 'manufacturerSettings.partTypes': 1 });
userSchema.index({ 'manufacturerSettings.machinery': 1 });
userSchema.index({ country: 1, region: 1 });
userSchema.index({ certifications: 1 });
userSchema.index({ companySize: 1 });

module.exports = mongoose.model('User', userSchema);
