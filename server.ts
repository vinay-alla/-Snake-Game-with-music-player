import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Add state to session to prevent CSRF
declare module 'express-session' {
  interface SessionData {
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    userName?: string;
  }
}

interface Score {
  name: string;
  score: number;
  date: string;
}

const scores: Score[] = [
  { name: "NEO", score: 5000, date: new Date().toISOString() },
  { name: "TRINITY", score: 4500, date: new Date().toISOString() },
  { name: "MORPHEUS", score: 4000, date: new Date().toISOString() },
  { name: "CYPHER", score: 3500, date: new Date().toISOString() },
  { name: "SWITCH", score: 3000, date: new Date().toISOString() },
];

const tracks = [
  {
    id: "track-1",
    title: "Neural Drift",
    artist: "AI Sentinel",
    bpm: 120,
    duration: "3:45",
    type: "ambient",
    waveform: Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.2)
  },
  {
    id: "track-2",
    title: "Glitch Protocol",
    artist: "Cyber Ghost",
    bpm: 90,
    duration: "4:20",
    type: "lofi",
    waveform: Array.from({ length: 40 }, () => Math.random() * 0.6 + 0.1)
  },
  {
    id: "track-3",
    title: "Quantum Surge",
    artist: "Electro Pulse",
    bpm: 145,
    duration: "2:50",
    type: "fast",
    waveform: Array.from({ length: 40 }, () => Math.random() * 0.9 + 0.3)
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(session({
    secret: process.env.SESSION_SECRET || "generative-cyber-snake-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,      // Required for SameSite=None
      sameSite: 'none',  // Required for cross-origin iframe
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // API Routes
  app.get("/api/scores", (req, res) => {
    const sortedScores = [...scores].sort((a, b) => b.score - a.score).slice(0, 10);
    res.json(sortedScores);
  });

  app.post("/api/scores", (req, res) => {
    const { name, score } = req.body;
    if (!name || typeof score !== "number") {
      return res.status(400).json({ error: "Invalid score data" });
    }
    const newScore = { name, score, date: new Date().toISOString() };
    scores.push(newScore);
    res.status(201).json(newScore);
  });

  app.get("/api/tracks", (req, res) => {
    res.json(tracks);
  });

  // SPOTIFY AUTH ROUTES
  app.get("/api/auth/spotify/url", (req, res) => {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "Spotify Client ID not configured" });
    }

    const redirectUri = `${process.env.APP_URL || `https://${req.get('host')}`}/auth/callback`;
    const scopes = 'user-read-private user-read-email user-read-playback-state user-library-read playlist-read-private';
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
    });

    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });

  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    const redirectUri = `${process.env.APP_URL || `https://${req.get('host')}`}/auth/callback`;

    if (!code || !clientId || !clientSecret) {
      return res.status(400).send("Missing authentication code or configuration");
    }

    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, refresh_token } = response.data;
      req.session.spotifyAccessToken = access_token;
      req.session.spotifyRefreshToken = refresh_token;

      // Fetch user info to confirm
      const userRes = await axios.get('https://api.spotify.com/v1/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      req.session.userName = userRes.data.display_name;

      res.send(`
        <html>
          <body style="background: #0a0a0f; color: #00f5ff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <div style="text-align: center;">
              <h2>PROTOCOL AUTHORIZED</h2>
              <p>Closing gateway...</p>
            </div>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Spotify Token Exchange Error:", error);
      res.status(500).send("Authentication failed");
    }
  });

  app.get("/api/auth/spotify/me", (req, res) => {
    if (!req.session.spotifyAccessToken) {
      return res.status(401).json({ connected: false });
    }
    res.json({ connected: true, name: req.session.userName });
  });

  app.get("/api/spotify/playlists", async (req, res) => {
    if (!req.session.spotifyAccessToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
        headers: { Authorization: `Bearer ${req.session.spotifyAccessToken}` }
      });
      
      const playlists = response.data.items.map((p: any) => ({
        id: p.id,
        title: p.name,
        artist: "Spotify Playlist",
        bpm: 128, // Default
        duration: `${p.tracks.total} tracks`,
        type: 'spotify',
        waveform: Array.from({ length: 40 }, () => Math.random() * 0.5 + 0.2)
      }));
      
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch playlists" });
    }
  });

  app.post("/api/auth/spotify/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
