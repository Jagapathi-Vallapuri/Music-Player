const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  tracks: [String],
  coverUrl: { type: String },
  coverFilename: { type: String },
  coverMimeType: { type: String },
  coverGridfsId: { type: mongoose.Schema.Types.ObjectId },
  description: { type: String, default: 'A handpicked selection of tracks.' },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'playlists' });

module.exports = mongoose.model('Playlist', playlistSchema);
