const express = require('express');
const router = express.Router();
const { uploadSong, getUserSongs, deleteSong, streamSong } = require('../controllers/songController');
const verifyToken = require('../middleware/authMiddleware');
const multer = require('multer');

const { GridFsStorage } = require('multer-gridfs-storage');

const storage = new GridFsStorage({
  url: process.env.MONGO_URL,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    return {
      filename: `${req.user._id}-${Date.now()}-${file.originalname}`,
      bucketName: 'uploads'
    };
  }
});

const upload = multer({ storage });

router.post('/upload', verifyToken, upload.single('song'), uploadSong);
router.get('/', verifyToken, getUserSongs);
router.delete('/:filename', verifyToken, deleteSong);
router.get('/stream/:filename', verifyToken, streamSong);

module.exports = router;
