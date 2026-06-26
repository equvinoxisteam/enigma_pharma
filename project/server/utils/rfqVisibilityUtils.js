const { getEffectivePlanType, PLAN_TYPES, hasFeature, FEATURE_KEYS } = require('../config/planFeatures');

const SELECTED_STATUSES = [
  'SUPPLIER_SELECTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED', 'CLOSED'
];

const SENSITIVE_DOC_TYPES = ['PROCESS_DESCRIPTION', 'ANALYTICAL_METHOD', 'DMF_REFERENCE'];

const maskBuyerForFree = (rfq) => ({
  companyName: 'Enigma Pharma Buyer',
  country: rfq?.country || '—',
  region: rfq?.region || '—',
  industryVertical: '—'
});

const isPaidManufacturer = (user) => {
  const plan = getEffectivePlanType(user);
  return plan !== PLAN_TYPES.FREE && hasFeature(user, FEATURE_KEYS.RFQ_RESPOND);
};

const isSelectedSupplier = (rfq, userId) => {
  const selectedId = rfq.selectedManufacturerId?._id?.toString()
    || rfq.selectedManufacturerId?.toString();
  return Boolean(selectedId && selectedId === userId.toString()
    && SELECTED_STATUSES.includes(rfq.status));
};

const sanitizeDocumentsForPreview = (documents, paid) => {
  if (!Array.isArray(documents)) return [];
  if (!paid) return [];
  return documents.filter((d) => !SENSITIVE_DOC_TYPES.includes(d.docType));
};

const sanitizeRfqForManufacturerView = (rfqDoc, user) => {
  const rfq = rfqDoc?.toObject ? rfqDoc.toObject() : { ...rfqDoc };
  const userId = user._id.toString();

  if (isSelectedSupplier(rfq, userId)) {
    return { ...rfq, visibilityTier: 'FULL' };
  }

  const paid = isPaidManufacturer(user);
  rfq.documents = sanitizeDocumentsForPreview(rfq.documents, paid);

  if (!paid) {
    rfq.buyerId = maskBuyerForFree(rfq);
    rfq.ndaFile = null;
    rfq.notes = null;
    rfq.requestJustification = null;
    rfq.regulatory = { requiredGmp: rfq.regulatory?.requiredGmp || [], requiredLicenses: [], dmfReferences: '', stabilityRequired: false };
    rfq.visibilityTier = 'FREE_PREVIEW';
  } else {
    if (rfq.buyerId && typeof rfq.buyerId === 'object') {
      rfq.buyerId = {
        companyName: rfq.buyerId.companyName || 'Pharma Buyer',
        country: rfq.buyerId.country,
        region: rfq.buyerId.region || rfq.region,
        industryVertical: rfq.buyerId.industryVertical
      };
    }
    rfq.visibilityTier = 'PAID_PREVIEW';
  }

  return rfq;
};

const sanitizePoolRfq = (rfqDoc, user) => {
  const rfq = sanitizeRfqForManufacturerView(rfqDoc, user);
  return {
    ...rfq,
    description: rfq.visibilityTier === 'FREE_PREVIEW'
      ? (rfq.description?.slice(0, 160) || 'Pharma RFQ — upgrade to view full project details.')
      : rfq.description
  };
};

const getRfqBuyerId = (rfq) => {
  if (!rfq?.buyerId) return null;
  return rfq.buyerId._id?.toString() || rfq.buyerId.toString();
};

const isRfqOwnedByUser = (rfq, userId) => {
  if (!userId || !rfq) return false;
  const buyerId = getRfqBuyerId(rfq);
  return buyerId === userId.toString();
};

module.exports = {
  SELECTED_STATUSES,
  isPaidManufacturer,
  isSelectedSupplier,
  sanitizeRfqForManufacturerView,
  sanitizePoolRfq,
  getRfqBuyerId,
  isRfqOwnedByUser
};
