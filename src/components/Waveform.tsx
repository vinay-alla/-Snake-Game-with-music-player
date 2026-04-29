import { useEffect, useRef } from 'react';
import { audioEngine } from '../lib/audioEngine';

interface WaveformProps {
  isPlaying: boolean;
}

export default function Waveform({ isPlaying }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = audioEngine.getAnalyser();
    if (!analyser) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / 64);
      let x = 0;

      for (let i = 0; i < 64; i++) {
        // We use only a portion of the frequency data for better visuals
        const barHeight = (dataArray[i] / 255) * canvas.height;

        // Gradient color for each bar
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#bf00ff'); // Purple
        gradient.addColorStop(1, '#00f5ff'); // Cyan

        ctx.fillStyle = gradient;
        
        // Add a bit of glow effect
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00f5ff';
        
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        
        x += barWidth;
      }
    };

    if (isPlaying) {
      draw();
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full"
      width={1024}
      height={60}
    />
  );
}
