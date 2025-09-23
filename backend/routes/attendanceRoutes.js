const express = require('express');
const {
  markAttendance,
  getStudentAttendance,
  getStudentStats,
  getSessionAttendance,
  getFacultyReports,
  markManualAttendance,
} = require('../controllers/attendanceController');

const { protect, facultyOnly, studentOnly } = require('../middleware/auth');
const { validateAttendanceMarking } = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student routes
router.post('/mark', studentOnly, validateAttendanceMarking, markAttendance);
router.get('/student/my', studentOnly, getStudentAttendance);
router.get('/student/stats', studentOnly, getStudentStats);

// Faculty routes
router.get('/faculty/sessions/:sessionId', facultyOnly, getSessionAttendance);
router.get('/faculty/reports', facultyOnly, getFacultyReports);
router.post('/manual', facultyOnly, markManualAttendance);

module.exports = router;