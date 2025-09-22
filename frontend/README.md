# Music-Player — Frontend

React + Vite + MUI single‑page application for the Music-Player project. Authenticated users get a global PlayerBar with queue management and Jamendo‑powered discovery pages.

## Features
- Authentication UI: Login, Register, and two‑factor verification
- Discover pages: Home (Popular), Albums, Album details
- Global PlayerBar (only when authenticated):
  - Play/Pause, Next/Prev, Seek
  - Volume and Mute (volume is persisted)
  - Queue Drawer: view, play specific track, remove, drag‑to‑reorder
  - Shuffle upcoming tracks
  - Compact layout with square artwork and theme‑aware colors (white on light, black on dark)
  - Placeholder state when idle; pressing Play starts the current queue
  - Album page has “Play now” and “Add to queue”; track row click starts playback from that index
  - Home Popular cards play a single track on click

## Environment
Create `frontend/.env.local` (optional):

```
VITE_API_BASE_URL=http://localhost:5000/api
```

If not set, the client defaults to `http://localhost:5000/api`.

## Development

```powershell
cd frontend
npm install
npm run dev
```

Other scripts:
- `npm run build` — production build to `dist/`
- `npm run preview` — preview the production build

## Implementation Notes
- The Axios client (`frontend/client.js`) injects the JWT automatically when present and can handle 401 by calling a provided logout handler.
- The player replaces Jamendo audio URLs with the backend streaming proxy `/api/music/stream?src=…` to bypass CORS and to enable Range requests.
- PlayerBar is not rendered when the user is logged out.

## Troubleshooting
- If API requests fail with CORS errors, ensure the backend `FRONTEND_ORIGIN` includes your frontend origin exactly.
- If playback doesn’t start, verify the backend is running and that the `/api/music/stream` proxy is reachable; also ensure Jamendo Client ID is configured on the backend.
- If icons or images 404, ensure `index.html` has the favicon and assets included (the project uses `/vite.svg`).
