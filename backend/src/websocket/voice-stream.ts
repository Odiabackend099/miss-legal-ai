// WebSocket Voice Streaming Service for MISS Legal AI
import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { voiceLogger, emergencyLogger } from '@/utils/logger';
import { WhisperService } from '@/services/voice/whisper';
import { ElevenLabsService } from '@/services/voice/elevenlabs';
import { ConversationService } from '@/services/ai/conversation';
import { EmergencyDetectionService } from '@/services/emergency/detection';
import { db } from '@/integrations/supabase/client';
import { WhatsAppService } from '@/integrations/whatsapp/client';
import { User, Language } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface VoiceSession {
  sessionId: string;
  userId: string;
  user: User;
  socketId: string;
  language: Language;
  isActive: boolean;
  startTime: Date;
  audioChunks: Buffer[];
  transcriptionBuffer: string;
  emergencyDetected: boolean;
  conversationContext?: any;
  quality: {
    audioQuality: number;
    transcriptionAccuracy: number;
    responseLatency: number[];
    connectionStability: number;
  };
}

interface AudioChunk {
  data: Buffer;
  timestamp: number;
  sequenceNumber: number;
  sampleRate: number;
  channels: number;
}

interface VoiceStreamingOptions {
  language?: Language;
  enableEmergencyDetection: boolean;
  audioQuality: 'low' | 'medium' | 'high';
  realTimeTranscription: boolean;
  bufferSize: number;
}

export class VoiceStreamingService {
  private io: SocketIOServer;
  private activeSessions = new Map<string, VoiceSession>();
  private sessionsByUser = new Map<string, string>(); // userId -> sessionId
  private emergencyCallbacks = new Map<string, Function>();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization"],
        credentials: true,
      },
      maxHttpBufferSize: 1e7, // 10MB for audio chunks
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.setupSocketHandlers();
    voiceLogger.info('Voice streaming service initialized');
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      voiceLogger.info('Client connected', { socketId: socket.id });

      // Authentication middleware
      socket.use(async (packet, next) => {
        try {
          const token = packet[1]?.auth?.token;
          if (!token) {
            return next(new Error('Authentication required'));
          }

          // Verify JWT token (implement token verification)
          const user = await this.verifyAuthToken(token);
          socket.data.user = user;
          next();
        } catch (error) {
          next(new Error('Authentication failed'));
        }
      });

      // Start voice session
      socket.on('start-voice-session', async (options: VoiceStreamingOptions) => {
        await this.handleStartVoiceSession(socket, options);
      });

      // Handle audio chunks
      socket.on('audio-chunk', async (audioChunk: AudioChunk) => {
        await this.handleAudioChunk(socket, audioChunk);
      });

      // Handle text input (fallback)
      socket.on('text-input', async (text: string) => {
        await this.handleTextInput(socket, text);
      });

      // End voice session
      socket.on('end-voice-session', async () => {
        await this.handleEndVoiceSession(socket);
      });

      // Handle emergency acknowledgment
      socket.on('emergency-acknowledged', async (emergencyId: string) => {
        await this.handleEmergencyAcknowledged(socket, emergencyId);
      });

      // Handle language change
      socket.on('change-language', async (language: Language) => {
        await this.handleLanguageChange(socket, language);
      });

      // Handle voice settings update
      socket.on('update-voice-settings', async (settings: any) => {
        await this.handleVoiceSettingsUpdate(socket, settings);
      });

      // Connection quality monitoring
      socket.on('quality-report', (qualityData: any) => {
        this.handleQualityReport(socket, qualityData);
      });

      // Handle disconnection
      socket.on('disconnect', async (reason: string) => {
        await this.handleDisconnection(socket, reason);
      });

      // Error handling
      socket.on('error', (error: Error) => {
        voiceLogger.error('Socket error', {
          socketId: socket.id,
          userId: socket.data.user?.id,
          error: error.message,
        });
      });
    });
  }

  /**
   * Start a new voice session
   */
  private async handleStartVoiceSession(
    socket: Socket,
    options: VoiceStreamingOptions
  ): Promise<void> {
    try {
      const user = socket.data.user as User;
      const sessionId = uuidv4();

      // Check for existing session
      const existingSessionId = this.sessionsByUser.get(user.id);
      if (existingSessionId) {
        await this.endSession(existingSessionId);
      }

      // Create new session
      const session: VoiceSession = {
        sessionId,
        userId: user.id,
        user,
        socketId: socket.id,
        language: options.language || 'english',
        isActive: true,
        startTime: new Date(),
        audioChunks: [],
        transcriptionBuffer: '',
        emergencyDetected: false,
        quality: {
          audioQuality: 0.8,
          transcriptionAccuracy: 0.8,
          responseLatency: [],
          connectionStability: 1.0,
        },
      };

      // Initialize conversation context
      session.conversationContext = await ConversationService.initializeConversation(
        sessionId,
        user.id,
        user,
        session.language
      );

      // Store session
      this.activeSessions.set(sessionId, session);
      this.sessionsByUser.set(user.id, sessionId);

      // Create database record
      await db.createVoiceSession({
        id: sessionId,
        user_id: user.id,
        language: session.language,
        status: 'active',
        started_at: session.startTime.toISOString(),
        audio_quality: options.audioQuality,
        emergency_detection_enabled: options.enableEmergencyDetection,
        real_time_transcription: options.realTimeTranscription,
        created_at: new Date().toISOString(),
      });

      // Send confirmation to client
      socket.emit('session-started', {
        sessionId,
        language: session.language,
        emergencyDetectionEnabled: options.enableEmergencyDetection,
        supportedLanguages: ['english', 'pidgin', 'yoruba', 'hausa', 'igbo'],
      });

      // Send initial greeting
      const greeting = await this.generateInitialGreeting(session.language, user.full_name);
      await this.sendVoiceResponse(socket, greeting, session);

      voiceLogger.info('Voice session started', {
        sessionId,
        userId: user.id,
        language: session.language,
        options,
      });
    } catch (error) {
      voiceLogger.error('Failed to start voice session', {
        userId: socket.data.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      socket.emit('session-error', {
        error: 'Failed to start voice session',
      });
    }
  }

  /**
   * Handle incoming audio chunks
   */
  private async handleAudioChunk(socket: Socket, audioChunk: AudioChunk): Promise<void> {
    try {
      const user = socket.data.user as User;
      const sessionId = this.sessionsByUser.get(user.id);
      
      if (!sessionId) {
        socket.emit('session-error', { error: 'No active session' });
        return;
      }

      const session = this.activeSessions.get(sessionId);
      if (!session || !session.isActive) {
        socket.emit('session-error', { error: 'Session not active' });
        return;
      }

      // Add chunk to buffer
      session.audioChunks.push(audioChunk.data);

      // Process audio when buffer reaches threshold or on timeout
      const bufferSize = session.audioChunks.reduce((size, chunk) => size + chunk.length, 0);
      const timeThreshold = Date.now() - session.startTime.getTime() > 3000; // 3 seconds

      if (bufferSize > 50000 || timeThreshold) { // ~50KB or 3 seconds
        await this.processAudioBuffer(session, socket);
      }

      // Emit chunk received confirmation
      socket.emit('chunk-received', {
        sequenceNumber: audioChunk.sequenceNumber,
        timestamp: audioChunk.timestamp,
      });

    } catch (error) {
      voiceLogger.error('Audio chunk processing failed', {
        userId: socket.data.user?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Process accumulated audio buffer
   */
  private async processAudioBuffer(session: VoiceSession, socket: Socket): Promise<void> {
    if (session.audioChunks.length === 0) return;

    const startTime = Date.now();

    try {
      // Combine audio chunks
      const combinedAudio = Buffer.concat(session.audioChunks);
      session.audioChunks = []; // Clear buffer

      // Create temporary filename
      const filename = `stream_${session.sessionId}_${Date.now()}.webm`;

      // Emergency detection (highest priority)
      if (!session.emergencyDetected) {
        const emergencyResult = await EmergencyDetectionService.detectEmergency(
          combinedAudio,
          filename,
          {
            sessionId: session.sessionId,
            userId: session.userId,
            language: session.language,
            location: session.user.default_location,
          }
        );

        if (emergencyResult.isEmergency && emergencyResult.confidence > 0.7) {
          await this.handleEmergencyDetected(session, socket, emergencyResult);
          return; // Emergency takes priority
        }
      }

      // Transcription
      const transcription = await WhisperService.transcribeStream(
        session.audioChunks.map((chunk, i) => ({
          data: chunk,
          timestamp: Date.now() - (session.audioChunks.length - i) * 1000,
          sequenceNumber: i,
        })),
        {
          language: session.language,
          sessionId: session.sessionId,
          userId: session.userId,
        }
      );

      if (transcription.transcription) {
        session.transcriptionBuffer += ' ' + transcription.transcription;

        // Emit transcription to client
        socket.emit('transcription', {
          text: transcription.transcription,
          confidence: transcription.confidence,
          language: transcription.language,
          isPartial: false,
        });

        // Process with AI if complete sentence detected
        if (this.isCompleteSentence(transcription.transcription)) {
          await this.processCompleteInput(session, socket, session.transcriptionBuffer.trim());
          session.transcriptionBuffer = ''; // Clear buffer
        }
      }

      // Update quality metrics
      const processingTime = Date.now() - startTime;
      session.quality.responseLatency.push(processingTime);
      session.quality.transcriptionAccuracy = transcription.confidence;

      // Keep only last 10 latency measurements
      if (session.quality.responseLatency.length > 10) {
        session.quality.responseLatency = session.quality.responseLatency.slice(-10);
      }

    } catch (error) {
      voiceLogger.error('Audio buffer processing failed', {
        sessionId: session.sessionId,
        userId: session.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Handle emergency detection
   */
  private async handleEmergencyDetected(
    session: VoiceSession,
    socket: Socket,
    emergencyResult: any
  ): Promise<void> {
    session.emergencyDetected = true;

    emergencyLogger.error('Emergency detected in voice stream', {
      sessionId: session.sessionId,
      userId: session.userId,
      emergencyType: emergencyResult.type,
      confidence: emergencyResult.confidence,
      urgencyLevel: emergencyResult.urgencyLevel,
    });

    // Generate emergency response
    const emergencyResponse = await ElevenLabsService.synthesizeEmergencyResponse(
      `I understand this is an emergency. I'm notifying your emergency contacts now. Stay calm and I'm here to help.`,
      {
        urgencyLevel: emergencyResult.urgencyLevel,
        userId: session.userId,
        sessionId: session.sessionId,
        emergencyType: emergencyResult.type,
      }
    );

    // Send emergency alert to client
    socket.emit('emergency-detected', {
      type: emergencyResult.type,
      confidence: emergencyResult.confidence,
      urgencyLevel: emergencyResult.urgencyLevel,
      message: 'Emergency detected - notifying contacts',
      audioResponse: emergencyResponse.audioBuffer.toString('base64'),
    });

    // Trigger emergency dispatch
    try {
      // Get user's emergency contacts
      const { data: emergencyContacts } = await db.client
        .from('emergency_contacts')
        .select('*')
        .eq('user_id', session.userId)
        .eq('is_active', true);

      if (emergencyContacts && emergencyContacts.length > 0) {
        // Send WhatsApp notifications
        for (const contact of emergencyContacts) {
          await WhatsAppService.sendEmergencyNotification(
            contact.phone,
            {
              type: emergencyResult.type,
              userLocation: session.user.default_location,
              confidence: emergencyResult.confidence,
              timestamp: new Date().toISOString(),
            },
            session.language
          );
        }
      }

      // Create emergency record
      await db.createEmergency({
        id: uuidv4(),
        user_id: session.userId,
        session_id: session.sessionId,
        type: emergencyResult.type,
        status: 'active',
        confidence_score: emergencyResult.confidence,
        detection_method: 'voice_ai',
        location: session.user.default_location,
        voice_transcript: session.transcriptionBuffer,
        audio_features: emergencyResult.audioFeatures,
        contacts_notified: emergencyContacts?.length || 0,
        created_at: new Date().toISOString(),
      });

    } catch (error) {
      emergencyLogger.error('Emergency notification failed', {
        sessionId: session.sessionId,
        userId: session.userId,
        error,
      });
    }
  }

  /**
   * Process complete user input with AI
   */
  private async processCompleteInput(
    session: VoiceSession,
    socket: Socket,
    userInput: string
  ): Promise<void> {
    try {
      // Process with conversation AI
      const aiResponse = await ConversationService.processUserInput(
        session.sessionId,
        userInput,
        {
          language: session.language,
          audioConfidence: session.quality.transcriptionAccuracy,
        }
      );

      // Generate voice response
      const ttsResponse = await ElevenLabsService.synthesizeSpeech(
        aiResponse.text,
        {
          language: session.language,
          context: aiResponse.emergencyDetected?.isEmergency ? 'emergency' : 'normal',
          userId: session.userId,
          sessionId: session.sessionId,
        }
      );

      // Send response to client
      socket.emit('ai-response', {
        text: aiResponse.text,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        actions: aiResponse.actions,
        audio: ttsResponse.audioBuffer.toString('base64'),
        audioFormat: 'mp3',
        requiresHumanEscalation: aiResponse.requiresHumanEscalation,
      });

      // Update session metrics
      session.quality.responseLatency.push(Date.now() - Date.now());

      voiceLogger.info('AI response generated', {
        sessionId: session.sessionId,
        userId: session.userId,
        intent: aiResponse.intent,
        confidence: aiResponse.confidence,
        audioSize: ttsResponse.audioBuffer.length,
      });

    } catch (error) {
      voiceLogger.error('AI processing failed', {
        sessionId: session.sessionId,
        userId: session.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Send error response
      socket.emit('ai-response', {
        text: "I'm sorry, I'm having trouble processing that. Could you please try again?",
        intent: 'error',
        confidence: 0.1,
        actions: ['retry'],
        requiresHumanEscalation: false,
      });
    }
  }

  /**
   * Handle text input (fallback mode)
   */
  private async handleTextInput(socket: Socket, text: string): Promise<void> {
    const user = socket.data.user as User;
    const sessionId = this.sessionsByUser.get(user.id);
    
    if (!sessionId) {
      socket.emit('session-error', { error: 'No active session' });
      return;
    }

    const session = this.activeSessions.get(sessionId);
    if (!session) {
      socket.emit('session-error', { error: 'Session not found' });
      return;
    }

    await this.processCompleteInput(session, socket, text);
  }

  /**
   * End voice session
   */
  private async handleEndVoiceSession(socket: Socket): Promise<void> {
    const user = socket.data.user as User;
    const sessionId = this.sessionsByUser.get(user.id);
    
    if (sessionId) {
      await this.endSession(sessionId);
    }

    socket.emit('session-ended', {
      sessionId,
      duration: sessionId ? this.getSessionDuration(sessionId) : 0,
    });
  }

  /**
   * End session cleanup
   */
  private async endSession(sessionId: string): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) return;

      session.isActive = false;

      // Update database
      await db.client
        .from('voice_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          total_duration: this.getSessionDuration(sessionId),
          quality_metrics: session.quality,
        })
        .eq('id', sessionId);

      // Clear conversation context
      ConversationService.clearConversationContext(sessionId);

      // Cleanup
      this.activeSessions.delete(sessionId);
      this.sessionsByUser.delete(session.userId);

      voiceLogger.info('Voice session ended', {
        sessionId,
        userId: session.userId,
        duration: this.getSessionDuration(sessionId),
      });
    } catch (error) {
      voiceLogger.error('Session cleanup failed', { sessionId, error });
    }
  }

  // Helper methods
  private async verifyAuthToken(token: string): Promise<User> {
    // Implement JWT verification
    // This would normally decode and verify the JWT token
    // For now, return a mock user
    return {
      id: 'user-id',
      email: 'user@example.com',
      full_name: 'Test User',
      subscription_tier: 'basic',
    } as User;
  }

  private async generateInitialGreeting(language: Language, userName: string): Promise<string> {
    const greetings: Record<Language, string> = {
      english: `Hello ${userName}! I'm Minnie Max, your legal assistant. How can I help you today?`,
      pidgin: `Hello ${userName}! I be Minnie Max, your legal assistant. How I fit help you today?`,
      yoruba: `Bawo ${userName}! Emi ni Minnie Max, oluranlowo legal yin. Bawo ni mo se le ran yin lowo loni?`,
      hausa: `Sannu ${userName}! Ni ne Minnie Max, mai taimako na shari'a. Yaya zan iya taimaka muku yau?`,
      igbo: `Ndewo ${userName}! Abu m Minnie Max, onye inyeaka gị maka iwu. Kedu ka m ga-esi nyere gị aka taa?`,
    };

    return greetings[language] || greetings.english;
  }

  private isCompleteSentence(text: string): boolean {
    const trimmed = text.trim();
    return /[.!?]$/.test(trimmed) || trimmed.length > 50;
  }

  private getSessionDuration(sessionId: string): number {
    const session = this.activeSessions.get(sessionId);
    if (!session) return 0;
    
    return Date.now() - session.startTime.getTime();
  }

  private async sendVoiceResponse(socket: Socket, text: string, session: VoiceSession): Promise<void> {
    try {
      const ttsResponse = await ElevenLabsService.synthesizeSpeech(text, {
        language: session.language,
        context: 'friendly',
        userId: session.userId,
        sessionId: session.sessionId,
      });

      socket.emit('voice-response', {
        text,
        audio: ttsResponse.audioBuffer.toString('base64'),
        audioFormat: 'mp3',
        voice: ttsResponse.voiceUsed,
      });
    } catch (error) {
      voiceLogger.error('Voice response failed', {
        sessionId: session.sessionId,
        error,
      });
    }
  }

  private handleQualityReport(socket: Socket, qualityData: any): void {
    const user = socket.data.user as User;
    const sessionId = this.sessionsByUser.get(user.id);
    
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.quality.connectionStability = qualityData.connectionStability || 1.0;
        session.quality.audioQuality = qualityData.audioQuality || 0.8;
      }
    }
  }

  private async handleEmergencyAcknowledged(socket: Socket, emergencyId: string): Promise<void> {
    // Update emergency status
    await db.client
      .from('emergencies')
      .update({
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', emergencyId);

    socket.emit('emergency-acknowledged', { emergencyId });
  }

  private async handleLanguageChange(socket: Socket, language: Language): Promise<void> {
    const user = socket.data.user as User;
    const sessionId = this.sessionsByUser.get(user.id);
    
    if (sessionId) {
      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.language = language;
        ConversationService.updateConversationContext(sessionId, { language });
        
        socket.emit('language-changed', { language });
        
        voiceLogger.info('Language changed', {
          sessionId,
          userId: user.id,
          newLanguage: language,
        });
      }
    }
  }

  private async handleVoiceSettingsUpdate(socket: Socket, settings: any): Promise<void> {
    // Update voice settings for the session
    socket.emit('voice-settings-updated', settings);
  }

  private async handleDisconnection(socket: Socket, reason: string): Promise<void> {
    const user = socket.data.user;
    if (user) {
      const sessionId = this.sessionsByUser.get(user.id);
      if (sessionId) {
        await this.endSession(sessionId);
      }
    }

    voiceLogger.info('Client disconnected', {
      socketId: socket.id,
      userId: user?.id,
      reason,
    });
  }

  /**
   * Get active sessions count
   */
  getActiveSessionsCount(): number {
    return Array.from(this.activeSessions.values()).filter(s => s.isActive).length;
  }

  /**
   * Get session by user ID
   */
  getSessionByUserId(userId: string): VoiceSession | undefined {
    const sessionId = this.sessionsByUser.get(userId);
    return sessionId ? this.activeSessions.get(sessionId) : undefined;
  }

  /**
   * Force end session (admin use)
   */
  async forceEndSession(sessionId: string): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      await this.endSession(sessionId);
      return true;
    }
    return false;
  }
}

export default VoiceStreamingService;
