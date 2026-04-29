import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import MusicPlayer from './components/MusicPlayer';
import SnakeGame from './components/SnakeGame';
import ScoreBoard from './components/ScoreBoard';
import Waveform from './components/Waveform';
import Background from './components/Background';
import { Track, ScoreEntry, GameState } from './types';
import { audioEngine } from './lib/audioEngine';

export default function App() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [score, setScore] = useState(0);
  const [spotifyUser, setSpotifyUser] = useState<{ connected: boolean; name?: string }>({ connected: false });
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('cybersnake_highscore')) || 0;
  });
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [volume, setVolume] = useState(0.5);
  const [isGlitching, setIsGlitching] = useState(false);

  useEffect(() => {
    const triggerGlitch = () => {
      if (Math.random() > 0.95) {
        setIsGlitching(true);
        setTimeout(() => setIsGlitching(false), 200);
      }
    };
    const interval = setInterval(triggerGlitch, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchAppData = useCallback(async () => {
    fetch('/api/tracks').then(res => res.json()).then(setTracks);
    fetch('/api/scores').then(res => res.json()).then(setLeaderboard);
    
    const spotifyRes = await fetch('/api/auth/spotify/me');
    if (spotifyRes.ok) {
      const data = await spotifyRes.json();
      setSpotifyUser(data);
      if (data.connected) {
        fetch('/api/spotify/playlists').then(res => res.json()).then(spotifyTracks => {
          setTracks(prev => [...prev.filter(t => t.type !== 'spotify'), ...spotifyTracks]);
        });
      }
    }
  }, []);

  useEffect(() => {
    fetchAppData();
  }, [fetchAppData]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchAppData();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchAppData]);

  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('cybersnake_highscore', score.toString());
    }
  }, [score, highScore]);

  const togglePlayMusic = useCallback(() => {
    if (!tracks[currentTrackIndex]) return;
    
    if (isPlayingMusic) {
      audioEngine.stop();
      setIsPlayingMusic(false);
    } else {
      audioEngine.playTrack(tracks[currentTrackIndex].type, tracks[currentTrackIndex].bpm);
      setIsPlayingMusic(true);
    }
  }, [isPlayingMusic, tracks, currentTrackIndex]);

  const handleTrackChange = useCallback((index: number) => {
    setCurrentTrackIndex(index);
    if (isPlayingMusic) {
      audioEngine.playTrack(tracks[index].type, tracks[index].bpm);
    }
  }, [isPlayingMusic, tracks]);

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    audioEngine.setVolume(v);
  };

  const submitScore = async (name: string) => {
    const res = await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score })
    });
    if (res.ok) {
      const data = await res.json();
      setLeaderboard(prev => [data, ...prev].sort((a, b) => b.score - a.score).slice(0, 10));
    }
  };

  const currentTrack = tracks[currentTrackIndex];

  const handleLogout = async () => {
    await fetch('/api/auth/spotify/logout', { method: 'POST' });
    fetchAppData();
  };

  return (
    <div className={`relative h-screen w-screen bg-cyber-bg font-mono text-gray-100 overflow-hidden select-none ${isGlitching ? 'glitch-effect' : ''}`}>
      <Background isPlaying={isPlayingMusic} bpm={currentTrack?.bpm || 120} />
      
      {/* Main Layout */}
      <div className="relative z-10 grid grid-cols-[400px_1fr_400px] h-full p-6 gap-6 pointer-events-none">
        
        {/* Left: Music Player Dashboard */}
        <div className="h-full overflow-hidden pointer-events-auto">
          <MusicPlayer 
            tracks={tracks}
            currentTrackIndex={currentTrackIndex}
            isPlaying={isPlayingMusic}
            onTogglePlay={togglePlayMusic}
            onTrackChange={handleTrackChange}
            volume={volume}
            onVolumeChange={handleVolumeChange}
            bpm={currentTrack?.bpm || 120}
            spotifyUser={spotifyUser}
            onLogout={handleLogout}
          />
        </div>

        {/* Center: Tactical Game Grid */}
        <div className="flex flex-col items-center justify-center pointer-events-auto">
          <div className="mb-4 text-center">
            <h1 className="font-orbitron text-3xl text-neon-cyan tracking-[0.5em] neon-text-cyan flex items-center justify-center gap-4">
              <span className="w-12 h-[1px] bg-neon-cyan/50" />
              NEON PROTOCOL
              <span className="w-12 h-[1px] bg-neon-cyan/50" />
            </h1>
          </div>
          <SnakeGame 
            gameState={gameState}
            setGameState={setGameState}
            setScore={setScore}
            score={score}
            currentBpm={currentTrack?.bpm || 120}
            isPlayingMusic={isPlayingMusic}
          />
        </div>

        {/* Right: Scoreboard Dashboard */}
        <div className="h-full overflow-hidden pointer-events-auto">
          <ScoreBoard 
            currentScore={score}
            highScore={highScore}
            leaderboard={leaderboard}
            gameState={gameState}
            onSubmitScore={submitScore}
          />
        </div>
      </div>

      {/* Bottom: Unified Systems Status Bar */}
      <div className="absolute bottom-0 left-0 w-full h-[60px] bg-black/80 border-t border-neon-cyan/30 z-20 backdrop-blur-md flex items-center px-6">
        <div className="flex-1">
          <Waveform isPlaying={isPlayingMusic} />
        </div>
        <div className="ml-8 flex items-center space-x-12 opacity-50">
          <div className="text-[10px] uppercase">
            <span className="text-neon-cyan block">CPU Load</span>
            <span className="font-bold">{(Math.random() * 20 + 40).toFixed(1)}%</span>
          </div>
          <div className="text-[10px] uppercase">
            <span className="text-neon-purple block">Sync Latency</span>
            <span className="font-bold">12ms</span>
          </div>
          <div className="text-[10px] uppercase text-neon-pink">
            <span className="block">Status</span>
            <span className="font-bold">Authorized</span>
          </div>
        </div>
      </div>
    </div>
  );
}
