const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController.js');
const { validateRegister, validateLogin } = require('../middleware/validationMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');

router.post('/register', authLimiter, validateRegister, register);

router.post('/login', authLimiter, validateLogin, login);

module.exports = router;
