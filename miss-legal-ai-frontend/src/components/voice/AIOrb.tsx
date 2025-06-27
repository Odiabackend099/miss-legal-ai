// AI Orb Component for MISS Legal AI
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AIOrb as AIOrb_Props } from '@/types';

interface AIOrb_Component_Props extends AIOrb_Props {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  emergencyAlert?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glowIntensity?: 'low' | 'medium' | 'high';
  volume?: number;
  onClick?: () => void;
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

const glowClasses = {
  low: 'shadow-orb-idle',
  medium: 'shadow-orb-listening',
  high: 'shadow-orb-speaking',
};

const VoiceWave: React.FC<{ 
  isActive: boolean; 
  volume: number; 
  delay: number;
  emergency?: boolean;
}> = ({ isActive, volume, delay, emergency = false }) => {
  const height = isActive ? Math.max(0.2, Math.min(1, volume)) * 100 : 20;
  
  return (
    <motion.div
      className={cn(
        'w-1 rounded-full mx-0.5',
        emergency ? 'bg-red-500' : 'bg-purple-500'
      )}
      initial={{ height: '20%' }}
      animate={{ 
        height: `${height}%`,
        scaleY: isActive ? [1, 1.2, 1] : 1
      }}
      transition={{
        duration: 0.3,
        delay: delay * 0.1,
        repeat: isActive ? Infinity : 0,
        repeatType: 'reverse',
      }}
    />
  );
};

const AIOrb: React.FC<AIOrb_Component_Props> = ({
  isListening = false,
  isSpeaking = false,
  isProcessing = false,
  emergencyAlert = false,
  size = 'lg',
  glowIntensity = 'medium',
  volume = 0.5,
  onClick,
  disabled = false,
  className,
  ...props
}) => {
  const [currentVolume, setCurrentVolume] = useState(volume);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    setCurrentVolume(volume);
  }, [volume]);

  useEffect(() => {
    if (isListening || isSpeaking || emergencyAlert) {
      const interval = setInterval(() => {
        setPulseKey(prev => prev + 1);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isListening, isSpeaking, emergencyAlert]);

  const getOrbState = () => {
    if (emergencyAlert) return 'emergency';
    if (isProcessing) return 'processing';
    if (isSpeaking) return 'speaking';
    if (isListening) return 'listening';
    return 'idle';
  };

  const getIcon = () => {
    if (emergencyAlert) return <AlertTriangle className="w-6 h-6" />;
    if (isProcessing) return <Loader2 className="w-6 h-6 animate-spin" />;
    if (isSpeaking) return <Volume2 className="w-6 h-6" />;
    if (isListening) return <Mic className="w-6 h-6" />;
    return <MicOff className="w-6 h-6" />;
  };

  const orbVariants = {
    idle: {
      scale: 1,
      boxShadow: '0 0 30px rgba(168, 85, 247, 0.3)',
      background: 'linear-gradient(135deg, #9333ea, #a855f7)',
    },
    listening: {
      scale: [1, 1.05, 1],
      boxShadow: [
        '0 0 30px rgba(168, 85, 247, 0.3)',
        '0 0 50px rgba(168, 85, 247, 0.6)',
        '0 0 30px rgba(168, 85, 247, 0.3)',
      ],
      background: 'linear-gradient(135deg, #a855f7, #c084fc)',
    },
    speaking: {
      scale: [1, 1.1, 1],
      boxShadow: [
        '0 0 50px rgba(168, 85, 247, 0.6)',
        '0 0 70px rgba(168, 85, 247, 0.9)',
        '0 0 50px rgba(168, 85, 247, 0.6)',
      ],
      background: 'linear-gradient(135deg, #c084fc, #d8b4fe)',
    },
    processing: {
      scale: 1.02,
      boxShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
      background: 'linear-gradient(135deg, #9333ea, #c084fc)',
      rotate: 360,
    },
    emergency: {
      scale: [1, 1.15, 1],
      boxShadow: [
        '0 0 30px rgba(239, 68, 68, 0.6)',
        '0 0 60px rgba(239, 68, 68, 1)',
        '0 0 30px rgba(239, 68, 68, 0.6)',
      ],
      background: 'linear-gradient(135deg, #dc2626, #ef4444)',
    },
  };

  const orbState = getOrbState();

  return (
    <motion.div
      className={cn(
        'relative flex items-center justify-center cursor-pointer',
        'rounded-full border-2',
        disabled && 'cursor-not-allowed opacity-50',
        emergencyAlert 
          ? 'border-red-500/50' 
          : 'border-purple-500/30',
        sizeClasses[size],
        className
      )}
      onClick={disabled ? undefined : onClick}
      variants={orbVariants}
      animate={orbState}
      transition={{
        duration: orbState === 'processing' ? 2 : 1.5,
        repeat: orbState === 'processing' ? Infinity : Infinity,
        repeatType: orbState === 'processing' ? 'loop' : 'reverse',
        ease: 'easeInOut',
      }}
      whileHover={!disabled ? { scale: 1.05 } : {}}
      whileTap={!disabled ? { scale: 0.95 } : {}}
    >
      {/* Background Gradient */}
      <div 
        className="absolute inset-0 rounded-full blur-sm opacity-50"
        style={{
          background: emergencyAlert 
            ? 'linear-gradient(135deg, #dc2626, #ef4444)'
            : 'linear-gradient(135deg, #9333ea, #a855f7)',
        }}
      />
      
      {/* Main Orb */}
      <div className="relative z-10 flex items-center justify-center w-full h-full rounded-full">
        {/* Voice Wave Visualization */}
        {(isListening || isSpeaking) && (
          <motion.div 
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center h-8">
              {Array.from({ length: 7 }).map((_, i) => (
                <VoiceWave 
                  key={`${pulseKey}-${i}`}
                  isActive={isListening || isSpeaking}
                  volume={currentVolume}
                  delay={i}
                  emergency={emergencyAlert}
                />
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Icon */}
        <motion.div
          className={cn(
            'relative z-20 flex items-center justify-center',
            emergencyAlert ? 'text-red-200' : 'text-purple-200'
          )}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {getIcon()}
        </motion.div>
        
        {/* Ripple Effect */}
        <AnimatePresence>
          {(isListening || isSpeaking || emergencyAlert) && (
            <motion.div
              className={cn(
                'absolute inset-0 rounded-full border-2',
                emergencyAlert 
                  ? 'border-red-400/30' 
                  : 'border-purple-400/30'
              )}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          )}
        </AnimatePresence>
      </div>
      
      {/* Emergency Pulse Ring */}
      {emergencyAlert && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-red-400"
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
      
      {/* Status Text */}
      {size === 'xl' && (
        <motion.div
          className="absolute -bottom-8 text-center text-sm text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {emergencyAlert && 'Emergency Detected'}
          {!emergencyAlert && isProcessing && 'Processing...'}
          {!emergencyAlert && !isProcessing && isSpeaking && 'Speaking'}
          {!emergencyAlert && !isProcessing && !isSpeaking && isListening && 'Listening'}
          {!emergencyAlert && !isProcessing && !isSpeaking && !isListening && 'Tap to Talk'}
        </motion.div>
      )}
    </motion.div>
  );
};

export default AIOrb;