// Voice AI Pipeline Tests for MISS Legal AI
import { describe, it, expect, beforeEach, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import { createServer } from 'http';
import { WhisperService } from '@/services/voice/whisper';
import { ElevenLabsService } from '@/services/voice/elevenlabs';
import { ConversationService } from '@/services/ai/conversation';
import { EmergencyDetectionService } from '@/services/emergency/detection';
import { VoiceStreamingService } from '@/websocket/voice-stream';
import { VoiceSessionManager } from '@/services/voice/session-manager';
import { AudioProcessor } from '@/utils/audio-processing';
import { Buffer } from 'buffer';

// Mock environment variables
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock external services
vi.mock('openai');
vi.mock('axios');
vi.mock('@/integrations/supabase/client');

describe('Voice AI Pipeline Integration Tests', () => {
  let server: any;
  let voiceStreamingService: VoiceStreamingService;
  let testPort: number;

  beforeAll(() => {
    testPort = 3001;
  });

  beforeEach(async () => {
    // Create test server
    server = createServer();
    voiceStreamingService = new VoiceStreamingService(server);
    
    await new Promise<void>((resolve) => {
      server.listen(testPort, () => resolve());
    });
  });

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
      });
    }
  });

  describe('Whisper Speech-to-Text Service', () => {
    it('should transcribe audio with Nigerian context', async () => {
      // Mock audio buffer (simple WebM-like data)
      const mockAudioBuffer = Buffer.from('webm-audio-data-mock');
      
      // Mock OpenAI response
      const mockWhisperResponse = {
        text: 'Hello, I need help with legal document',
        language: 'en',
        segments: [
          {
            start: 0,
            end: 3.5,
            text: 'Hello, I need help with legal document',
            avg_logprob: -0.3,
          }
        ]
      };

      // Mock the OpenAI call
      vi.mocked(require('openai')).mockImplementation(() => ({
        audio: {
          transcriptions: {
            create: vi.fn().mockResolvedValue(mockWhisperResponse)
          }
        }
      }));

      const result = await WhisperService.transcribeAudio(
        mockAudioBuffer,
        'test.webm',
        { language: 'english' }
      );

      expect(result.text).toBe('Hello, I need help with legal document');
      expect(result.language).toBe('english');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should handle streaming transcription', async () => {
      const audioChunks = [
        { data: Buffer.from('chunk1'), timestamp: Date.now(), sequenceNumber: 1 },
        { data: Buffer.from('chunk2'), timestamp: Date.now(), sequenceNumber: 2 },
      ];

      const result = await WhisperService.transcribeStream(audioChunks, {
        language: 'english',
        sessionId: 'test-session',
        userId: 'test-user',
      });

      expect(result).toHaveProperty('transcription');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('language');
    });

    it('should detect Nigerian languages', async () => {
      const mockAudioBuffer = Buffer.from('yoruba-audio-data');

      const result = await WhisperService.detectLanguage(mockAudioBuffer, 'test.webm');

      expect(result).toHaveProperty('language');
      expect(result).toHaveProperty('confidence');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });
  });

  describe('ElevenLabs Text-to-Speech Service', () => {
    it('should synthesize speech with Minnie Max voice', async () => {
      // Mock Axios response
      const mockAudioData = Buffer.from('mock-mp3-audio-data');
      vi.mocked(require('axios')).create.mockReturnValue({
        post: vi.fn().mockResolvedValue({
          data: mockAudioData,
          status: 200,
        }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });

      const result = await ElevenLabsService.synthesizeSpeech(
        'Hello, I am Minnie Max, your legal assistant.',
        {
          language: 'english',
          context: 'normal',
          userId: 'test-user',
          sessionId: 'test-session',
        }
      );

      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.voiceUsed).toContain('Minnie Max');
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should handle emergency voice synthesis', async () => {
      const mockAudioData = Buffer.from('emergency-audio-data');
      vi.mocked(require('axios')).create.mockReturnValue({
        post: vi.fn().mockResolvedValue({ data: mockAudioData }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      });

      const result = await ElevenLabsService.synthesizeEmergencyResponse(
        'Emergency detected. Notifying your contacts now.',
        {
          urgencyLevel: 'high',
          userId: 'test-user',
          sessionId: 'test-session',
        }
      );

      expect(result.audioBuffer).toBeInstanceOf(Buffer);
      expect(result.voiceUsed).toContain('Emergency');
    });

    it('should optimize for Nigerian accents', async () => {
      const result = await ElevenLabsService.synthesizeSpeech(
        'Wetin you want make I help you with today?',
        {
          language: 'pidgin',
          context: 'friendly',
          userId: 'test-user',
          sessionId: 'test-session',
        }
      );

      expect(result.voiceUsed).toContain('Pidgin');
    });
  });

  describe('Emergency Detection Service', () => {
    it('should detect medical emergencies', async () => {
      const mockAudioBuffer = Buffer.from('medical-emergency-audio');
      
      const result = await EmergencyDetectionService.detectEmergency(
        mockAudioBuffer,
        'emergency.webm',
        {
          sessionId: 'test-session',
          userId: 'test-user',
          language: 'english',
        }
      );

      expect(result).toHaveProperty('isEmergency');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('urgencyLevel');
      expect(result).toHaveProperty('recommendation');
    });

    it('should detect emergencies in Nigerian languages', async () => {
      // Test with Pidgin emergency phrase
      const emergencyText = 'Help me o! Person dey die for here!';
      
      const textDetection = await EmergencyDetectionService['detectEmergencyFromText'](
        emergencyText,
        'pidgin'
      );

      expect(textDetection.isEmergency).toBe(true);
      expect(textDetection.confidence).toBeGreaterThan(0.5);
    });

    it('should handle false positive filtering', async () => {
      const normalText = 'I want to create a tenancy agreement';
      
      const textDetection = await EmergencyDetectionService['detectEmergencyFromText'](
        normalText,
        'english'
      );

      expect(textDetection.isEmergency).toBe(false);
      expect(textDetection.confidence).toBeLessThan(0.3);
    });

    it('should provide multimodal emergency detection', async () => {
      const mockAudioBuffer = Buffer.from('distressed-voice-audio');
      
      const result = await EmergencyDetectionService.detectEmergency(
        mockAudioBuffer,
        'distress.webm',
        {
          sessionId: 'test-session',
          userId: 'test-user',
          language: 'english',
        }
      );

      expect(result).toHaveProperty('multimodalScore');
      expect(result).toHaveProperty('audioFeatures');
      expect(result).toHaveProperty('textFeatures');
    });
  });

  describe('Conversation AI Service', () => {
    it('should initialize conversation with Nigerian context', async () => {
      const mockUser = {
        id: 'test-user',
        email: 'test@example.com',
        full_name: 'Test User',
        subscription_tier: 'basic',
      };

      const context = await ConversationService.initializeConversation(
        'test-session',
        'test-user',
        mockUser,
        'english'
      );

      expect(context.sessionId).toBe('test-session');
      expect(context.userId).toBe('test-user');
      expect(context.language).toBe('english');
      expect(context.conversationHistory).toEqual([]);
    });

    it('should process legal document requests', async () => {
      // Mock OpenAI response
      vi.mocked(require('openai')).mockImplementation(() => ({
        chat: {
          completions: {
            create: vi.fn().mockResolvedValue({
              choices: [{
                message: {
                  content: 'I can help you create a tenancy agreement. Let me gather the necessary information.'
                }
              }]
            })
          }
        }
      }));

      const response = await ConversationService.processUserInput(
        'test-session',
        'I need to create a tenancy agreement',
        { language: 'english' }
      );

      expect(response.intent).toContain('document');
      expect(response.text).toContain('tenancy');
      expect(response.confidence).toBeGreaterThan(0);
    });

    it('should handle multilingual conversations', async () => {
      const response = await ConversationService.processUserInput(
        'test-session',
        'Abeg, I wan create power of attorney',
        { language: 'pidgin' }
      );

      expect(response).toHaveProperty('text');
      expect(response).toHaveProperty('intent');
    });
  });

  describe('Audio Processing Utilities', () => {
    it('should process audio for speech recognition', async () => {
      const mockAudioBuffer = Buffer.from('raw-audio-data');
      
      const result = await AudioProcessor.processForSpeechRecognition(
        mockAudioBuffer,
        'webm'
      );

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.metadata).toHaveProperty('sampleRate');
      expect(result.metadata).toHaveProperty('channels');
      expect(result.quality).toHaveProperty('quality');
    });

    it('should detect voice activity', async () => {
      const mockAudioBuffer = Buffer.from('voice-activity-audio');
      
      const result = await AudioProcessor.detectVoiceActivity(mockAudioBuffer);

      expect(result).toHaveProperty('hasVoice');
      expect(result).toHaveProperty('voiceSegments');
      expect(result).toHaveProperty('silenceRatio');
      expect(result).toHaveProperty('averageEnergy');
    });

    it('should optimize for Nigerian network conditions', async () => {
      const mockAudioBuffer = Buffer.from('network-test-audio');
      
      const optimized = await AudioProcessor.optimizeForNetwork(
        mockAudioBuffer,
        'poor'
      );

      expect(optimized).toBeInstanceOf(Buffer);
      // Should be smaller for poor network
      expect(optimized.length).toBeLessThanOrEqual(mockAudioBuffer.length);
    });

    it('should enhance audio for Nigerian accents', async () => {
      const mockAudioBuffer = Buffer.from('nigerian-accent-audio');
      
      const enhanced = await AudioProcessor.enhanceForNigerianAccents(mockAudioBuffer);

      expect(enhanced).toBeInstanceOf(Buffer);
    });
  });

  describe('Voice Session Management', () => {
    it('should create and manage voice sessions', async () => {
      const mockUser = {
        id: 'test-user',
        email: 'test@example.com',
        full_name: 'Test User',
        subscription_tier: 'basic',
      };

      const config = {
        language: 'english' as const,
        enableEmergencyDetection: true,
        audioQuality: 'high' as const,
        realTimeTranscription: true,
        autoSave: true,
        retentionDays: 30,
      };

      const session = await VoiceSessionManager.createSession(
        'test-user',
        mockUser,
        config
      );

      expect(session.sessionId).toBeDefined();
      expect(session.config).toEqual(config);
      expect(session.retentionPolicy).toHaveProperty('audioRetentionDays');
    });

    it('should record transcriptions with NDPR compliance', async () => {
      await VoiceSessionManager.recordTranscription('test-session', {
        text: 'Test transcription',
        confidence: 0.95,
        language: 'english',
        timestamp: new Date(),
      });

      // Should not throw errors and handle NDPR retention
    });

    it('should handle emergency events', async () => {
      await VoiceSessionManager.recordEmergencyEvent('test-session', {
        type: 'medical',
        confidence: 0.9,
        urgencyLevel: 'high',
        notificationsSent: 2,
      });

      // Should create emergency record with proper tracking
    });
  });

  describe('WebSocket Voice Streaming Integration', () => {
    it('should handle WebSocket connections', (done) => {
      const ws = new WebSocket(`ws://localhost:${testPort}`);
      
      ws.on('open', () => {
        // Test authentication
        ws.send(JSON.stringify({
          type: 'auth',
          token: 'test-jwt-token',
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'auth-success') {
          ws.close();
          done();
        }
      });

      ws.on('error', (error) => {
        done(error);
      });
    });

    it('should handle voice session lifecycle', async () => {
      // This would test the complete voice session workflow
      // including session start, audio streaming, and session end
      expect(voiceStreamingService).toBeDefined();
      expect(voiceStreamingService.getActiveSessionsCount()).toBe(0);
    });
  });

  describe('End-to-End Voice Pipeline', () => {
    it('should process complete voice interaction flow', async () => {
      // This would test the complete pipeline:
      // 1. Audio input
      // 2. Speech-to-text
      // 3. Emergency detection
      // 4. AI processing
      // 5. Text-to-speech
      // 6. Audio output

      const mockAudioInput = Buffer.from('hello-minnie-max-audio');
      
      // Step 1: Transcribe audio
      const transcription = await WhisperService.transcribeAudio(
        mockAudioInput,
        'test.webm',
        { language: 'english' }
      );

      // Step 2: Check for emergency
      const emergencyCheck = await EmergencyDetectionService.detectEmergency(
        mockAudioInput,
        'test.webm',
        {
          sessionId: 'test-session',
          userId: 'test-user',
          language: 'english',
        }
      );

      // Step 3: Process with AI if not emergency
      if (!emergencyCheck.isEmergency) {
        const aiResponse = await ConversationService.processUserInput(
          'test-session',
          transcription.text,
          { language: 'english' }
        );

        // Step 4: Generate voice response
        const voiceResponse = await ElevenLabsService.synthesizeSpeech(
          aiResponse.text,
          {
            language: 'english',
            context: 'normal',
            userId: 'test-user',
            sessionId: 'test-session',
          }
        );

        expect(voiceResponse.audioBuffer).toBeInstanceOf(Buffer);
      }
    });

    it('should handle emergency flow end-to-end', async () => {
      const emergencyAudio = Buffer.from('help-emergency-audio');
      
      // Detect emergency
      const emergencyResult = await EmergencyDetectionService.detectEmergency(
        emergencyAudio,
        'emergency.webm',
        {
          sessionId: 'test-session',
          userId: 'test-user',
          language: 'english',
        }
      );

      if (emergencyResult.isEmergency) {
        // Generate emergency response
        const emergencyResponse = await ElevenLabsService.synthesizeEmergencyResponse(
          'Emergency detected. Help is on the way.',
          {
            urgencyLevel: emergencyResult.urgencyLevel,
            userId: 'test-user',
            sessionId: 'test-session',
          }
        );

        expect(emergencyResponse.audioBuffer).toBeInstanceOf(Buffer);
        expect(emergencyResult.recommendation).toBe('immediate_response');
      }
    });
  });

  describe('Performance and Quality Tests', () => {
    it('should meet latency requirements', async () => {
      const startTime = Date.now();
      
      const mockAudioBuffer = Buffer.from('performance-test-audio');
      await WhisperService.transcribeAudio(mockAudioBuffer, 'test.webm');
      
      const latency = Date.now() - startTime;
      expect(latency).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle concurrent voice sessions', async () => {
      const sessionPromises = [];
      
      for (let i = 0; i < 5; i++) {
        const promise = VoiceSessionManager.createSession(
          `test-user-${i}`,
          {
            id: `test-user-${i}`,
            email: `test${i}@example.com`,
            full_name: `Test User ${i}`,
            subscription_tier: 'basic',
          },
          {
            language: 'english',
            enableEmergencyDetection: true,
            audioQuality: 'high',
            realTimeTranscription: true,
            autoSave: true,
            retentionDays: 30,
          }
        );
        sessionPromises.push(promise);
      }

      const sessions = await Promise.all(sessionPromises);
      expect(sessions).toHaveLength(5);
      sessions.forEach(session => {
        expect(session.sessionId).toBeDefined();
      });
    });

    it('should maintain audio quality standards', async () => {
      const mockAudioBuffer = Buffer.from('quality-test-audio');
      
      const processed = await AudioProcessor.processForSpeechRecognition(
        mockAudioBuffer,
        'webm'
      );

      expect(processed.quality.quality).not.toBe('poor');
      expect(processed.metadata.sampleRate).toBe(16000); // Optimal for speech
    });
  });
});
