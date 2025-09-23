const express = require('express');
const router = express.Router();
const { addTrackToHistory, getUserHistory, getFavorites, addToFavorites, removeFromFavorites, createPlaylist, getUserPlaylists, deletePlaylist, updatePlaylist, uploadAvatar, deleteAvatar, updateAbout, getMe, upload, getPlaylistById, uploadPlaylistCover, setPlaylistCover } = require('../controllers/userController');
const { getMyAvatar } = require('../controllers/imageController');
const verifyToken = require('../middleware/authMiddleware');
const { validateHistoryTrack, validateTrackId, validatePlaylist, validatePlaylistUpdate, validatePlaylistId } = require('../middleware/validationMiddleware');


router.post('/history', verifyToken, validateHistoryTrack, addTrackToHistory);
router.get('/history', verifyToken, getUserHistory);
router.get('/favorites', verifyToken, getFavorites);
router.post('/favorites', verifyToken, validateTrackId, addToFavorites);
router.delete('/favorites', verifyToken, validateTrackId, removeFromFavorites);
router.get('/playlists', verifyToken, getUserPlaylists);
router.post('/playlists', verifyToken, validatePlaylist, createPlaylist);
router.get('/playlists/:id', verifyToken, validatePlaylistId, getPlaylistById);
router.put('/playlists/:id', verifyToken, validatePlaylistUpdate, updatePlaylist);
router.delete('/playlists/:id', verifyToken, validatePlaylistId, deletePlaylist);
router.post('/playlists/:id/cover', verifyToken, validatePlaylistId, uploadPlaylistCover.single('cover'), setPlaylistCover);

router.get('/me', verifyToken, getMe);
router.patch('/me', verifyToken, updateAbout);
router.post('/me/avatar', verifyToken, upload.single('avatar'), uploadAvatar);
router.get('/me/avatar', verifyToken, getMyAvatar);
router.delete('/me/avatar', verifyToken, deleteAvatar);

module.exports = router;
