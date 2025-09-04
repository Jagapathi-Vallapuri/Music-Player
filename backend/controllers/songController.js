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
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const songData = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype,
      gridfsId: req.file.id
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

module.exports = {
  uploadSong,
  getUserSongs,
  deleteSong,
  streamSong
};
