// Voice Session Management Hook for MISS Legal AI
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

interface VoiceSessionConfig {
  language: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo';
  enableEmergencyDetection: boolean;
  audioQuality: 'low' | 'medium' | 'high';
  realTimeTranscription: boolean;
}

interface VoiceSessionState {
  isConnected: boolean;
  sessionId: string | null;
  isRecording: boolean;
  isSpeaking: boolean;
  transcription: string;
  conversationHistory: ConversationMessage[];
  emergencyAlert: EmergencyAlert | null;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  error: string | null;
}

interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  confidence?: number;
  intent?: string;
  actions?: string[];
}

interface EmergencyAlert {
  id: string;
  type: string;
  confidence: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface AudioMetrics {
  volume: number;
  quality: number;
  latency: number;
  packetsLost: number;
}

export const useVoiceSession = (authToken: string, backendUrl?: string) => {
  // State
  const [state, setState] = useState<VoiceSessionState>({
    isConnected: false,
    sessionId: null,
    isRecording: false,
    isSpeaking: false,
    transcription: '',
    conversationHistory: [],
    emergencyAlert: null,
    connectionQuality: 'good',
    error: null,
  });

  const [config, setConfig] = useState<VoiceSessionConfig>({
    language: 'english',
    enableEmergencyDetection: true,
    audioQuality: 'high',
    realTimeTranscription: true,
  });

  const [audioMetrics, setAudioMetrics] = useState<AudioMetrics>({
    volume: 0,
    quality: 0.8,
    latency: 0,
    packetsLost: 0,
  });

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPacketTimeRef = useRef<number>(0);

  /**
   * Initialize WebSocket connection
   */
  const initializeConnection = useCallback(async () => {
    try {
      const socket = io(backendUrl || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000', {
        auth: { token: authToken },
        transports: ['websocket'],
        upgrade: true,
        timeout: 20000,
        forceNew: true,
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        setState(prev => ({ ...prev, isConnected: true, error: null }));
        startMetricsCollection();
      });

      socket.on('disconnect', (reason) => {
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          sessionId: null,
          error: `Disconnected: ${reason}` 
        }));
        stopMetricsCollection();
      });

      socket.on('connect_error', (error) => {
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          error: `Connection failed: ${error.message}` 
        }));
      });

      // Session events
      socket.on('session-started', (sessionData) => {
        setState(prev => ({ 
          ...prev, 
          sessionId: sessionData.sessionId,
          error: null 
        }));
      });

      socket.on('session-ended', (data) => {
        setState(prev => ({ 
          ...prev, 
          sessionId: null,
          isRecording: false,
          isSpeaking: false,
        }));
      });

      socket.on('session-error', (error) => {
        setState(prev => ({ ...prev, error: error.error }));
      });

      // Transcription events
      socket.on('transcription', (result) => {
        if (result.isPartial) {
          setState(prev => ({ ...prev, transcription: result.text }));
        } else {
          const message: ConversationMessage = {
            id: `user-${Date.now()}`,
            type: 'user',
            text: result.text,
            timestamp: new Date(),
            confidence: result.confidence,
          };

          setState(prev => ({
            ...prev,
            transcription: '',
            conversationHistory: [...prev.conversationHistory, message],
          }));
        }
      });

      // AI response events
      socket.on('ai-response', (response) => {
        const message: ConversationMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          text: response.text,
          timestamp: new Date(),
          confidence: response.confidence,
          intent: response.intent,
          actions: response.actions,
        };

        setState(prev => ({
          ...prev,
          conversationHistory: [...prev.conversationHistory, message],
        }));

        // Play audio if available
        if (response.audio) {
          playAudioResponse(response.audio, response.audioFormat);
        }
      });

      // Emergency events
      socket.on('emergency-detected', (alert) => {
        const emergencyAlert: EmergencyAlert = {
          id: `emergency-${Date.now()}`,
          type: alert.type,
          confidence: alert.confidence,
          urgencyLevel: alert.urgencyLevel,
          message: alert.message,
          timestamp: new Date(),
          acknowledged: false,
        };

        setState(prev => ({ ...prev, emergencyAlert }));

        // Play emergency audio
        if (alert.audioResponse) {
          playAudioResponse(alert.audioResponse, 'mp3');
        }
      });

      // Metrics events
      socket.on('chunk-received', (confirmation) => {
        updateLatencyMetrics(confirmation.timestamp);
      });

      socket.on('quality-report', (qualityData) => {
        setAudioMetrics(prev => ({
          ...prev,
          quality: qualityData.audioQuality || prev.quality,
        }));
      });

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Failed to initialize: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  }, [authToken, backendUrl]);

  /**
   * Start voice session
   */
  const startSession = useCallback(async () => {
    if (!socketRef.current || !state.isConnected) {
      await initializeConnection();
    }

    if (socketRef.current) {
      socketRef.current.emit('start-voice-session', config);
    }
  }, [config, state.isConnected, initializeConnection]);

  /**
   * End voice session
   */
  const endSession = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('end-voice-session');
      socketRef.current.disconnect();
    }

    // Cleanup audio resources
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    stopMetricsCollection();

    setState(prev => ({
      ...prev,
      isConnected: false,
      sessionId: null,
      isRecording: false,
      isSpeaking: false,
      transcription: '',
      emergencyAlert: null,
    }));
  }, []);

  /**
   * Start recording audio
   */
  const startRecording = useCallback(async () => {
    try {
      if (!state.sessionId) {
        throw new Error('No active session');
      }

      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });

      // Initialize media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 64000,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current) {
          event.data.arrayBuffer().then((buffer) => {
            const audioChunk = {
              data: Array.from(new Uint8Array(buffer)),
              timestamp: Date.now(),
              sequenceNumber: Math.floor(Date.now() / 1000),
              sampleRate: 16000,
              channels: 1,
            };

            socketRef.current?.emit('audio-chunk', audioChunk);
            lastPacketTimeRef.current = Date.now();
          });
        }
      };

      // Start recording
      mediaRecorder.start(1000); // 1-second chunks
      setState(prev => ({ ...prev, isRecording: true }));

      // Monitor audio levels
      startAudioLevelMonitoring(stream);

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: `Recording failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      }));
    }
  }, [state.sessionId]);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }

    setState(prev => ({ ...prev, isRecording: false }));
  }, []);

  /**
   * Send text input
   */
  const sendTextInput = useCallback((text: string) => {
    if (!socketRef.current || !state.sessionId) return;

    socketRef.current.emit('text-input', text);

    const message: ConversationMessage = {
      id: `user-text-${Date.now()}`,
      type: 'user',
      text,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, message],
    }));
  }, [state.sessionId]);

  /**
   * Change language
   */
  const changeLanguage = useCallback((language: VoiceSessionConfig['language']) => {
    if (socketRef.current && state.isConnected) {
      socketRef.current.emit('change-language', language);
      setConfig(prev => ({ ...prev, language }));
    }
  }, [state.isConnected]);

  /**
   * Acknowledge emergency
   */
  const acknowledgeEmergency = useCallback(() => {
    if (state.emergencyAlert && socketRef.current) {
      socketRef.current.emit('emergency-acknowledged', state.emergencyAlert.id);
      setState(prev => ({
        ...prev,
        emergencyAlert: prev.emergencyAlert ? {
          ...prev.emergencyAlert,
          acknowledged: true,
        } : null,
      }));
    }
  }, [state.emergencyAlert]);

  /**
   * Clear emergency alert
   */
  const clearEmergencyAlert = useCallback(() => {
    setState(prev => ({ ...prev, emergencyAlert: null }));
  }, []);

  /**
   * Update session configuration
   */
  const updateConfig = useCallback((newConfig: Partial<VoiceSessionConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    setState(prev => ({ ...prev, conversationHistory: [] }));
  }, []);

  // Helper functions

  const playAudioResponse = useCallback(async (audioBase64: string, format: string = 'mp3') => {
    try {
      setState(prev => ({ ...prev, isSpeaking: true }));

      const audioData = atob(audioBase64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      const audioBlob = new Blob([audioArray], { type: `audio/${format}` });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      setState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, []);

  const startMetricsCollection = useCallback(() => {
    metricsIntervalRef.current = setInterval(() => {
      // Update connection quality based on metrics
      const currentTime = Date.now();
      const timeSinceLastPacket = currentTime - lastPacketTimeRef.current;
      
      let quality: typeof state.connectionQuality = 'excellent';
      if (timeSinceLastPacket > 5000) quality = 'poor';
      else if (timeSinceLastPacket > 2000) quality = 'fair';
      else if (timeSinceLastPacket > 1000) quality = 'good';

      setState(prev => ({ ...prev, connectionQuality: quality }));
    }, 1000);
  }, []);

  const stopMetricsCollection = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
  }, []);

  const startAudioLevelMonitoring = useCallback((stream: MediaStream) => {
    if (!audioContextRef.current) return;

    const analyser = audioContextRef.current.createAnalyser();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 256;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateAudioLevel = () => {
      if (state.isRecording) {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        const normalizedLevel = average / 255;

        setAudioMetrics(prev => ({ ...prev, volume: normalizedLevel }));
        requestAnimationFrame(updateAudioLevel);
      }
    };

    updateAudioLevel();
  }, [state.isRecording]);

  const updateLatencyMetrics = useCallback((packetTimestamp: number) => {
    const currentTime = Date.now();
    const latency = currentTime - packetTimestamp;
    
    setAudioMetrics(prev => ({ ...prev, latency }));
  }, []);

  // Initialize connection on mount
  useEffect(() => {
    initializeConnection();

    return () => {
      endSession();
    };
  }, [initializeConnection, endSession]);

  return {
    // State
    ...state,
    config,
    audioMetrics,

    // Actions
    startSession,
    endSession,
    startRecording,
    stopRecording,
    sendTextInput,
    changeLanguage,
    acknowledgeEmergency,
    clearEmergencyAlert,
    updateConfig,
    clearConversation,

    // Computed values
    isSessionActive: Boolean(state.sessionId),
    canRecord: state.isConnected && Boolean(state.sessionId) && !state.isRecording,
    canSpeak: state.isConnected && Boolean(state.sessionId) && !state.isSpeaking,
  };
};

export default useVoiceSession;
