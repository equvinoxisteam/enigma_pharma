const { getEffectivePlanType, PLAN_TYPES, hasFeature, FEATURE_KEYS } = require('../config/planFeatures');

const SELECTED_STATUSES = [
  'SUPPLIER_SELECTED',
  'IN_PRODUCTION',
  'SHIPPED',
  'DELIVERED',
  'CLOSED'
];

const isStlFile = (url) => {
  if (!url || typeof url !== 'string') return false;
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  return ext === 'stl';
};

const sanitizeWorkpieceForPreview = (workpiece) => {
  const wp = workpiece?.toObject ? workpiece.toObject() : { ...workpiece };
  wp.extraFiles = [];
  if (!isStlFile(wp.mainFile)) {
    wp.mainFile = '';
  }
  return wp;
};

const maskBuyerForFree = (rfq) => ({
  companyName: 'Enigma Buyer',
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

/**
 * Before buyer accepts a supplier: STL only, no extra files.
 * Free manufacturers: masked buyer, no NDA, minimal fields.
 * Paid manufacturers: limited buyer snapshot + NDA when present.
 */
const sanitizeRfqForManufacturerView = (rfqDoc, user) => {
  const rfq = rfqDoc?.toObject ? rfqDoc.toObject() : { ...rfqDoc };
  const userId = user._id.toString();

  if (isSelectedSupplier(rfq, userId)) {
    return { ...rfq, visibilityTier: 'FULL' };
  }

  const paid = isPaidManufacturer(user);

  rfq.workpieces = (rfq.workpieces || []).map(sanitizeWorkpieceForPreview);

  if (!paid) {
    rfq.buyerId = maskBuyerForFree(rfq);
    rfq.ndaFile = null;
    rfq.notes = null;
    rfq.requestJustification = null;
    rfq.visibilityTier = 'FREE_PREVIEW';
  } else {
    if (rfq.buyerId && typeof rfq.buyerId === 'object') {
      rfq.buyerId = {
        companyName: rfq.buyerId.companyName || 'Buyer',
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
      ? (rfq.description?.slice(0, 160) || 'RFQ opportunity — upgrade to view full details.')
      : rfq.description
  };
};

module.exports = {
  SELECTED_STATUSES,
  isStlFile,
  isPaidManufacturer,
  isSelectedSupplier,
  sanitizeRfqForManufacturerView,
  sanitizePoolRfq
};
