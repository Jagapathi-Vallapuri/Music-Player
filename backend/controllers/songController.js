const mongoose = require('mongoose');
const { GridFSBucket, ObjectId } = require('mongodb');
const conn = mongoose.connection;
let bucket;

conn.once('open', () => {
  bucket = new GridFSBucket(conn.db, { bucketName: 'uploads' });
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

    if (!songFile.mimetype || !songFile.mimetype.startsWith('audio/')) {
      return res.status(400).json({ message: 'Uploaded file must be an audio file' });
    }
    if (coverFile && !coverFile.mimetype?.startsWith('image/')) {
      return res.status(400).json({ message: 'Cover must be an image' });
    }
    const songFilename = `${req.user._id}-${Date.now()}-${songFile.originalname}`;
    const songUpload = bucket.openUploadStream(songFilename, { contentType: songFile.mimetype });
    songUpload.end(songFile.buffer);

    let coverFilename, coverId;
    if (coverFile) {
      coverFilename = `${req.user._id}-${Date.now()}-${coverFile.originalname}`;
      const coverUpload = bucket.openUploadStream(coverFilename, { contentType: coverFile.mimetype });
      coverUpload.end(coverFile.buffer);
      // Retrieve ids after finish
      await new Promise((resolve, reject) => {
        coverUpload.on('finish', resolve);
        coverUpload.on('error', reject);
      });
      coverId = coverUpload.id;
    }
    await new Promise((resolve, reject) => {
      songUpload.on('finish', resolve);
      songUpload.on('error', reject);
    });

    const titleLen = typeof title === 'string' ? title.trim().length : 0;
    const hasCover = !!coverFile;
    const preferredAudio = /mp3|mpeg|aac|flac|wav|ogg/.test(songFile.mimetype);
    const sizeQuality = songFile.size > 15 * 1024 * 1024 ? 'large' : songFile.size > 2 * 1024 * 1024 ? 'ok' : 'small';
    const curationScore = (hasCover ? 40 : 0) + Math.min(30, Math.floor(titleLen / 2)) + (preferredAudio ? 20 : 5) + (sizeQuality === 'ok' ? 10 : sizeQuality === 'large' ? 5 : 0);

    const songData = {
      filename: songFilename,
      originalName: songFile.originalname,
      size: songFile.size,
      mimeType: songFile.mimetype,
      gridfsId: songUpload.id,
      title: typeof title === 'string' ? title.trim() : undefined,
      coverFilename,
      coverMimeType: coverFile?.mimetype,
      coverGridfsId: coverId,
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
      try { await bucket.delete(new ObjectId(song.gridfsId)); } catch (e) { /* ignore */ }
    }
    if (song.coverGridfsId) {
      try { await bucket.delete(new ObjectId(song.coverGridfsId)); } catch (e) { /* ignore */ }
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

    try {
      const dl = bucket.openDownloadStream(new ObjectId(song.gridfsId));
      res.set('Content-Type', song.mimeType);
      const cleanup = () => { try { dl.unpipe(res); } catch (_) {} try { dl.destroy(); } catch (_) {} try { res.end(); } catch (_) {} };
      dl.on('error', (err) => { cleanup(); res.status(500).json({ message: 'Stream error', error: err.message }); });
      res.on('close', cleanup);
      req.on('aborted', cleanup);
      dl.pipe(res);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to stream song', error: err.message });
    }
  } catch (err) {
    res.status(500).json({ message: 'Failed to stream song', error: err.message });
  }
};

const streamCover = async (req, res) => {
  try {
    const { filename } = req.params;
    const user = await User.findById(req.user._id);

    const entry = user.uploadedSongs.find(s => s.coverFilename === filename);
    if (!entry || !entry.coverGridfsId) {
      return res.status(404).json({ message: 'Cover not found' });
    }

    try {
      const dl = bucket.openDownloadStream(new ObjectId(entry.coverGridfsId));
      res.set('Content-Type', entry.coverMimeType || 'image/jpeg');
      const cleanup = () => { try { dl.unpipe(res); } catch (_) {} try { dl.destroy(); } catch (_) {} try { res.end(); } catch (_) {} };
      dl.on('error', (err) => { cleanup(); res.status(500).json({ message: 'Stream error', error: err.message }); });
      res.on('close', cleanup);
      req.on('aborted', cleanup);
      dl.pipe(res);
    } catch (err) {
      return res.status(500).json({ message: 'Failed to stream cover', error: err.message });
    }
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
