const express = require('express');
const {
  createSession,
  getSession,
  getFacultySessions,
  getStudentSessions,
  endSession,
  getActiveSession,
  getCurrentActiveSession,
  extendSession,
} = require('../controllers/sessionController');

const { protect, facultyOnly, studentOnly } = require('../middleware/auth');
const { validateSessionCreation } = require('../middleware/validation');

const router = express.Router();

// Public routes (for QR code scanning)
router.get('/active/:sessionId', getActiveSession);

// Protected routes
router.use(protect); // All routes below require authentication

// Faculty-specific routes (specific routes must come before generic ones)
router.post('/', facultyOnly, validateSessionCreation, createSession);
router.get('/faculty/my', facultyOnly, getFacultySessions);
router.get('/active', facultyOnly, getCurrentActiveSession);
router.put('/:id/end', facultyOnly, endSession);
router.put('/:id/extend', facultyOnly, extendSession);

// General session routes (generic routes must come after specific ones)
router.get('/:id', getSession);

// Student-specific routes
router.get('/student/my', studentOnly, getStudentSessions);

module.exports = router;