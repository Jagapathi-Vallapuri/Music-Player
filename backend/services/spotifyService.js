const axios = require('axios');
const cache = require('./cacheService');

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const SPOTIFY_MARKET = process.env.SPOTIFY_MARKET || 'IN';
const SPOTIFY_POPULAR_PLAYLIST_ID = process.env.SPOTIFY_POPULAR_PLAYLIST_ID; // optional, e.g. Global Top 50: 37i9dQZEVXbMDoHDwVN2tF

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
  console.warn('Spotify credentials missing: set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET');
}

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

async function getAccessToken() {
  const cached = await cache.get('spotify:token');
  if (cached) return cached;

  const tokenResp = await axios.post(
    'https://accounts.spotify.com/api/token',
    new URLSearchParams({ grant_type: 'client_credentials' }).toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' + Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      },
    }
  );
  const { access_token, expires_in } = tokenResp.data;
  // Cache slightly less than expiry to be safe
  await cache.set('spotify:token', access_token, Math.max(60, Math.min(expires_in - 60, 3500)));
  return access_token;
}

async function spotifyRequest(path, params = {}) {
  const token = await getAccessToken();
  const res = await axios.get(`${SPOTIFY_API_BASE}${path}`, {
    params,
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}

const decodeHtmlEntities = (text) => (text ? text.replace(/&amp;/g, '&') : '');

function mapTrack(track, albumHint) {
  if (!track) return null;
  const album = albumHint || track.album;
  const image = album?.images?.[0]?.url || null;
  return {
    id: track.id,
    name: track.name,
    artist: decodeHtmlEntities(track.artists?.[0]?.name || ''),
    audioUrl: track.preview_url || null, // Spotify preview (30s) or null
    image,
    duration: Number.isFinite(track.duration_ms) ? Math.round(track.duration_ms / 1000) : undefined,
    album: album?.name || undefined,
    // Optional fields to keep parity with Jamendo shapes
    genres: [],
    stats: { favorited: 0, likes: 0 },
  };
}

// SEARCH TRACKS
const searchTracks = (query) => {
  const normalized = String(query || '').trim().toLowerCase();
  return withCache(`spotify:search:${normalized}`, async () => {
    const data = await spotifyRequest('/search', {
      q: query,
      type: 'track',
      market: SPOTIFY_MARKET,
      limit: 20,
    });
    const items = data?.tracks?.items || [];
    return items.map((t) => mapTrack(t));
  }, null, 3600);
};

// TRACK BY ID
const getTrackById = (id) => {
  const normId = String(id).trim();
  return withCache(`spotify:track:${normId}`, async () => {
    const data = await spotifyRequest(`/tracks/${normId}`, { market: SPOTIFY_MARKET });
    return data ? mapTrack(data) : null;
  }, null, 21600);
};

// POPULAR TRACKS (via featured playlist if provided, else a broad search fallback)
const getPopular = () => {
  return withCache('spotify:popular', async () => {
    if (SPOTIFY_POPULAR_PLAYLIST_ID) {
      const data = await spotifyRequest(`/playlists/${SPOTIFY_POPULAR_PLAYLIST_ID}/tracks`, {
        market: SPOTIFY_MARKET,
        limit: 30,
      });
      const items = data?.items || [];
      return items
        .map((it) => (it && it.track ? mapTrack(it.track) : null))
        .filter(Boolean);
    }
    // Fallback: broad search likely to yield popular tracks
    const data = await spotifyRequest('/search', {
      q: 'year:2024-2025',
      type: 'track',
      market: SPOTIFY_MARKET,
      limit: 30,
    });
    const items = data?.tracks?.items || [];
    return items.map((t) => mapTrack(t));
  }, null, 1800);
};

// NEW RELEASE ALBUMS
const getAlbums = () => {
  return withCache('spotify:albums', async () => {
    const data = await spotifyRequest('/browse/new-releases', {
      country: SPOTIFY_MARKET,
      limit: 10,
    });
    const items = data?.albums?.items || [];
    return items.map((al) => ({
      id: al.id,
      name: al.name,
      artist: decodeHtmlEntities(al.artists?.[0]?.name || ''),
      image: al.images?.[0]?.url || null,
      // Keep contract parity
      stats: { favorited: 0, likes: 0 },
    }));
  }, null, 3600);
};

// ALBUM BY ID
const getAlbumById = (id) => {
  const normId = String(id).trim();
  return withCache(`spotify:album:${normId}`, async () => {
    const album = await spotifyRequest(`/albums/${normId}`, { market: SPOTIFY_MARKET });
    if (!album) return null;

    // Collect up to first 50 tracks; paginate if needed (optional enhancement)
    let tracks = album.tracks?.items || [];
    // Map tracks now
    const mappedTracks = tracks.map((t) => mapTrack(t, album));

    return {
      id: album.id,
      name: album.name,
      artist: decodeHtmlEntities(album.artists?.[0]?.name || ''),
      image: album.images?.[0]?.url || null,
      stats: { favorited: 0, likes: 0 },
      tracks: mappedTracks,
    };
  }, null, 3600);
};

// TRACKS BY IDS
const getTracksByIds = (ids) => {
  const idsArr = Array.isArray(ids)
    ? ids.map(String).map((s) => s.trim())
    : String(ids)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  const sorted = idsArr.slice().sort();
  return withCache(`spotify:tracks:${sorted.join(',')}`, async () => {
    if (!sorted.length) return [];
    // Spotify allows up to 50 ids per request
    const chunks = [];
    for (let i = 0; i < sorted.length; i += 50) {
      chunks.push(sorted.slice(i, i + 50));
    }
    const results = [];
    for (const chunk of chunks) {
      const data = await spotifyRequest(`/tracks`, {
        ids: chunk.join(','),
        market: SPOTIFY_MARKET,
      });
      const tracks = data?.tracks || [];
      results.push(...tracks.map((t) => mapTrack(t)));
    }
    return results;
  }, null, 21600);
};

// Simple cache wrapper similar to jamendoService
async function withCache(key, fn, transform, ttlSeconds) {
  const cached = await cache.get(key);
  if (cached) return JSON.parse(cached);
  const result = await fn();
  const transformed = transform ? transform(result) : result;
  await cache.set(key, JSON.stringify(transformed), ttlSeconds || 3600);
  return transformed;
}

module.exports = {
  searchTracks,
  getTrackById,
  getPopular,
  getAlbums,
  getTracksByIds,
  getAlbumById,
};
