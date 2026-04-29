import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScoreEntry, GameState } from '../types';
import { Trophy, Target, Star, History, Send } from 'lucide-react';

interface ScoreBoardProps {
  currentScore: number;
  highScore: number;
  leaderboard: ScoreEntry[];
  gameState: GameState;
  onSubmitScore: (name: string) => void;
}

export default function ScoreBoard({ 
  currentScore, 
  highScore, 
  leaderboard, 
  gameState,
  onSubmitScore
}: ScoreBoardProps) {
  const [playerName, setPlayerName] = useState('');
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && !hasSubmitted) {
      onSubmitScore(playerName.trim());
      setHasSubmitted(true);
      setPlayerName('');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Tactical Stats Matrix */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-black/80 border-l-4 border-neon-cyan border-y border-r border-gray-800 rounded-r-lg relative overflow-hidden group glow-cyan">
          <div className="absolute top-0 right-0 p-1 opacity-20"><Target size={12} className="text-neon-cyan" /></div>
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-[0.2em]">Live Yield</p>
          <motion.p 
            key={currentScore}
            initial={{ y: -5, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-3xl font-orbitron font-bold text-white neon-text-cyan"
          >
            {currentScore.toLocaleString()}
          </motion.p>
        </div>
        <div className="p-4 bg-black/80 border-l-4 border-neon-purple border-y border-r border-gray-800 rounded-r-lg relative overflow-hidden group glow-purple">
          <div className="absolute top-0 right-0 p-1 opacity-20"><Trophy size={12} className="text-neon-purple" /></div>
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-[0.2em]">Peak Node</p>
          <p className="text-3xl font-orbitron font-bold text-white neon-text-purple">
            {highScore.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Submission Link (Only on Game Over) */}
      <AnimatePresence>
        {gameState === 'GAME_OVER' && !hasSubmitted && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-6 bg-neon-cyan/10 border border-neon-cyan/50 rounded-xl">
              <p className="text-[10px] text-neon-cyan uppercase font-bold mb-4 flex items-center tracking-widest">
                <Send size={12} className="mr-2" /> Log Performance Identity
              </p>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  maxLength={10}
                  placeholder="ID_ENTRY"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  className="flex-1 bg-black border border-neon-cyan/40 px-4 py-3 text-sm focus:outline-none focus:border-neon-cyan text-neon-cyan placeholder:text-gray-800 font-mono tracking-widest"
                />
                <button 
                  type="submit"
                  className="bg-neon-cyan text-black px-6 py-3 font-bold hover:brightness-125 transition-all rounded shadow-lg glow-cyan uppercase text-xs"
                >
                  UPLOAD
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Leaderboard Matrix */}
      <div className="flex-1 flex flex-col bg-black/60 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
          <h3 className="font-orbitron text-[10px] text-neon-purple tracking-[0.3em] flex items-center gap-3 uppercase">
            <History size={14} className="text-neon-purple" /> Collective Databank
          </h3>
          <div className="flex space-x-1">
            <span className="w-1 h-1 bg-neon-purple rounded-full animate-pulse" />
            <span className="w-1 h-1 bg-neon-purple rounded-full animate-pulse delay-75" />
            <span className="w-1 h-1 bg-neon-purple rounded-full animate-pulse delay-150" />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center text-gray-700 text-[10px] uppercase tracking-widest font-bold">
              Searching Archive...
            </div>
          ) : (
            <table className="w-full text-left text-[11px] uppercase tracking-wider">
              <thead className="text-gray-600 border-b border-gray-800/50">
                <tr>
                  <th className="px-6 py-3 font-bold">Rank</th>
                  <th className="px-6 py-3 font-bold">Node</th>
                  <th className="px-6 py-3 font-bold text-right text-neon-purple">Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr 
                    key={`${entry.name}-${index}`} 
                    className={`border-b border-gray-800/20 hover:bg-neon-cyan/5 transition-colors group ${
                      index < 3 ? 'text-neon-cyan' : 'text-gray-500'
                    }`}
                  >
                    <td className="px-6 py-4 font-bold opacity-30 text-xs">{(index + 1).toString().padStart(2, '0')}</td>
                    <td className="px-6 py-4 font-orbitron tracking-tighter group-hover:neon-text-cyan transition-all">{entry.name}</td>
                    <td className="px-6 py-4 text-right font-bold text-white">
                      {entry.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-3 bg-neon-purple/5 border-t border-neon-purple/20 text-[9px] text-center text-neon-purple/50 uppercase tracking-[0.3em] font-bold">
          Neural Transmission Active v4.2
        </div>
      </div>
    </div>
  );
}
