const mongoose = require('mongoose');

/**
 * Validates if a string is a valid MongoDB ObjectId
 * @param {string} id - The ID to validate
 * @returns {boolean} - True if valid ObjectId, false otherwise
 */
const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  
  // Check if it's literally the string "undefined" (common error case)
  if (id === 'undefined' || id === 'null') return false;
  
  // Check if it matches ObjectId pattern (24 character hex string)
  if (!id.match(/^[0-9a-fA-F]{24}$/)) return false;
  
  // Use mongoose's built-in validation as final check
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Middleware to validate ObjectId in request params
 * @param {string} paramName - The name of the parameter to validate (e.g., 'id', 'sessionId')
 * @returns {Function} - Express middleware function
 */
const validateObjectIdParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

/**
 * Validates multiple ObjectIds in request body
 * @param {object} obj - Object containing IDs to validate
 * @param {string[]} fields - Array of field names to validate
 * @returns {object} - { isValid: boolean, invalidFields: string[] }
 */
const validateObjectIds = (obj, fields) => {
  const invalidFields = [];
  
  fields.forEach(field => {
    if (obj[field] && !isValidObjectId(obj[field])) {
      invalidFields.push(field);
    }
  });
  
  return {
    isValid: invalidFields.length === 0,
    invalidFields
  };
};

module.exports = {
  isValidObjectId,
  validateObjectIdParam,
  validateObjectIds
};