const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Session = require('../models/Session');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { isWithinGeofence, getAccuracyLevel } = require('../utils/geofence');
const { isValidObjectId } = require('../utils/validation');
const asyncHandler = require('express-async-handler');
const moment = require('moment');

// @desc    Mark attendance by scanning QR code
// @route   POST /api/attendance/mark
// @access  Private (Student only)
const markAttendance = asyncHandler(async (req, res) => {
  const { sessionId, location } = req.body;

  // Get session details
  const session = await Session.findOne({ sessionId })
    .populate('subject', 'code name')
    .populate('faculty', 'name');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  // Check if session is active and not expired
  if (!session.isActive || new Date() > session.expiryTime) {
    return res.status(400).json({
      success: false,
      message: 'Session has expired or is no longer active'
    });
  }

  // Check if student belongs to the correct class and section
  if (req.user.class !== session.class || req.user.section !== session.section) {
    return res.status(403).json({
      success: false,
      message: 'You are not enrolled in this class session'
    });
  }

  // Check if attendance already marked
  const existingAttendance = await Attendance.findOne({
    student: req.user._id,
    session: session._id
  });

  if (existingAttendance) {
    return res.status(400).json({
      success: false,
      message: 'Attendance already marked for this session'
    });
  }

  // Validate geofencing if location provided
  if (location && location.latitude && location.longitude) {
    const isInGeofence = isWithinGeofence(
      location.latitude,
      location.longitude,
      session.geofence.latitude,
      session.geofence.longitude,
      session.geofence.radius
    );

    if (!isInGeofence) {
      return res.status(400).json({
        success: false,
        message: 'You must be within the classroom area to mark attendance'
      });
    }
  }

  // Get device info from request
  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.connection.remoteAddress;
  
  let deviceType = 'unknown';
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    if (/iPad/.test(userAgent)) deviceType = 'tablet';
    else deviceType = 'mobile';
  } else if (/Desktop/.test(userAgent)) {
    deviceType = 'desktop';
  }

  // Determine if attendance is late (marked after 10 minutes of session start)
  const tenMinutesAfterStart = new Date(session.startTime.getTime() + 10 * 60 * 1000);
  const isLate = new Date() > tenMinutesAfterStart;

  // Create attendance record
  console.log('🎯 ============================================');
  console.log('🎯 ATTENDANCE MARKING DEBUG - BACKEND');
  console.log('🎯 ============================================');
  console.log('🎯 Session ID:', sessionId);
  console.log('🎯 Student ID:', req.user._id);
  console.log('🎯 Student details:', {
    name: req.user.name,
    class: req.user.class,
    section: req.user.section
  });
  console.log('🎯 Session details:', {
    id: session._id,
    sessionId: session.sessionId,
    class: session.class,
    section: session.section,
    isActive: session.isActive,
    expiryTime: session.expiryTime,
    currentTime: new Date()
  });
  console.log('🎯 Device info:', {
    userAgent,
    ipAddress,
    deviceType,
    isLate
  });
  
  const attendanceData = {
    student: req.user._id,
    session: session._id,
    subject: session.subject._id,
    faculty: session.faculty._id,
    status: isLate ? 'late' : 'present',
    markedAt: new Date(),
    location: location ? {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || 0
    } : undefined,
    deviceInfo: {
      userAgent,
      ipAddress,
      deviceType
    },
    class: session.class,
    section: session.section,
    attendanceDate: new Date().toDateString(),
    markedBy: 'qr_scan'
  };
  
  console.log('🎯 Attendance data to save:', JSON.stringify(attendanceData, null, 2));
  
  try {
    const attendance = await Attendance.create(attendanceData);
    console.log('✅ Attendance created successfully!');
    console.log('✅ Attendance ID:', attendance._id);
    console.log('✅ Status:', attendance.status);
    console.log('🎯 ============================================');
  } catch (validationError) {
    console.error('❌ ATTENDANCE CREATION FAILED!');
    console.error('❌ Validation Error:', validationError.message);
    console.error('❌ Full error:', validationError);
    console.log('🎯 ============================================');
    throw validationError;
  }
  
  const attendance = await Attendance.findOne({
    student: req.user._id,
    session: session._id
  });

  // Update session attendance count
  session.attendedStudents += 1;
  session.attendancePercentage = session.calculateAttendancePercentage();
  await session.save();

  // Populate attendance with student details
  await attendance.populate([
    { path: 'student', select: 'name rollNumber' },
    { path: 'subject', select: 'code name' }
  ]);

  res.status(201).json({
    success: true,
    message: `Attendance marked successfully${isLate ? ' (Late)' : ''}`,
    data: {
      attendance: {
        id: attendance._id,
        status: attendance.status,
        markedAt: attendance.markedAt,
        student: attendance.student,
        subject: attendance.subject,
        class: attendance.class,
        section: attendance.section,
        accuracyLevel: location ? getAccuracyLevel(location.accuracy) : null
      }
    }
  });
});

// @desc    Get attendance records for student
// @route   GET /api/attendance/student/my
// @access  Private (Student only)
const getStudentAttendance = asyncHandler(async (req, res) => {
  const { subject, startDate, endDate, page = 1, limit = 10 } = req.query;

  const query = { student: req.user._id };

  // Filter by subject
  if (subject) {
    query.subject = subject;
  }

  // Filter by date range
  if (startDate && endDate) {
    query.attendanceDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const attendance = await Attendance.find(query)
    .populate('subject', 'code name')
    .populate('faculty', 'name')
    .sort({ attendanceDate: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await Attendance.countDocuments(query);

  res.status(200).json({
    success: true,
    count: attendance.length,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    },
    data: attendance
  });
});

// @desc    Get attendance statistics for student
// @route   GET /api/attendance/student/stats
// @access  Private (Student only)
const getStudentStats = asyncHandler(async (req, res) => {
  const { subject, month, year } = req.query;
  const studentId = req.user._id;

  // Build aggregation pipeline
  const matchStage = { student: studentId };

  if (subject) {
    // Validate subject ObjectId
    if (!isValidObjectId(subject)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subject ID format'
      });
    }
    matchStage.subject = new mongoose.Types.ObjectId(subject);
  }

  if (month && year) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    matchStage.attendanceDate = {
      $gte: startDate,
      $lte: endDate
    };
  }

  const stats = await Attendance.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$subject',
        totalClasses: { $sum: 1 },
        presentClasses: {
          $sum: {
            $cond: [{ $in: ['$status', ['present', 'late']] }, 1, 0]
          }
        },
        lateClasses: {
          $sum: {
            $cond: [{ $eq: ['$status', 'late'] }, 1, 0]
          }
        }
      }
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subject'
      }
    },
    {
      $unwind: '$subject'
    },
    {
      $project: {
        subject: {
          id: '$subject._id',
          code: '$subject.code',
          name: '$subject.name'
        },
        totalClasses: 1,
        presentClasses: 1,
        lateClasses: 1,
        absentClasses: { $subtract: ['$totalClasses', '$presentClasses'] },
        percentage: {
          $round: [
            { $multiply: [{ $divide: ['$presentClasses', '$totalClasses'] }, 100] },
            2
          ]
        }
      }
    }
  ]);

  // Calculate overall statistics
  const overall = stats.reduce((acc, subjectStat) => {
    acc.totalClasses += subjectStat.totalClasses;
    acc.presentClasses += subjectStat.presentClasses;
    acc.lateClasses += subjectStat.lateClasses;
    acc.absentClasses += subjectStat.absentClasses;
    return acc;
  }, { totalClasses: 0, presentClasses: 0, lateClasses: 0, absentClasses: 0 });

  overall.percentage = overall.totalClasses > 0 
    ? Math.round((overall.presentClasses / overall.totalClasses) * 100 * 100) / 100
    : 0;

  res.status(200).json({
    success: true,
    data: {
      overall,
      subjects: stats
    }
  });
});

// @desc    Get attendance for faculty's sessions
// @route   GET /api/attendance/faculty/sessions/:sessionId
// @access  Private (Faculty only)
const getSessionAttendance = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  // Validate ObjectId format
  if (!isValidObjectId(sessionId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid session ID format'
    });
  }

  // Verify session belongs to faculty
  const session = await Session.findById(sessionId)
    .populate('subject', 'code name');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  if (session.faculty.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  // Get attendance records for this session
  const attendance = await Attendance.find({ session: sessionId })
    .populate('student', 'name rollNumber')
    .sort({ markedAt: 1 });

  // Get all students in the class for absent list
  const allStudents = await User.find({
    role: 'student',
    class: session.class,
    section: session.section,
    isActive: true
  }).select('name rollNumber');

  const presentStudentIds = attendance.map(att => att.student._id.toString());
  const absentStudents = allStudents.filter(
    student => !presentStudentIds.includes(student._id.toString())
  );

  res.status(200).json({
    success: true,
    data: {
      session: {
        id: session._id,
        subject: session.subject,
        class: session.class,
        section: session.section,
        period: session.period,
        startTime: session.startTime,
        totalStudents: session.totalStudents,
        attendedStudents: session.attendedStudents,
        attendancePercentage: session.attendancePercentage
      },
      attendance: {
        present: attendance,
        absent: absentStudents
      },
      summary: {
        total: allStudents.length,
        present: attendance.length,
        absent: absentStudents.length,
        late: attendance.filter(att => att.status === 'late').length,
        percentage: session.attendancePercentage
      }
    }
  });
});

// @desc    Get attendance reports for faculty
// @route   GET /api/attendance/faculty/reports
// @access  Private (Faculty only)
const getFacultyReports = asyncHandler(async (req, res) => {
  const { 
    subject, 
    class: className, 
    section, 
    startDate, 
    endDate, 
    format = 'json' 
  } = req.query;

  // Build query
  const query = { faculty: req.user._id };

  if (subject) query.subject = subject;
  if (className) query.class = className;
  if (section) query.section = section;

  if (startDate && endDate) {
    query.attendanceDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const reports = await Attendance.find(query)
    .populate('student', 'name rollNumber')
    .populate('subject', 'code name')
    .sort({ attendanceDate: -1, markedAt: -1 });

  if (format === 'csv') {
    // Generate CSV format
    const csvHeader = 'Date,Student Name,Roll Number,Subject,Status,Marked At,Class,Section\n';
    const csvRows = reports.map(record => [
      moment(record.attendanceDate).format('YYYY-MM-DD'),
      record.student.name,
      record.student.rollNumber,
      record.subject.code,
      record.status,
      moment(record.markedAt).format('YYYY-MM-DD HH:mm:ss'),
      record.class,
      record.section
    ].join(',')).join('\n');

    const csv = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance-report.csv"');
    return res.send(csv);
  }

  // Group by subject for summary
  const subjectSummary = {};
  reports.forEach(record => {
    const subjectKey = record.subject.code;
    if (!subjectSummary[subjectKey]) {
      subjectSummary[subjectKey] = {
        subject: record.subject,
        total: 0,
        present: 0,
        late: 0,
        absent: 0
      };
    }
    subjectSummary[subjectKey].total++;
    if (record.status === 'present') subjectSummary[subjectKey].present++;
    else if (record.status === 'late') subjectSummary[subjectKey].late++;
    else subjectSummary[subjectKey].absent++;
  });

  res.status(200).json({
    success: true,
    count: reports.length,
    data: {
      records: reports,
      summary: Object.values(subjectSummary).map(summary => ({
        ...summary,
        percentage: Math.round((summary.present + summary.late) / summary.total * 100 * 100) / 100
      }))
    }
  });
});

// @desc    Manual attendance marking by faculty
// @route   POST /api/attendance/manual
// @access  Private (Faculty only)
const markManualAttendance = asyncHandler(async (req, res) => {
  const { sessionId, students, status = 'present' } = req.body;

  // Verify session
  const session = await Session.findById(sessionId)
    .populate('subject');

  if (!session) {
    return res.status(404).json({
      success: false,
      message: 'Session not found'
    });
  }

  if (session.faculty.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  const results = [];
  const errors = [];

  for (const studentId of students) {
    try {
      // Check if attendance already exists
      const existingAttendance = await Attendance.findOne({
        student: studentId,
        session: sessionId
      });

      if (existingAttendance) {
        errors.push({
          studentId,
          message: 'Attendance already marked'
        });
        continue;
      }

      // Get student details
      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        errors.push({
          studentId,
          message: 'Student not found'
        });
        continue;
      }

      // Create attendance record
      const attendance = await Attendance.create({
        student: studentId,
        session: sessionId,
        subject: session.subject._id,
        faculty: session.faculty,
        status,
        markedAt: new Date(),
        class: session.class,
        section: session.section,
        attendanceDate: new Date().toDateString(),
        markedBy: 'manual'
      });

      results.push({
        studentId,
        student: {
          name: student.name,
          rollNumber: student.rollNumber
        },
        status,
        markedAt: attendance.markedAt
      });

    } catch (error) {
      errors.push({
        studentId,
        message: error.message
      });
    }
  }

  // Update session attendance count
  if (results.length > 0) {
    session.attendedStudents += results.length;
    session.attendancePercentage = session.calculateAttendancePercentage();
    await session.save();
  }

  res.status(200).json({
    success: true,
    message: `Manual attendance marked for ${results.length} students`,
    data: {
      successful: results,
      errors,
      summary: {
        total: students.length,
        successful: results.length,
        failed: errors.length
      }
    }
  });
});

module.exports = {
  markAttendance,
  getStudentAttendance,
  getStudentStats,
  getSessionAttendance,
  getFacultyReports,
  markManualAttendance
};