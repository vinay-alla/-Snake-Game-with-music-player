# 🎮🎵 NeonByte — Snake Game × Music Player

A full-stack cyberpunk web application that fuses a classic Snake Game with 
a procedural AI Music Player into one immersive neon-drenched experience.
Built with React 18, Web Audio API, HTML5 Canvas, Tailwind CSS, and a 
Node.js/Express backend.

## ✨ Features

### 🐍 Snake Game
- Smooth 60fps gameplay on HTML5 Canvas (20×20 grid)
- Neon-glowing snake with cyan-to-purple gradient body
- Speed scaling, combo multiplier, and power pellets
- Wall toggle (wrap vs. collision death)
- Keyboard controls: Arrow Keys / WASD, Enter, P/Escape

### 🎵 AI Music Player
- 3 procedurally generated tracks via Web Audio API (no external files)
  - "Neural Drift" — Ambient Synthwave (120 BPM)
  - "Glitch Protocol" — Lo-Fi Electronic (90 BPM)
  - "Quantum Surge" — Cyberpunk Fast (145 BPM)
- Play / Pause / Skip controls with seek and volume sliders
- Live 64-bar waveform visualizer using AnalyserNode
- Animated frequency bars synced to BPM

### 🎮 Game × Music Integration
- Snake speed and canvas pulse sync to current track BPM
- Death sound and level-up chimes via Web Audio API
- Music fades on Game Over

### 🏆 Scoreboard & Leaderboard
- Real-time score with +points pop animations
- Persistent high score via localStorage
- Live leaderboard (top 10) fetched from Express backend
- Submit your score with a custom player name

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|--------------------------------------|
| Frontend   | React 18, Tailwind CSS, Web Audio API, HTML5 Canvas |
| Backend    | Node.js, Express.js                  |
| State      | React Hooks (useState, useEffect, useRef) |
| Audio      | Web Audio API (OscillatorNode, AnalyserNode, ConvolverNode) |
| Storage    | localStorage (high score), In-memory (leaderboard) |
| Styling    | Tailwind CSS + custom neon CSS effects |

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm or yarn

### Installation

# Clone the repo
git clone https://github.com/your-username/neonbyte.git
cd neonbyte

# Install frontend dependencies
cd client && npm install

# Install backend dependencies
cd ../server && npm install

### Running the App

# Start backend (runs on port 5000)
cd server && npm start

# Start frontend (runs on port 3000)
cd client && npm start

Then open http://localhost:3000 in your browser.

## 🎮 Controls

| Key          | Action              |
|--------------|----------------------|
| Arrow / WASD | Move snake           |
| Enter        | Start / Restart game |
| P / Escape   | Pause / Resume       |
| ?            | Toggle shortcuts panel |

## 📁 Project Structure

neonbyte/
├── client/               # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── SnakeGame.jsx
│   │   │   ├── MusicPlayer.jsx
│   │   │   ├── Scoreboard.jsx
│   │   │   └── Waveform.jsx
│   │   ├── hooks/
│   │   │   ├── useAudioEngine.js
│   │   │   └── useSnakeGame.js
│   │   └── App.jsx
├── server/               # Node.js + Express backend
│   ├── routes/
│   │   ├── tracks.js
│   │   └── scores.js
│   └── index.js
└── README.md

## 🌐 API Endpoints

| Method | Endpoint      | Description              |
|--------|---------------|--------------------------|
| GET    | /api/tracks   | Returns track metadata   |
| GET    | /api/scores   | Returns top 10 scores    |
| POST   | /api/scores   | Submit { name, score }   |

## 🎨 Design

- Aesthetic: Dark Neon Cyberpunk
- Fonts: Orbitron (headings), Share Tech Mono (data)
- Colors: #00f5ff (cyan), #bf00ff (purple), #ff0080 (pink)
- Effects: glowing box-shadows, scanline overlay, animated grid background

## 📄 License

MIT License — feel free to fork, remix, and build on it.

## 🙌 Author

Built by [Your Name] — CS Student | ML • IoT • Full Stack
