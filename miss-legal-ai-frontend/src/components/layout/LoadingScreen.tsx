// Loading Screen Component for MISS Legal AI
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import AIOrb from '@/components/voice/AIOrb';

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-primary flex items-center justify-center">
      <div className="text-center">
        {/* Logo/Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <AIOrb size="xl" isProcessing={true} />
        </motion.div>

        {/* Brand Name */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-4xl font-bold mb-4"
        >
          <span className="text-gradient bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 bg-clip-text text-transparent">
            MISS Legal AI
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-gray-300 text-lg mb-8"
        >
          Your Voice-First Legal Assistant
        </motion.p>

        {/* Loading Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="flex flex-col items-center"
        >
          <div className="w-64 h-1 bg-dark-hover rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1 }}
            className="text-sm text-gray-400"
          >
            Initializing AI systems...
          </motion.p>
        </motion.div>

        {/* Powered by */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.5 }}
          className="mt-12 text-center"
        >
          <p className="text-xs text-gray-500 mb-2">Powered by</p>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
            <span>ODIA Intelligence</span>
            <span>•</span>
            <span>Mudiame University</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LoadingScreen;