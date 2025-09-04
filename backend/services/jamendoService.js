const axios = require('axios');
const cache = require('./cacheService');
const JAMENDO_API_BASE = 'https://api.jamendo.com/v3.0/';
const CLIENT_ID = process.env.JAMENDO_CLIENT_ID;

const decodeHtmlEntities = (text) => {
    if (!text) return '';
    return text.replace(/&amp;/g, '&');
};

const withCache = async (key, fn, transform, ttlSeconds) => {
    const cached = await cache.get(key);
    if (cached) return JSON.parse(cached);

    const result = await fn();
    const transformedResult = transform ? transform(result) : result;

    await cache.set(key, JSON.stringify(transformedResult), ttlSeconds);
    return transformedResult;
};

const searchTracks = (query) => {
    const normalized = String(query || '').trim().toLowerCase();
    return withCache(`search:${normalized}`, async () => {
        const response = await axios.get(`${JAMENDO_API_BASE}/tracks`, {
            params: {
                client_id: CLIENT_ID,
                format: 'json',
                limit: 20,
                namesearch: query,
                audioformat: 'mp3',
                include: 'musicinfo'
            },
        });
        return response.data.results.map(track => ({
            ...track,
            artist_name: decodeHtmlEntities(track.artist_name)
        }));
    }, null, 3600);
};

const getTrackById = (id) => {
    const normId = String(id).trim();
    return withCache(`track:${normId}`, async () => {
        const response = await axios.get(`${JAMENDO_API_BASE}/tracks`, {
            params: {
                client_id: CLIENT_ID,
                id: normId,
                format: 'json',
                include: 'musicinfo+stats'
            }
        });
        const track = response.data.results[0];
        if (track) {
            track.artist_name = decodeHtmlEntities(track.artist_name);
        }
        return track;
    }, null, 21600);
};

const getPopular = () => {
    return withCache('popular', async () => {
        const response = await axios.get(`${JAMENDO_API_BASE}/tracks`, {
            params: {
                client_id: CLIENT_ID,
                format: 'json',
                order: 'popularity_total',
                limit: 30,
                include: 'musicinfo+stats'
            }
        });
        return response.data.results;
    }, (results) => results.map((track) => ({
        id: track.id,
        name: track.name,
        artist: decodeHtmlEntities(track.artist_name),
        audioUrl: track.audio,
        image: track.image,
        duration: track.duration,
        album: track.album_name,
        genres: track.musicinfo?.tags?.genres || [],
        stats: {
            favorited: track.stats?.favorited || 0,
            likes: track.stats?.likes || 0,
        }
    })), 1800);
};

const getAlbums = () => {
    return withCache('albums', async () => {
        const response = await axios.get(`${JAMENDO_API_BASE}/albums/tracks`, {
            params: {
                client_id: CLIENT_ID,
                format: 'json',
                order: 'popularity_total',
                limit: 10,
                include: 'musicinfo+stats'
            }
        });
        return response.data.results;
    }, (results) => results.map((album) => ({
        id: album.id,
        name: album.name,
        artist: decodeHtmlEntities(album.artist_name),
        image: album.image,
        tracks: album.tracks,
        stats: {
            favorited: album.stats?.favorited || 0,
            likes: album.stats?.likes || 0,
        }
    })), 3600);
};

const getTracksByIds = (ids) => {
    const idsArr = Array.isArray(ids) ? ids.map(String).map(s => s.trim()) : String(ids).split(',').map(s => s.trim());
    const sorted = idsArr.slice().sort();
    return withCache(`tracks:${sorted.join(',')}`, async () => {
        const response = await axios.get(`${JAMENDO_API_BASE}/tracks`, {
            params: {
                client_id: CLIENT_ID,
                id: sorted.join('+'),
                format: 'json',
                include: 'musicinfo+stats'
            }
        });
        return response.data.results.map(track => ({
            ...track,
            artist_name: decodeHtmlEntities(track.artist_name)
        }));
    }, null, 21600);
};

module.exports = { searchTracks, getTrackById, getPopular, getAlbums, getTracksByIds };