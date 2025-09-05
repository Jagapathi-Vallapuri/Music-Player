# MusicPlayer Backend

This repository contains the backend RESTful API for the MusicPlayer application. It provides user authentication, track search, favorites management, playlists, listening history, and caching features.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [Folder Structure](#folder-structure)
- [API Endpoints](#api-endpoints)
- [Caching Strategy](#caching-strategy)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)

## Features

- **User Authentication** (Register, Login) using JWT
- **Mandatory 2FA**: All users must verify via email code for login and password changes
- **Password Change**: Secure password updates with 2FA verification
- **Profile Pictures**: Upload and retrieve user profile pictures (stored in MongoDB)
- **Song Uploads**: Users can upload their own audio files (stored in MongoDB GridFS)
- **Music Search** and **Track Details** via Jamendo API
- **Popular Tracks** listing
- **Favorites**: add/remove tracks
- **Playlists**: create, update, delete, fetch user playlists
- **Listening History**: record and retrieve track history
- **Input Validation** with express-validator
- **Rate Limiting** for general requests and sensitive routes
- **Caching**: Redis-based caching for Jamendo API responses and user objects to improve performance and reduce database load.

## Tech Stack

- Node.js
- Express.js
- MongoDB (Mongoose + GridFS for file storage)
- Redis (for caching)
- JSON Web Tokens (jsonwebtoken)
- Jamendo API (via axios)
- Nodemailer (for email/2FA)
- Multer & Multer-GridFS-Storage (for file uploads)
- Middleware: CORS, Rate Limiting, Validation, Error Handling

## Prerequisites

- Node.js (v14+)
- MongoDB instance (local or cloud)
- Redis instance (local or cloud)
- [ ] A `.env` file with the necessary variables

## Installation

1. Clone the repository:
   ```bash
   git clone <repo-url> backend
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

## Environment Variables

Create a `.env` file in the `backend` folder with the following (examples):

```dotenv
# Required (server will exit if missing):
MONGO_URL=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret>

# Redis (preferred: single URL). If not provided, you can use the individual components below.
# REDIS_URL supports redis:// and rediss:// (TLS) formats.
# Example: REDIS_URL=rediss://:mypassword@my-redis-host.example.com:6380
REDIS_URL=redis://localhost:6379

# Optional alternative (component) configuration:
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=default
REDIS_PASSWORD=<your-redis-password>

# Other optional vars:
PORT=5000
# JAMENDO_CLIENT_ID is required if you use Jamendo features
# JAMENDO_CLIENT_ID=<your-jamendo-client-id>

# SMTP settings for 2FA emails
SMTP_HOST=<your-smtp-host>
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=<your-smtp-username>
SMTP_PASS=<your-smtp-password>
SMTP_FROM=<your-smtp-from-email>
```

Notes:
- The server now validates required environment variables at startup and will exit early with a clear error if `MONGO_URL` or `JWT_SECRET` are missing.
- Use `REDIS_URL` for cloud providers (recommended). If `REDIS_URL` is not set, the app will attempt to use `REDIS_HOST`/`REDIS_PORT`/`REDIS_USERNAME`/`REDIS_PASSWORD` if provided.
- For cloud Redis, prefer TLS (`rediss://`) and restrict access via VPC/ACLs where possible.
- In development you may keep a local Redis instance, but never commit credentials to source control — use a `.env` file and add it to `.gitignore` or use a secrets manager in production.
- If Redis is unreachable, the application falls back to a safe no-op cache (writes are skipped and reads return null) so the server remains available.

## Running the Server

- Development (auto-restart on changes):
  ```bash
  npm run dev
  ```
- Production:
  ```bash
  npm start
  ```

The server will start on `http://localhost:<PORT>` and expose routes under `/api`.

## Folder Structure

```
backend/
├─ controllers/       # Route handlers
│  ├─ authController.js
│  ├─ musicController.js
│  ├─ userController.js
# MusicPlayer — Backend

This folder contains the backend REST API for the MusicPlayer app (Express + MongoDB + Redis). This README is a concise developer guide to get the backend running locally, explains the 2FA session flow, and includes operational and security notes.

## Quick start

- Copy or create a `.env` file in `backend/` (see Environment Variables).
- Install dependencies and start the local dev server:

```powershell
cd backend
npm install
npm run dev
```

The API mounts under `/api` and defaults to port `5000` (configurable via `PORT`).

## Environment Variables

Create a `.env` (or use environment secrets) containing at minimum:

```dotenv
MONGO_URL=<mongodb-uri>
JWT_SECRET=<strong-jwt-secret>
REDIS_URL=redis://localhost:6379
PORT=5000

# SMTP for 2FA emails
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=you@example.com
SMTP_PASS=secret
SMTP_FROM="MusicPlayer <no-reply@example.com>"
```

Notes:
- The server validates required env vars at startup and will exit with a message if `MONGO_URL` or `JWT_SECRET` are missing.
- Prefer `REDIS_URL` for cloud providers (use `rediss://` for TLS).

## Running

- Development (auto-reload): `npm run dev`
- Production: `npm start`

Use `POST /api/auth/register` and `POST /api/auth/login` to exercise authentication flows.

## Docker (local / CI)

A `Dockerfile` exists in this folder. To build and run locally:

```powershell
cd backend
docker build -t musicplayer-backend:local .
docker run -p 5000:5000 --env-file .env musicplayer-backend:local
```

When deploying to a container platform, ensure your environment variables (esp. `MONGO_URL`, `REDIS_URL`, and `JWT_SECRET`) are set securely in the target environment.

## 2FA session behavior (important)

This backend uses server-issued 2FA sessions for login:

- `POST /api/auth/login` authenticates credentials and, if valid, generates a short-lived server `sessionId` (UUID) and an email 6-digit code.
- The code is stored in Redis at key `2fa:session:{sessionId}` with a TTL (short, e.g., 300s). The `sessionId` is returned to the client.
- The client submits the code along with `sessionId` to `POST /api/auth/verify-2fa`.
- Verification uses a Redis Lua script that atomically compares the stored code with the supplied one and deletes the key on success. This prevents race conditions and one-time reuse.

Frontend behavior: clients should persist `sessionId` (e.g., `sessionStorage`) while awaiting the code so a page reload doesn’t break the flow.

Security notes about 2FA:
- Codes are short-lived, but currently stored server-side in Redis. For better security, consider storing a keyed HMAC of the code instead of plaintext.
- Add a per-session attempt counter or rate-limiting to mitigate brute-force attempts.

## Folder overview

Key folders and files:

- `controllers/` — Express route handlers (e.g., `authController.js`)
- `routes/` — Route wiring
- `services/` — Integrations: `cacheService.js` (Redis), `emailService.js`, `jamendoService.js`
- `models/` — Mongoose schemas (User, Playlist)
- `middleware/` — auth, validation, rate limiting, error handling
- `server.js` — app entrypoint

## API (high level)

Base path: `/api`

- Auth: `POST /auth/register`, `POST /auth/login`, `POST /auth/verify-2fa`, `POST /auth/change-password`
- Music: `GET /music/search`, `GET /music/track/:id`, `GET /music/popular`
- Users / Playlists / Favorites endpoints under `/users`
- Songs: upload/stream endpoints under `/songs`

For full details of each route and payloads, inspect the `routes/` and `controllers/` files.

## Important operational notes

- Redis is used for caching and 2FA sessions; if Redis becomes unavailable the app falls back to a no-op cache for non-critical features, but authentication will fail if 2FA storage is unavailable.
- Keep `JWT_SECRET` strong and rotate it periodically if feasible.
- Do not commit `.env` to source control. Use a secrets manager for production deployments.

## Troubleshooting

- If the server exits on startup, check env var validation output for the missing variable.
- If email 2FA messages are not arriving, validate SMTP settings and check `emailService.js` logs.
- For Redis issues, verify `REDIS_URL` connectivity and that the Redis server supports EVAL commands (standard Redis does).