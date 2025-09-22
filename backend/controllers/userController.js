const User = require('../models/User');
const Playlist = require('../models/Playlist');
const cache = require('../services/cacheService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure avatars directory exists
const avatarsDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarsDir)) {
    fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `${req.user._id}-${Date.now()}${ext}`);
    }
});

const imageFileFilter = (req, file, cb) => {
    if (!/^(image)\//.test(file.mimetype)) {
        return cb(new Error('Only image uploads are allowed'));
    }
    cb(null, true);
};

const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 }, fileFilter: imageFileFilter }); // 2MB limit

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
    const { name, tracks, coverUrl, description } = req.body;
        const userId = req.user._id;
    const playlist = new Playlist({ userId, name, tracks, coverUrl, description });
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
        const { name, tracks, coverUrl, description } = req.body;
        const playlist = await Playlist.findOneAndUpdate(
            { _id: playlistId, userId: req.user._id },
            { name, tracks, coverUrl, description },
            { new: true }
        );
        if (!playlist) return res.status(404).json({ message: 'Playlist not found or unauthorized' });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ message: 'Error updating playlist', error: err.message });
    }
};

const getPlaylistById = async (req, res) => {
    try {
        const { id } = req.params;
        const playlist = await Playlist.findOne({ _id: id, userId: req.user._id });
        if (!playlist) return res.status(404).json({ message: 'Playlist not found or unauthorized' });
        res.json(playlist);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching playlist', error: err.message });
    }
};

// Upload avatar (stores on disk, saves filename)
const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const oldUser = await User.findById(req.user._id).select('avatarFilename');
        // Delete old avatar file if exists
        if (oldUser?.avatarFilename) {
            const oldPath = path.join(avatarsDir, oldUser.avatarFilename);
            fs.unlink(oldPath, () => {}); // ignore errors
        }
        await updateUserAndClearCache(req.user._id, { avatarFilename: req.file.filename });
        res.json({ message: 'Avatar uploaded', filename: req.file.filename });
    } catch (err) {
        res.status(500).json({ message: 'Failed to upload avatar', error: err.message });
    }
};

// Serve current avatar file
const getAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('avatarFilename');
        if (!user || !user.avatarFilename) return res.status(404).json({ message: 'Avatar not set' });
        const filePath = path.join(avatarsDir, user.avatarFilename);
        if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Avatar file missing' });
        return res.sendFile(filePath);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get avatar', error: err.message });
    }
};

// Delete current avatar
const deleteAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('avatarFilename');
        if (!user || !user.avatarFilename) return res.status(404).json({ message: 'Avatar not set' });
        const filePath = path.join(avatarsDir, user.avatarFilename);
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, () => {}); // ignore unlink errors
        }
        await updateUserAndClearCache(req.user._id, { $unset: { avatarFilename: '' } });
        res.json({ message: 'Avatar removed' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete avatar', error: err.message });
    }
};

// Update about text
const updateAbout = async (req, res) => {
    try {
        const { about } = req.body;
        if (typeof about !== 'string' || about.length > 500) {
            return res.status(400).json({ message: 'About must be a string up to 500 characters' });
        }
        await updateUserAndClearCache(req.user._id, { about });
        res.json({ message: 'About updated', about });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update about', error: err.message });
    }
};

// Get self profile (minimal)
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('username email about avatarFilename');
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get profile', error: err.message });
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
    getPlaylistById,
    uploadAvatar,
    getAvatar,
    deleteAvatar,
    updateAbout,
    getMe,
    upload // export upload middleware for route wiring
};

// ===== Playlist cover upload setup =====
const coversDir = path.join(__dirname, '..', 'uploads', 'playlist-covers');
if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true });
}

const coverStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, coversDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.png';
        cb(null, `${req.user._id}-${Date.now()}${ext}`);
    }
});

const uploadPlaylistCover = multer({ storage: coverStorage, limits: { fileSize: 3 * 1024 * 1024 }, fileFilter: imageFileFilter });

module.exports.uploadPlaylistCover = uploadPlaylistCover;

module.exports.setPlaylistCover = async (req, res) => {
    try {
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const playlist = await Playlist.findOne({ _id: id, userId: req.user._id });
        if (!playlist) return res.status(404).json({ message: 'Playlist not found or unauthorized' });
        // If coverUrl points to our uploads dir, attempt to clean up old file
        if (playlist.coverUrl) {
            try {
                const maybePath = playlist.coverUrl.split('/api/uploads/')[1];
                if (maybePath) {
                    const full = path.join(__dirname, '..', 'uploads', maybePath);
                    if (fs.existsSync(full)) fs.unlink(full, () => {});
                }
            } catch {}
        }
        const relPath = `playlist-covers/${req.file.filename}`;
        const coverUrl = `/api/uploads/${relPath}`;
        playlist.coverUrl = coverUrl;
        await playlist.save();
        res.json({ message: 'Cover updated', coverUrl });
    } catch (err) {
        res.status(500).json({ message: 'Failed to set cover', error: err.message });
    }
};
