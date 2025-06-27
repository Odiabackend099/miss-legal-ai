import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

import { VoiceMessage, VoiceState, VoiceSettings, ConversationSession } from '@/types/voice';
import { useAuth } from './AuthProvider';
import { useOffline } from './OfflineProvider';
import { VoiceService } from '@/services/VoiceService';
import { EmergencyDetectionService } from '@/services/EmergencyDetectionService';
import { showToast } from '@/utils/toast';

interface VoiceContextType {
  // State
  voiceState: VoiceState;
  isRecording: boolean;
  isProcessing: boolean;
  conversation: VoiceMessage[];
  currentSession: ConversationSession | null;
  
  // Audio levels
  audioLevel: number;
  isListening: boolean;
  
  // Settings
  voiceSettings: VoiceSettings;
  updateVoiceSettings: (settings: Partial<VoiceSettings>) => void;
  
  // Recording methods
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  
  // Conversation methods
  sendTextMessage: (text: string) => Promise<void>;
  addMessage: (message: VoiceMessage) => void;
  clearConversation: () => void;
  
  // Session management
  startNewSession: (sessionType?: string) => Promise<void>;
  endSession: () => Promise<void>;
  
  // Playback methods
  playMessage: (messageId: string) => Promise<void>;
  stopPlayback: () => Promise<void>;
  
  // Emergency detection
  emergencyDetected: boolean;
  acknowledgeEmergency: () => void;
  
  // Offline support
  saveConversationOffline: () => Promise<void>;
  loadOfflineConversations: () => Promise<VoiceMessage[][]>;
  
  // Analytics
  getVoiceAnalytics: () => {
    totalSessions: number;
    averageSessionDuration: number;
    languageUsage: Record<string, number>;
    emergencyTriggers: number;
  };
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

interface VoiceProviderProps {
  children: ReactNode;
}

const STORAGE_KEYS = {
  VOICE_SETTINGS: 'voice_settings',
  OFFLINE_CONVERSATIONS: 'offline_conversations',
  VOICE_ANALYTICS: 'voice_analytics',
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  language: 'english',
  voiceActivation: true,
  noiseCancellation: true,
  autoPlayResponses: true,
  emergencyKeywords: true,
  voiceSpeed: 1.0,
  microphoneSensitivity: 0.7,
  backgroundProcessing: true,
  offlineMode: true,
  dataOptimization: true,
};

export function VoiceProvider({ children }: VoiceProviderProps) {
  const { user, preferredLanguage } = useAuth();
  const { isOnline, queueOfflineAction } = useOffline();
  
  // State
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState<VoiceMessage[]>([]);
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  
  // Audio
  const [audioLevel, setAudioLevel] = useState(0);
  const [isListening, setIsListening] = useState(false);
  
  // Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  
  // Emergency
  const [emergencyDetected, setEmergencyDetected] = useState(false);
  
  // Refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const sessionStartTime = useRef<number>(0);
  const voiceService = useRef(new VoiceService());
  const emergencyService = useRef(new EmergencyDetectionService());
  
  useEffect(() => {
    initializeVoice();
    setupAppStateListener();
    return cleanup;
  }, []);

  useEffect(() => {
    if (preferredLanguage) {
      updateVoiceSettings({ language: preferredLanguage });
    }
  }, [preferredLanguage]);

  const initializeVoice = async () => {
    try {
      // Request audio permissions
      await Audio.requestPermissionsAsync();
      
      // Configure audio session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
      
      // Load settings
      await loadVoiceSettings();
      
      // Initialize services
      voiceService.current.initialize({
        language: voiceSettings.language,
        apiEndpoint: process.env.EXPO_PUBLIC_API_URL + '/voice',
        websocketUrl: process.env.EXPO_PUBLIC_WS_URL,
      });
      
      emergencyService.current.initialize({
        language: voiceSettings.language,
        sensitivity: voiceSettings.microphoneSensitivity,
        keywords: voiceSettings.emergencyKeywords,
      });
      
    } catch (error) {
      console.error('Voice initialization error:', error);
      showToast(
        preferredLanguage === 'yoruba' ? 'Aṣiṣe ninu ṣiṣeto ohun' :
        preferredLanguage === 'hausa' ? 'Kuskure wajen saita murya' :
        preferredLanguage === 'igbo' ? 'Njehie n\'ịtọ olu' :
        'Voice setup error',
        'error'
      );
    }
  };

  const setupAppStateListener = () => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' && isRecording) {
        if (voiceSettings.backgroundProcessing) {
          // Continue recording in background
          setVoiceState('background');
        } else {
          // Pause recording
          pauseRecording();
        }
      } else if (nextAppState === 'active' && voiceState === 'background') {
        setVoiceState('recording');
      }
    };

    AppState.addEventListener('change', handleAppStateChange);
    return () => AppState.removeEventListener('change', handleAppStateChange);
  };

  const cleanup = async () => {
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
      }
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      voiceService.current.disconnect();
    } catch (error) {
      console.error('Voice cleanup error:', error);
    }
  };

  const loadVoiceSettings = async () => {
    try {
      const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_SETTINGS);
      if (settingsJson) {
        const settings = JSON.parse(settingsJson);
        setVoiceSettings({ ...DEFAULT_VOICE_SETTINGS, ...settings });
      }
    } catch (error) {
      console.error('Error loading voice settings:', error);
    }
  };

  const updateVoiceSettings = async (newSettings: Partial<VoiceSettings>) => {
    try {
      const updatedSettings = { ...voiceSettings, ...newSettings };
      setVoiceSettings(updatedSettings);
      await AsyncStorage.setItem(STORAGE_KEYS.VOICE_SETTINGS, JSON.stringify(updatedSettings));
      
      // Update services with new settings
      voiceService.current.updateSettings(updatedSettings);
      emergencyService.current.updateSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating voice settings:', error);
    }
  };

  const startRecording = async () => {
    try {
      if (isRecording) return;

      // Check permissions
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Audio permission not granted');
      }

      // Create recording configuration
      const recordingOptions: Audio.RecordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 1,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      // Start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(recordingOptions);
      
      recordingRef.current = recording;
      await recording.startAsync();
      
      setIsRecording(true);
      setVoiceState('recording');
      setIsListening(true);
      sessionStartTime.current = Date.now();
      
      // Start monitoring audio levels
      startAudioLevelMonitoring();
      
      // Start session if not already started
      if (!currentSession) {
        await startNewSession();
      }
      
    } catch (error) {
      console.error('Recording start error:', error);
      showToast(
        preferredLanguage === 'yoruba' ? 'Aṣiṣe ninu bẹrẹ gbigbasilẹ' :
        preferredLanguage === 'hausa' ? 'Kuskure wajen fara yin rikodin' :
        preferredLanguage === 'igbo' ? 'Njehie n\'ibido ndekọ' :
        'Failed to start recording',
        'error'
      );
    }
  };

  const stopRecording = async () => {
    try {
      if (!isRecording || !recordingRef.current) return;

      setIsRecording(false);
      setIsListening(false);
      setVoiceState('processing');
      setIsProcessing(true);
      
      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      
      if (!uri) {
        throw new Error('No recording URI available');
      }

      // Process the audio
      await processAudioRecording(uri);
      
    } catch (error) {
      console.error('Recording stop error:', error);
      setIsProcessing(false);
      setVoiceState('idle');
      showToast(
        preferredLanguage === 'yoruba' ? 'Aṣiṣe ninu duro gbigbasilẹ' :
        preferredLanguage === 'hausa' ? 'Kuskure wajen dakatar da rikodin' :
        preferredLanguage === 'igbo' ? 'Njehie n\'ikwụsị ndekọ' :
        'Failed to stop recording',
        'error'
      );
    }
  };

  const processAudioRecording = async (audioUri: string) => {
    try {
      let transcript = '';
      let response = '';
      
      if (isOnline) {
        // Online processing
        const result = await voiceService.current.processAudio(audioUri, {
          language: voiceSettings.language,
          sessionId: currentSession?.id,
          userId: user?.id,
        });
        
        transcript = result.transcript;
        response = result.response;
        
        // Check for emergency
        const isEmergency = await emergencyService.current.detectEmergency(transcript);
        if (isEmergency) {
          setEmergencyDetected(true);
        }
        
      } else {
        // Offline processing
        transcript = await voiceService.current.processAudioOffline(audioUri);
        response = 'I\'m currently offline. Your message has been saved and will be processed when connection is restored.';
        
        // Queue for online processing
        queueOfflineAction('voice_process', {
          audioUri,
          transcript,
          sessionId: currentSession?.id,
          timestamp: Date.now(),
        });
      }
      
      // Add messages to conversation
      const userMessage: VoiceMessage = {
        id: Date.now().toString(),
        text: transcript,
        type: 'user',
        timestamp: new Date(),
        audioUri,
        language: voiceSettings.language,
      };
      
      const assistantMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        type: 'assistant',
        timestamp: new Date(),
        language: voiceSettings.language,
      };
      
      setConversation(prev => [...prev, userMessage, assistantMessage]);
      
      // Auto-play response if enabled
      if (voiceSettings.autoPlayResponses && isOnline) {
        await playTextToSpeech(response);
      }
      
      // Save conversation offline
      await saveConversationOffline();
      
    } catch (error) {
      console.error('Audio processing error:', error);
      showToast(
        preferredLanguage === 'yoruba' ? 'Aṣiṣe ninu ṣiṣẹ ohun' :
        preferredLanguage === 'hausa' ? 'Kuskure wajen sarrafa murya' :
        preferredLanguage === 'igbo' ? 'Njehie n\'ịhazi olu' :
        'Error processing audio',
        'error'
      );
    } finally {
      setIsProcessing(false);
      setVoiceState('idle');
    }
  };

  const playTextToSpeech = async (text: string) => {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }
      
      const audioUrl = await voiceService.current.synthesizeSpeech(text, {
        language: voiceSettings.language,
        speed: voiceSettings.voiceSpeed,
      });
      
      const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
      soundRef.current = sound;
      
      await sound.playAsync();
      
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  };

  const sendTextMessage = async (text: string) => {
    try {
      setIsProcessing(true);
      
      let response = '';
      
      if (isOnline) {
        response = await voiceService.current.processText(text, {
          language: voiceSettings.language,
          sessionId: currentSession?.id,
          userId: user?.id,
        });
        
        // Check for emergency
        const isEmergency = await emergencyService.current.detectEmergency(text);
        if (isEmergency) {
          setEmergencyDetected(true);
        }
      } else {
        response = 'I\'m currently offline. Your message has been saved and will be processed when connection is restored.';
        
        queueOfflineAction('text_process', {
          text,
          sessionId: currentSession?.id,
          timestamp: Date.now(),
        });
      }
      
      const userMessage: VoiceMessage = {
        id: Date.now().toString(),
        text,
        type: 'user',
        timestamp: new Date(),
        language: voiceSettings.language,
      };
      
      const assistantMessage: VoiceMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        type: 'assistant',
        timestamp: new Date(),
        language: voiceSettings.language,
      };
      
      setConversation(prev => [...prev, userMessage, assistantMessage]);
      
      if (voiceSettings.autoPlayResponses && isOnline) {
        await playTextToSpeech(response);
      }
      
      await saveConversationOffline();
      
    } catch (error) {
      console.error('Text processing error:', error);
      showToast('Error processing message', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const startAudioLevelMonitoring = () => {
    const interval = setInterval(async () => {
      if (!isRecording || !recordingRef.current) {
        clearInterval(interval);
        return;
      }
      
      try {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording && status.metering !== undefined) {
          setAudioLevel(Math.abs(status.metering) / 160); // Normalize to 0-1
        }
      } catch (error) {
        console.error('Audio level monitoring error:', error);
      }
    }, 100);
  };

  const pauseRecording = async () => {
    try {
      if (recordingRef.current && isRecording) {
        await recordingRef.current.pauseAsync();
        setVoiceState('paused');
      }
    } catch (error) {
      console.error('Recording pause error:', error);
    }
  };

  const resumeRecording = async () => {
    try {
      if (recordingRef.current && voiceState === 'paused') {
        await recordingRef.current.startAsync();
        setVoiceState('recording');
      }
    } catch (error) {
      console.error('Recording resume error:', error);
    }
  };

  const addMessage = (message: VoiceMessage) => {
    setConversation(prev => [...prev, message]);
  };

  const clearConversation = async () => {
    setConversation([]);
    if (currentSession) {
      await endSession();
    }
  };

  const startNewSession = async (sessionType: string = 'general') => {
    const session: ConversationSession = {
      id: Date.now().toString(),
      userId: user?.id || 'anonymous',
      startTime: new Date(),
      sessionType,
      language: voiceSettings.language,
      messages: [],
    };
    
    setCurrentSession(session);
    sessionStartTime.current = Date.now();
    
    if (isOnline) {
      try {
        await voiceService.current.startSession(session);
      } catch (error) {
        console.error('Session start error:', error);
      }
    }
  };

  const endSession = async () => {
    if (!currentSession) return;
    
    const endTime = new Date();
    const duration = endTime.getTime() - currentSession.startTime.getTime();
    
    const finalSession = {
      ...currentSession,
      endTime,
      duration,
      messages: conversation,
    };
    
    if (isOnline) {
      try {
        await voiceService.current.endSession(finalSession);
      } catch (error) {
        console.error('Session end error:', error);
      }
    }
    
    setCurrentSession(null);
    await updateVoiceAnalytics(finalSession);
  };

  const playMessage = async (messageId: string) => {
    try {
      const message = conversation.find(m => m.id === messageId);
      if (!message) return;
      
      if (message.audioUri) {
        // Play recorded audio
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
        }
        
        const { sound } = await Audio.Sound.createAsync({ uri: message.audioUri });
        soundRef.current = sound;
        await sound.playAsync();
      } else if (message.type === 'assistant') {
        // Generate and play TTS
        await playTextToSpeech(message.text);
      }
    } catch (error) {
      console.error('Message playback error:', error);
    }
  };

  const stopPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
      }
    } catch (error) {
      console.error('Playback stop error:', error);
    }
  };

  const acknowledgeEmergency = () => {
    setEmergencyDetected(false);
  };

  const saveConversationOffline = async () => {
    try {
      const conversations = await loadOfflineConversations();
      conversations.push(conversation);
      
      // Keep only last 10 conversations to save storage
      const trimmedConversations = conversations.slice(-10);
      
      await AsyncStorage.setItem(
        STORAGE_KEYS.OFFLINE_CONVERSATIONS,
        JSON.stringify(trimmedConversations)
      );
    } catch (error) {
      console.error('Error saving conversation offline:', error);
    }
  };

  const loadOfflineConversations = async (): Promise<VoiceMessage[][]> => {
    try {
      const conversationsJson = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CONVERSATIONS);
      return conversationsJson ? JSON.parse(conversationsJson) : [];
    } catch (error) {
      console.error('Error loading offline conversations:', error);
      return [];
    }
  };

  const updateVoiceAnalytics = async (session: ConversationSession) => {
    try {
      const analyticsJson = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_ANALYTICS);
      const analytics = analyticsJson ? JSON.parse(analyticsJson) : {
        totalSessions: 0,
        totalDuration: 0,
        languageUsage: {},
        emergencyTriggers: 0,
      };
      
      analytics.totalSessions += 1;
      analytics.totalDuration += session.duration || 0;
      analytics.languageUsage[session.language] = (analytics.languageUsage[session.language] || 0) + 1;
      
      if (emergencyDetected) {
        analytics.emergencyTriggers += 1;
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.VOICE_ANALYTICS, JSON.stringify(analytics));
    } catch (error) {
      console.error('Error updating voice analytics:', error);
    }
  };

  const getVoiceAnalytics = async () => {
    try {
      const analyticsJson = await AsyncStorage.getItem(STORAGE_KEYS.VOICE_ANALYTICS);
      const analytics = analyticsJson ? JSON.parse(analyticsJson) : {
        totalSessions: 0,
        totalDuration: 0,
        languageUsage: {},
        emergencyTriggers: 0,
      };
      
      return {
        totalSessions: analytics.totalSessions,
        averageSessionDuration: analytics.totalSessions > 0 
          ? analytics.totalDuration / analytics.totalSessions 
          : 0,
        languageUsage: analytics.languageUsage,
        emergencyTriggers: analytics.emergencyTriggers,
      };
    } catch (error) {
      console.error('Error getting voice analytics:', error);
      return {
        totalSessions: 0,
        averageSessionDuration: 0,
        languageUsage: {},
        emergencyTriggers: 0,
      };
    }
  };

  const contextValue: VoiceContextType = {
    voiceState,
    isRecording,
    isProcessing,
    conversation,
    currentSession,
    
    audioLevel,
    isListening,
    
    voiceSettings,
    updateVoiceSettings,
    
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    
    sendTextMessage,
    addMessage,
    clearConversation,
    
    startNewSession,
    endSession,
    
    playMessage,
    stopPlayback,
    
    emergencyDetected,
    acknowledgeEmergency,
    
    saveConversationOffline,
    loadOfflineConversations,
    
    getVoiceAnalytics,
  };

  return (
    <VoiceContext.Provider value={contextValue}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice(): VoiceContextType {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}

export default VoiceProvider;
