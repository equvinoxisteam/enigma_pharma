const { getEffectivePlanType, PLAN_TYPES, hasFeature, FEATURE_KEYS } = require('../config/planFeatures');

const sanitizePublicManufacturerProfile = (userDoc) => {
  const user = userDoc?.toObject ? userDoc.toObject() : { ...userDoc };
  const plan = getEffectivePlanType(user);
  const isFree = plan === PLAN_TYPES.FREE;
  const isPaid = !isFree && hasFeature(user, FEATURE_KEYS.RFQ_RESPOND);

  if (!isPaid) {
    return {
      ...user,
      planType: plan,
      companyName: 'Enigma Pharma Partner',
      fullName: 'Enigma Manufacturer',
      companyLogo: '',
      companyBanner: '',
      description: 'Upgrade to a paid plan to reveal full manufacturer credentials.',
      facilityPhotos: [],
      companyPresentationUrl: '',
      companyBrochurePdfUrl: '',
      companyProfilePdfUrl: '',
      primaryMaterials: [],
      manufacturingTypes: [],
      certifications: [],
      website: '',
      isProfileHidden: true,
      manufacturerSettings: {
        ...(user.manufacturerSettings || {}),
        isVerified: false,
        materials: [],
        machinery: [],
        technologies: []
      }
    };
  }

  return {
    ...user,
    planType: plan,
    isProfileHidden: false,
    manufacturerSettings: {
      ...(user.manufacturerSettings || {}),
      isVerified: hasFeature(user, FEATURE_KEYS.VERIFIED_BADGE) || user.manufacturerSettings?.isVerified
    }
  };
};

module.exports = { sanitizePublicManufacturerProfile };
