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

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

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
  const [shake, setShake] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const gameLoopRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const directionRef = useRef<Point>({ x: 0, y: -1 });

  const spawnParticles = (x: number, y: number, color: string, count: number = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random(),
        x: x + CELL_SIZE / 2,
        y: y + CELL_SIZE / 2,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1.0,
        color: color,
        size: Math.random() * 3 + 2
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  };

  const triggerShake = (intensity: number) => {
    setShake(intensity);
    setTimeout(() => setShake(0), 150);
  };

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
    if (gameState !== 'PLAYING') return;

    const head = snake[0];
    if (!head) return;

    let newHead = {
      x: head.x + directionRef.current.x,
      y: head.y + directionRef.current.y
    };

    // 1. Collision Check: Walls
    if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
      if (isWrapping) {
        newHead.x = (newHead.x + GRID_SIZE) % GRID_SIZE;
        newHead.y = (newHead.y + GRID_SIZE) % GRID_SIZE;
      } else {
        setGameState('GAME_OVER');
        audioEngine.playDeathSound();
        triggerShake(12);
        return;
      }
    }

    // 2. Collision Check: Self
    if (snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
      setGameState('GAME_OVER');
      audioEngine.playDeathSound();
      triggerShake(12);
      return;
    }

    // 3. Food Logic
    const ateFood = newHead.x === food.x && newHead.y === food.y;
    const ateSpecial = specialFood && newHead.x === specialFood.x && newHead.y === specialFood.y;

    if (ateFood || ateSpecial) {
      const particleColor = ateSpecial ? '#fbbf24' : '#e11d48';
      spawnParticles(newHead.x * CELL_SIZE, newHead.y * CELL_SIZE, particleColor, 12);
      
      const now = Date.now();
      const comboTime = now - combo.lastEat < 3000;
      const newMultiplier = comboTime ? Math.min(combo.multiplier + 1, 5) : 1;
      const points = (ateSpecial ? 50 : 10) * newMultiplier;
      
      const newSnake = [newHead, ...snake];
      setSnake(newSnake);
      setScore(s => s + points);
      setCombo({ multiplier: newMultiplier, lastEat: now });

      if (ateFood) {
        setFood(generateFood(newSnake));
        if (Math.floor((score + points) / 100) > Math.floor(score / 100)) {
          setSpecialFood(generateFood([...newSnake, food]));
        } else if (specialFood) {
          setSpecialFood(null);
        }
      } else {
        setSpecialFood(null);
      }

      // Progress logic
      const totalEaten = Math.floor((score + points) / 10);
      if (totalEaten > 0 && totalEaten % 5 === 0) {
        setSpeed(s => Math.max(s - 2, 60)); // Slower speed increase for better feel
        if (totalEaten % 50 === 0) {
          setLevel(l => l + 1);
          audioEngine.playLevelUpSound();
        }
      }
    } else {
      setSnake([newHead, ...snake.slice(0, -1)]);
    }
  }, [snake, food, specialFood, isWrapping, combo, score, generateFood, setGameState, setScore, gameState]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      // Adjust speed based on BPM: roughly BPM 120 = 1x, 145 = 1.2x
      const bpmFactor = currentBpm / 120;
      const effectiveSpeed = speed / (isPlayingMusic ? bpmFactor : 1);
      
      const timer = window.setInterval(moveSnake, effectiveSpeed);
      return () => clearInterval(timer);
    }
  }, [gameState, moveSnake, speed, currentBpm, isPlayingMusic]);

  // Stable refs for animation loop
  const snakeRef = useRef<Point[]>(snake);
  const foodRef = useRef<Point>(food);
  const specialFoodRef = useRef<Point | null>(specialFood);
  const shakeRef = useRef(shake);

  useEffect(() => { snakeRef.current = snake; }, [snake]);
  useEffect(() => { foodRef.current = food; }, [food]);
  useEffect(() => { specialFoodRef.current = specialFood; }, [specialFood]);
  useEffect(() => { shakeRef.current = shake; }, [shake]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply Screen Shake
      if (shakeRef.current > 0) {
        const dx = (Math.random() - 0.5) * shakeRef.current;
        const dy = (Math.random() - 0.5) * shakeRef.current;
        ctx.translate(dx, dy);
      }

      // Background Grid
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = 'rgba(0, 245, 255, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0); ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE); ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
      }

      // Particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        return p.life > 0;
      });
      ctx.globalAlpha = 1;

      // Draw Food
      const drawFood = (pos: Point, color: string, glow: string) => {
        const x = pos.x * CELL_SIZE + CELL_SIZE / 2;
        const y = pos.y * CELL_SIZE + CELL_SIZE / 2;
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = glow;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
        
        // Inner core
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      };

      drawFood(foodRef.current, '#e11d48', '#ff0080');
      if (specialFoodRef.current) {
        drawFood(specialFoodRef.current, '#fbbf24', '#00f5ff');
      }

      // Draw Snake
      snakeRef.current.forEach((segment, i) => {
        const isHead = i === 0;
        const alpha = 1 - (i / snakeRef.current.length) * 0.7;
        const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

        ctx.save();
        if (isHead) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#00f5ff';
          ctx.fillStyle = '#00f5ff';
        } else {
          ctx.fillStyle = `rgba(191, 0, 255, ${alpha})`;
        }

        ctx.beginPath();
        ctx.roundRect(
          segment.x * CELL_SIZE + 2, 
          segment.y * CELL_SIZE + 2, 
          CELL_SIZE - 4, 
          CELL_SIZE - 4, 
          isHead ? 8 : 4
        );
        ctx.fill();
        ctx.restore();
      });

      ctx.restore();
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <div className="relative">
      {/* Game Header Stats Dashboard */}
      <div className="absolute -top-16 left-0 w-full flex justify-between px-4 font-orbitron text-[10px] tracking-widest">
        <div className="flex space-x-8">
          <div className="flex flex-col">
            <span className="text-gray-500 lowercase underline underline-offset-4 mb-1">Sector</span>
            <span className="text-neon-cyan font-bold">{level.toString().padStart(2, '0')}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-500 lowercase underline underline-offset-4 mb-1">Velocity</span>
            <span className="text-neon-purple font-bold">{Math.floor(1000 / speed * 10)}u/s</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-gray-500 lowercase underline underline-offset-4 mb-1">Multiplier</span>
          <span className="text-neon-pink font-bold">X{combo.multiplier}</span>
        </div>
      </div>

      {/* Canvas Container */}
      <div className={`relative border-4 rounded-lg overflow-hidden transition-all duration-500 ${
        isPlayingMusic ? 'border-neon-cyan shadow-[0_0_30px_rgba(0,245,255,0.3)]' : 'border-gray-800 shadow-2xl'
      }`}>
        <canvas 
          ref={canvasRef}
          width={GRID_SIZE * CELL_SIZE}
          height={GRID_SIZE * CELL_SIZE}
          className="bg-[#0a0a0f]"
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
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 backdrop-blur-md"
            >
              <h1 className="font-orbitron text-4xl text-neon-cyan mb-2 tracking-[0.2em] neon-text-cyan">APEX PREDATOR</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-12">Neural Link Established</p>
              
              {/* Level / Difficulty Selector */}
              <div className="flex space-x-4 mb-12">
                {[1, 5, 10].map(l => (
                  <button
                    key={l}
                    onClick={() => {
                      setLevel(l);
                      setSpeed(Math.max(INITIAL_SPEED - (l - 1) * 10, 60));
                    }}
                    className={`w-16 h-16 rounded border flex flex-col items-center justify-center transition-all ${
                      level === l 
                        ? 'border-neon-cyan bg-neon-cyan/20 text-neon-cyan glow-cyan' 
                        : 'border-gray-800 text-gray-600 hover:border-gray-600'
                    }`}
                  >
                    <span className="text-[8px] uppercase opacity-50 mb-1 font-mono">Gear</span>
                    <span className="font-orbitron text-xl">{l}</span>
                  </button>
                ))}
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="px-12 py-4 bg-neon-cyan text-black font-bold font-orbitron uppercase tracking-widest hover:brightness-125 transition-all glow-cyan rounded shadow-lg"
              >
                INITIALIZE CORE
              </motion.button>
              
              <p className="mt-8 text-[9px] text-gray-600 animate-pulse uppercase tracking-[0.4em]">Ready for link</p>
            </motion.div>
          )}

          {gameState === 'PAUSED' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20 backdrop-blur-md"
            >
              <h2 className="font-orbitron text-3xl text-white mb-4 neon-text-cyan">LINK SUSPENDED</h2>
              <button 
                onClick={() => setGameState('PLAYING')}
                className="text-neon-cyan border border-neon-cyan px-6 py-2 rounded-full uppercase text-xs font-bold font-orbitron hover:bg-neon-cyan/10 transition-all"
              >
                RESUME UPLOAD
              </button>
            </motion.div>
          )}

          {gameState === 'GAME_OVER' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20 p-8 text-center"
            >
              <div className="p-8 rounded-xl border border-neon-pink/30 w-full glow-pink bg-black/80 backdrop-blur-sm">
                <h2 className="font-orbitron text-5xl text-neon-pink mb-2 neon-text-pink">SYSTEM FAILURE</h2>
                <p className="text-gray-500 text-xs mb-8 tracking-[0.4em] uppercase">Neural Connection Loss</p>
                
                <div className="bg-neon-pink/5 w-full p-6 border-y border-neon-pink/20 mb-12">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Performance Yield</span>
                    <span className="text-white font-orbitron font-bold text-3xl">{score}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Sync Duration</span>
                    <span className="text-neon-purple font-bold">{(score/10).toFixed(0)}u</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setGameState('IDLE')}
                    className="py-4 border border-gray-700 text-gray-500 font-bold uppercase tracking-widest hover:text-white hover:border-white transition-all rounded font-mono"
                  >
                    Menu
                  </button>
                  <button 
                    onClick={resetGame}
                    className="py-4 bg-neon-cyan text-black font-orbitron font-bold uppercase tracking-widest hover:brightness-125 transition-all rounded shadow-lg glow-cyan"
                  >
                    Reboot
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Tips */}
      <div className="mt-8 flex justify-center space-x-12 text-[10px] text-gray-600 uppercase tracking-widest bg-black/60 p-4 border border-gray-800 rounded-lg">
        <div className="flex items-center"><span className="text-neon-cyan mr-3 font-bold">W-A-S-D</span> STEER</div>
        <div className="flex items-center"><span className="text-neon-purple mr-3 font-bold">P</span> FREEZE</div>
        <div className="flex items-center">
          <button 
            onClick={() => setIsWrapping(!isWrapping)}
            className={`mr-3 px-3 py-1 rounded border transition-all font-bold ${
              isWrapping 
                ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan glow-cyan' 
                : 'border-gray-700'
            }`}
          >
            {isWrapping ? 'STABILIZED' : 'LOCKED'}
          </button>
          PHYSICS
        </div>
      </div>
    </div>
  );
}
