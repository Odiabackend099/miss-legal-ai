// Clone MISS Page for MISS Legal AI
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const ClonePage: React.FC = () => {
  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Clone MISS</h1>
        <p className="text-gray-300">White-label AI legal assistant for your business</p>
      </motion.div>

      <Card className="glass-card p-8 text-center">
        <Building className="w-16 h-16 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Enterprise Solution</h3>
        <p className="text-gray-300 mb-6">
          Deploy your own branded version of MISS Legal AI for your organization.
          Custom integrations, branding, and specialized legal knowledge available.
        </p>
        <Button className="glow-button">
          Contact Sales
        </Button>
      </Card>
    </div>
  );
};

export default ClonePage;