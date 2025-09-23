const Subject = require('../models/Subject');
const asyncHandler = require('express-async-handler');

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Private
const getSubjects = asyncHandler(async (req, res) => {
  let query = {};
  
  // If faculty, only get subjects assigned to them
  if (req.user.role === 'faculty') {
    query.faculty = req.user._id;
  }
  
  // If student, get subjects for their class and section
  if (req.user.role === 'student') {
    query.classes = {
      $elemMatch: {
        class: req.user.class,
        section: req.user.section
      }
    };
  }
  
  const subjects = await Subject.find(query)
    .populate('faculty', 'name email employeeId')
    .sort({ code: 1 });
  
  res.status(200).json({
    success: true,
    count: subjects.length,
    data: subjects
  });
});

// @desc    Get single subject
// @route   GET /api/subjects/:id
// @access  Private
const getSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('faculty', 'name email employeeId');
  
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }
  
  // Check if user has access to this subject
  if (req.user.role === 'faculty' && subject.faculty.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this subject'
    });
  }
  
  if (req.user.role === 'student') {
    const hasAccess = subject.classes.some(cls => 
      cls.class === req.user.class && cls.section === req.user.section
    );
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this subject'
      });
    }
  }
  
  res.status(200).json({
    success: true,
    data: subject
  });
});

// @desc    Create subject (Admin only - for now we'll allow faculty)
// @route   POST /api/subjects
// @access  Private (Faculty)
const createSubject = asyncHandler(async (req, res) => {
  // Only faculty can create subjects for now
  if (req.user.role !== 'faculty') {
    return res.status(403).json({
      success: false,
      message: 'Only faculty can create subjects'
    });
  }
  
  // Set the faculty to the current user
  req.body.faculty = req.user._id;
  
  const subject = await Subject.create(req.body);
  await subject.populate('faculty', 'name email employeeId');
  
  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: subject
  });
});

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Faculty who owns the subject)
const updateSubject = asyncHandler(async (req, res) => {
  let subject = await Subject.findById(req.params.id);
  
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }
  
  // Check if user owns this subject
  if (subject.faculty.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this subject'
    });
  }
  
  subject = await Subject.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).populate('faculty', 'name email employeeId');
  
  res.status(200).json({
    success: true,
    message: 'Subject updated successfully',
    data: subject
  });
});

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Faculty who owns the subject)
const deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);
  
  if (!subject) {
    return res.status(404).json({
      success: false,
      message: 'Subject not found'
    });
  }
  
  // Check if user owns this subject
  if (subject.faculty.toString() !== req.user._id.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this subject'
    });
  }
  
  await subject.deleteOne();
  
  res.status(200).json({
    success: true,
    message: 'Subject deleted successfully'
  });
});

module.exports = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject
};