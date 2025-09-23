const Session = require('../models/Session');
const Subject = require('../models/Subject');
const User = require('../models/User');
const QRCode = require('qrcode');
const { validateGeofenceConfig } = require('../utils/geofence');
const asyncHandler = require('express-async-handler');

// @desc    Create new session and generate QR code
// @route   POST /api/sessions
// @access  Private (Faculty only)
const createSession = asyncHandler(async (req, res) => {
  const { subject, class: sessionClass, section, period, geofence } = req.body;

  // Verify subject exists and faculty is assigned to it
  const subjectDoc = await Subject.findById(subject);
  if (!subjectDoc) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }

  // Check if faculty is assigned to this subject
  if (subjectDoc.faculty.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'You are not authorized to create sessions for this subject'
    });
  }

  // Check if subject is assigned to the specified class and section
  const isClassAssigned = subjectDoc.classes.some(
    cls => cls.class === sessionClass && cls.section === section
  );

  if (!isClassAssigned) {
    return res.status(400).json({
      success: false,
      message: 'Subject is not assigned to the specified class and section'
    });
  }

  // Validate geofence configuration
  const geofenceValidation = validateGeofenceConfig(geofence);
  if (!geofenceValidation.valid) {
    return res.status(400).json({
      success: false,
      message: geofenceValidation.error
    });
  }

  // Check for active session for the same class, section, and time slot
  const now = new Date();
  const activeSession = await Session.findOne({
    faculty: req.user._id,
    class: sessionClass,
    section: section,
    isActive: true,
    expiryTime: { $gt: now }
  });

  if (activeSession) {
    return res.status(400).json({
      success: false,
      message: 'An active session already exists for this class'
    });
  }

  // Calculate session times
  const expiryMinutes = parseInt(process.env.QR_CODE_EXPIRY_MINUTES) || 5;
  const expiryTime = new Date(now.getTime() + expiryMinutes * 60 * 1000);
  
  // Estimate end time based on period (50 minutes standard class duration)
  const endTime = new Date(now.getTime() + 50 * 60 * 1000);

  // Count total students in the class and section
  const totalStudents = await User.countDocuments({
    role: 'student',
    class: sessionClass,
    section: section,
    isActive: true
  });

  // Create session
  const session = await Session.create({
    faculty: req.user._id,
    subject,
    class: sessionClass,
    section,
    period,
    startTime: now,
    endTime,
    expiryTime,
    geofence,
    totalStudents,
    isActive: true
  });

  // Populate session with subject and faculty details
  await session.populate([
    { path: 'subject', select: 'code name' },
    { path: 'faculty', select: 'name employeeId' }
  ]);

  // Generate QR code data
  console.log('🔍 ===========================================');
  console.log('🔍 QR CODE GENERATION DEBUG');
  console.log('🔍 ===========================================');
  console.log('🔍 session object:', session);
  console.log('🔍 session.sessionId:', session.sessionId);
  console.log('🔍 session._id:', session._id);
  console.log('🔍 req.user._id:', req.user._id);
  console.log('🔍 subjectDoc.code:', subjectDoc.code);
  console.log('🔍 period:', period);
  console.log('🔍 sessionClass:', sessionClass);
  console.log('🔍 section:', section);
  console.log('🔍 geofence:', geofence);
  
  const qrDataObject = {
    type: 'attendance',  // Required by QR scanner validation
    sessionId: session.sessionId,
    facultyId: req.user._id,
    subject: subjectDoc.code,
    period,
    class: sessionClass,
    section,
    timestamp: now.toISOString(),
    expiryTime: expiryTime.toISOString(),
    geofence,
    version: '1.0'
  };
  
  console.log('🔍 qrDataObject before stringify:', qrDataObject);
  const qrData = JSON.stringify(qrDataObject);
  console.log('🔍 qrData after stringify (first 200 chars):', qrData.substring(0, 200));
  console.log('🔍 qrData length:', qrData.length);
  console.log('🔍 ===========================================');

  // Generate QR code image
  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  res.status(201).json({
    success: true,
    message: 'Session created successfully',
    data: {
      session: {
        id: session._id,
        sessionId: session.sessionId,
        subject: session.subject,
        faculty: session.faculty,
        class: session.class,
        section: session.section,
        period: session.period,
        startTime: session.startTime,
        endTime: session.endTime,
        expiryTime: session.expiryTime,
        geofence: session.geofence,
        totalStudents: session.totalStudents,
        attendedStudents: session.attendedStudents,
        isActive: session.isActive,
        createdAt: session.createdAt
      },
      qrCode: qrCodeDataUrl,
      qrData
    }
  });
});

// @desc    Get session by ID
// @route   GET /api/sessions/:id
// @access  Private
const getSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate ObjectId format
  if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session ID format'
    });
  }
  
  const session = await Session.findById(id)
    .populate('subject', 'code name')
    .populate('faculty', 'name employeeId');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  // Check if user has access to this session
  if (req.user.role === 'faculty' && session.faculty._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (req.user.role === 'student' && 
      (session.class !== req.user.class || session.section !== req.user.section)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Get sessions for faculty
// @route   GET /api/sessions/faculty/my
// @access  Private (Faculty only)
const getFacultySessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, subject } = req.query;

  const query = { faculty: req.user._id };

  // Filter by status
  if (status === 'active') {
    query.isActive = true;
    query.expiryTime = { $gt: new Date() };
  } else if (status === 'expired') {
    query.expiryTime = { $lte: new Date() };
  }

  // Filter by subject
  if (subject) {
    query.subject = subject;
  }

  const sessions = await Session.find(query)
    .populate('subject', 'code name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Session.countDocuments(query);

  res.status(200).json({
    success: true,
    count: sessions.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: sessions
  });
});

// @desc    Get sessions for student's class
// @route   GET /api/sessions/student/my
// @access  Private (Student only)
const getStudentSessions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, date } = req.query;

  const query = {
    class: req.user.class,
    section: req.user.section
  };

  // Filter by date
  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    query.createdAt = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }

  const sessions = await Session.find(query)
    .populate('subject', 'code name')
    .populate('faculty', 'name')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Session.countDocuments(query);

  res.status(200).json({
    success: true,
    count: sessions.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: sessions
  });
});

// @desc    End session
// @route   PUT /api/sessions/:id/end
// @access  Private (Faculty only)
const endSession = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Validate ObjectId format
  if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session ID format'
    });
  }
  
  const session = await Session.findById(id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  // Check if faculty owns this session
  if (session.faculty.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (!session.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Session is already ended'
    });
  }

  session.isActive = false;
  session.endTime = new Date();
  session.attendancePercentage = session.calculateAttendancePercentage();
  
  await session.save();

  res.status(200).json({
    success: true,
    message: 'Session ended successfully',
    data: session
  });
});

// @desc    Get active session by session ID
// @route   GET /api/sessions/active/:sessionId
// @access  Public (for QR code scanning)
const getActiveSession = asyncHandler(async (req, res) => {
  const session = await Session.findOne({
    sessionId: req.params.sessionId,
    isActive: true,
    expiryTime: { $gt: new Date() }
  }).populate('subject', 'code name')
    .populate('faculty', 'name');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found or expired'
    });
  }

  res.status(200).json({
    success: true,
    data: session
  });
});

// @desc    Get current faculty's active session
// @route   GET /api/sessions/active
// @access  Private (Faculty only)
const getCurrentActiveSession = asyncHandler(async (req, res) => {
  const activeSession = await Session.findOne({
    faculty: req.user._id,
    isActive: true,
    expiryTime: { $gt: new Date() }
  }).populate([
    { path: 'subject', select: 'code name' },
    { path: 'faculty', select: 'name employeeId' }
  ]);

  if (!activeSession) {
    return res.status(404).json({
      success: false,
      message: 'No active session found'
    });
  }

  res.status(200).json({
    success: true,
    data: activeSession
  });
});

// @desc    Extend session expiry
// @route   PUT /api/sessions/:id/extend
// @access  Private (Faculty only)
const extendSession = asyncHandler(async (req, res) => {
  const { minutes = 5 } = req.body;
  const { id } = req.params;
  
  // Validate ObjectId format
  if (!id || id === 'undefined' || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session ID format'
    });
  }
  
  const session = await Session.findById(id);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  // Check if faculty owns this session
  if (session.faculty.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  if (!session.isActive) {
    return res.status(400).json({
      success: false,
      message: 'Cannot extend inactive session'
    });
  }

  // Extend expiry time
  session.expiryTime = new Date(session.expiryTime.getTime() + minutes * 60 * 1000);
  await session.save();

  res.status(200).json({
    success: true,
    message: `Session extended by ${minutes} minutes`,
    data: {
      expiryTime: session.expiryTime
    }
  });
});

module.exports = {
  createSession,
  getSession,
  getFacultySessions,
  getStudentSessions,
  endSession,
  getActiveSession,
  getCurrentActiveSession,
  extendSession
};
