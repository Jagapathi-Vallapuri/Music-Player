const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  tracks: [String],
  // Optional cover image URL for the playlist
  coverUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'playlists' });

module.exports = mongoose.model('Playlist', playlistSchema);
