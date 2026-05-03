import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface EnergyCoreProps {
  state: 'disconnected' | 'connecting' | 'idle' | 'listening' | 'speaking';
  onClick: () => void;
}

export const EnergyCore: React.FC<EnergyCoreProps> = ({ state, onClick }) => {
  const getGlowColor = () => {
    switch (state) {
      case 'connecting': return 'shadow-[0_0_50px_rgba(59,130,246,0.5)] bg-blue-500';
      case 'listening': return 'shadow-[0_0_70px_rgba(236,72,153,0.6)] bg-pink-500';
      case 'speaking': return 'shadow-[0_0_90px_rgba(168,85,247,0.7)] bg-purple-500';
      case 'idle': return 'shadow-[0_0_30px_rgba(255,255,255,0.2)] bg-white/20';
      default: return 'shadow-none bg-white/10';
    }
  };

  return (
    <div className="relative flex items-center justify-center p-20 cursor-pointer group" onClick={onClick} id="energy-core-container">
      {/* Background Ripple Waves */}
      {state !== 'disconnected' && (
        <>
          <motion.div
            animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
            className={cn("absolute w-64 h-64 rounded-full border-2 border-white/10")}
          />
          <motion.div
            animate={{ scale: [1, 1.8, 2.5], opacity: [0.3, 0.1, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            className={cn("absolute w-64 h-64 rounded-full border-2 border-white/5")}
          />
        </>
      )}

      {/* Main Energy Core */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative w-40 h-40 rounded-full flex items-center justify-center transition-all duration-700 ease-in-out",
          getGlowColor()
        )}
        id="main-core"
      >
        {/* Inner detail */}
        <div className="absolute inset-2 rounded-full border border-white/20 flex items-center justify-center overflow-hidden">
          {state === 'connecting' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-full h-full border-t-2 border-blue-200 rounded-full"
            />
          )}
          {state === 'listening' && (
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-32 h-32 bg-pink-300/30 rounded-full"
            />
          )}
        </div>

        {/* Center Symbol / Icon if needed, otherwise just the core */}
        <div className="z-10 text-white font-bold tracking-widest text-xs uppercase opacity-80 group-hover:opacity-100 transition-opacity">
          {state === 'disconnected' ? 'START' : state.toUpperCase()}
        </div>
      </motion.div>

      {/* Rotating Energy Rings */}
      {state === 'connecting' || state === 'speaking' || state === 'listening' ? (
        <motion.div
          animate={{ rotate: state === 'speaking' ? -360 : 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute w-56 h-56 rounded-full border border-dashed border-white/20"
        />
      ) : null}
    </div>
  );
};
