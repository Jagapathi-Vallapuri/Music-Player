const express = require('express');
const router = express.Router();
const { register, login, verify2FA, changePassword } = require('../controllers/authController.js');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const verifyToken = require('../middleware/authMiddleware');

router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/verify-2fa', authLimiter, verify2FA);
router.post('/change-password', authLimiter, verifyToken, changePassword);

module.exports = router;