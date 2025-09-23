const express = require('express');
const { getStudents, getMyAttendance } = require('../controllers/authController');
const { protect, facultyOnly, studentOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/students
// @desc    Get all students (Faculty only)
// @access  Private/Faculty
router.get('/students', protect, facultyOnly, getStudents);

// @route   GET /api/users/my-attendance
// @desc    Get student's own attendance data
// @access  Private/Student
router.get('/my-attendance', protect, studentOnly, getMyAttendance);

module.exports = router;