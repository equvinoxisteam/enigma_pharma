const mongoose = require('mongoose');
const RFQ = require('../models/RFQ');
const ManufacturerRequest = require('../models/ManufacturerRequest');
const Rating = require('../models/Rating');

const getDateFilter = (range) => {
  const now = new Date();
  const start = new Date(now);
  switch (range) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      start.setMonth(now.getMonth() - 3);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    case 'all':
    default:
      return null;
  }
  return { $gte: start };
};

const toChartData = (obj) =>
  Object.entries(obj)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

const getManufacturerAnalytics = async (userId, range) => {
  const dateFilter = getDateFilter(range);
  const matchBase = { manufacturerId: userId };
  if (dateFilter) matchBase.createdAt = dateFilter;

  const requests = await ManufacturerRequest.find(matchBase).lean();
  const accepted = requests.filter((r) => r.status === 'ACCEPTED');
  const pending = requests.filter((r) => r.status === 'PENDING');

  const ratings = await Rating.find({
    manufacturerId: userId,
    ...(dateFilter ? { createdAt: dateFilter } : {})
  }).lean();

  const avgRating = ratings.length
    ? Number((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1))
    : 0;

  const avgLeadTime = accepted.length
    ? Math.round(accepted.reduce((s, r) => s + (r.proposedLeadTime || 0), 0) / accepted.length)
    : 0;

  const winRate = requests.length ? Math.round((accepted.length / requests.length) * 100) : 0;

  const rfqFilter = { selectedManufacturerId: userId };
  if (dateFilter) rfqFilter.updatedAt = dateFilter;
  const wonRfqs = await RFQ.find(rfqFilter).lean();

  const byTechnology = {};
  const byRegion = {};
  wonRfqs.forEach((rfq) => {
    rfq.workpieces?.forEach((wp) => {
      if (wp.technology) {
        byTechnology[wp.technology] = (byTechnology[wp.technology] || 0) + 1;
      }
    });
    const regionLabel = rfq.region || rfq.country || 'Unknown';
    byRegion[regionLabel] = (byRegion[regionLabel] || 0) + 1;
  });

  const timeline = await ManufacturerRequest.aggregate([
    { $match: { manufacturerId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        requests: { $sum: 1 },
        won: { $sum: { $cond: [{ $eq: ['$status', 'ACCEPTED'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 12 }
  ]);

  return {
    kpis: {
      requestsReceived: pending.length + accepted.length,
      rfqsAccepted: accepted.length,
      winRate,
      revenueWon: wonRfqs.length * 0,
      avgLeadTime,
      avgRating
    },
    byTechnology: toChartData(byTechnology),
    byRegion: toChartData(byRegion),
    timeline: timeline.map((t) => ({
      label: t._id,
      requests: t.requests,
      won: t.won
    }))
  };
};

const getBuyerAnalytics = async (userId, range) => {
  const dateFilter = getDateFilter(range);
  const matchBase = { buyerId: userId };
  if (dateFilter) matchBase.createdAt = dateFilter;

  const rfqs = await RFQ.find(matchBase).lean();
  const active = rfqs.filter((r) => !['CLOSED', 'CANCELLED', 'EXPIRED'].includes(r.status));
  const pending = rfqs.filter((r) => r.status === 'REQUESTS_PENDING');
  const inProduction = rfqs.filter((r) => r.status === 'IN_PRODUCTION');
  const closed = rfqs.filter((r) => r.status === 'CLOSED' || r.status === 'DELIVERED');

  const byTechnology = {};
  const byRegion = {};
  rfqs.forEach((rfq) => {
    rfq.workpieces?.forEach((wp) => {
      if (wp.technology) {
        byTechnology[wp.technology] = (byTechnology[wp.technology] || 0) + 1;
      }
    });
    const regionLabel = rfq.region || rfq.country || 'Unknown';
    byRegion[regionLabel] = (byRegion[regionLabel] || 0) + 1;
  });

  const timeline = await RFQ.aggregate([
    { $match: { buyerId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        requests: { $sum: 1 },
        won: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 12 }
  ]);

  return {
    kpis: {
      requestsReceived: pending.length,
      rfqsAccepted: closed.length,
      winRate: rfqs.length ? Math.round((closed.length / rfqs.length) * 100) : 0,
      revenueWon: 0,
      avgLeadTime: 0,
      avgRating: 0,
      activeRFQs: active.length,
      inProduction: inProduction.length
    },
    byTechnology: toChartData(byTechnology),
    byRegion: toChartData(byRegion),
    timeline: timeline.map((t) => ({
      label: t._id,
      requests: t.requests,
      won: t.won
    }))
  };
};

const getAnalytics = async (req, res) => {
  try {
    const { range = 'month' } = req.query;
    const userType = req.user.userType;

    let data;
    if (userType === 'BUYER') {
      data = await getBuyerAnalytics(req.user._id, range);
    } else {
      data = await getManufacturerAnalytics(req.user._id, range);
    }

    res.json({ success: true, data, userType });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to load analytics' });
  }
};

module.exports = { getAnalytics };
