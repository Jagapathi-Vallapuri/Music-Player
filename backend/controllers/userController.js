const User = require('../models/User');
const Playlist = require('../models/Playlist');
const cache = require('../services/cacheService');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');

// Shared GridFS bucket for uploads (songs, images)
const conn = mongoose.connection;
let bucket;
conn.once('open', () => {
    bucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
});

// Multer in-memory storage for avatars (to stream into GridFS)
const storage = multer.memoryStorage();

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
    // If description is missing or blank, omit it so Mongoose default applies
    const desc = (typeof description === 'string' && description.trim().length > 0) ? description : undefined;
    const playlist = new Playlist({ userId, name, tracks, coverUrl, description: desc });
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
        const { name, tracks, coverUrl } = req.body;
        let { description } = req.body;
        if (typeof description !== 'string' || description.trim().length === 0) {
            description = 'A handpicked selection of tracks.';
        }
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

// Upload avatar (stores in GridFS)
const uploadAvatar = async (req, res) => {
    try {
        if (!bucket) return res.status(503).json({ message: 'Storage not ready, please try again' });
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        if (!/^(image)\//.test(req.file.mimetype)) return res.status(400).json({ message: 'Only image uploads are allowed' });

        // Remove old avatar from GridFS if exists
        const oldUser = await User.findById(req.user._id).select('avatarGridfsId');
        if (oldUser?.avatarGridfsId) {
            try { await bucket.delete(new ObjectId(oldUser.avatarGridfsId)); } catch (_) {}
        }

        const ext = path.extname(req.file.originalname) || '';
        const filename = `${req.user._id}-${Date.now()}${ext}`;
        const up = bucket.openUploadStream(filename, { contentType: req.file.mimetype });
        up.end(req.file.buffer);
        await new Promise((resolve, reject) => {
            up.on('finish', resolve);
            up.on('error', reject);
        });

        await updateUserAndClearCache(req.user._id, {
            avatarFilename: filename,
            avatarMimeType: req.file.mimetype,
            avatarGridfsId: up.id
        });

        res.json({ message: 'Avatar uploaded', filename });
    } catch (err) {
        res.status(500).json({ message: 'Failed to upload avatar', error: err.message });
    }
};

// Stream current avatar from GridFS
const getAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('avatarGridfsId avatarMimeType');
        if (!user || !user.avatarGridfsId) return res.status(404).json({ message: 'Avatar not set' });
        try {
            const dl = bucket.openDownloadStream(new ObjectId(user.avatarGridfsId));
            if (user.avatarMimeType) res.set('Content-Type', user.avatarMimeType);
            dl.on('error', (e) => res.status(500).json({ message: 'Stream error', error: e.message }));
            dl.pipe(res);
        } catch (e) {
            return res.status(500).json({ message: 'Failed to stream avatar', error: e.message });
        }
    } catch (err) {
        res.status(500).json({ message: 'Failed to get avatar', error: err.message });
    }
};

// Delete current avatar (GridFS)
const deleteAvatar = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('avatarGridfsId avatarFilename');
        if (!user) return res.status(404).json({ message: 'Avatar not set' });
        if (user.avatarGridfsId && bucket) {
            try { await bucket.delete(new ObjectId(user.avatarGridfsId)); } catch (_) {}
        } else if (user.avatarFilename) {
            // disk fallback cleanup
            const filePath = path.join(__dirname, '..', 'uploads', 'avatars', user.avatarFilename);
            if (fs.existsSync(filePath)) { try { fs.unlinkSync(filePath); } catch (_) {} }
        }
        await updateUserAndClearCache(req.user._id, { $unset: { avatarFilename: '', avatarMimeType: '', avatarGridfsId: '' } });
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
    upload
};

// Playlist cover upload via memory and GridFS
const uploadPlaylistCover = multer({ storage: multer.memoryStorage(), limits: { fileSize: 3 * 1024 * 1024 }, fileFilter: imageFileFilter });

module.exports.uploadPlaylistCover = uploadPlaylistCover;

module.exports.setPlaylistCover = async (req, res) => {
    try {
        if (!bucket) return res.status(503).json({ message: 'Storage not ready, please try again' });
        const { id } = req.params;
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const playlist = await Playlist.findOne({ _id: id, userId: req.user._id });
        if (!playlist) return res.status(404).json({ message: 'Playlist not found or unauthorized' });
        // Delete old GridFS cover if exists
        if (playlist.coverGridfsId) {
            try { await bucket.delete(new ObjectId(playlist.coverGridfsId)); } catch (_) {}
        }
        // Remove any old disk cover referenced by legacy coverUrl
        if (playlist.coverUrl && playlist.coverUrl.includes('/api/uploads/')) {
            try {
                const rel = playlist.coverUrl.split('/api/uploads/')[1];
                if (rel) {
                    const full = path.join(__dirname, '..', 'uploads', rel);
                    if (fs.existsSync(full)) fs.unlinkSync(full);
                }
            } catch (_) {}
        }

        const ext = path.extname(req.file.originalname) || '';
        const filename = `${req.user._id}-${Date.now()}${ext}`;
        const up = bucket.openUploadStream(filename, { contentType: req.file.mimetype });
        up.end(req.file.buffer);
        await new Promise((resolve, reject) => { up.on('finish', resolve); up.on('error', reject); });

        // Public stream endpoint for playlist covers
        const coverUrl = `/api/images/playlist/${encodeURIComponent(String(playlist._id))}`;
        playlist.coverUrl = coverUrl;
        playlist.coverFilename = filename;
        playlist.coverMimeType = req.file.mimetype;
        playlist.coverGridfsId = up.id;
        await playlist.save();
        res.json({ message: 'Cover updated', coverUrl });
    } catch (err) {
        res.status(500).json({ message: 'Failed to set cover', error: err.message });
    }
};
