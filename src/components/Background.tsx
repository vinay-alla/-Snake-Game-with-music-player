import { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';

interface BackgroundProps {
  isPlaying: boolean;
  bpm: number;
  comboMultiplier: number;
}

const PARTICLE_COUNT = 30;

export default function Background({ isPlaying, bpm, comboMultiplier }: BackgroundProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [fragments, setFragments] = useState<{ id: number; x: number; y: number; size: number; speed: number }[]>([]);

  useEffect(() => {
    const initialFragments = Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.1
    }));
    setFragments(initialFragments);

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const beatDuration = 60 / bpm;
  const intensity = 1 + (comboMultiplier - 1) * 0.5; // Multiplier scales intensity

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none bg-[#020205]">
      {/* 3D Grid Backdrop */}
      <motion.div 
        animate={{ 
          opacity: isPlaying ? [0.15, 0.3, 0.15] : 0.2,
          filter: isPlaying ? [`brightness(1)`, `brightness(1.5)`, `brightness(1)`] : `brightness(1)`
        }}
        transition={{ 
          duration: beatDuration, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="absolute bottom-0 left-0 w-full h-[60vh]"
        style={{
          perspective: '500px',
          background: `
            linear-gradient(rgba(0, 245, 255, 0.1) 1px, transparent 1px) 0 0 / 50px 50px,
            linear-gradient(90deg, rgba(0, 245, 255, 0.1) 1px, transparent 1px) 0 0 / 50px 50px
          `,
          transform: 'rotateX(60deg) translateY(50px)',
          transformOrigin: 'bottom',
        }}
      />

      {/* Floating Data Frags */}
      {fragments.map((f) => (
        <motion.div
          key={f.id}
          className={`absolute rounded-full bg-neon-cyan/40 ${comboMultiplier > 1 ? 'glow-cyan' : ''}`}
          initial={{ left: `${f.x}%`, top: `${f.y}%` }}
          animate={{
            left: [`${f.x}%`, `${(f.x + 10 * intensity) % 100}%`],
            top: [`${f.y}%`, `${(f.y + 10 * intensity) % 100}%`],
            scale: isPlaying ? [1 * intensity, 1.5 * intensity, 1 * intensity] : 1 * intensity,
            opacity: [0.1 * intensity, 0.3 * intensity, 0.1 * intensity]
          }}
          transition={{
            left: { duration: 20 * (1 / (f.speed * intensity)), repeat: Infinity, ease: "linear" },
            top: { duration: 25 * (1 / (f.speed * intensity)), repeat: Infinity, ease: "linear" },
            scale: { duration: beatDuration / intensity, repeat: Infinity, ease: "easeInOut" },
            opacity: { duration: 3 / intensity, repeat: Infinity, ease: "linear" }
          }}
          style={{ 
            width: f.size * intensity, 
            height: f.size * intensity,
            boxShadow: comboMultiplier > 1 ? `0 0 ${10 * intensity}px #00f5ff` : 'none'
          }}
        />
      ))}

      {/* Mouse Laser Glow */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none opacity-20 blur-[100px]"
        style={{
          left: mousePos.x - 300,
          top: mousePos.y - 300,
          background: 'radial-gradient(circle, rgba(191, 0, 255, 0.4) 0%, transparent 70%)',
          transition: 'all 0.1s ease-out'
        }}
      />

      {/* Horizontal Scan Laser */}
      <motion.div 
        animate={{ top: ['-10%', '110%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute left-0 w-full h-[1px] bg-neon-cyan/20 glow-cyan z-0"
      />

      {/* Vignette */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
      
      {/* Global Scanline Matrix */}
      <div className="absolute inset-0 scanline opacity-30 pointer-events-none" />
    </div>
  );
}
