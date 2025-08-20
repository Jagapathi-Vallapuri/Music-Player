const express = require('express');
const router = express.Router();
const { addTrackToHistory, getUserHistory, getFavorites, addToFavorites, removeFromFavorites, createPlaylist, getUserPlaylists, deletePlaylist, updatePlaylist } = require('../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');
const { validateHistoryTrack, validateTrackId, validatePlaylist, validatePlaylistUpdate, validatePlaylistId } = require('../middleware/validationMiddleware');

router.post('/history', verifyToken, validateHistoryTrack, addTrackToHistory);
router.get('/history', verifyToken, getUserHistory);
router.get('/favorites', verifyToken, getFavorites);
router.post('/favorites', verifyToken, validateTrackId, addToFavorites);
router.delete('/favorites', verifyToken, validateTrackId, removeFromFavorites);
router.get('/playlists', verifyToken, getUserPlaylists);
router.post('/playlists', verifyToken, validatePlaylist, createPlaylist);
router.put('/playlists/:id', verifyToken, validatePlaylistUpdate, updatePlaylist);
router.delete('/playlists/:id', verifyToken, validatePlaylistId, deletePlaylist);

module.exports = router;
