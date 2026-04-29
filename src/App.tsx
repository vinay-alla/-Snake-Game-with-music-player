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
    <div className="relative h-screen w-screen bg-cyber-bg font-mono text-gray-100 overflow-hidden select-none">
      <Background isPlaying={isPlayingMusic} bpm={currentTrack?.bpm || 120} />
      
      {/* Main Layout */}
      <div className="relative z-10 grid grid-cols-[380px_1fr_350px] h-full p-6 gap-6 pointer-events-none">
        
        {/* Left: Music Player */}
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

        {/* Center: Game */}
        <div className="flex flex-col items-center justify-center pointer-events-auto">
          <SnakeGame 
            gameState={gameState}
            setGameState={setGameState}
            setScore={setScore}
            score={score}
            currentBpm={currentTrack?.bpm || 120}
            isPlayingMusic={isPlayingMusic}
          />
        </div>

        {/* Right: Scoreboard */}
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

      {/* Bottom: Waveform Visualizer */}
      <div className="absolute bottom-0 left-0 w-full h-[60px] bg-black/40 border-t border-neon-cyan/30 z-20">
        <Waveform isPlaying={isPlayingMusic} />
      </div>
    </div>
  );
}
