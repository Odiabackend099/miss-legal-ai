// Legal Page for MISS Legal AI
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Scale } from 'lucide-react';
import { Card } from '@/components/ui/card';

const LegalPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-primary py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl font-bold text-white mb-4">Legal Information</h1>
          <p className="text-xl text-gray-300">
            NDPR compliance, terms of service, and legal disclaimers
          </p>
        </motion.div>

        <div className="space-y-8">
          <Card className="glass-card p-8">
            <div className="flex items-center mb-4">
              <Shield className="w-8 h-8 text-purple-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">NDPR Compliance</h2>
            </div>
            <p className="text-gray-300 mb-4">
              MISS Legal AI is fully compliant with the Nigeria Data Protection Regulation (NDPR) 
              and the new GAID guidelines. We protect your personal data and ensure your privacy rights.
            </p>
            <ul className="text-gray-300 space-y-2">
              <li>• Voice recordings are encrypted and processed locally when possible</li>
              <li>• Personal data is only used for legal assistance purposes</li>
              <li>• You have the right to access, rectify, and delete your data</li>
              <li>• Emergency data is handled according to Nigerian emergency protocols</li>
            </ul>
          </Card>

          <Card className="glass-card p-8">
            <div className="flex items-center mb-4">
              <Scale className="w-8 h-8 text-blue-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Legal Disclaimer</h2>
            </div>
            <p className="text-gray-300 mb-4">
              MISS Legal AI provides general legal information and guidance based on Nigerian law. 
              This service does not constitute legal advice and should not replace consultation with 
              a qualified Nigerian legal practitioner.
            </p>
            <ul className="text-gray-300 space-y-2">
              <li>• Information provided is for educational purposes</li>
              <li>• Always consult a licensed lawyer for specific legal matters</li>
              <li>• Generated documents should be reviewed by legal professionals</li>
              <li>• Emergency services should be contacted directly in urgent situations</li>
            </ul>
          </Card>

          <Card className="glass-card p-8">
            <div className="flex items-center mb-4">
              <FileText className="w-8 h-8 text-green-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Terms of Service</h2>
            </div>
            <p className="text-gray-300 mb-4">
              By using MISS Legal AI, you agree to our terms of service and privacy policy. 
              Please read these documents carefully before using our services.
            </p>
            <div className="space-y-2">
              <a href="#" className="text-purple-400 hover:text-purple-300 block">
                → Read Full Terms of Service
              </a>
              <a href="#" className="text-purple-400 hover:text-purple-300 block">
                → Read Privacy Policy
              </a>
              <a href="#" className="text-purple-400 hover:text-purple-300 block">
                → Contact Legal Team
              </a>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;