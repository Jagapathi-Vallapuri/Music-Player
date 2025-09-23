const express = require('express');
const router = express.Router();
const { getPlaylistCover, getMyAvatar } = require('../controllers/imageController');
const verifyToken = require('../middleware/authMiddleware');

// Public playlist cover (used in <img src>)
router.get('/playlist/:id', getPlaylistCover);

// Authenticated avatar stream for current user
router.get('/me/avatar', verifyToken, getMyAvatar);

module.exports = router;
