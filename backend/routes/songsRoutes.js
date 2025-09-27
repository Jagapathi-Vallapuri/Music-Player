const express = require('express');
const router = express.Router();
const { uploadSong, getUserSongs, deleteSong, streamSong, streamCover } = require('../controllers/songController');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 } });

router.post('/upload', verifyToken, upload.fields([{ name: 'song', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), uploadSong);
router.get('/', verifyToken, getUserSongs);
router.delete('/:filename', verifyToken, deleteSong);
router.get('/stream/:filename', verifyToken, streamSong);
router.get('/cover/:filename', verifyToken, streamCover);

module.exports = router;
