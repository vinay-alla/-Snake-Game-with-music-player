import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Point } from '../types';
import { audioEngine } from '../lib/audioEngine';

interface SnakeGameProps {
  gameState: GameState;
  setGameState: (s: GameState) => void;
  setScore: (s: number | ((prev: number) => number)) => void;
  score: number;
  currentBpm: number;
  isPlayingMusic: boolean;
}

const GRID_SIZE = 20;
const CELL_SIZE = 24;
const INITIAL_SPEED = 150;

export default function SnakeGame({ 
  gameState, 
  setGameState, 
  setScore, 
  score,
  currentBpm,
  isPlayingMusic
}: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [specialFood, setSpecialFood] = useState<Point | null>(null);
  const [direction, setDirection] = useState<Point>({ x: 0, y: -1 });
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [isWrapping, setIsWrapping] = useState(true);
  const [combo, setCombo] = useState({ multiplier: 1, lastEat: 0 });
  const [level, setLevel] = useState(1);
  const gameLoopRef = useRef<number | null>(null);
  const directionRef = useRef<Point>({ x: 0, y: -1 });

  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
      const onSnake = currentSnake.some(s => s.x === newFood.x && s.y === newFood.y);
      if (!onSnake) break;
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    setFood(generateFood([{ x: 10, y: 10 }]));
    setSpecialFood(null);
    setDirection({ x: 0, y: -1 });
    directionRef.current = { x: 0, y: -1 };
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setLevel(1);
    setCombo({ multiplier: 1, lastEat: 0 });
    setGameState('PLAYING');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (directionRef.current.y !== 1) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (directionRef.current.y !== -1) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (directionRef.current.x !== 1) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (directionRef.current.x !== -1) setDirection({ x: 1, y: 0 });
          break;
        case 'Enter':
          if (gameState === 'IDLE' || gameState === 'GAME_OVER') resetGame();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          if (gameState === 'PLAYING') setGameState('PAUSED');
          else if (gameState === 'PAUSED') setGameState('PLAYING');
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + directionRef.current.x,
        y: head.y + directionRef.current.y
      };

      // Collision Check: Walls
      if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
        if (isWrapping) {
          newHead.x = (newHead.x + GRID_SIZE) % GRID_SIZE;
          newHead.y = (newHead.y + GRID_SIZE) % GRID_SIZE;
        } else {
          setGameState('GAME_OVER');
          audioEngine.playDeathSound();
          return prevSnake;
        }
      }

      // Collision Check: Self
      if (prevSnake.some(s => s.x === newHead.x && s.y === newHead.y)) {
        setGameState('GAME_OVER');
        audioEngine.playDeathSound();
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check Food
      const ateFood = newHead.x === food.x && newHead.y === food.y;
      const ateSpecial = specialFood && newHead.x === specialFood.x && newHead.y === specialFood.y;

      if (ateFood || ateSpecial) {
        const now = Date.now();
        const comboTime = now - combo.lastEat < 3000;
        const newMultiplier = comboTime ? Math.min(combo.multiplier + 1, 5) : 1;
        
        const points = (ateSpecial ? 50 : 10) * newMultiplier;
        setScore(s => s + points);
        setCombo({ multiplier: newMultiplier, lastEat: now });

        if (ateFood) {
          setFood(generateFood(newSnake));
          // Spawn special food every 10 foods
          if (Math.floor((score + points) / 100) > Math.floor(score / 100)) {
            setSpecialFood(generateFood([...newSnake, food]));
          } else {
            // Random chance or clear after some time? Let's just clear for now
            if (specialFood) setSpecialFood(null);
          }
        } else {
          setSpecialFood(null);
        }

        // Speed up
        const totalEaten = Math.floor(score / 10);
        if (totalEaten % 5 === 0) {
          setSpeed(s => Math.max(s - 5, 60));
          if (totalEaten % 50 === 0) {
            setLevel(l => l + 1);
            audioEngine.playLevelUpSound();
          }
        }

        return newSnake;
      } else {
        newSnake.pop();
        return newSnake;
      }
    });
  }, [food, specialFood, isWrapping, combo, score, generateFood, setGameState]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      // Adjust speed based on BPM: roughly BPM 120 = 1x, 145 = 1.2x
      const bpmFactor = currentBpm / 120;
      const effectiveSpeed = speed / (isPlayingMusic ? bpmFactor : 1);
      
      const timer = window.setInterval(moveSnake, effectiveSpeed);
      return () => clearInterval(timer);
    }
  }, [gameState, moveSnake, speed, currentBpm, isPlayingMusic]);

  // Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Food
    ctx.fillStyle = '#ff0080';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0080';
    ctx.beginPath();
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();

    if (specialFood) {
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.beginPath();
      ctx.arc(specialFood.x * CELL_SIZE + CELL_SIZE / 2, specialFood.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Snake
    snake.forEach((segment, i) => {
      const isHead = i === 0;
      const alpha = 1 - (i / snake.length) * 0.7;
      
      let pulse = 0;
      if (isPlayingMusic) {
        const beatDuration = 60000 / currentBpm;
        pulse = Math.sin((Date.now() % beatDuration) / beatDuration * Math.PI) * 4;
      }

      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

      if (isHead) {
        // Draw Realistic Head
        ctx.save();
        ctx.translate(centerX, centerY);
        
        // Rotate head based on direction
        let angle = 0;
        if (directionRef.current.x === 1) angle = 0;
        else if (directionRef.current.x === -1) angle = Math.PI;
        else if (directionRef.current.y === 1) angle = Math.PI / 2;
        else if (directionRef.current.y === -1) angle = -Math.PI / 2;
        ctx.rotate(angle);

        // Head Shape
        ctx.shadowBlur = 15 + pulse;
        ctx.shadowColor = '#00f5ff';
        const headGradient = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
        headGradient.addColorStop(0, '#00f5ff');
        headGradient.addColorStop(1, '#00b8cc');
        ctx.fillStyle = headGradient;
        
        // Organic head shape
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.shadowBlur = 5;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(4, -4, 2, 0, Math.PI * 2); // Right eye
        ctx.arc(4, 4, 2, 0, Math.PI * 2);  // Left eye
        ctx.fill();
        
        // Pupils
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(5, -4, 1, 0, Math.PI * 2);
        ctx.arc(5, 4, 1, 0, Math.PI * 2);
        ctx.fill();

        // Tongue (flicking)
        if (Date.now() % 1000 < 200) {
          ctx.strokeStyle = '#ff0080';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(8, 0);
          ctx.lineTo(14, 0);
          ctx.moveTo(14, 0);
          ctx.lineTo(16, -2);
          ctx.moveTo(14, 0);
          ctx.lineTo(16, 2);
          ctx.stroke();
        }

        ctx.restore();
      } else {
        // Draw Body Segment with Scales
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#bf00ff';
        
        const bodyGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 10);
        bodyGradient.addColorStop(0, `rgba(191, 0, 255, ${alpha})`);
        bodyGradient.addColorStop(1, `rgba(100, 0, 150, ${alpha})`);
        ctx.fillStyle = bodyGradient;

        // Rounded body segment
        ctx.beginPath();
        ctx.arc(centerX, centerY, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
        ctx.fill();

        // Scale Pattern
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
        ctx.lineWidth = 1;
        for (let j = 0; j < 3; j++) {
           ctx.beginPath();
           ctx.arc(centerX, centerY, (CELL_SIZE / 2 - 4) - j * 3, 0, Math.PI);
           ctx.stroke();
        }

        ctx.restore();
      }
    });

    ctx.shadowBlur = 0;
  }, [snake, food, specialFood, currentBpm, isPlayingMusic]);

  return (
    <div className="relative">
      {/* Game Header Stats */}
      <div className="absolute -top-12 left-0 w-full flex justify-between px-2 font-orbitron text-xs">
        <div className="flex space-x-4">
          <span className="text-neon-cyan">LEVEL: {level}</span>
          <span className="text-neon-purple">SPEED: {Math.floor(1000 / speed * 10)}</span>
        </div>
        <div className="text-neon-pink">
          COMBO: x{combo.multiplier}
        </div>
      </div>

      {/* Canvas Container */}
      <div className={`relative border-4 rounded-sm transition-all duration-300 ${
        isPlayingMusic ? 'border-neon-cyan/50 glow-cyan' : 'border-gray-800'
      }`}>
        <canvas 
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="bg-black shadow-2xl"
        />
        
        {/* Scanlines on canvas */}
        <div className="absolute inset-0 scanline opacity-20 pointer-events-none" />

        {/* Overlays */}
        <AnimatePresence>
          {gameState === 'IDLE' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-20"
            >
              <h1 className="font-orbitron text-4xl text-neon-cyan mb-8 tracking-widest animate-pulse">NEON PROTOCOL</h1>
              <button 
                onClick={resetGame}
                className="px-8 py-3 border-2 border-neon-cyan text-neon-cyan font-bold hover:bg-neon-cyan hover:text-black transition-all glow-cyan"
              >
                PRESS ENTER TO START
              </button>
            </motion.div>
          )}

          {gameState === 'PAUSED' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20"
            >
              <h2 className="font-orbitron text-3xl text-white mb-4">SYSTEM PAUSED</h2>
              <button 
                onClick={() => setGameState('PLAYING')}
                className="text-neon-cyan underline underline-offset-4"
              >
                PRESS 'P' TO RESUME
              </button>
            </motion.div>
          )}

          {gameState === 'GAME_OVER' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-8 text-center"
            >
              <h2 className="font-orbitron text-5xl text-red-500 mb-2 neon-text-pink">GAME OVER</h2>
              <p className="text-gray-400 mb-8 tracking-widest uppercase">Connection Severed</p>
              
              <div className="bg-gray-900 w-full p-6 border-y border-neon-purple/30 mb-8">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-500">FINAL SCORE</span>
                  <span className="text-neon-cyan font-bold text-xl">{score}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">LENGTH REACHED</span>
                  <span className="text-neon-purple">{snake.length} u</span>
                </div>
              </div>

              <button 
                onClick={resetGame}
                className="w-full py-4 bg-neon-cyan text-black font-bold uppercase tracking-widest hover:brightness-125 transition-all mb-4"
              >
                REINITIALIZE SESSION
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Tips */}
      <div className="mt-6 flex justify-center space-x-8 text-[10px] text-gray-500 uppercase tracking-widest bg-black/40 p-3 border border-gray-800/50 rounded-lg">
        <div className="flex items-center"><span className="text-neon-cyan mr-2 border border-neon-cyan/30 px-1 rounded">WASD</span> MOVE</div>
        <div className="flex items-center"><span className="text-neon-purple mr-2 border border-neon-purple/30 px-1 rounded">P</span> PAUSE</div>
        <div className="flex items-center"><span className="text-neon-pink mr-2 border border-neon-pink/30 px-1 rounded">ESC</span> QUIT</div>
        <div className="flex items-center">
          <button 
            onClick={() => setIsWrapping(!isWrapping)}
            className={`mr-2 px-1 rounded border transition-colors ${isWrapping ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan' : 'border-gray-700'}`}
          >
            WRAP
          </button>
          WALL EASE
        </div>
      </div>
    </div>
  );
}
