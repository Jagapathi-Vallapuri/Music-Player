const User = require('../models/User');
const Playlist = require('../models/Playlist');
const cache = require('../services/cacheService');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

const updateUserAndClearCache = async (userId, update) => {
    await User.findByIdAndUpdate(userId, update);
    await cache.del(`user:${userId}`); // Use del instead of set with null
};

const addTrackToHistory = async (req, res) => {
    try {
        const { trackId } = req.body;
        if (!trackId) return res.status(400).json({ message: 'trackId is required' });
        await updateUserAndClearCache(req.user._id, { $push: { history: { trackId, listenedAt: new Date() } } });
        res.json({ message: 'Track added to history' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add to history', error: err.message });
    }
};

const getUserHistory = async (req, res) => {
    try {
        res.json(req.user.history || []);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get history', error: err.message });
    }
};

const getFavorites = async (req, res) => {
    try {
        res.json(req.user.favorites || []);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get favorites', error: err.message });
    }
};

const addToFavorites = async (req, res) => {
    try {
        const { trackId } = req.body;
        await updateUserAndClearCache(req.user._id, { $addToSet: { favorites: trackId } });
        res.json({ message: 'Track added to favorites' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add to favorites', error: err.message });
    }
};

const removeFromFavorites = async (req, res) => {
    try {
        const { trackId } = req.body;
        await updateUserAndClearCache(req.user._id, { $pull: { favorites: trackId } });
        res.json({ message: 'Track removed from favorites' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove from favorites', error: err.message });
    }
};

const createPlaylist = async (req, res) => {
    try {
        const { name, tracks } = req.body;
        const userId = req.user._id;
        const playlist = new Playlist({ userId, name, tracks });
        await playlist.save();
        await updateUserAndClearCache(userId, { $push: { playlists: playlist._id } });
        res.status(201).json(playlist);
    } catch (err) {
        res.status(500).json({ message: 'Error creating playlist', error: err.message });
    }
};

const getUserPlaylists = async (req, res) => {
    try {
        const playlists = await Playlist.find({ userId: req.user._id });
        res.json(playlists);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching playlists', error: err.message });
    }
};

const deletePlaylist = async (req, res) => {
    try {
        const { id: playlistId } = req.params;
        const userId = req.user._id;
        const playlist = await Playlist.findOneAndDelete({ _id: playlistId, userId });
        if (!playlist) return res.status(404).json({ message: 'Playlist not found or unauthorized' });
        await updateUserAndClearCache(userId, { $pull: { playlists: playlistId } });
        res.json({ message: 'Playlist deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting playlist', error: err.message });
    }
};

const updatePlaylist = async (req, res) => {
    try {
        const { id: playlistId } = req.params;
        const { name, tracks } = req.body;
        const playlist = await Playlist.findOneAndUpdate(
            { _id: playlistId, userId: req.user._id },
            { name, tracks },
            { new: true }
        );
        if (!playlist) return res.status(404).json({ message: 'Playlist not found or unauthorized' });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ message: 'Error updating playlist', error: err.message });
    }
};

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const profilePictureBuffer = req.file.buffer;
        const profilePictureType = req.file.mimetype;
        await updateUserAndClearCache(req.user._id, { profilePicture: profilePictureBuffer, profilePictureType });
        res.json({ message: 'Profile picture uploaded successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to upload profile picture', error: err.message });
    }
};

const getProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('profilePicture profilePictureType');
        if (!user || !user.profilePicture) return res.status(404).json({ message: 'Profile picture not found' });
        res.set('Content-Type', user.profilePictureType);
        res.send(user.profilePicture);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get profile picture', error: err.message });
    }
};

module.exports = {
    addTrackToHistory,
    getUserHistory,
    getFavorites,
    addToFavorites,
    removeFromFavorites,
    createPlaylist,
    getUserPlaylists,
    deletePlaylist,
    updatePlaylist,
    uploadProfilePicture,
    getProfilePicture
};
