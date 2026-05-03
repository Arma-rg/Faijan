import React, { useEffect, useRef } from 'react';

interface WaveformProps {
  isSpeaking: boolean;
  isListening: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isSpeaking, isListening }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrame: number;
    let t = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const mid = height / 2;

      ctx.beginPath();
      ctx.strokeStyle = isSpeaking ? 'rgba(168,85,247,0.8)' : isListening ? 'rgba(236,72,153,0.8)' : 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 2;

      const amplitude = isSpeaking ? 40 : isListening ? 20 : 5;
      const frequency = 0.05;

      for (let x = 0; x < width; x++) {
        const y = mid + Math.sin(x * frequency + t) * amplitude * Math.sin(t * 0.2);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      t += 0.1;
      animationFrame = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationFrame);
  }, [isSpeaking, isListening]);

  return (
    <canvas 
      ref={canvasRef} 
      width={400} 
      height={100} 
      className="max-w-full opacity-40 mix-blend-screen"
      style={{ filter: 'blur(1px)' }}
    />
  );
};
