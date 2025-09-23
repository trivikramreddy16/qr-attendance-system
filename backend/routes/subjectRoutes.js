const express = require('express');
const router = express.Router();

const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
} = require('../controllers/subjectController');

const { protect } = require('../middleware/auth');
const { validateSubjectCreation } = require('../middleware/validation');

// All routes require authentication
router.use(protect);

// Routes
router.route('/')
  .get(getSubjects)
  .post(validateSubjectCreation, createSubject);

router.route('/:id')
  .get(getSubject)
  .put(validateSubjectCreation, updateSubject)
  .delete(deleteSubject);

module.exports = router;