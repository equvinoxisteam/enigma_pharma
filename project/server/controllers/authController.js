const User = require('../models/User');
const generateToken = require('../config/jwt');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const emailService = require('../emailService/EmailService');
const { getEffectivePlanType, PLAN_TYPES } = require('../config/planFeatures');
const { formatUserResponse } = require('../utils/userResponse');
const { getAdminCredentials } = require('../utils/envUtils');

const bootstrapAdminUser = async (email, plainPassword) => {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        fullName: 'Platform Admin',
        isAdmin: true,
        isEmailVerified: true,
        status: 'ACTIVE',
        password: hashedPassword,
        userType: 'HYBRID',
        manufacturerStatus: 'ACTIVE',
        'subscription.planType': PLAN_TYPES.ENTERPRISE,
        'subscription.status': 'ACTIVE',
        'subscription.billingCycle': 'YEARLY',
        'subscription.startsAt': new Date(),
        'subscription.pendingPlanType': null,
        'subscription.pendingPlanEffectiveAt': null
      },
      $setOnInsert: {
        email,
        phoneNumber: '0000000000',
        companyName: 'Enigma Admin',
        address: 'Admin Center',
        city: 'Admin',
        state: 'Admin',
        zipCode: '400001',
        country: 'India'
      }
    },
    { upsert: true, new: true, runValidators: false, setDefaultsOnInsert: true }
  ).select('-passwordResetToken -emailVerificationToken');
};

// @desc    Authenticate user
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const { email: adminEmail, password: adminPassword } = getAdminCredentials();

    const isAdminLogin = Boolean(
      adminEmail &&
      adminPassword &&
      normalizedEmail === adminEmail &&
      String(password).trim() === adminPassword
    );

    if (isAdminLogin) {
      try {
        const adminUser = await bootstrapAdminUser(normalizedEmail, adminPassword);
        if (!adminUser?._id) {
          return res.status(500).json({ message: 'Failed to initialize admin account' });
        }
        return res.json(formatUserResponse(adminUser, generateToken(adminUser._id)));
      } catch (adminError) {
        console.error('Admin login bootstrap error:', adminError);
        return res.status(500).json({
          message: 'Admin login failed during account setup. Check server logs or reset the admin user in the database.'
        });
      }
    }

    let user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.password) {
      console.error('Login failed: user has no password hash', normalizedEmail);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    let passwordMatches = isAdminLogin;
    if (!isAdminLogin) {
      try {
        passwordMatches = await bcrypt.compare(password, user.password);
      } catch (compareError) {
        console.error('Password compare failed for', normalizedEmail, compareError.message);
        return res.status(401).json({
          message: 'Account password needs reset. Use Forgot Password to set a new password.'
        });
      }
    }

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!isAdminLogin && !user.isEmailVerified) {
      return res.status(401).json({
        message: 'Please verify your email address before logging in',
        requiresVerification: true
      });
    }

    return res.json(formatUserResponse(user, generateToken(user._id)));
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Register new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  const {
    title,
    fullName,
    email,
    password,
    confirmPassword,
    userType,
    phoneNumber,
    companyName,
    website,
    address,
    city,
    state,
    zipCode,
    country,
    gstNumber,
    // Manufacturer fields
    manufacturingTypes,
    companySize,
    yearsInBusiness,
    maxDimensions,
    primaryMaterials,
    certifications,
    // Buyer fields
    industryVertical,
    annualSpending,
    procurementTeamSize,
    preferredLeadTime
  } = req.body;

  try {
    const normalizedEmail = String(email || '').trim().toLowerCase();

    // Input validation
    if (!fullName || !email || !password || !userType || !phoneNumber || !companyName || !address || !city || !state || !zipCode) {
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Comprehensive password validation
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one uppercase letter' });
    }
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one lowercase letter' });
    }
    if (!/\d/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one number' });
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: normalizedEmail });
    
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Validate manufacturing types only for manufacturer-capable roles
    const needsManufacturingProfile = userType === 'MANUFACTURER' || userType === 'HYBRID';
    if (needsManufacturingProfile && (!req.body.serviceCategories?.length && (!manufacturingTypes || manufacturingTypes.length === 0))) {
      return res.status(400).json({ message: 'Select at least one service category (API, CDMO, etc.)' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Determine initial status
    let status = 'PENDING_VERIFICATION';
    let manufacturerStatus = 'PENDING_REVIEW';
    if (userType === 'BUYER') {
      status = 'PENDING_VERIFICATION';
    }

    // Create user
    const userData = {
      title: title || '',
      fullName,
      email: normalizedEmail,
      password: hashedPassword,
      userType,
      phoneNumber,
      companyName,
      website: website || '',
      address,
      city,
      state,
      zipCode,
      country: country || 'India',
      gstNumber: gstNumber || '',
      subscription: {
        planType: userType === 'BUYER' ? PLAN_TYPES.BUYER_FREE : PLAN_TYPES.FREE,
        status: 'ACTIVE',
        amountPaid: 0,
        billingCycle: 'YEARLY',
        startsAt: new Date(),
        expiresAt: null
      },
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      status
    };

    // Add all fields for all user types
    userData.manufacturingTypes = manufacturingTypes || req.body.serviceCategories || [];
    userData.serviceCategories = req.body.serviceCategories || manufacturingTypes || [];
    userData.gmpCertifications = req.body.gmpCertifications || certifications || [];
    userData.companySize = companySize || '';
    userData.yearsInBusiness = yearsInBusiness || 0;
    userData.maxDimensions = maxDimensions || { height: 0, width: 0, length: 0 };
    userData.primaryMaterials = primaryMaterials || [];
    userData.certifications = certifications || [];
    userData.industryVertical = industryVertical || '';
    userData.annualSpending = annualSpending || '';
    userData.procurementTeamSize = procurementTeamSize || '';
    userData.preferredLeadTime = preferredLeadTime || '';
    
    // Set manufacturer status only for manufacturers and hybrid
    if (userType === 'MANUFACTURER' || userType === 'HYBRID') {
      userData.manufacturerStatus = manufacturerStatus;
      userData.manufacturerSettings = {
        technologies: manufacturingTypes || [],
        materials: primaryMaterials || [],
        partTypes: [],
        machinery: [],
        regionsServed: [],
        languages: ['English'],
        capacityStatus: 'OPEN',
        isVerified: false,
        videoSlides: []
      };
    }

    const user = await User.create(userData);

    if (user) {
      // Send verification email
      try {
        await emailService.sendVerificationEmail(email, verificationToken, fullName);
        
        res.status(201).json({
          message: 'User registered successfully! Please check your email to verify your account.',
          requiresVerification: true,
          userId: user._id
        });
      } catch (emailError) {
        console.error('Email sending error:', emailError);
        // Don't delete user, just log error
        res.status(201).json({
          message: 'User registered successfully! Please check your email to verify your account.',
          requiresVerification: true,
          userId: user._id,
          warning: 'Verification email may not have been sent. Please contact support.'
        });
      }
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email
const verifyEmail = async (req, res) => {
  const token = req.query.token || req.body.token;

  try {
    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    
    // Update status based on user type
    if (user.userType === 'BUYER') {
      user.status = 'ACTIVE';
    } else if (user.userType === 'MANUFACTURER' || user.userType === 'HYBRID') {
      user.status = 'PENDING_VERIFICATION'; // Still needs profile review
    }
    
    await user.save();

    try {
      await emailService.sendWelcomeEmail(user.email, user.fullName);
    } catch (emailError) {
      console.error('Welcome email error:', emailError);
    }

    res.json({
      message: 'Email verified successfully! You can now login.',
      success: true
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken, user.fullName);

    res.json({
      message: 'Verification email sent successfully!'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send reset email
    await emailService.sendPasswordResetEmail(email, resetToken, user.fullName);

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user
    user.password = hashedPassword;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    res.json({
      message: 'Password reset successfully! You can now login with your new password.',
      success: true
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(formatUserResponse(user));
  } catch (error) {
    console.error('GetMe error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update allowed fields
    const allowedFields = [
      'title', 'fullName', 'phoneNumber', 'companyName', 'website',
      'address', 'city', 'state', 'zipCode', 'country', 'gstNumber',
      'manufacturingTypes', 'companySize', 'yearsInBusiness', 'maxDimensions',
      'primaryMaterials', 'certifications', 'industryVertical', 'annualSpending',
      'procurementTeamSize', 'preferredLeadTime', 'facilityPhotos'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    });

    await user.save();

    return res.json(formatUserResponse(user, generateToken(user._id)));
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: errors.join(', ') });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Submit upgrade request
// @route   POST /api/auth/upgrade-request
const requestUpgrade = async (req, res) => {
  try {
    const { planName, planType, message } = req.body;
    const UpgradeRequest = require('../models/UpgradeRequest');

    if (!['MANUFACTURER', 'HYBRID'].includes(req.user.userType)) {
      return res.status(400).json({ message: 'Only manufacturer and hybrid accounts can request plan upgrades' });
    }

    const resolvedPlan = (planType || planName || '').toUpperCase();
    const validPlans = ['STANDARD', 'PRO', 'ENTERPRISE'];
    if (!validPlans.includes(resolvedPlan)) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    const request = await UpgradeRequest.create({
      user: req.user._id,
      planName: resolvedPlan,
      message
    });

    res.json({ success: true, message: 'Upgrade request submitted successfully', request });
  } catch (error) {
    console.error('Request upgrade error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  loginUser,
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  requestUpgrade
};
