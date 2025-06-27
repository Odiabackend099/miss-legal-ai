// Voice Chat Component for MISS Legal AI
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Mic, MicOff, Volume2, VolumeX, AlertTriangle, Phone } from 'lucide-react';

interface VoiceSession {
  sessionId: string;
  language: string;
  emergencyDetectionEnabled: boolean;
  supportedLanguages: string[];
}

interface TranscriptionResult {
  text: string;
  confidence: number;
  language: string;
  isPartial: boolean;
}

interface AIResponse {
  text: string;
  intent: string;
  confidence: number;
  actions: string[];
  audio?: string;
  audioFormat?: string;
  requiresHumanEscalation: boolean;
}

interface EmergencyAlert {
  type: string;
  confidence: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  audioResponse?: string;
}

interface VoiceChatProps {
  authToken: string;
  language?: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo';
  enableEmergencyDetection?: boolean;
  onEmergencyDetected?: (emergency: EmergencyAlert) => void;
  onSessionUpdate?: (session: VoiceSession) => void;
}

export const VoiceChat: React.FC<VoiceChatProps> = ({
  authToken,
  language = 'english',
  enableEmergencyDetection = true,
  onEmergencyDetected,
  onSessionUpdate,
}) => {
  // State management
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentTranscription, setCurrentTranscription] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{
    type: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    confidence?: number;
  }>>([]);
  const [emergencyAlert, setEmergencyAlert] = useState<EmergencyAlert | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [currentLanguage, setCurrentLanguage] = useState(language);
  const [session, setSession] = useState<VoiceSession | null>(null);

  // Refs
  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio settings
  const AUDIO_SETTINGS = {
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    chunkDuration: 1000, // 1 second chunks
  };

  /**
   * Initialize WebSocket connection
   */
  const initializeConnection = useCallback(async () => {
    try {
      // Initialize socket connection
      const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000', {
        auth: { token: authToken },
        transports: ['websocket'],
        upgrade: true,
        timeout: 20000,
      });

      socketRef.current = socket;

      // Connection handlers
      socket.on('connect', () => {
        console.log('Connected to voice streaming service');
        setIsConnected(true);
        startVoiceSession();
      });

      socket.on('disconnect', (reason) => {
        console.log('Disconnected from voice service:', reason);
        setIsConnected(false);
        cleanup();
      });

      socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setIsConnected(false);
      });

      // Voice session handlers
      socket.on('session-started', (sessionData: VoiceSession) => {
        console.log('Voice session started:', sessionData);
        setSession(sessionData);
        onSessionUpdate?.(sessionData);
      });

      socket.on('session-error', (error) => {
        console.error('Session error:', error);
        setEmergencyAlert({
          type: 'session_error',
          confidence: 1.0,
          urgencyLevel: 'medium',
          message: error.error || 'Session error occurred',
        });
      });

      // Transcription handlers
      socket.on('transcription', (result: TranscriptionResult) => {
        console.log('Transcription received:', result);
        setCurrentTranscription(result.text);
        
        if (!result.isPartial) {
          setConversationHistory(prev => [...prev, {
            type: 'user',
            text: result.text,
            timestamp: new Date(),
            confidence: result.confidence,
          }]);
          setCurrentTranscription('');
        }
      });

      // AI response handlers
      socket.on('ai-response', async (response: AIResponse) => {
        console.log('AI response received:', response);
        
        setConversationHistory(prev => [...prev, {
          type: 'assistant',
          text: response.text,
          timestamp: new Date(),
          confidence: response.confidence,
        }]);

        // Play audio response if available
        if (response.audio) {
          await playAudioResponse(response.audio, response.audioFormat || 'mp3');
        }
      });

      // Emergency detection handlers
      socket.on('emergency-detected', (alert: EmergencyAlert) => {
        console.warn('Emergency detected:', alert);
        setEmergencyAlert(alert);
        onEmergencyDetected?.(alert);
        
        // Play emergency audio if available
        if (alert.audioResponse) {
          playAudioResponse(alert.audioResponse, 'mp3');
        }
      });

      // Audio chunk confirmation
      socket.on('chunk-received', (confirmation) => {
        // Update connection quality based on response time
        updateConnectionQuality();
      });

      // Language change confirmation
      socket.on('language-changed', (data) => {
        setCurrentLanguage(data.language);
      });

    } catch (error) {
      console.error('Failed to initialize connection:', error);
    }
  }, [authToken, onEmergencyDetected, onSessionUpdate]);

  /**
   * Start voice session
   */
  const startVoiceSession = useCallback(() => {
    if (!socketRef.current) return;

    socketRef.current.emit('start-voice-session', {
      language: currentLanguage,
      enableEmergencyDetection,
      audioQuality: 'high',
      realTimeTranscription: true,
      bufferSize: 1024,
    });
  }, [currentLanguage, enableEmergencyDetection]);

  /**
   * Initialize audio recording
   */
  const initializeAudioRecording = useCallback(async () => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: AUDIO_SETTINGS.sampleRate,
          channelCount: AUDIO_SETTINGS.channels,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;

      // Initialize audio context for processing
      audioContextRef.current = new AudioContext({
        sampleRate: AUDIO_SETTINGS.sampleRate,
      });

      // Initialize MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 64000,
      });

      mediaRecorderRef.current = mediaRecorder;

      // Handle audio data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && socketRef.current) {
          // Convert blob to buffer and send
          event.data.arrayBuffer().then((buffer) => {
            const audioChunk = {
              data: Array.from(new Uint8Array(buffer)),
              timestamp: Date.now(),
              sequenceNumber: Math.floor(Date.now() / 1000),
              sampleRate: AUDIO_SETTINGS.sampleRate,
              channels: AUDIO_SETTINGS.channels,
            };

            socketRef.current?.emit('audio-chunk', audioChunk);
          });
        }
      };

    } catch (error) {
      console.error('Failed to initialize audio recording:', error);
      throw error;
    }
  }, []);

  /**
   * Start recording
   */
  const startRecording = useCallback(async () => {
    try {
      if (!mediaRecorderRef.current) {
        await initializeAudioRecording();
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current.start(AUDIO_SETTINGS.chunkDuration);
        setIsRecording(true);

        // Auto-stop recording after 30 seconds
        recordingTimeoutRef.current = setTimeout(() => {
          stopRecording();
        }, 30000);
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [initializeAudioRecording]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
  }, []);

  /**
   * Play audio response
   */
  const playAudioResponse = useCallback(async (audioBase64: string, format: string) => {
    try {
      setIsSpeaking(true);

      // Convert base64 to blob
      const audioData = atob(audioBase64);
      const audioArray = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        audioArray[i] = audioData.charCodeAt(i);
      }

      const audioBlob = new Blob([audioArray], { type: `audio/${format}` });
      const audioUrl = URL.createObjectURL(audioBlob);

      // Create and play audio element
      const audio = new Audio(audioUrl);
      audioElementRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play audio response:', error);
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Change language
   */
  const changeLanguage = useCallback((newLanguage: typeof language) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('change-language', newLanguage);
      setCurrentLanguage(newLanguage);
    }
  }, [isConnected]);

  /**
   * Send text input (fallback)
   */
  const sendTextInput = useCallback((text: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('text-input', text);
      
      setConversationHistory(prev => [...prev, {
        type: 'user',
        text,
        timestamp: new Date(),
      }]);
    }
  }, [isConnected]);

  /**
   * Acknowledge emergency
   */
  const acknowledgeEmergency = useCallback(() => {
    if (emergencyAlert && socketRef.current) {
      socketRef.current.emit('emergency-acknowledged', emergencyAlert.type);
      setEmergencyAlert(null);
    }
  }, [emergencyAlert]);

  /**
   * Update connection quality
   */
  const updateConnectionQuality = useCallback(() => {
    // Simple quality assessment based on latency
    // In production, this would be more sophisticated
    const now = Date.now();
    const latency = now % 1000; // Mock latency calculation
    
    if (latency < 100) setConnectionQuality('excellent');
    else if (latency < 300) setConnectionQuality('good');
    else if (latency < 600) setConnectionQuality('fair');
    else setConnectionQuality('poor');
  }, []);

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (audioElementRef.current) {
      audioElementRef.current.pause();
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
    }
  }, []);

  /**
   * End session
   */
  const endSession = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('end-voice-session');
      socketRef.current.disconnect();
    }
    cleanup();
    setIsConnected(false);
    setSession(null);
  }, [cleanup]);

  // Effects
  useEffect(() => {
    initializeConnection();

    return () => {
      cleanup();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeConnection, cleanup]);

  // Render connection quality indicator
  const renderConnectionQuality = () => {
    const colors = {
      excellent: 'text-green-500',
      good: 'text-blue-500',
      fair: 'text-yellow-500',
      poor: 'text-red-500',
    };

    return (
      <div className={`text-sm ${colors[connectionQuality]}`}>
        Connection: {connectionQuality}
      </div>
    );
  };

  // Render language selector
  const renderLanguageSelector = () => {
    const languages = [
      { code: 'english', name: 'English' },
      { code: 'pidgin', name: 'Pidgin' },
      { code: 'yoruba', name: 'Yorùbá' },
      { code: 'hausa', name: 'Hausa' },
      { code: 'igbo', name: 'Igbo' },
    ];

    return (
      <select
        value={currentLanguage}
        onChange={(e) => changeLanguage(e.target.value as typeof language)}
        className="px-3 py-1 text-sm border rounded-md"
        disabled={!isConnected}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Voice Chat with Minnie Max</h2>
          {renderConnectionQuality()}
        </div>
        <div className="flex items-center space-x-4">
          {renderLanguageSelector()}
          <button
            onClick={endSession}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
            disabled={!isConnected}
          >
            End Session
          </button>
        </div>
      </div>

      {/* Emergency Alert */}
      {emergencyAlert && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="font-semibold text-red-700">Emergency Detected</h3>
          </div>
          <p className="text-red-600 mb-3">{emergencyAlert.message}</p>
          <div className="flex space-x-2">
            <button
              onClick={acknowledgeEmergency}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Acknowledge
            </button>
            <button
              onClick={() => window.open('tel:199', '_self')}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center space-x-2"
            >
              <Phone className="w-4 h-4" />
              <span>Call Emergency (199)</span>
            </button>
          </div>
        </div>
      )}

      {/* Conversation History */}
      <div className="flex-1 mb-4 p-4 bg-white border rounded-lg overflow-y-auto max-h-96">
        {conversationHistory.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Start speaking to begin your conversation with Minnie Max</p>
            <p className="text-sm mt-2">
              Emergency detection is {enableEmergencyDetection ? 'enabled' : 'disabled'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversationHistory.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <p>{message.text}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                    {message.confidence && ` • ${Math.round(message.confidence * 100)}%`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Current Transcription */}
        {currentTranscription && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-600 italic">"{currentTranscription}"</p>
            <p className="text-xs text-blue-500 mt-1">Transcribing...</p>
          </div>
        )}
      </div>

      {/* Voice Controls */}
      <div className="flex items-center justify-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!isConnected || isSpeaking}
          className={`p-4 rounded-full ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200`}
        >
          {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full ${
            isConnected ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-xs mt-1">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="flex flex-col items-center">
          {isSpeaking ? <Volume2 className="w-6 h-6 text-green-500" /> : <VolumeX className="w-6 h-6 text-gray-400" />}
          <span className="text-xs mt-1">
            {isSpeaking ? 'Speaking' : 'Silent'}
          </span>
        </div>
      </div>

      {/* Text Input Fallback */}
      <div className="mt-4">
        <input
          type="text"
          placeholder="Type your message here (fallback mode)"
          className="w-full p-3 border rounded-lg"
          disabled={!isConnected}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && e.currentTarget.value.trim()) {
              sendTextInput(e.currentTarget.value.trim());
              e.currentTarget.value = '';
            }
          }}
        />
      </div>
    </div>
  );
};

export default VoiceChat;
