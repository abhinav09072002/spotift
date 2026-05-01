/**
 * Spotify "Now Playing" Backend
 * ─────────────────────────────
 * Deploy to: Railway / Render / Fly.io / any Node host
 *
 * ENV vars required:
 *   SPOTIFY_CLIENT_ID      – from Spotify Developer Dashboard
 *   SPOTIFY_CLIENT_SECRET  – from Spotify Developer Dashboard
 *   SPOTIFY_REFRESH_TOKEN  – obtained once via OAuth (see README)
 *   PORT                   – defaults to 3001
 *   ALLOWED_ORIGIN         – your portfolio URL, e.g. https://abhinav.dev
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3001;

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = process.env.ALLOWED_ORIGIN || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Token cache (in-memory; re-fetched when expired) ─────────────────────────
let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry - 60_000) return cachedToken;

  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } = process.env;

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error('Missing Spotify env vars. See server.js header for details.');
  }

  const basic = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`);
  const json = await res.json();
  cachedToken = json.access_token;
  tokenExpiry = Date.now() + json.expires_in * 1000;
  return cachedToken;
}

// ── /now-playing ──────────────────────────────────────────────────────────────
app.get('/now-playing', async (req, res) => {
  try {
    const token = await getAccessToken();

    const spRes = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 204 = nothing playing; 401 = bad token
    if (spRes.status === 204 || spRes.status === 401) {
      return res.json({ isPlaying: false });
    }

    if (!spRes.ok) {
      return res.status(502).json({ error: `Spotify error: ${spRes.status}` });
    }

    const data = await spRes.json();

    if (!data || !data.item) {
      return res.json({ isPlaying: false });
    }

    const track = data.item;

    return res.json({
      isPlaying: data.is_playing,
      title: track.name,
      artist: track.artists.map((a) => a.name).join(', '),
      album: track.album.name,
      duration: track.duration_ms,
      progress: data.progress_ms,
      coverImage: track.album.images?.[1]?.url || track.album.images?.[0]?.url || '',
      spotifyUrl: track.external_urls?.spotify || '',
    });
  } catch (err) {
    console.error('[now-playing]', err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`Spotify proxy listening on :${PORT}`));
