const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const conn = mongoose.connection;
let gfs;

conn.once('open', () => {
  gfs = Grid(conn.db, mongoose.mongo);
  if (!gfs) {
    console.error('Failed to initialize GridFS');
    return;
  }
  gfs.collection('uploads');
});

const User = require('../models/User');

const uploadSong = async (req, res) => {
  try {
    const songFile = req.files?.song?.[0];
    const coverFile = req.files?.cover?.[0];
    const { title } = req.body || {};
    if (!songFile) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }

    // Basic audio-only validation
    if (!songFile.mimetype || !songFile.mimetype.startsWith('audio/')) {
      return res.status(400).json({ message: 'Uploaded file must be an audio file' });
    }
    if (coverFile && !coverFile.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Cover must be an image' });
    }

    // Compute a simple curation score
    const titleLen = typeof title === 'string' ? title.trim().length : 0;
    const hasCover = !!coverFile;
    const preferredAudio = /mp3|mpeg|aac|flac|wav|ogg/.test(songFile.mimetype);
    const sizeQuality = songFile.size > 15 * 1024 * 1024 ? 'large' : songFile.size > 2 * 1024 * 1024 ? 'ok' : 'small';
    const curationScore = (hasCover ? 40 : 0) + Math.min(30, Math.floor(titleLen / 2)) + (preferredAudio ? 20 : 5) + (sizeQuality === 'ok' ? 10 : sizeQuality === 'large' ? 5 : 0);

    const songData = {
      filename: songFile.filename,
      originalName: songFile.originalname,
      size: songFile.size,
      mimeType: songFile.mimetype,
      gridfsId: songFile.id,
      title: typeof title === 'string' ? title.trim() : undefined,
      coverFilename: coverFile?.filename,
      coverMimeType: coverFile?.mimetype,
      coverGridfsId: coverFile?.id,
      curationScore,
      curation: {
        hasCover,
        titleLength: titleLen,
        preferredAudio,
        sizeQuality,
      }
    };

    await User.findByIdAndUpdate(req.user._id, {
      $push: { uploadedSongs: songData }
    });

    res.json({
      message: 'Song uploaded successfully',
      song: songData
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Failed to upload song', error: err.message });
  }
};

const getUserSongs = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('uploadedSongs');
    res.json(user.uploadedSongs || []);
  } catch (err) {
    res.status(500).json({ message: 'Failed to get songs', error: err.message });
  }
};

const deleteSong = async (req, res) => {
  try {
    const { filename } = req.params;
    const user = await User.findById(req.user._id);

    const songIndex = user.uploadedSongs.findIndex(song => song.filename === filename);
    if (songIndex === -1) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const song = user.uploadedSongs[songIndex];

    if (song.gridfsId) {
      gfs.remove({ _id: song.gridfsId, root: 'uploads' }, (err) => {
        if (err) console.error('GridFS delete error:', err);
      });
    }

    user.uploadedSongs.splice(songIndex, 1);
    await user.save();

    res.json({ message: 'Song deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete song', error: err.message });
  }
};

const streamSong = async (req, res) => {
  try {
    const { filename } = req.params;
    const user = await User.findById(req.user._id);

    const song = user.uploadedSongs.find(song => song.filename === filename);
    if (!song || !song.gridfsId) {
      return res.status(404).json({ message: 'Song not found' });
    }

    const readstream = gfs.createReadStream({
      _id: song.gridfsId,
      root: 'uploads'
    });

    readstream.on('error', (err) => {
      res.status(500).json({ message: 'Stream error', error: err.message });
    });

    res.set('Content-Type', song.mimeType);
    readstream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: 'Failed to stream song', error: err.message });
  }
};

// Stream cover image by filename (re-use the same collection)
const streamCover = async (req, res) => {
  try {
    const { filename } = req.params;
    const user = await User.findById(req.user._id);

    const entry = user.uploadedSongs.find(s => s.coverFilename === filename);
    if (!entry || !entry.coverGridfsId) {
      return res.status(404).json({ message: 'Cover not found' });
    }

    const readstream = gfs.createReadStream({
      _id: entry.coverGridfsId,
      root: 'uploads'
    });

    readstream.on('error', (err) => {
      res.status(500).json({ message: 'Stream error', error: err.message });
    });

    res.set('Content-Type', entry.coverMimeType || 'image/jpeg');
    readstream.pipe(res);
  } catch (err) {
    res.status(500).json({ message: 'Failed to stream cover', error: err.message });
  }
};

module.exports = {
  uploadSong,
  getUserSongs,
  deleteSong,
  streamSong,
  streamCover
};
