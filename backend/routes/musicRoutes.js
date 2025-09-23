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
router.get('/tracks', getTracksByIds);
router.get('/popular', getPopularTracks);
router.get('/albums', getAlbums);
router.get('/albums/by-categories', getAlbumsPerCategories);
router.get('/albums/:id', getAlbum);
router.get('/stream', streamAudio);

module.exports = router;