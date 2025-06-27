// Talk to MISS Page - Voice Chat Interface
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  Settings,
  MessageSquare,
  Phone,
  X,
  Languages,
  Shield,
  Clock,
  Activity
} from 'lucide-react';
import AIOrb from '@/components/voice/AIOrb';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { cn, formatDuration } from '@/lib/utils';
import { Language, ConversationMessage, EmergencyAlert, VoiceSession } from '@/types';

const TalkPage: React.FC = () => {
  // Voice session state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('english');
  const [emergencyDetectionEnabled, setEmergencyDetectionEnabled] = useState(true);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [emergencyAlert, setEmergencyAlert] = useState<EmergencyAlert | null>(null);
  
  // Conversation state
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [sessionDuration, setSessionDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  
  // Connection state
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [latency, setLatency] = useState(120);
  
  const sessionStartTime = useRef<Date | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Language options
  const languages: { value: Language; label: string; flag: string }[] = [
    { value: 'english', label: 'English', flag: '🇬🇧' },
    { value: 'pidgin', label: 'Nigerian Pidgin', flag: '🇳🇬' },
    { value: 'yoruba', label: 'Yorùbá', flag: '🇳🇬' },
    { value: 'hausa', label: 'Hausa', flag: '🇳🇬' },
    { value: 'igbo', label: 'Igbo', flag: '🇳🇬' },
  ];

  // Mock conversation messages for demo
  useEffect(() => {
    const demoMessages: ConversationMessage[] = [
      {
        id: '1',
        type: 'assistant',
        text: "Hello! I'm MISS, your AI legal assistant. How can I help you with your legal questions today?",
        timestamp: new Date(),
        confidence: 0.95,
        intent: 'greeting'
      }
    ];
    setMessages(demoMessages);
  }, []);

  // Session timer
  useEffect(() => {
    if (isConnected && !timerRef.current) {
      sessionStartTime.current = new Date();
      timerRef.current = setInterval(() => {
        if (sessionStartTime.current) {
          const elapsed = Math.floor((Date.now() - sessionStartTime.current.getTime()) / 1000);
          setSessionDuration(elapsed);
        }
      }, 1000);
    } else if (!isConnected && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isConnected]);

  // Mock emergency detection
  useEffect(() => {
    if (emergencyDetectionEnabled && isListening) {
      // Simulate random emergency detection for demo
      const randomCheck = () => {
        if (Math.random() < 0.001) { // Very low probability for demo
          const mockEmergency: EmergencyAlert = {
            id: Date.now().toString(),
            type: 'distress_signal',
            confidence: 0.85,
            urgencyLevel: 'high',
            message: 'Distress signal detected in voice pattern',
            timestamp: new Date(),
            acknowledged: false,
          };
          setEmergencyAlert(mockEmergency);
          setShowEmergencyAlert(true);
        }
      };

      const interval = setInterval(randomCheck, 2000);
      return () => clearInterval(interval);
    }
  }, [emergencyDetectionEnabled, isListening]);

  const handleStartListening = () => {
    if (!isConnected) {
      setIsConnected(true);
    }
    setIsListening(true);
    setCurrentTranscription('');
  };

  const handleStopListening = () => {
    setIsListening(false);
    if (currentTranscription) {
      // Add user message
      const userMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: 'user',
        text: currentTranscription,
        timestamp: new Date(),
        confidence: 0.9,
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Simulate processing
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setIsSpeaking(true);
        
        // Add AI response
        const aiResponse: ConversationMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          text: generateMockResponse(currentTranscription),
          timestamp: new Date(),
          confidence: 0.95,
          intent: 'legal_advice',
        };
        setMessages(prev => [...prev, aiResponse]);
        
        // Simulate speaking duration
        setTimeout(() => {
          setIsSpeaking(false);
        }, 3000);
      }, 2000);
      
      setCurrentTranscription('');
    }
  };

  const generateMockResponse = (input: string): string => {
    const responses = [
      "Based on Nigerian law, I can help you with that. Let me explain the relevant legal provisions...",
      "That's a great question about Nigerian legal requirements. Here's what you need to know...",
      "For your situation, the Lagos State Tenancy Law applies. I recommend the following steps...",
      "Under the NDPR regulations, your rights include data protection and privacy. Let me clarify...",
      "For document generation, I can help you create legally compliant agreements. Would you like me to start?"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleEmergencyAcknowledge = () => {
    if (emergencyAlert) {
      setEmergencyAlert({ ...emergencyAlert, acknowledged: true });
      setShowEmergencyAlert(false);
    }
  };

  const handleEmergencyCall = () => {
    // Mock emergency call
    window.open('tel:199', '_self');
  };

  const getConnectionColor = () => {
    switch (connectionQuality) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'fair': return 'text-yellow-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  // Mock transcription update for demo
  useEffect(() => {
    if (isListening) {
      const mockTranscriptions = [
        "I need help with...",
        "I need help with my tenancy agreement...",
        "I need help with my tenancy agreement in Lagos State."
      ];
      
      let index = 0;
      const interval = setInterval(() => {
        if (index < mockTranscriptions.length) {
          setCurrentTranscription(mockTranscriptions[index]);
          index++;
        } else {
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isListening]);

  return (
    <div className="min-h-screen bg-dark-primary p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Talk to MISS</h1>
            <p className="text-gray-300">Your AI legal assistant is ready to help</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm">
              <Activity className={cn("w-4 h-4", getConnectionColor())} />
              <span className={getConnectionColor()}>
                {connectionQuality} ({latency}ms)
              </span>
            </div>

            {/* Session Duration */}
            {isConnected && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(sessionDuration)}</span>
              </div>
            )}

            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="glow-button-outline"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Voice Interface */}
          <div className="lg:col-span-2">
            <Card className="glass-card p-8 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-8"
              >
                <AIOrb
                  size="xl"
                  isListening={isListening}
                  isSpeaking={isSpeaking}
                  isProcessing={isProcessing}
                  emergencyAlert={!!emergencyAlert && !emergencyAlert.acknowledged}
                  volume={volume}
                  onClick={isListening ? handleStopListening : handleStartListening}
                />
              </motion.div>

              {/* Current Transcription */}
              <AnimatePresence>
                {currentTranscription && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mb-6"
                  >
                    <div className="glass-card p-4 max-w-lg mx-auto">
                      <p className="text-white italic">"{currentTranscription}"</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Controls */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={isListening ? handleStopListening : handleStartListening}
                  className={cn(
                    "px-8 py-3 text-lg",
                    isListening ? "glow-button-emergency" : "glow-button"
                  )}
                  disabled={isProcessing}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-5 h-5 mr-2" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 mr-2" />
                      Start Talking
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setMessages([])}
                  className="glow-button-outline px-6"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>

              {/* Status */}
              <div className="mt-6 text-center">
                {isProcessing && (
                  <div className="flex items-center justify-center text-purple-400">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full mr-2"
                    />
                    Processing your request...
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center justify-center text-blue-400">
                    <Volume2 className="w-4 h-4 mr-2" />
                    MISS is speaking...
                  </div>
                )}
                {isListening && (
                  <div className="flex items-center justify-center text-green-400">
                    <Mic className="w-4 h-4 mr-2" />
                    Listening... Speak now
                  </div>
                )}
                {!isListening && !isSpeaking && !isProcessing && (
                  <p className="text-gray-400">
                    Tap the orb or click "Start Talking" to begin
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Language & Settings */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Languages className="w-5 h-5 mr-2" />
                Language & Settings
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Conversation Language
                  </label>
                  <Select value={currentLanguage} onValueChange={(value: Language) => setCurrentLanguage(value)}>
                    <SelectTrigger className="input-field">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-card border border-purple-500/20">
                      {languages.map((lang) => (
                        <SelectItem
                          key={lang.value}
                          value={lang.value}
                          className="text-white hover:bg-purple-500/20"
                        >
                          <div className="flex items-center gap-2">
                            <span>{lang.flag}</span>
                            <span>{lang.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-gray-300">Emergency Detection</span>
                  </div>
                  <Switch
                    checked={emergencyDetectionEnabled}
                    onCheckedChange={setEmergencyDetectionEnabled}
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-300 mb-2 block">
                    Microphone Sensitivity
                  </label>
                  <Progress value={volume * 100} className="w-full" />
                </div>
              </div>
            </Card>

            {/* Conversation History */}
            <Card className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Conversation
              </h3>

              <div className="space-y-4 max-h-96 overflow-y-auto scrollbar-hide">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      message.type === 'user'
                        ? "bg-purple-500/20 text-purple-100 ml-4"
                        : "bg-dark-hover text-gray-300 mr-4"
                    )}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium">
                        {message.type === 'user' ? 'You' : 'MISS'}
                      </span>
                      {message.confidence && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(message.confidence * 100)}%
                        </Badge>
                      )}
                    </div>
                    <p>{message.text}</p>
                    <div className="text-xs text-gray-500 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Emergency Alert Modal */}
        <AnimatePresence>
          {showEmergencyAlert && emergencyAlert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="bg-dark-card border border-red-500 rounded-lg p-6 max-w-md w-full"
              >
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-400 mr-3" />
                  <div>
                    <h3 className="text-xl font-bold text-red-400">
                      Emergency Detected
                    </h3>
                    <p className="text-sm text-gray-300">
                      {emergencyAlert.urgencyLevel} priority alert
                    </p>
                  </div>
                </div>

                <p className="text-gray-300 mb-6">
                  {emergencyAlert.message}
                </p>

                <div className="flex gap-3">
                  <Button
                    onClick={handleEmergencyCall}
                    className="glow-button-emergency flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call Emergency
                  </Button>
                  <Button
                    onClick={handleEmergencyAcknowledge}
                    variant="outline"
                    className="glow-button-outline flex-1"
                  >
                    Dismiss
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default TalkPage;