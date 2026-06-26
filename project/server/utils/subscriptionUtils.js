const ManufacturerRequest = require('../models/ManufacturerRequest');
const { PLAN_TYPES, getEffectivePlanType, hasFeature, FEATURE_KEYS } = require('../config/planFeatures');

const DOWNGRADE_BUFFER_MS = 24 * 60 * 60 * 1000;

const PLAN_RFQ_REQUEST_LIMITS = {
  [PLAN_TYPES.FREE]: 0,
  [PLAN_TYPES.STANDARD]: 20,
  [PLAN_TYPES.PRO]: 40,
  [PLAN_TYPES.ENTERPRISE]: null
};

const PLAN_RANK = {
  [PLAN_TYPES.FREE]: 0,
  [PLAN_TYPES.STANDARD]: 1,
  [PLAN_TYPES.PRO]: 2,
  [PLAN_TYPES.ENTERPRISE]: 3
};

const isDowngrade = (fromPlan, toPlan) => (PLAN_RANK[toPlan] ?? 0) < (PLAN_RANK[fromPlan] ?? 0);

const clearPendingPlan = (subscription) => {
  if (!subscription) return;
  subscription.pendingPlanType = undefined;
  subscription.pendingPlanEffectiveAt = undefined;
};

const applyPendingPlanChanges = async (user) => {
  if (!user?.subscription?.pendingPlanType || !user.subscription.pendingPlanEffectiveAt) {
    return user;
  }

  if (new Date() >= new Date(user.subscription.pendingPlanEffectiveAt)) {
    user.subscription.planType = user.subscription.pendingPlanType;
    clearPendingPlan(user.subscription);

    if (user.subscription.planType === PLAN_TYPES.FREE) {
      user.subscription.status = 'ACTIVE';
      if (user.manufacturerSettings) {
        user.manufacturerSettings.isVerified = false;
      }
    }

    await user.save();
  }

  return user;
};

const isManufacturerSubscriptionActive = (user) => {
  if (!user || user.userType === 'BUYER') return true;
  const status = user.subscription?.status;
  return status === 'ACTIVE' && !isSubscriptionExpired(user);
};

const isSubscriptionExpired = (user) => {
  const expiresAt = user?.subscription?.expiresAt;
  if (!expiresAt) return false;
  return new Date() > new Date(expiresAt);
};

const getRfqRequestLimit = (user) => {
  if (user?.userType === 'BUYER') return null;
  const plan = getEffectivePlanType(user);
  if (plan === PLAN_TYPES.BUYER_FREE) return null;
  return PLAN_RFQ_REQUEST_LIMITS[plan] ?? 0;
};

const countRfqRequestsInPeriod = async (manufacturerId, periodStart) => {
  const since = periodStart ? new Date(periodStart) : new Date(0);
  return ManufacturerRequest.countDocuments({
    manufacturerId,
    createdAt: { $gte: since }
  });
};

const getSubscriptionUsage = async (user) => {
  const plan = getEffectivePlanType(user);
  const limit = getRfqRequestLimit(user);
  const periodStart = user?.subscription?.startsAt || user?.createdAt;
  const used = (user?.userType === 'MANUFACTURER' || user?.userType === 'HYBRID')
    ? await countRfqRequestsInPeriod(user._id, periodStart)
    : 0;

  return {
    planType: plan,
    status: user?.subscription?.status || 'ACTIVE',
    rfqRequestsUsed: used,
    rfqRequestsLimit: limit,
    rfqRequestsRemaining: limit === null ? null : Math.max(0, limit - used),
    expiresAt: user?.subscription?.expiresAt || null,
    pendingPlanType: user?.subscription?.pendingPlanType || null,
    pendingPlanEffectiveAt: user?.subscription?.pendingPlanEffectiveAt || null,
    canRequestRfqs: hasFeature(user, FEATURE_KEYS.RFQ_RESPOND)
      && isManufacturerSubscriptionActive(user)
      && (limit === null || used < limit)
  };
};

const schedulePlanDowngrade = (user, targetPlan = PLAN_TYPES.FREE) => {
  const current = user.subscription.planType;
  if (current === targetPlan) {
    clearPendingPlan(user.subscription);
    return;
  }

  user.subscription.pendingPlanType = targetPlan;
  user.subscription.pendingPlanEffectiveAt = new Date(Date.now() + DOWNGRADE_BUFFER_MS);
};

const activatePlan = (user, planType) => {
  user.subscription.planType = planType;
  user.subscription.status = 'ACTIVE';
  user.subscription.startsAt = new Date();
  user.subscription.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  clearPendingPlan(user.subscription);
  user.subscription.pausedAt = null;
  user.subscription.deactivatedAt = null;

  if (['PRO', 'ENTERPRISE'].includes(planType)) {
    user.manufacturerSettings = user.manufacturerSettings || {};
    user.manufacturerSettings.isVerified = true;
  } else if (planType === PLAN_TYPES.FREE || planType === PLAN_TYPES.STANDARD) {
    if (user.manufacturerSettings) {
      user.manufacturerSettings.isVerified = false;
    }
  }
};

module.exports = {
  DOWNGRADE_BUFFER_MS,
  PLAN_RFQ_REQUEST_LIMITS,
  applyPendingPlanChanges,
  isManufacturerSubscriptionActive,
  isSubscriptionExpired,
  isDowngrade,
  getRfqRequestLimit,
  countRfqRequestsInPeriod,
  getSubscriptionUsage,
  schedulePlanDowngrade,
  activatePlan
};
