import { motion } from 'motion/react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Disc, Music, LogOut } from 'lucide-react';
import { Track } from '../types';

interface MusicPlayerProps {
  tracks: Track[];
  currentTrackIndex: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onTrackChange: (index: number) => void;
  volume: number;
  onVolumeChange: (v: number) => void;
  bpm: number;
  spotifyUser: { connected: boolean; name?: string };
  onLogout: () => void;
}

export default function MusicPlayer({ 
  tracks, 
  currentTrackIndex, 
  isPlaying, 
  onTogglePlay, 
  onTrackChange,
  volume,
  onVolumeChange,
  bpm,
  spotifyUser,
  onLogout
}: MusicPlayerProps) {
  const currentTrack = tracks[currentTrackIndex];

  const handleSpotifyConnect = async () => {
    try {
      const res = await fetch('/api/auth/spotify/url');
      const { url } = await res.json();
      window.open(url, 'spotify_pivot', 'width=600,height=700');
    } catch (err) {
      console.error("Auth Fail:", err);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="p-3 bg-black/60 border border-neon-cyan/50 glow-cyan rounded-lg flex items-center justify-between">
        <h2 className="font-orbitron text-lg text-neon-cyan tracking-widest">NEURAL AUDIO</h2>
        <div className="flex items-center space-x-2">
          {spotifyUser.connected ? (
            <div className="flex items-center space-x-2">
              <span className="text-[9px] text-neon-purple uppercase font-bold">{spotifyUser.name}</span>
              <button onClick={onLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleSpotifyConnect}
              className="text-[9px] px-2 py-1 bg-neon-purple/20 border border-neon-purple text-neon-purple rounded hover:bg-neon-purple hover:text-black transition-all font-bold"
            >
              LINK SPOTIFY
            </button>
          )}
        </div>
      </div>

      {/* Now Playing Card */}
      <div className="flex flex-col p-6 bg-black/80 border-2 border-neon-purple/50 rounded-xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-neon-purple to-transparent animate-pulse" />
        
        {/* Spinning Disc */}
        <div className="flex justify-center mb-6">
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 60 / bpm * 4, repeat: Infinity, ease: "linear" }}
            className={`p-1 rounded-full border-4 ${isPlaying ? 'border-neon-cyan glow-cyan' : 'border-gray-700'}`}
          >
            <div className="bg-gray-900 rounded-full p-8 relative">
              <Disc size={64} className={isPlaying ? 'text-neon-cyan' : 'text-gray-600'} />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-neon-purple rounded-full blur-[2px]" />
            </div>
          </motion.div>
        </div>

        {/* Track Title */}
        <div className="text-center overflow-hidden">
          <div className="whitespace-nowrap animate-marquee mb-1">
            <span className="font-orbitron text-xl text-white neon-text-cyan">
              {currentTrack?.title || 'SELECT PROTOCOL...'}
            </span>
          </div>
          <p className="text-neon-purple text-sm font-bold tracking-widest">
            {currentTrack?.artist || 'UNKNOWN ENTITY'}
          </p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-[10px] bg-neon-cyan/10 text-neon-cyan px-2 py-0.5 rounded border border-neon-cyan/20">
              {bpm} BPM
            </span>
            <span className="text-[10px] bg-neon-purple/10 text-neon-purple px-2 py-0.5 rounded border border-neon-purple/20">
              {currentTrack?.duration || '0:00'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6 mt-8">
          <button 
            onClick={() => onTrackChange((currentTrackIndex - 1 + tracks.length) % tracks.length)}
            className="p-2 text-neon-cyan hover:text-white transition-colors"
          >
            <SkipBack size={24} />
          </button>
          
          <button 
            onClick={onTogglePlay}
            className="w-16 h-16 rounded-full flex items-center justify-center bg-neon-cyan text-black hover:scale-110 active:scale-95 transition-all glow-cyan"
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} className="ml-1" />}
          </button>
          
          <button 
            onClick={() => onTrackChange((currentTrackIndex + 1) % tracks.length)}
            className="p-2 text-neon-cyan hover:text-white transition-colors"
          >
            <SkipForward size={24} />
          </button>
        </div>

        {/* Volume Slider */}
        <div className="flex items-center space-x-3 mt-6 px-4">
          <Volume2 size={16} className="text-neon-cyan" />
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
          />
        </div>
      </div>

      {/* Track List */}
      <div className="flex-1 bg-black/40 border border-gray-800 rounded-lg overflow-y-auto custom-scrollbar">
        {tracks.map((track, index) => (
          <button
            key={track.id}
            onClick={() => onTrackChange(index)}
            className={`w-full flex items-center p-4 border-b border-gray-800/50 hover:bg-neon-cyan/5 transition-all text-left ${
              currentTrackIndex === index ? 'bg-neon-cyan/10 border-l-4 border-l-neon-cyan' : ''
            }`}
          >
            <div className={`w-8 h-8 rounded bg-gray-900 flex items-center justify-center mr-4 border ${
              currentTrackIndex === index ? 'border-neon-cyan text-neon-cyan' : 'border-gray-700 text-gray-500'
            }`}>
              {track.type === 'spotify' ? <Music size={14} className="text-neon-purple" /> : (index + 1)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`text-sm font-bold truncate ${currentTrackIndex === index ? 'text-neon-cyan' : 'text-gray-300'}`}>
                {track.title}
              </h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-tighter">{track.artist}</p>
            </div>
            <div className="text-[10px] text-gray-600 font-mono">
              {track.duration}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
