const RFQ = require('../models/RFQ');
const ManufacturerRequest = require('../models/ManufacturerRequest');
const Invitation = require('../models/Invitation');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const { hasFeature, FEATURE_KEYS } = require('../config/planFeatures');
const {
  applyPendingPlanChanges,
  isManufacturerSubscriptionActive,
  getRfqRequestLimit,
  countRfqRequestsInPeriod
} = require('../utils/subscriptionUtils');
const { sanitizeRfqForManufacturerView, sanitizePoolRfq, isSelectedSupplier, isRfqOwnedByUser } = require('../utils/rfqVisibilityUtils');

// @desc    Create new RFQ
// @route   POST /api/rfqs
// @access  Private (Buyer/Hybrid)
const createRFQ = async (req, res) => {
  try {
    const {
      title, description, status = 'DRAFT', ndaFile, projectPdf, isCorporateRFQ,
      pharmaProject, documents, regulatory, requirements = {}
    } = req.body;
    const buyerId = req.user._id;

    if (req.user.userType === 'MANUFACTURER') {
      return res.status(403).json({ message: 'CDMO/API manufacturers cannot create RFQs. Only pharma buyers and hybrid accounts can publish projects.' });
    }

    if (!ndaFile) {
      return res.status(400).json({ message: 'NDA/CDA document is required for all pharma RFQs.' });
    }

    if (!pharmaProject?.serviceCategory) {
      return res.status(400).json({ message: 'Service category is required.' });
    }

    const rfqData = {
      buyerId,
      title,
      description: description || requirements?.description || '',
      status,
      pharmaProject,
      documents: documents || [],
      regulatory: regulatory || {},
      ndaFile,
      projectPdf: projectPdf || requirements?.projectPdf || '',
      isCorporateRFQ: Boolean(isCorporateRFQ || requirements?.isCorporateRFQ),
      preferredCurrency: requirements.preferredCurrency,
      rfqDeadline: requirements.rfqDeadline,
      acceptanceDeadline: requirements.acceptanceDeadline,
      projectTrackingId: requirements.projectTrackingId || requirements.partTrackingId,
      requestJustification: requirements.requestJustification,
      targetDeliveryDate: requirements.targetDeliveryDate,
      shippingTerms: requirements.shippingTerms,
      country: requirements.country,
      region: requirements.region,
      communicationLanguage: requirements.communicationLanguage,
      notes: requirements.notes
    };

    const rfq = await RFQ.create(rfqData);

    // Create notification for the buyer
    await createNotification({
      userId: buyerId,
      type: 'RFQ_CREATED',
      title: 'RFQ Created Successfully',
      message: `Your RFQ "${rfq.title}" has been created and is now open for manufacturer requests.`,
      link: `/my-rfqs/${rfq._id}`
    });

    res.status(201).json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Create RFQ error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid RFQ data', details: error.message });
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Get user's RFQs
// @route   GET /api/rfqs/my-rfqs
// @access  Private
const getMyRFQs = async (req, res) => {
  try {
    const { status, serviceCategory, country, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    const userType = req.user.userType;

    let query = {};

    if (userType === 'BUYER') {
      query.buyerId = userId;
    } else if (userType === 'MANUFACTURER') {
      // For manufacturers, get RFQs they've requested or been selected for
      const requestedRFQs = await ManufacturerRequest.find({ manufacturerId: userId }).select('rfqId');
      const rfqIds = requestedRFQs.map(r => r.rfqId);
      query.$or = [
        { _id: { $in: rfqIds } },
        { selectedManufacturerId: userId }
      ];
    } else if (userType === 'HYBRID') {
      const requestedRFQs = await ManufacturerRequest.find({ manufacturerId: userId }).select('rfqId');
      const rfqIds = requestedRFQs.map(r => r.rfqId);
      query.$or = [
        { buyerId: userId },
        { _id: { $in: rfqIds } },
        { selectedManufacturerId: userId }
      ];
    }

    if (status) query.status = status;
    if (serviceCategory) query['pharmaProject.serviceCategory'] = serviceCategory;
    if (country) query.country = country;

    const skip = (page - 1) * limit;
    const rfqs = await RFQ.find(query)
      .populate('buyerId', 'fullName companyName country')
      .populate('selectedManufacturerId', 'fullName companyName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RFQ.countDocuments(query);

    res.json({
      success: true,
      data: rfqs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get My RFQs error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Get RFQ Pool (for manufacturers)
// @route   GET /api/rfqs/pool
// @access  Private (Manufacturer/Hybrid)
const getRFQPool = async (req, res) => {
  try {
    if (req.user.userType === 'BUYER') {
      return res.status(403).json({ message: 'Only manufacturers can access RFQ pool' });
    }

    const {
      serviceCategory,
      developmentPhase,
      country,
      region,
      keyword,
      gmp,
      page = 1,
      limit = 20
    } = req.query;

    let query = {
      status: { $in: ['OPEN_FOR_REQUESTS', 'REQUESTS_PENDING'] },
      buyerId: { $ne: req.user._id }
    };

    if (serviceCategory) {
      const cats = Array.isArray(serviceCategory) ? serviceCategory : [serviceCategory];
      query['pharmaProject.serviceCategory'] = { $in: cats };
    }

    if (developmentPhase) {
      query['pharmaProject.developmentPhase'] = developmentPhase;
    }

    if (country) query.country = { $regex: country, $options: 'i' };
    if (region) query.region = { $regex: region, $options: 'i' };

    if (gmp) {
      const gmpArr = Array.isArray(gmp) ? gmp : [gmp];
      query['regulatory.requiredGmp'] = { $in: gmpArr };
    }

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
        { 'pharmaProject.moleculeName': { $regex: keyword, $options: 'i' } }
      ];
    }

    // Corporate RFQs visible only to Enterprise manufacturers
    if (!hasFeature(req.user, FEATURE_KEYS.CORPORATE_RFQS)) {
      query.isCorporateRFQ = { $ne: true };
    }

    // Exclude RFQs already requested by this manufacturer
    const existingRequests = await ManufacturerRequest.find({
      manufacturerId: req.user._id
    }).select('rfqId');
    const excludedIds = existingRequests.map(r => r.rfqId);
    if (excludedIds.length > 0) {
      query._id = { $nin: excludedIds };
    }

    const sortOrder = hasFeature(req.user, FEATURE_KEYS.CORPORATE_RFQS)
      ? { isCorporateRFQ: -1, createdAt: -1 }
      : { createdAt: -1 };

    const skip = (page - 1) * limit;
    const rfqs = await RFQ.find(query)
      .populate('buyerId', 'companyName country region industryVertical')
      .sort(sortOrder)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RFQ.countDocuments(query);

    // Calculate match scores for each RFQ
    const rfqsWithScores = await Promise.all(
      rfqs.map(async (rfq) => {
        let score = 0;
        const manufacturer = req.user;

        const mfrCategories = manufacturer.serviceCategories?.length
          ? manufacturer.serviceCategories
          : (manufacturer.manufacturingTypes || []);
        const rfqCat = rfq.pharmaProject?.serviceCategory;

        if (rfqCat && mfrCategories.includes(rfqCat)) score += 35;

        const mfrGmp = manufacturer.gmpCertifications?.length
          ? manufacturer.gmpCertifications
          : (manufacturer.certifications || []);
        const requiredGmp = rfq.regulatory?.requiredGmp || [];
        const gmpMatch = mfrGmp.filter((c) => requiredGmp.includes(c));
        score += gmpMatch.length * 15;

        if (manufacturer.country && rfq.country && manufacturer.country === rfq.country) score += 15;

        if (manufacturer.manufacturerSettings?.regionsServed && rfq.region) {
          if (manufacturer.manufacturerSettings.regionsServed.includes(rfq.region)) score += 10;
        }

        return {
          ...sanitizePoolRfq(rfq, manufacturer),
          matchScore: Math.min(score, 100)
        };
      })
    );

    res.json({
      success: true,
      data: rfqsWithScores,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get RFQ Pool error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Get accepted RFQs (for manufacturers)
// @route   GET /api/rfqs/accepted
// @access  Private (Manufacturer/Hybrid)
const getAcceptedRFQs = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const manufacturerId = req.user._id;

    let query = {
      selectedManufacturerId: manufacturerId,
      status: { $in: ['SUPPLIER_SELECTED', 'IN_PRODUCTION', 'SHIPPED', 'DELIVERED'] }
    };

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;
    const rfqs = await RFQ.find(query)
      .populate('buyerId', 'fullName companyName country region')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await RFQ.countDocuments(query);

    res.json({
      success: true,
      data: rfqs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Accepted RFQs error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Get RFQ by ID
// @route   GET /api/rfqs/:id
// @access  Private
const getRFQById = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id)
      .populate('buyerId', 'fullName companyName country region industryVertical')
      .populate('selectedManufacturerId', 'fullName companyName country region');

    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    // Check access permissions
    const userId = req.user._id;
    const isBuyer = rfq.buyerId._id.toString() === userId.toString();
    const isSelectedMfr = isSelectedSupplier(rfq, userId);

    if (!isBuyer && req.user.userType !== 'ADMIN' && !isSelectedMfr) {
      if (req.user.userType === 'MANUFACTURER' || req.user.userType === 'HYBRID') {
        const isOpenPoolRfq = rfq.status === 'OPEN_FOR_REQUESTS' || rfq.status === 'REQUESTS_PENDING';

        if (isOpenPoolRfq) {
          if (isRfqOwnedByUser(rfq, userId)) {
            return res.status(403).json({
              message: 'This is your own pharma RFQ. Manage it from My RFQs — you cannot bid on your own project.'
            });
          }
          return res.json({
            success: true,
            data: sanitizeRfqForManufacturerView(rfq, req.user)
          });
        }

        const request = await ManufacturerRequest.findOne({
          rfqId: rfq._id,
          manufacturerId: userId
        });

        if (!request) {
          return res.status(403).json({ message: 'Access denied' });
        }

        return res.json({
          success: true,
          data: sanitizeRfqForManufacturerView(rfq, req.user)
        });
      }

      return res.status(403).json({ message: 'Access denied' });
    }

    // Get manufacturer requests if buyer
    let manufacturerRequests = [];
    if (isBuyer && rfq.status !== 'SUPPLIER_SELECTED') {
      manufacturerRequests = await ManufacturerRequest.find({ rfqId: rfq._id })
        .populate('manufacturerId', 'fullName companyName country region certifications manufacturingTypes primaryMaterials')
        .sort({ requestedAt: -1 });
    }

    res.json({
      success: true,
      data: {
        ...rfq.toObject(),
        manufacturerRequests
      }
    });
  } catch (error) {
    console.error('Get RFQ by ID error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Update RFQ
// @route   PUT /api/rfqs/:id
// @access  Private (Buyer only)
const updateRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);

    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    if (rfq.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lockedStatuses = [
      'SUPPLIER_SELECTED',
      'IN_PRODUCTION',
      'SHIPPED',
      'DELIVERED',
      'CLOSED',
      'CANCELLED',
      'EXPIRED'
    ];
    if (lockedStatuses.includes(rfq.status)) {
      return res.status(400).json({ message: 'Cannot update RFQ after a manufacturer has been accepted' });
    }

    const updatedRFQ = await RFQ.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('buyerId', 'fullName companyName');

    res.json({
      success: true,
      data: updatedRFQ
    });
  } catch (error) {
    console.error('Update RFQ error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Delete RFQ
// @route   DELETE /api/rfqs/:id
// @access  Private (Buyer only)
const deleteRFQ = async (req, res) => {
  try {
    const rfq = await RFQ.findById(req.params.id);

    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    if (rfq.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const deletableStatuses = ['DRAFT', 'OPEN_FOR_REQUESTS', 'REQUESTS_PENDING'];
    if (!deletableStatuses.includes(rfq.status)) {
      return res.status(400).json({ message: 'Can only delete RFQs before a manufacturer is accepted' });
    }

    await RFQ.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'RFQ deleted successfully'
    });
  } catch (error) {
    console.error('Delete RFQ error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Request RFQ (Manufacturer requests to work on RFQ)
// @route   POST /api/rfqs/:id/request
// @access  Private (Manufacturer/Hybrid)
const requestRFQ = async (req, res) => {
  try {
    const { message, proposedLeadTime, technologyMatch, materialMatch } = req.body;
    const rfqId = req.params.id;
    const manufacturerId = req.user._id;

    if (req.user.userType === 'BUYER') {
      return res.status(403).json({ message: 'Only manufacturers and hybrid accounts can request RFQs. Buyers create RFQs instead.' });
    }

    await applyPendingPlanChanges(req.user);

    if (!isManufacturerSubscriptionActive(req.user)) {
      return res.status(403).json({ message: 'Your subscription is paused or inactive. Contact support or upgrade to request RFQs.' });
    }

    if (!hasFeature(req.user, FEATURE_KEYS.RFQ_RESPOND)) {
      return res.status(403).json({ message: 'Upgrade to Standard or higher to send RFQ requests. Free plan is view-only.' });
    }

    const requestLimit = getRfqRequestLimit(req.user);
    if (requestLimit === 0) {
      return res.status(403).json({ message: 'Your plan does not include RFQ requests. Upgrade to Standard (20/year), Pro (40/year), or Enterprise (unlimited).' });
    }

    if (requestLimit !== null) {
      const used = await countRfqRequestsInPeriod(manufacturerId, req.user.subscription?.startsAt);
      if (used >= requestLimit) {
        return res.status(403).json({
          message: `Annual RFQ request limit reached (${used}/${requestLimit}). Upgrade your plan for more requests.`,
          limit: requestLimit,
          used
        });
      }
    }

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    if (isRfqOwnedByUser(rfq, manufacturerId)) {
      return res.status(403).json({
        message: 'You cannot bid on your own RFQ. Manage it from My RFQs.'
      });
    }

    if (rfq.status !== 'OPEN_FOR_REQUESTS' && rfq.status !== 'REQUESTS_PENDING') {
      return res.status(400).json({ message: 'RFQ is not accepting requests' });
    }

    // Check if already requested
    const existingRequest = await ManufacturerRequest.findOne({
      rfqId,
      manufacturerId
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'You have already requested this RFQ' });
    }

    // Calculate match score (pharma)
    let matchScore = 0;
    const manufacturer = req.user;
    const mfrCategories = manufacturer.serviceCategories?.length
      ? manufacturer.serviceCategories
      : (manufacturer.manufacturingTypes || []);
    const rfqCat = rfq.pharmaProject?.serviceCategory;
    if (rfqCat && mfrCategories.includes(rfqCat)) matchScore += 35;

    const mfrGmp = manufacturer.gmpCertifications?.length
      ? manufacturer.gmpCertifications
      : (manufacturer.certifications || []);
    const requiredGmp = rfq.regulatory?.requiredGmp || [];
    matchScore += mfrGmp.filter((c) => requiredGmp.includes(c)).length * 15;

    const manufacturerRequest = await ManufacturerRequest.create({
      rfqId,
      manufacturerId,
      message,
      proposedLeadTime,
      technologyMatch: technologyMatch || false,
      materialMatch: materialMatch || false,
      matchScore
    });

    // Update RFQ status if first request
    if (rfq.status === 'OPEN_FOR_REQUESTS') {
      rfq.status = 'REQUESTS_PENDING';
      await rfq.save();
    }

    // Notify buyer about new manufacturer request
    await createNotification({
      userId: rfq.buyerId,
      type: 'QUOTE_RECEIVED',
      title: 'New Manufacturer Request',
      message: `A manufacturer has requested to work on your RFQ "${rfq.title}".`,
      link: `/my-rfqs/${rfq._id}?tab=requests`,
      metadata: { rfqId: rfq._id, manufacturerId }
    });

    res.status(201).json({
      success: true,
      data: manufacturerRequest
    });
  } catch (error) {
    console.error('Request RFQ error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Accept manufacturer for RFQ
// @route   POST /api/rfqs/:id/accept-manufacturer
// @access  Private (Buyer only)
const acceptManufacturer = async (req, res) => {
  try {
    const { manufacturerRequestId } = req.body;
    const rfqId = req.params.id;
    const buyerId = req.user._id;

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    if (rfq.buyerId.toString() !== buyerId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const manufacturerRequest = await ManufacturerRequest.findById(manufacturerRequestId)
      .populate('manufacturerId');

    if (!manufacturerRequest) {
      return res.status(404).json({ message: 'Manufacturer request not found' });
    }

    if (manufacturerRequest.rfqId.toString() !== rfqId) {
      return res.status(400).json({ message: 'Invalid manufacturer request for this RFQ' });
    }

    const selectedMfrId = manufacturerRequest.manufacturerId._id?.toString()
      || manufacturerRequest.manufacturerId.toString();
    if (selectedMfrId === buyerId.toString()) {
      return res.status(403).json({ message: 'You cannot accept your own bid on your RFQ.' });
    }

    // Update RFQ
    rfq.selectedManufacturerId = manufacturerRequest.manufacturerId._id;
    rfq.selectedManufacturerRequestId = manufacturerRequestId;
    rfq.status = 'SUPPLIER_SELECTED';
    await rfq.save();

    // Update manufacturer request status
    manufacturerRequest.status = 'ACCEPTED';
    manufacturerRequest.respondedAt = new Date();
    await manufacturerRequest.save();

    // Reject other requests
    await ManufacturerRequest.updateMany(
      {
        rfqId,
        _id: { $ne: manufacturerRequestId }
      },
      {
        status: 'REJECTED',
        respondedAt: new Date()
      }
    );

    // Notify accepted manufacturer
    await createNotification({
      userId: manufacturerRequest.manufacturerId._id,
      type: 'QUOTE_ACCEPTED',
      title: 'Your Request Was Accepted!',
      message: `You have been selected as the manufacturer for RFQ "${rfq.title}".`,
      link: `/accepted-rfqs/${rfq._id}`,
      metadata: { rfqId: rfq._id }
    });

    res.json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Accept manufacturer error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Reject manufacturer request
// @route   POST /api/rfqs/:id/reject-manufacturer
// @access  Private (Buyer only)
const rejectManufacturer = async (req, res) => {
  try {
    const { manufacturerRequestId, rejectionReason } = req.body;
    const rfqId = req.params.id;
    const buyerId = req.user._id;

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    if (rfq.buyerId.toString() !== buyerId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const manufacturerRequest = await ManufacturerRequest.findById(manufacturerRequestId);

    if (!manufacturerRequest || manufacturerRequest.rfqId.toString() !== rfqId) {
      return res.status(404).json({ message: 'Manufacturer request not found' });
    }

    manufacturerRequest.status = 'REJECTED';
    manufacturerRequest.respondedAt = new Date();
    manufacturerRequest.rejectionReason = rejectionReason;
    await manufacturerRequest.save();

    res.json({
      success: true,
      message: 'Manufacturer request rejected'
    });
  } catch (error) {
    console.error('Reject manufacturer error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Update RFQ status
// @route   PUT /api/rfqs/:id/status
// @access  Private
const updateRFQStatus = async (req, res) => {
  try {
    const { status, productionStatus, trackingInfo, shippingDocs } = req.body;
    const rfqId = req.params.id;
    const userId = req.user._id;

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      return res.status(404).json({ message: 'RFQ not found' });
    }

    // Check permissions
    const isBuyer = rfq.buyerId.toString() === userId.toString();
    const isManufacturer = rfq.selectedManufacturerId && 
      rfq.selectedManufacturerId.toString() === userId.toString();

    if (!isBuyer && !isManufacturer) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Status transition logic
    const validTransitions = {
      SUPPLIER_SELECTED: ['IN_PRODUCTION'],
      IN_PRODUCTION: ['SHIPPED', 'QUALITY_CHECK', 'READY_TO_SHIP'],
      SHIPPED: ['DELIVERED'],
      DELIVERED: ['CLOSED']
    };

    if (status && validTransitions[rfq.status] && !validTransitions[rfq.status].includes(status)) {
      return res.status(400).json({ 
        message: `Invalid status transition from ${rfq.status} to ${status}` 
      });
    }

    // Update fields
    if (status) rfq.status = status;
    if (productionStatus) rfq.productionStatus = productionStatus;
    if (trackingInfo) rfq.trackingInfo = trackingInfo;
    if (shippingDocs) rfq.shippingDocs = shippingDocs;

    if (status === 'CLOSED' || status === 'DELIVERED') {
      rfq.closedAt = new Date();
    }

    await rfq.save();

    res.json({
      success: true,
      data: rfq
    });
  } catch (error) {
    console.error('Update RFQ status error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

module.exports = {
  createRFQ,
  getRFQById,
  updateRFQ,
  deleteRFQ,
  getRFQPool,
  requestRFQ,
  acceptManufacturer,
  rejectManufacturer,
  updateRFQStatus,
  getAcceptedRFQs,
  getMyRFQs
};

