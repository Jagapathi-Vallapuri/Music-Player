const express = require('express');
const router = express.Router();
const { getPlaylistCover, getMyAvatar } = require('../controllers/imageController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/playlist/:id', getPlaylistCover);
router.get('/me/avatar', verifyToken, getMyAvatar);

module.exports = router;
