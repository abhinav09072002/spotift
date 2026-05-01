/**
 * get-refresh-token.js
 */

import dotenv from "dotenv";
dotenv.config();

import http from "http";

const CLIENT_ID     = process.env.SPOTIFY_CLIENT_ID     || "YOUR_CLIENT_ID";
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "YOUR_CLIENT_SECRET";
const REDIRECT_URI  = "http://127.0.0.1:8888/callback";

const SCOPES = "user-read-currently-playing user-read-playback-state";

const authUrl =
  `https://accounts.spotify.com/authorize` +
  `?client_id=${CLIENT_ID}` +
  `&response_type=code` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&scope=${encodeURIComponent(SCOPES)}`;

console.log("\n🎵 Open this URL in your browser:\n");
console.log(authUrl);
console.log("\nWaiting for callback on http://localhost:8888/callback …\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost:8888");
  const code = url.searchParams.get("code");

  if (!code) return;

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const json = await tokenRes.json();

  res.end("<h2>✅ Got refresh token — check your terminal!</h2>");
  server.close();

  console.log("\n✅ Your refresh token:\n");
  console.log(json.refresh_token);
  console.log("\nStore it as: SPOTIFY_REFRESH_TOKEN=<above value>\n");
});

server.listen(8888);