# Music-Player

A full‑stack music app with Spotify-powered discovery, user authentication, playlists, personal song uploads/streaming, and a global web audio player.

- Backend: Node.js, Express 5, MongoDB (Mongoose), GridFS (uploads), Redis (caching), Nodemailer (email/2FA)
- Music provider: Spotify Web API (Client Credentials flow)
- Frontend: React + Vite + MUI, React Router, Axios

## Features
- Email/password auth with optional email 2FA flows (unified verification endpoint)
- User profile with avatar upload, about, history, favorites, and playlists
- Discover: Popular tracks, New Releases (Albums), Album details (tracks)
- Personal song upload to MongoDB GridFS and authenticated streaming
- Rate limiting, request validation, centralized error handling
- Global audio player (play/pause, progress) with click‑to‑play from pages

## Monorepo Structure
```
backend/
  server.js
  package.json
  controllers/  # auth, music, songs, users
  middleware/   # auth, validation, rate-limit, error
  models/       # User, Playlist
  routes/       # /api/* routers
  services/     # spotify, cache (redis), email
  uploads/      # gridfs bucket name reference
frontend/
  src/
    pages/     # Login, Register, Verify2FA, Home, Album, etc.
    context/   # PlayerContext, Auth/UI/Theme contexts (where applicable)
    components/# PlayerBar
  package.json
  vite.config.js
```

## Prerequisites
- Node.js 18+ (recommended)
- MongoDB connection string (Atlas or self-hosted)
- Spotify API credentials (Client ID/Secret)
- Redis (optional but recommended for caching; app runs even if Redis is unavailable)
- SMTP account (optional; required for email 2FA/password flows)

## Quick Start (Local)
1) Backend
- Create `backend/.env` (see template below)
- Install and start the API server (default port 5000)

2) Frontend
- Configure API base if needed
- Install and start the Vite dev server (default port 5173)

Open the app at http://localhost:5173

### Backend: .env template
Create a file `backend/.env` with the following keys (example values are placeholders):
```
# Core
PORT=5000
MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-string

# CORS
FRONTEND_ORIGIN=http://localhost:5173

# Spotify (required)
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_MARKET=IN
# Optional: a playlist to source "popular" tracks from (e.g., Global Top 50)
# SPOTIFY_POPULAR_PLAYLIST_ID=37i9dQZEVXbMDoHDwVN2tF

# Redis (optional: choose URL or host/port)
# REDIS_URL=redis://default:<password>@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_USERNAME=default
# REDIS_PASSWORD=your-redis-password

# SMTP (required only for email 2FA/password flows)
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@example.com
```
Notes:
- If Redis connects successfully, Spotify tokens and API results will be cached.
- If Redis is unreachable, cache gracefully disables; the app still functions (with more direct API calls).

### Install & Run
Backend (port 5000):
- cd backend
- npm install
- npm run dev  # nodemon

Frontend (port 5173):
- cd frontend
- npm install
- npm run dev

The frontend Axios client defaults to `http://localhost:5000/api`. You can override with `VITE_API_BASE_URL` in `frontend` if your API is elsewhere.

## API Overview
Base URL: `http://localhost:5000/api`

Health
- GET `/health` → { success, message, timestamp }

Auth
- POST `/auth/register` { username, email, password }
  - Starts registration and sends a 2FA code via email (if SMTP configured)
- POST `/auth/verify-2fa` { email, code, type: 'register' | 'login', sessionId? }
  - Unified verification endpoint: completes registration or login after 2FA
- POST `/auth/login` { email, password }
- GET `/auth/validate` (Bearer token)
- POST `/auth/change-password` (Bearer token) { currentPassword, newPassword }

Music (Spotify-powered, public)
- GET `/music/search?q=<query>`
- GET `/music/track/:id`
- GET `/music/popular`
- GET `/music/albums` (New Releases by market)
- GET `/music/albums/:id`

Users (Bearer token required)
- Profile
  - GET `/users/me`
  - PATCH `/users/me` { about }
  - POST `/users/me/avatar` (multipart form-data, field: `avatar`)
  - GET `/users/me/avatar`
  - DELETE `/users/me/avatar`
- History
  - POST `/users/history` { track fields }
  - GET `/users/history`
- Favorites
  - GET `/users/favorites`
  - POST `/users/favorites` { trackId }
  - DELETE `/users/favorites` { trackId }
- Playlists
  - GET `/users/playlists`
  - POST `/users/playlists` { name, description?, tracks? }
  - PUT `/users/playlists/:id`
  - DELETE `/users/playlists/:id`

Songs (personal uploads; Bearer token required)
- POST `/songs/upload` (multipart form-data, field: `song`) → Stores into GridFS
- GET `/songs` → Lists uploaded files
- GET `/songs/stream/:filename` → Streams from GridFS
- DELETE `/songs/:filename`

Rate Limits
- General: 100 req / 15 min per IP
- Auth: 5 attempts / 15 min (successful requests skipped)
- Search: 20 req / min

Validation & Errors
- Requests validated via `express-validator`
- Standard error wrapper with meaningful HTTP codes and messages

## Frontend
- Vite React app with MUI components and a global PlayerBar
- Axios client (`frontend/client.js`) uses `VITE_API_BASE_URL` (or defaults to `http://localhost:5000/api`) and attaches JWT if present
- A 401 response triggers a centralized logout handler if wired via `injectLogoutHandler`

Environment (frontend `/.env.local`, optional):
```
VITE_API_BASE_URL=http://localhost:5000/api
```

Dev Scripts
- `npm run dev` → start Vite dev server
- `npm run build` → production build to `dist/`
- `npm run preview` → preview the production build

## Development Notes
- CORS: If the frontend runs on a different origin, update `FRONTEND_ORIGIN` in backend `.env` (comma‑separated list allowed)
- Spotify previews: Some tracks have no `preview_url`; the player will show a user‑friendly message and skip playback
- Authentication: Many user and upload routes require a Bearer token in `Authorization` header
- Global player: A minimal global bar is wired; seek/queue/next/prev can be added later
- Known UI gaps: "View all" pages for albums/popular may not be implemented yet (router warnings may appear if linked)

## Production Deployment (outline)
- Frontend: `npm run build` in `frontend` and deploy `dist/` to static hosting (Netlify/Vercel/S3/etc.)
- Backend: Run Node server (PM2/systemd/Docker) with `.env` configured; expose port 5000 (or set `PORT`)
- Configure CORS `FRONTEND_ORIGIN` to your deployed frontend URL
- Ensure MongoDB, Redis (optional), and SMTP (optional) services are reachable

## Troubleshooting
- 401 Unauthorized on `/auth/validate`: ensure requests include `Authorization: Bearer <token>`; login/2FA must complete successfully to obtain a token
- CORS blocked: verify `FRONTEND_ORIGIN` includes your frontend origin exactly (scheme, host, and port)
- Redis errors: app continues without cache; verify `REDIS_URL` or host/port/auth settings
- Spotify errors: confirm `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are set; network must reach `accounts.spotify.com` and `api.spotify.com`
- MongoDB connection: check `MONGO_URL` and whitelist your IP if using Atlas

## Acknowledgements
- Spotify Web API
- Material UI (MUI)
