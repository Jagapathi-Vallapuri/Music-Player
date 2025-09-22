const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    favorites: [String],
    playlists: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Playlist' }],
    history: [
        {
            trackId: String,
            listenedAt: { type: Date, default: Date.now }
        }
    ],
    profilePicture: { type: Buffer },
    profilePictureType: { type: String },
    about: { type: String, maxlength: 500, default: '' },
    avatarFilename: { type: String },
    uploadedSongs: [{
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        size: { type: Number, required: true },
        mimeType: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now },
        gridfsId: { type: mongoose.Schema.Types.ObjectId },
        // Optional metadata
        title: { type: String },
        coverFilename: { type: String },
        coverMimeType: { type: String },
        coverGridfsId: { type: mongoose.Schema.Types.ObjectId },
        // Curation metrics
        curationScore: { type: Number, default: 0 },
        curation: {
            hasCover: { type: Boolean, default: false },
            titleLength: { type: Number, default: 0 },
            preferredAudio: { type: Boolean, default: false },
            sizeQuality: { type: String, enum: ['small','ok','large','unknown'], default: 'unknown' }
        }
    }]
});

module.exports = mongoose.model('User', userSchema);  