import { Language } from './index';

export type VoiceState = 'idle' | 'recording' | 'processing' | 'paused' | 'background' | 'error';

export interface VoiceMessage {
  id: string;
  text: string;
  type: 'user' | 'assistant';
  timestamp: Date;
  audioUri?: string;
  language: Language;
  confidence?: number;
  duration?: number;
  processed?: boolean;
  metadata?: {
    intentDetected?: string;
    entityExtraction?: Record<string, any>;
    sentiment?: 'positive' | 'neutral' | 'negative';
    urgency?: 'low' | 'medium' | 'high';
  };
}

export interface VoiceSettings {
  language: Language;
  voiceActivation: boolean;
  noiseCancellation: boolean;
  autoPlayResponses: boolean;
  emergencyKeywords: boolean;
  voiceSpeed: number; // 0.5 to 2.0
  microphoneSensitivity: number; // 0.0 to 1.0
  backgroundProcessing: boolean;
  offlineMode: boolean;
  dataOptimization: boolean;
}

export interface ConversationSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  sessionType: 'general' | 'legal' | 'emergency' | 'document' | 'consultation';
  language: Language;
  messages: VoiceMessage[];
  metadata?: {
    deviceInfo?: any;
    networkCondition?: string;
    qualityScore?: number;
    userSatisfaction?: number;
  };
}

export interface VoiceProcessingResult {
  transcript: string;
  response: string;
  confidence: number;
  language: Language;
  intent?: {
    name: string;
    confidence: number;
    entities: Record<string, any>;
  };
  emergency?: {
    detected: boolean;
    confidence: number;
    type: 'security' | 'medical' | 'fire' | 'other';
  };
  followUp?: {
    required: boolean;
    questions: string[];
    context: string;
  };
}

export interface VoiceAnalytics {
  totalSessions: number;
  averageSessionDuration: number;
  languageUsage: Record<Language, number>;
  emergencyTriggers: number;
  qualityMetrics: {
    averageConfidence: number;
    transcriptionAccuracy: number;
    responseRelevance: number;
    userSatisfaction: number;
  };
  usagePatterns: {
    hourlyDistribution: number[];
    dailyDistribution: number[];
    monthlyTrends: {
      month: string;
      sessions: number;
      duration: number;
    }[];
  };
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  bitRate: number;
  format: 'wav' | 'mp3' | 'm4a';
  quality: 'low' | 'medium' | 'high';
}

export interface SpeechSynthesisOptions {
  language: Language;
  voice?: string;
  speed: number;
  pitch: number;
  volume: number;
  ssml?: boolean;
}

export interface VoiceCommand {
  trigger: string;
  action: string;
  description: string;
  requiresOnline: boolean;
  parameters?: {
    name: string;
    type: 'string' | 'number' | 'boolean';
    required: boolean;
  }[];
}

export interface VoiceShortcut {
  id: string;
  name: string;
  trigger: string;
  response: string;
  enabled: boolean;
  language: Language;
  category: 'greeting' | 'help' | 'legal' | 'emergency' | 'navigation';
}

export interface VoiceTranscription {
  text: string;
  confidence: number;
  segments: {
    start: number;
    end: number;
    text: string;
    confidence: number;
  }[];
  language: Language;
  processingTime: number;
  model: string;
}

export interface VoiceEmotionAnalysis {
  emotion: 'happy' | 'sad' | 'angry' | 'fear' | 'surprise' | 'neutral';
  confidence: number;
  valence: number; // -1 to 1
  arousal: number; // 0 to 1
  dominance: number; // 0 to 1
}

export interface VoiceContextMemory {
  sessionId: string;
  context: {
    previousTopics: string[];
    userPreferences: Record<string, any>;
    conversationState: 'greeting' | 'inquiry' | 'clarification' | 'resolution' | 'escalation';
    currentTask?: {
      type: string;
      progress: number;
      nextSteps: string[];
    };
  };
  entities: {
    name: string;
    value: any;
    confidence: number;
    lastMentioned: Date;
  }[];
}

export interface OfflineVoiceCapability {
  transcription: boolean;
  synthesis: boolean;
  intentRecognition: boolean;
  emergencyDetection: boolean;
  basicCommands: boolean;
  languages: Language[];
}

export interface VoiceQualityMetrics {
  audioQuality: {
    snr: number; // Signal-to-noise ratio
    clarity: number;
    volume: number;
  };
  transcriptionQuality: {
    accuracy: number;
    completeness: number;
    coherence: number;
  };
  responseQuality: {
    relevance: number;
    helpfulness: number;
    clarity: number;
    correctness: number;
  };
}

export interface VoiceError {
  code: string;
  message: string;
  category: 'audio' | 'network' | 'processing' | 'permission' | 'service';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestion?: string;
  timestamp: Date;
}

export interface VoiceFeatures {
  realTimeTranscription: boolean;
  voiceCommands: boolean;
  emotionDetection: boolean;
  speechSynthesis: boolean;
  multiLanguageSupport: boolean;
  offlineMode: boolean;
  noiseCancellation: boolean;
  echoCancellation: boolean;
  backgroundNoise: boolean;
  speakerIdentification: boolean;
}
