const express = require('express');
const router = express.Router();

const {
    search,
    getTrackDetails,
    getPopularTracks,
    getAlbums
} = require('../controllers/musicController');

const { searchLimiter } = require('../middleware/rateLimitMiddleware');
const {
    validateSearchQuery,
    validateTrackParam,
} = require('../middleware/validationMiddleware');

router.get('/search', searchLimiter, validateSearchQuery, search);
router.get('/track/:id', validateTrackParam, getTrackDetails);
router.get('/popular', getPopularTracks);
router.get('/albums', getAlbums);

module.exports = router;