const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('role')
    .isIn(['student', 'faculty'])
    .withMessage('Role must be either student or faculty'),
  
  body('rollNumber')
    .if(body('role').equals('student'))
    .notEmpty()
    .withMessage('Roll number is required for students'),
  
  body('employeeId')
    .if(body('role').equals('faculty'))
    .notEmpty()
    .withMessage('Employee ID is required for faculty'),
  
  body('class')
    .if(body('role').equals('student'))
    .isIn(['I-I', 'II-I', 'III-I', 'IV-I'])
    .withMessage('Invalid class'),
  
  body('section')
    .if(body('role').equals('student'))
    .isIn(['CSE-DS-A', 'CSE-A', 'CSE-B', 'IT-A', 'IT-B'])
    .withMessage('Invalid section'),
  
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid phone number'),
  
  handleValidationErrors
];

// User login validation
const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Subject creation validation
const validateSubjectCreation = [
  body('code')
    .trim()
    .notEmpty()
    .withMessage('Subject code is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Subject code must be between 2 and 10 characters')
    .isAlphanumeric()
    .withMessage('Subject code must contain only letters and numbers'),
  
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Subject name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject name must be between 2 and 100 characters'),
  
  body('credits')
    .isInt({ min: 1, max: 10 })
    .withMessage('Credits must be between 1 and 10'),
  
  body('department')
    .isIn(['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'])
    .withMessage('Invalid department'),
  
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  
  handleValidationErrors
];

// Session creation validation
const validateSessionCreation = [
  body('subject')
    .isMongoId()
    .withMessage('Invalid subject ID'),
  
  body('class')
    .isIn(['I-I', 'II-I', 'III-I', 'IV-I'])
    .withMessage('Invalid class'),
  
  body('section')
    .isIn(['CSE-DS-A', 'CSE-A', 'CSE-B', 'IT-A', 'IT-B'])
    .withMessage('Invalid section'),
  
  
  body('period')
    .trim()
    .notEmpty()
    .withMessage('Period is required'),
  
  body('geofence.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('geofence.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('geofence.radius')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Radius must be between 1 and 1000 meters'),
  
  handleValidationErrors
];

// Attendance marking validation
const validateAttendanceMarking = [
  body('sessionId')
    .trim()
    .notEmpty()
    .withMessage('Session ID is required'),
  
  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('location.accuracy')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Location accuracy must be a positive number'),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid phone number'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  handleValidationErrors
];

// Password change validation
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match password');
      }
      return value;
    }),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateSubjectCreation,
  validateSessionCreation,
  validateAttendanceMarking,
  validateProfileUpdate,
  validatePasswordChange
};