# Pulse — Backend

This folder contains the backend REST API for the Pulse application (Express + MongoDB + Redis). This README is a concise developer guide to get the backend running locally, explains the 2FA session flow, and includes operational and security notes.

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
SMTP_FROM="Pulse <no-reply@example.com>"
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
docker build -t pulse-backend:local .
docker run -p 5000:5000 --env-file .env pulse-backend:local
```

When deploying to a container platform, ensure your environment variables (esp. `MONGO_URL`, `REDIS_URL`, and `JWT_SECRET`) are set securely in the target environment.

## 2FA model (registration + password change)

Current design enforces email-based 2FA only for:

1. Initial registration (account activation)
2. Password changes (confirmation)

Login itself is now a single step (JWT issued immediately) but only after the user has verified their email via the registration 2FA. A new field `isVerified` on the `User` model gates access:

- `POST /api/auth/register` creates the user with `isVerified=false`, generates a `sessionId` + 6‑digit code, stores it in Redis at key `2fa:session:{sessionId}` with JSON payload `{ code, email, purpose: 'register' }` (TTL ~300s) and emails the code.
- Client calls `POST /api/auth/verify-2fa` with `{ email, code, type: 'register', sessionId }` to activate. On success: `isVerified` is set true and a JWT is returned.
- `POST /api/auth/login` returns 403 if `isVerified=false`.
- `POST /api/auth/change-password` sends a one-time 2FA code (stored at `2fa:{userId}`) and puts the hashed pending password at `pendingPassword:{userId}` until verified via `POST /api/auth/verify-2fa` with `type: 'password-change'`.

Security notes / future hardening:
- Consider hashing/HMAC’ing codes before storage (defense-in-depth if Redis compromised).
- Track attempt counts per session (`attempts:2fa:session:{sessionId}`) to lock after N failures.
- Consider adding optional time-based authenticator app support later (fallback to email only).
- Ensure SMTP rate limiting at provider level to deter abuse.

Client guidance:
- Persist `sessionId` (e.g., `sessionStorage`) during registration verification so refreshes don’t orphan the flow.
- On 403 login response with message `Account not verified`, redirect user to a resend/verification UX.

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