const mongoose = require('mongoose');
const {
  SERVICE_CATEGORIES,
  DEVELOPMENT_PHASES,
  GMP_CERTIFICATIONS,
  LICENSE_TYPES,
  DOCUMENT_TYPES,
  BATCH_SCALES
} = require('../config/pharmaTaxonomy');

const rfqSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: {
    type: String,
    enum: [
      'DRAFT', 'OPEN_FOR_REQUESTS', 'REQUESTS_PENDING', 'SUPPLIER_SELECTED',
      'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CLOSED', 'EXPIRED', 'CANCELLED'
    ],
    default: 'DRAFT'
  },

  pharmaProject: {
    serviceCategory: { type: String, enum: SERVICE_CATEGORIES, required: true },
    serviceCategoryOther: { type: String, default: '' },
    moleculeName: { type: String, trim: true, default: '' },
    developmentPhase: { type: String, enum: DEVELOPMENT_PHASES, default: 'OTHER' },
    therapeuticArea: { type: String, default: '' },
    targetMarkets: [{ type: String }],
    batchScale: { type: String, enum: BATCH_SCALES, default: 'NOT_SPECIFIED' },
    annualVolume: { type: String, default: '' }
  },

  documents: [{
    docType: { type: String, enum: DOCUMENT_TYPES, default: 'OTHER' },
    fileUrl: { type: String, required: true },
    fileName: { type: String, default: '' }
  }],

  regulatory: {
    requiredGmp: [{ type: String, enum: GMP_CERTIFICATIONS }],
    requiredLicenses: [{ type: String, enum: LICENSE_TYPES }],
    dmfReferences: { type: String, default: '' },
    stabilityRequired: { type: Boolean, default: false }
  },

  ndaFile: { type: String, required: true },

  preferredCurrency: { type: String, default: 'USD' },
  rfqDeadline: { type: Date, required: true },
  acceptanceDeadline: { type: Date },
  projectTrackingId: { type: String },
  requestJustification: { type: String },
  targetDeliveryDate: { type: Date },
  shippingTerms: { type: String, default: 'FOB' },
  country: { type: String, required: true },
  region: { type: String },
  communicationLanguage: { type: String, default: 'English' },
  notes: { type: String },
  isCorporateRFQ: { type: Boolean, default: false },

  selectedManufacturerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  selectedManufacturerRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'ManufacturerRequest' },

  productionStatus: {
    type: String,
    enum: ['NOT_STARTED', 'QUALITY_CHECK', 'READY_TO_SHIP', 'SHIPPED'],
    default: 'NOT_STARTED'
  },
  trackingInfo: {
    trackingId: String,
    carrier: String,
    shippingDate: Date
  },
  shippingDocs: [{ type: { type: String }, url: String }],

  closedAt: { type: Date }
}, { timestamps: true });

rfqSchema.index({ buyerId: 1, status: 1 });
rfqSchema.index({ status: 1, createdAt: -1 });
rfqSchema.index({ 'pharmaProject.serviceCategory': 1 });
rfqSchema.index({ 'pharmaProject.developmentPhase': 1 });
rfqSchema.index({ country: 1, region: 1 });
rfqSchema.index({ title: 'text', description: 'text', 'pharmaProject.moleculeName': 'text' });

module.exports = mongoose.model('RFQ', rfqSchema);
