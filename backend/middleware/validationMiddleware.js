const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// Auth validation rules
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Music validation rules
const validateTrackId = [
  body('trackId')
    .trim()
    .notEmpty()
    .withMessage('Track ID is required')
    .isNumeric()
    .withMessage('Track ID must be a number'),
  
  handleValidationErrors
];

const validatePlaylist = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Playlist name must be between 1 and 100 characters'),
  
  body('tracks')
    .optional()
    .isArray()
    .withMessage('Tracks must be an array'),
  
  body('tracks.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Track ID cannot be empty')
    .isNumeric()
    .withMessage('Each track ID must be a number'),
  
  handleValidationErrors
];

const validatePlaylistUpdate = [
  param('id')
    .isMongoId()
    .withMessage('Invalid playlist ID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Playlist name must be between 1 and 100 characters'),
  
  body('tracks')
    .optional()
    .isArray()
    .withMessage('Tracks must be an array'),
  
  body('tracks.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Track ID cannot be empty')
    .isNumeric()
    .withMessage('Each track ID must be a number'),
  
  handleValidationErrors
];

const validatePlaylistId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid playlist ID'),
  
  handleValidationErrors
];

const validateTrackParam = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Track ID is required')
    .isNumeric()
    .withMessage('Track ID must be a number'),
  
  handleValidationErrors
];

const validateSearchQuery = [
  query('q')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_.,!?]+$/)
    .withMessage('Search query contains invalid characters'),
  
  handleValidationErrors
];

// User validation rules
const validateHistoryTrack = [
  body('trackId')
    .trim()
    .notEmpty()
    .withMessage('Track ID is required')
    .isNumeric()
    .withMessage('Track ID must be a number'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegister,
  validateLogin,
  validateTrackId,
  validatePlaylist,
  validatePlaylistUpdate,
  validatePlaylistId,
  validateTrackParam,
  validateSearchQuery,
  validateHistoryTrack
};
