# Spotify Now Playing — Backend

Lightweight Node.js proxy that safely exposes your Spotify "now playing" data
to your static GitHub Pages portfolio without leaking tokens.

---

## Quick Start

### 1 · Create a Spotify App
1. Go to https://developer.spotify.com/dashboard
2. Create an app → note **Client ID** and **Client Secret**
3. Edit settings → add Redirect URI: `http://localhost:8888/callback`

### 2 · Get your Refresh Token (one-time)
```bash
SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy node get-refresh-token.js
```
Open the printed URL → authorise → copy the token from the terminal.

### 3 · Install & run locally
```bash
npm install
SPOTIFY_CLIENT_ID=xxx \
SPOTIFY_CLIENT_SECRET=yyy \
SPOTIFY_REFRESH_TOKEN=zzz \
ALLOWED_ORIGIN=http://localhost:5500 \
node server.js
```

### 4 · Deploy (pick one)

#### Railway (recommended – free tier)
```bash
railway login
railway init
railway up
railway variables set SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy SPOTIFY_REFRESH_TOKEN=zzz ALLOWED_ORIGIN=https://yourdomain.com
```

#### Render
1. New Web Service → connect repo
2. Build: `npm install` · Start: `node server.js`
3. Add env vars in dashboard

#### Fly.io
```bash
fly launch
fly secrets set SPOTIFY_CLIENT_ID=xxx SPOTIFY_CLIENT_SECRET=yyy SPOTIFY_REFRESH_TOKEN=zzz ALLOWED_ORIGIN=https://yourdomain.com
fly deploy
```

---

## Endpoint
```
GET /now-playing
```

**Response (playing):**
```json
{
  "isPlaying": true,
  "title": "Blinding Lights",
  "artist": "The Weeknd",
  "album": "After Hours",
  "duration": 200040,
  "progress": 45320,
  "coverImage": "https://i.scdn.co/image/...",
  "spotifyUrl": "https://open.spotify.com/track/..."
}
```

**Response (nothing playing):**
```json
{ "isPlaying": false }
```

---

## Scopes required
- `user-read-currently-playing`
- `user-read-playback-state`
