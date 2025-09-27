const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');
const asyncHandler = require('express-async-handler');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { 
    name, 
    email, 
    password, 
    role, 
    rollNumber, 
    employeeId, 
    class: userClass, 
    section, 
    department, 
    phone 
  } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'User already exists with this email'
    });
  }

  // Check for duplicate roll number for students
  if (role === 'student' && rollNumber) {
    const existingStudent = await User.findOne({ rollNumber });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this roll number already exists'
      });
    }
  }

  // Check for duplicate employee ID for faculty
  if (role === 'faculty' && employeeId) {
    const existingFaculty = await User.findOne({ employeeId });
    if (existingFaculty) {
      return res.status(400).json({
        success: false,
        message: 'Faculty with this employee ID already exists'
      });
    }
  }

  // Create user
  const userData = {
    name,
    email,
    password,
    role,
    department: department || 'CSE',
    phone
  };

  // Add role-specific fields
  if (role === 'student') {
    userData.rollNumber = rollNumber;
    userData.class = userClass;
    userData.section = section;
  } else if (role === 'faculty') {
    userData.employeeId = employeeId;
  }

  const user = await User.create(userData);

  sendTokenResponse(user, 201, res, 'User registered successfully');
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('🔐 Login attempt for:', email);
    console.log('🔍 Database connection state:', require('mongoose').connection.readyState);

    // Check if user exists and get password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ User found:', user.email, 'Role:', user.role);

    // Check if account is active
    if (!user.isActive) {
      console.log('❌ User account is inactive:', email);
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('✅ Password valid for:', email);

    // Update last login - make this operation more robust
    try {
      await User.findByIdAndUpdate(
        user._id,
        { lastLogin: new Date() },
        { validateBeforeSave: false, new: false }
      );
      console.log('✅ Last login updated for:', email);
    } catch (updateError) {
      console.warn('⚠️ Failed to update last login (non-critical):', updateError.message);
      // Don't fail login if this update fails
    }

    console.log('🚀 Sending token response for:', email);
    sendTokenResponse(user, 200, res, 'Login successful');
    
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Handle specific database connection errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return res.status(503).json({
        success: false,
        message: 'Database connection issue. Please try again.'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.cookie('refreshToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      employeeId: user.employeeId,
      class: user.class,
      section: user.section,
      department: user.department,
      phone: user.phone,
      isActive: user.isActive,
      profilePicture: user.profilePicture,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    }
  });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const fieldsToUpdate = {
    name: req.body.name,
    phone: req.body.phone,
  };

  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      employeeId: user.employeeId,
      class: user.class,
      section: user.section,
      department: user.department,
      phone: user.phone,
      profilePicture: user.profilePicture,
    }
  });
});

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);

  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully'
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh
// @access  Private
const refreshToken = asyncHandler(async (req, res) => {
  const user = req.user;
  sendTokenResponse(user, 200, res, 'Token refreshed successfully');
});

// @desc    Get all students (for faculty only)
// @route   GET /api/users/students
// @access  Private (Faculty only)
const getStudents = asyncHandler(async (req, res) => {
  const students = await User.find({ role: 'student', isActive: true })
    .select('name email rollNumber class section department phone createdAt')
    .sort({ class: 1, section: 1, rollNumber: 1 });

  res.status(200).json({
    success: true,
    count: students.length,
    data: students
  });
});

// @desc    Get student's own attendance data
// @route   GET /api/users/my-attendance
// @access  Private (Student only)
const getMyAttendance = asyncHandler(async (req, res) => {
  const studentId = req.user._id;
  const Attendance = require('../models/Attendance');
  const Session = require('../models/Session');
  const Subject = require('../models/Subject');

  try {
    // Get all subjects
    const subjects = await Subject.find().select('name code');
    
    // Get all sessions for the student's class and section
    const sessions = await Session.find({
      class: req.user.class,
      section: req.user.section
    }).populate('subject', 'name code');

    // Get student's attendance records
    const attendanceRecords = await Attendance.find({
      student: studentId
    }).populate({
      path: 'session',
      populate: {
        path: 'subject',
        select: 'name code'
      }
    });

    // Process data for response
    const subjectWiseData = {};
    let totalPresent = 0;
    let totalSessions = sessions.length;

    // Initialize subject data
    subjects.forEach(subject => {
      subjectWiseData[subject._id] = {
        code: subject.code,
        name: subject.name,
        present: 0,
        total: 0,
        percentage: 0,
        records: []
      };
    });

    // Count total sessions per subject
    sessions.forEach(session => {
      if (session.subject && subjectWiseData[session.subject._id]) {
        subjectWiseData[session.subject._id].total++;
      }
    });

    // Count attendance per subject
    attendanceRecords.forEach(record => {
      if (record.session && record.session.subject && subjectWiseData[record.session.subject._id]) {
        if (record.status === 'present') {
          subjectWiseData[record.session.subject._id].present++;
          totalPresent++;
        }
        
        subjectWiseData[record.session.subject._id].records.push({
          date: record.session.date,
          time: record.session.startTime,
          status: record.status === 'present' ? 'Present' : 'Absent'
        });
      }
    });

    // Calculate percentages
    Object.keys(subjectWiseData).forEach(subjectId => {
      const subject = subjectWiseData[subjectId];
      subject.percentage = subject.total > 0 ? Math.round((subject.present / subject.total) * 100) : 0;
      subject.records.sort((a, b) => new Date(b.date) - new Date(a.date));
    });

    const overallPercentage = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        overall: {
          present: totalPresent,
          total: totalSessions,
          percentage: overallPercentage
        },
        subjects: Object.values(subjectWiseData).filter(s => s.total > 0),
        recentRecords: attendanceRecords
          .filter(r => r.session && r.session.subject)
          .map(r => ({
            date: r.session.date,
            subject: r.session.subject.code,
            status: r.status === 'present' ? 'Present' : 'Absent',
            time: r.session.startTime || 'N/A'
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
      }
    });
  } catch (error) {
    console.error('Error fetching student attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance data'
    });
  }
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
  refreshToken,
  getStudents,
  getMyAttendance,
};
