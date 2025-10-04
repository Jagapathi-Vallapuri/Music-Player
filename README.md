# Pulse

A full‑stack music app with Jamendo‑powered discovery, user authentication, playlists, personal song uploads/streaming, and a robust global web audio player with queue management.

- Backend: Node.js, Express 5, MongoDB (Mongoose), GridFS (uploads), Redis (caching), Nodemailer (email/2FA)
- Music provider: Jamendo API v3.0
- Frontend: React + Vite + MUI, React Router, Axios

## Features
- Email/password auth with optional email 2FA flows (unified verification endpoint)
- User profile with avatar upload, about, history, favorites, and playlists
- Discover: Popular tracks, Albums, Album details (tracks)
- Personal song upload to MongoDB GridFS and authenticated streaming
- Rate limiting, request validation, centralized error handling
- Favorites across the app: like/unlike songs in Album, Playlist, Search results, and Uploads
- Icon‑first actions: Play Now, Add to Queue, and Add to Playlist presented as icons with tooltips
- Profile metrics include approximate "hours listened" derived from history
- Global audio player with:
  - Play/pause, next/prev, seek
  - Volume control and mute, persisted volume
  - Queue: play now, add to queue, remove, drag‑to‑reorder, play at index
  - Shuffle upcoming tracks
  - Compact PlayerBar with square artwork, theme‑aware colors (light: white controls; dark: black)
  - Placeholder state when idle; pressing Play starts the current queue
  - Player is shown only when the user is authenticated
  - Album page: “Play now” and “Add to queue” buttons; track row click starts playback from that track
  - Home Popular: clicking a card plays just that single track
  - Queue and current index persist in localStorage; session resumes after reload without auto‑play

## Monorepo Structure
```
backend/
  server.js
  package.json
  controllers/  # auth, music, songs, users
  middleware/   # auth, validation, rate-limit, error
  models/       # User, Playlist
  routes/       # /api/* routers
  services/     # jamendo, cache (redis), email
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
- Jamendo API Client ID
- Redis (optional but recommended for caching; app runs even if Redis is unavailable)
- Email provider (SendGrid recommended). SMTP account optional (used only as fallback) for email 2FA/password flows.

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

# Jamendo (required)
JAMENDO_CLIENT_ID=your-jamendo-client-id

# Redis (optional: choose URL or host/port)
# REDIS_URL=redis://default:<password>@localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_USERNAME=default
# REDIS_PASSWORD=your-redis-password

# Email: SendGrid-first (recommended), SMTP fallback (optional)
# SendGrid (recommended for cloud hosts; uses HTTPS port 443)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM="Pulse <no-reply@yourdomain.com>"

# SMTP (fallback only; many hosts block outbound SMTP ports)
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@example.com
```
Notes:
- If Redis connects successfully, Jamendo responses are cached.
- If Redis is unreachable, cache gracefully disables; the app still functions (with direct API calls).
 - Playback is proxied through the backend to bypass Jamendo storage CORS. The API exposes `/api/music/stream?src=<jamendo-audio-url>` with Range support.
 - Email: In production on most PaaS hosts, prefer SendGrid’s Web API with a Verified Sender or Domain. SMTP often times out due to blocked ports.

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

Music (Jamendo-powered, public)
- GET `/music/search?q=<query>`
- GET `/music/track/:id`
- GET `/music/popular`
- GET `/music/albums`
- GET `/music/albums/:id`
- GET `/music/stream?src=<jamendo-audio-url>` — streams/proxies Jamendo audio with Range support (used by the frontend player to avoid CORS)

Users (Bearer token required)
- Profile
  - GET `/users/me`
  - PATCH `/users/me` { about }
  - POST `/users/me/avatar` (multipart form-data, field: `avatar`)
  - GET `/users/me/avatar`
  - DELETE `/users/me/avatar`
- History
  - POST `/users/history` { trackId }
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
  - POST `/users/playlists/:id/cover` (multipart form-data, field: `cover`)

Songs (personal uploads; Bearer token required)
- POST `/songs/upload` (multipart form-data, field: `song`) → Stores into GridFS
- GET `/songs` → Lists uploaded files
- GET `/songs/stream/:filename` → Streams from GridFS
- GET `/songs/cover/:filename` → Streams uploaded cover image from GridFS
- DELETE `/songs/:filename`
  
Images
- GET `/images/playlist/:id` → Streams playlist cover from GridFS
  
Legacy static files (old uploads)
- Served under `/api/uploads/*` for backward compatibility

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

Player & Queue
- PlayerBar is rendered only for authenticated users.
- Controls: play/pause, next/prev, seek, volume, mute.
- Queue Drawer: view, play specific track, remove, and drag to reorder. “Shuffle” shuffles upcoming tracks while keeping the current one.
- Album page includes “Play now” (prioritize album tracks) and “Add to queue”. Clicking a track row starts playback from that index.
- Home Popular: clicking a card plays that single track.

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
- Jamendo audio: Track objects include `audio` URLs for streaming when requested with `audioformat=mp3`; respect the specific Creative Commons license of each track.
- Audio streaming is performed via the backend proxy `/api/music/stream` to support Range requests and avoid CORS issues with Jamendo storage hosts. Only Jamendo hosts are permitted by the proxy as an SSRF safeguard.
- Authentication: Many user and upload routes require a Bearer token in `Authorization` header
- Global player: Full controls, queue management, shuffle, and theme‑aware UI are implemented.
- Known UI gaps: "View all" pages for albums/popular may not be implemented yet (router warnings may appear if linked)

## Production Deployment (outline)
- Frontend: `npm run build` in `frontend` and deploy `dist/` to static hosting (Netlify/Vercel/S3/etc.)
- Backend: Run Node server (PM2/systemd/Docker) with `.env` configured; expose port 5000 (or set `PORT`)
- Configure CORS `FRONTEND_ORIGIN` to your deployed frontend URL
- Ensure MongoDB, Redis (optional), and SMTP (optional) services are reachable

## Deployment on Render
Render works well with this monorepo. Use a Web Service for the backend and a Static Site for the frontend.

Backend (Web Service):
- Root: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`
- Health Check: `/api/health` (expects JSON `{ success: true }`)
- Environment Variables:
  - MONGO_URL, JWT_SECRET, JAMENDO_CLIENT_ID
  - FRONTEND_ORIGIN: set to your Static Site URL(s), e.g. `https://pulse-frontend.onrender.com`
  - SENDGRID_API_KEY, SENDGRID_FROM (recommended) and optionally SMTP_* for fallback
- Notes:
  - Express is configured with `app.set('trust proxy', 1)` to work correctly behind Render’s proxy (rate limiter and IP extraction).
  - If using MongoDB Atlas, add Render egress IPs to your Atlas Network Access allowlist.
  - SMTP ports are commonly blocked on PaaS; prefer SendGrid Web API.

Frontend (Static Site):
- Root: `frontend`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Environment: set `VITE_API_BASE_URL` (in Render Static Site environment) to your backend URL, e.g. `https://pulse-backend.onrender.com/api`
- After deploy, update backend `FRONTEND_ORIGIN` to this static site origin for CORS.

Optional `render.yaml` (monorepo) can be added to codify both services. If you want, we can generate one tailored to your Render account naming.

## Troubleshooting
- 401 Unauthorized on `/auth/validate`: ensure requests include `Authorization: Bearer <token>`; login/2FA must complete successfully to obtain a token
- CORS blocked: verify `FRONTEND_ORIGIN` includes your frontend origin exactly (scheme, host, and port)
- Redis errors: app continues without cache; verify `REDIS_URL` or host/port/auth settings
- Jamendo errors or no playback: confirm `JAMENDO_CLIENT_ID` is set; network must reach `api.jamendo.com`; ensure the frontend is using the `/music/stream` proxy (the player replaces Jamendo audio URLs automatically).
- MongoDB connection: check `MONGO_URL` and whitelist your IP if using Atlas

## Acknowledgements
- Jamendo API
- Material UI (MUI)
