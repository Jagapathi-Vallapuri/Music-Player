const express = require('express');
const router = express.Router();

const {
    search,
    getTrackDetails,
    getPopularTracks,
    getAlbums,
    getAlbum,
    getAlbumsPerCategories,
    getTracksByIds,
    streamAudio,
} = require('../controllers/musicController');

const { searchLimiter } = require('../middleware/rateLimitMiddleware');
const {
    validateSearchQuery,
    validateTrackParam,
} = require('../middleware/validationMiddleware');

router.get('/search', searchLimiter, validateSearchQuery, search);
router.get('/track/:id', validateTrackParam, getTrackDetails);
// Fetch multiple tracks by IDs: /api/music/tracks?ids=1,2,3
router.get('/tracks', getTracksByIds);
router.get('/popular', getPopularTracks);
router.get('/albums', getAlbums);
router.get('/albums/by-categories', getAlbumsPerCategories);
// Place static routes before dynamic ones to avoid matching 'by-categories' as :id
router.get('/albums/:id', getAlbum);
router.get('/stream', streamAudio);

module.exports = router;