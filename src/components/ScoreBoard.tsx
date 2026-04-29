import { useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && !hasSubmitted) {
      onSubmitScore(playerName.trim());
      setHasSubmitted(true);
      setPlayerName('');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Current Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-black/60 border border-neon-cyan/30 rounded-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-1"><Target size={12} className="text-neon-cyan opacity-50" /></div>
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Current</p>
          <motion.p 
            key={currentScore}
            initial={{ scale: 1.2, color: '#00f5ff' }}
            animate={{ scale: 1, color: '#fff' }}
            className="text-2xl font-orbitron font-bold"
          >
            {currentScore.toLocaleString()}
          </motion.p>
        </div>
        <div className="p-4 bg-black/60 border border-neon-purple/30 rounded-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-1"><Trophy size={12} className="text-neon-purple opacity-50" /></div>
          <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Record</p>
          <p className="text-2xl font-orbitron font-bold text-white">
            {highScore.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Submission Panel (Only on Game Over) */}
      <AnimatePresence>
        {gameState === 'GAME_OVER' && !hasSubmitted && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="p-4 bg-neon-cyan/10 border border-neon-cyan/50 rounded-lg">
              <p className="text-[10px] text-neon-cyan uppercase font-bold mb-3 flex items-center">
                <Star size={10} className="mr-2" /> Upload Score to Network
              </p>
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  maxLength={10}
                  placeholder="IDENTITY_ID"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  className="flex-1 bg-black border border-neon-cyan/30 px-3 py-2 text-sm focus:outline-none focus:border-neon-cyan text-neon-cyan placeholder:text-gray-700 font-mono"
                />
                <button 
                  type="submit"
                  className="bg-neon-cyan text-black px-4 py-2 hover:brightness-125 transition-all"
                >
                  <Send size={18} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leaderboard */}
      <div className="flex-1 flex flex-col bg-black/40 border border-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
          <h3 className="font-orbitron text-xs text-neon-purple tracking-widest flex items-center gap-2">
            <History size={14} /> GLOBAL LEADERBOARD
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-gray-600 text-xs italic">
              NO RECORDS FOUND IN DATABANK
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="text-gray-600 uppercase border-b border-gray-800/30">
                <tr>
                  <th className="px-4 py-2 font-normal">Rank</th>
                  <th className="px-4 py-2 font-normal">ID</th>
                  <th className="px-4 py-2 font-normal text-right">Score</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr 
                    key={`${entry.name}-${index}`} 
                    className={`border-b border-gray-800/10 hover:bg-white/5 transition-colors ${
                      index < 3 ? 'text-neon-cyan' : 'text-gray-400'
                    }`}
                  >
                    <td className="px-4 py-3 font-bold opacity-50">#{(index + 1).toString().padStart(2, '0')}</td>
                    <td className="px-4 py-3 font-orbitron tracking-tighter">{entry.name}</td>
                    <td className="px-4 py-3 text-right font-bold">
                      {entry.score.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-3 bg-neon-purple/5 border-t border-neon-purple/20 text-[9px] text-center text-neon-purple/60">
          SECURE ENCRYPTED SCORE TRANSMISSION v1.0.4
        </div>
      </div>
    </div>
  );
}
