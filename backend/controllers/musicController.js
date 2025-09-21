// Switched provider from Jamendo to Spotify. Contracts remain the same for controllers.
const { searchTracks, getTrackById, getPopular, getAlbums: fetchAlbums, getTracksByIds: fetchTracksByIdsService, getAlbumById } = require('../services/spotifyService');


const search = async (req, res) => {
	try {
		const { q } = req.query;

		if (!q) {
			return res.status(400).json({ message: 'Missing query parameter ?q=track_name' });
		}

		const tracks = await searchTracks(q);
		res.json(tracks);
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Failed to search tracks', error: err.message });
	}
};

const getTrackDetails = async (req, res) => {
	try {
		const track = await getTrackById(req.params.id);
		if (!track) return res.status(404).json({ message: 'Track not found' });
		res.json(track);
	} catch (err) {
		res.status(500).json({ message: 'Failed to get track info', error: err.message });
	}
};

const getPopularTracks = async (req, res) => {
	try {
		const tracks = await getPopular();
		res.json(tracks);
	} catch (err) {
		res.status(500).json({ message: 'Failed to get popular tracks', error: err.message });
	}
};

const getAlbums = async (req, res) => {
    try {
        const albums = await fetchAlbums();
        res.json(albums);
    } catch (err) {
        res.status(500).json({ message: 'Failed to get albums', error: err.message });
    }
};

const getAlbum = async (req, res) => {
	try {
		const { id } = req.params;
		const album = await getAlbumById(id);
		if (!album) return res.status(404).json({ message: 'Album not found' });
		res.json(album);
	} catch (err) {
		res.status(500).json({ message: 'Failed to get album', error: err.message });
	}
};

const getTracksByIds = async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) {
            return res.status(400).json({ message: 'Missing query parameter ?ids=track_id1,track_id2' });
        }
        const trackIds = ids.split(',');
        const tracks = await fetchTracksByIdsService(trackIds);
        res.json(tracks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to get tracks by IDs', error: err.message });
    }
};


module.exports = {
	search,
	getTrackDetails,
	getPopularTracks,
	getAlbums,
	getAlbum,
    getTracksByIds
};

