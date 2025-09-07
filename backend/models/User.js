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
    uploadedSongs: [{
        filename: { type: String, required: true },
        originalName: { type: String, required: true },
        size: { type: Number, required: true },
        mimeType: { type: String, required: true },
        uploadDate: { type: Date, default: Date.now },
        gridfsId: { type: mongoose.Schema.Types.ObjectId }
    }]
});

module.exports = mongoose.model('User', userSchema);  