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
│  └─ songController.js     # NEW: Song upload handlers
├─ middleware/        # Custom middleware
│  ├─ authMiddleware.js
│  ├─ errorMiddleware.js
│  ├─ rateLimitMiddleware.js
│  └─ validationMiddleware.js
├─ models/            # Mongoose schemas
│  ├─ User.js
│  └─ Playlist.js
├─ routes/            # API route definitions
│  ├─ authRoutes.js
│  ├─ musicRoutes.js
│  ├─ userRoutes.js
│  └─ songsRoutes.js       # NEW: Song upload routes
├─ services/          # External API integrations and other services
│  ├─ jamendoService.js
│  ├─ cacheService.js  # Redis caching service
│  └─ emailService.js  # Email service for 2FA
├─ server.js          # Entry point
├─ package.json
└─ .env.example       # Example environment variables
```

## API Endpoints

Base URL: `/api`

### Auth

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| POST   | `/auth/register`       | Register new user              |
| POST   | `/auth/login`          | User login (returns 2FA code)  |
| POST   | `/auth/verify-2fa`     | Verify 2FA code for login      |
| POST   | `/auth/change-password`| Change password with 2FA       |

### Music

| Method | Endpoint                         | Description                                    |
| ------ | -------------------------------- | ---------------------------------------------- |
| GET    | `/music/search?q=<query>`       | Search tracks                                  |
| GET    | `/music/track/:id`              | Get details for a specific track               |
| GET    | `/music/popular`                | Fetch popular tracks                           |

### User

| Method | Endpoint                    | Description                               |
| ------ | --------------------------- | ----------------------------------------- |
| POST   | `/users/history`            | Add track to listening history (auth)     |
| GET    | `/users/history`            | Get user listening history                |
| GET    | `/users/favorites`          | Get user favorites (auth)                 |
| POST   | `/users/favorites`          | Add track to favorites                    |
| DELETE | `/users/favorites`          | Remove track from favorites               |
| GET    | `/users/playlists`          | Get user playlists                        |
| POST   | `/users/playlists`          | Create a new playlist (auth)              |
| PUT    | `/users/playlists/:id`      | Update playlist name or tracks            |
| DELETE | `/users/playlists/:id`      | Delete a playlist                         |
| POST   | `/users/profile-picture`    | Upload profile picture (auth)             |
| GET    | `/users/profile-picture`    | Get profile picture (auth)                |

### Songs

| Method | Endpoint                    | Description                               |
| ------ | --------------------------- | ----------------------------------------- |
| POST   | `/songs/upload`             | Upload a song file (auth, multipart)      |
| GET    | `/songs`                    | Get user's uploaded songs                 |
| DELETE | `/songs/:filename`          | Delete a specific song                    |
| GET    | `/songs/stream/:filename`   | Stream a song file                        |

## File Storage

- **Profile Pictures**: Stored as binary data in MongoDB (User model).
- **Uploaded Songs**: Stored using MongoDB GridFS, which automatically handles large files by breaking them into chunks:
  - `uploads.files`: Metadata (filename, size, MIME type, etc.)
  - `uploads.chunks`: File data in 255KB chunks
- **Supported Formats**: MP3, WAV, OGG, MP4 (audio files only, max 50MB)
- **Streaming**: Songs are streamed directly from GridFS for efficient playback

- **Jamendo API Calls**: Responses from the Jamendo API (tracks, albums, popular) are cached in Redis to reduce external API calls and improve response times. Cache keys are generated based on query parameters.
- **User Objects**: After successful authentication, user objects (excluding sensitive data like passwords) are cached. The authentication middleware (`verifyToken`) attempts to retrieve the user from the cache first before querying MongoDB. This speeds up subsequent authenticated requests.
- **Cache Invalidation**: For user objects, the cache is invalidated (cleared) upon write operations (e.g., adding a favorite, updating history, modifying playlists) to ensure data consistency. The next request for that user will fetch fresh data from MongoDB and re-cache it.
- **TTL (Time-To-Live)**: Cached items have a defined TTL (e.g., 5 minutes for user objects, 1 hour for Jamendo API responses) after which they expire and are refetched on the next request.

### Cache TTLs

Current TTLs used by the application (seconds):

- User objects (cached in `authMiddleware`): 300 (5 minutes)
- Jamendo search responses: 3600 (1 hour)
- Jamendo single track: 21600 (6 hours)
- Jamendo popular: 1800 (30 minutes)
- Jamendo albums: 3600 (1 hour)
- Jamendo tracks by IDs: 21600 (6 hours)

You can tune these TTLs in `services/jamendoService.js` and `services/cacheService.js` to match your freshness/performance tradeoffs.

## Rate Limiting

To protect the API from abuse and ensure fair usage, rate limiting is implemented using the `express-rate-limit` middleware. Different strategies are applied to various parts of the API:

- **General Limiter**: Applied to all incoming requests to provide a baseline level of protection against rapid, repeated requests. This helps mitigate common DoS or brute-force attempts.
  - *Configuration*: Typically allows a higher number of requests per IP address within a given time window (e.g., 100 requests per 15 minutes).
- **Authentication Limiter (`authLimiter`)**: Specifically targets sensitive authentication routes like `/auth/register` and `/auth/login`. This helps prevent brute-force attacks on user credentials.
  - *Configuration*: Allows a lower number of requests (e.g., 5-10 requests per 15 minutes per IP) to these specific endpoints.
- **Search Limiter (`searchLimiter`)**: Applied to routes that interact with the external Jamendo API (e.g., `/music/search`). This protects our Jamendo API client ID from being overused and potentially blocked, and also helps manage costs if the external API has usage limits.
  - *Configuration*: Configured with a moderate number of requests (e.g., 20-30 requests per 15 minutes per IP).

When a rate limit is exceeded, the API responds with a `429 Too Many Requests` HTTP status code and a message indicating that the limit has been hit. The `Retry-After` header may also be included to inform the client when they can try again.

## Error Handling

The API employs a robust error handling strategy to ensure consistent and informative responses, and to prevent sensitive error details from leaking to the client in production.

- **Async Error Handling**: Controller functions that involve asynchronous operations (e.g., database queries, external API calls) use `try...catch` blocks or rely on a global async error wrapper (if implemented, e.g., `express-async-errors`) to catch promise rejections and pass them to the centralized error handler.
- **Validation Errors**: Input validation is performed by `express-validator` middleware. If validation fails, it typically sends a `400 Bad Request` response with an array of error messages detailing the specific validation failures.
- **404 Not Found**: A dedicated middleware is used to handle requests to undefined routes. If no route matches the request, this middleware responds with a `404 Not Found` error.
- **Centralized Error Handler**: All errors caught by route handlers or other middleware are passed to a final, centralized error handling middleware function (typically defined last in the Express middleware stack).
  - This handler is responsible for:
    - Logging the error (especially in development/staging environments) for debugging purposes.
    - Determining the appropriate HTTP status code. If the error is a known type (e.g., a Mongoose validation error, a custom application error with a status code), that status is used. Otherwise, it defaults to `500 Internal Server Error`.
    - Sending a structured JSON response to the client. In development, this response might include the error stack trace. In production, it will provide a generic error message to avoid exposing internal details.
    - Example error response structure:
      ```json
      {
        "message": "Descriptive error message",
        // "error": "Detailed error object or stack trace" (in development only)
      }
      ```

---
