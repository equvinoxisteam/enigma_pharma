const Invitation = require('../models/Invitation');
const RFQ = require('../models/RFQ');
const ManufacturerRequest = require('../models/ManufacturerRequest');
const {
  applyPendingPlanChanges,
  isManufacturerSubscriptionActive,
  getRfqRequestLimit,
  countRfqRequestsInPeriod
} = require('../utils/subscriptionUtils');
const { hasFeature, FEATURE_KEYS } = require('../config/planFeatures');

// @desc    Get invitations for manufacturer
// @route   GET /api/invitations
// @access  Private (Manufacturer/Hybrid)
const getInvitations = async (req, res) => {
  try {
    const manufacturerId = req.user._id;

    const invitations = await Invitation.find({ manufacturerId })
      .populate('rfqId', 'title pharmaProject status country region')
      .populate('buyerId', 'fullName companyName country region')
      .sort({ invitedAt: -1 });

    res.json({
      success: true,
      data: invitations
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Create invitation
// @route   POST /api/invitations
// @access  Private (Buyer/Hybrid)
const createInvitation = async (req, res) => {
  try {
    const { rfqId, manufacturerId, message } = req.body;
    const buyerId = req.user._id;

    const rfq = await RFQ.findById(rfqId);
    if (!rfq || rfq.buyerId.toString() !== buyerId.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (rfq.status !== 'OPEN_FOR_REQUESTS' && rfq.status !== 'REQUESTS_PENDING') {
      return res.status(400).json({ message: 'RFQ is not accepting invitations' });
    }

    // Check if already invited
    const existingInvitation = await Invitation.findOne({
      rfqId,
      manufacturerId
    });

    if (existingInvitation) {
      return res.status(400).json({ message: 'Manufacturer already invited' });
    }

    const invitation = await Invitation.create({
      rfqId,
      buyerId,
      manufacturerId,
      message
    });

    res.status(201).json({
      success: true,
      data: invitation
    });
  } catch (error) {
    console.error('Create invitation error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Accept invitation
// @route   POST /api/invitations/:id/accept
// @access  Private (Manufacturer/Hybrid)
const acceptInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id)
      .populate('rfqId');

    if (!invitation || invitation.manufacturerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await applyPendingPlanChanges(req.user);

    if (!isManufacturerSubscriptionActive(req.user)) {
      return res.status(403).json({ message: 'Subscription is paused or inactive' });
    }

    let manufacturerRequest = await ManufacturerRequest.findOne({
      rfqId: invitation.rfqId._id,
      manufacturerId: req.user._id
    });

    if (!manufacturerRequest) {
      const requestLimit = getRfqRequestLimit(req.user);
      if (!hasFeature(req.user, FEATURE_KEYS.RFQ_RESPOND) || requestLimit === 0) {
        return res.status(403).json({ message: 'Upgrade to a paid plan to respond to invitations with RFQ requests' });
      }
      if (requestLimit !== null) {
        const used = await countRfqRequestsInPeriod(req.user._id, req.user.subscription?.startsAt);
        if (used >= requestLimit) {
          return res.status(403).json({ message: `RFQ request limit reached (${used}/${requestLimit})` });
        }
      }
      manufacturerRequest = await ManufacturerRequest.create({
        rfqId: invitation.rfqId._id,
        manufacturerId: req.user._id,
        message: 'Accepted invitation',
        proposedLeadTime: 30, // Default, can be updated
        status: 'PENDING'
      });
    }

    invitation.status = 'ACCEPTED';
    invitation.respondedAt = new Date();
    await invitation.save();

    // Update RFQ status if needed
    if (invitation.rfqId.status === 'OPEN_FOR_REQUESTS') {
      invitation.rfqId.status = 'REQUESTS_PENDING';
      await invitation.rfqId.save();
    }

    res.json({
      success: true,
      data: {
        invitation,
        manufacturerRequest
      }
    });
  } catch (error) {
    console.error('Accept invitation error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Decline invitation
// @route   POST /api/invitations/:id/decline
// @access  Private (Manufacturer/Hybrid)
const declineInvitation = async (req, res) => {
  try {
    const { declineReason } = req.body;
    const invitation = await Invitation.findById(req.params.id);

    if (!invitation || invitation.manufacturerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    invitation.status = 'DECLINED';
    invitation.respondedAt = new Date();
    invitation.declineReason = declineReason;
    await invitation.save();

    res.json({
      success: true,
      message: 'Invitation declined'
    });
  } catch (error) {
    console.error('Decline invitation error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

module.exports = {
  getInvitations,
  createInvitation,
  acceptInvitation,
  declineInvitation
};

