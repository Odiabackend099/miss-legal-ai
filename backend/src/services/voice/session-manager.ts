// Voice Session Management Service for MISS Legal AI
import { voiceLogger } from '@/utils/logger';
import { db } from '@/integrations/supabase/client';
import { Language, User } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface VoiceSessionConfig {
  language: Language;
  enableEmergencyDetection: boolean;
  audioQuality: 'low' | 'medium' | 'high';
  realTimeTranscription: boolean;
  autoSave: boolean;
  retentionDays: number;
}

interface VoiceSessionMetrics {
  totalDuration: number;
  audioProcessingTime: number;
  transcriptionAccuracy: number;
  responseLatency: number;
  emergencyDetections: number;
  userSatisfactionScore?: number;
}

interface VoiceSessionSummary {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  language: Language;
  totalTranscriptions: number;
  emergencyDetected: boolean;
  conversationSummary: string;
  actionItems: string[];
  documentsGenerated: string[];
  lawyerConsultationRequested: boolean;
  metrics: VoiceSessionMetrics;
}

export class VoiceSessionManager {
  private static readonly MAX_SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
  private static readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private static readonly AUDIO_RETENTION_DAYS = 7; // NDPR compliance

  // Session storage for active sessions
  private static activeSessions = new Map<string, any>();
  private static userSessions = new Map<string, string[]>(); // userId -> sessionIds

  static {
    // Start cleanup timer
    setInterval(() => {
      this.cleanupExpiredSessions();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Create a new voice session
   */
  static async createSession(
    userId: string,
    user: User,
    config: VoiceSessionConfig
  ): Promise<{
    sessionId: string;
    config: VoiceSessionConfig;
    retentionPolicy: {
      audioRetentionDays: number;
      transcriptRetentionDays: number;
      autoDeleteDate: string;
    };
  }> {
    try {
      const sessionId = uuidv4();
      const now = new Date();
      
      // Calculate retention dates based on NDPR compliance
      const audioRetentionDate = new Date(now.getTime() + (this.AUDIO_RETENTION_DAYS * 24 * 60 * 60 * 1000));
      const transcriptRetentionDate = new Date(now.getTime() + (config.retentionDays * 24 * 60 * 60 * 1000));

      // Create session record in database
      const sessionRecord = await db.client.from('voice_sessions').insert({
        id: sessionId,
        user_id: userId,
        language: config.language,
        status: 'created',
        started_at: now.toISOString(),
        audio_quality: config.audioQuality,
        emergency_detection_enabled: config.enableEmergencyDetection,
        real_time_transcription: config.realTimeTranscription,
        auto_save_enabled: config.autoSave,
        audio_retention_date: audioRetentionDate.toISOString(),
        transcript_retention_date: transcriptRetentionDate.toISOString(),
        created_at: now.toISOString(),
        config: config,
      }).select().single();

      // Add to active sessions
      this.activeSessions.set(sessionId, {
        sessionId,
        userId,
        user,
        config,
        startTime: now,
        transcriptions: [],
        audioChunks: [],
        emergencyEvents: [],
        metrics: {
          totalDuration: 0,
          audioProcessingTime: 0,
          transcriptionAccuracy: 0,
          responseLatency: 0,
          emergencyDetections: 0,
        },
      });

      // Add to user sessions tracking
      if (!this.userSessions.has(userId)) {
        this.userSessions.set(userId, []);
      }
      this.userSessions.get(userId)!.push(sessionId);

      // Log session creation
      await db.createAuditLog({
        user_id: userId,
        action: 'VOICE_SESSION_CREATED',
        resource_type: 'voice_sessions',
        resource_id: sessionId,
        new_values: {
          language: config.language,
          emergency_detection: config.enableEmergencyDetection,
          audio_quality: config.audioQuality,
        },
        success: true,
        ndpr_relevant: true,
        retention_date: transcriptRetentionDate,
      });

      voiceLogger.info('Voice session created', {
        sessionId,
        userId,
        language: config.language,
        retentionDays: config.retentionDays,
      });

      return {
        sessionId,
        config,
        retentionPolicy: {
          audioRetentionDays: this.AUDIO_RETENTION_DAYS,
          transcriptRetentionDays: config.retentionDays,
          autoDeleteDate: transcriptRetentionDate.toISOString(),
        },
      };
    } catch (error) {
      voiceLogger.error('Voice session creation failed', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Update session status
   */
  static async updateSessionStatus(
    sessionId: string,
    status: 'created' | 'active' | 'paused' | 'ended' | 'error'
  ): Promise<void> {
    try {
      await db.client
        .from('voice_sessions')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = status;
      }

      voiceLogger.info('Session status updated', { sessionId, status });
    } catch (error) {
      voiceLogger.error('Session status update failed', { sessionId, status, error });
    }
  }

  /**
   * Record transcription in session
   */
  static async recordTranscription(
    sessionId: string,
    transcription: {
      text: string;
      confidence: number;
      language: Language;
      timestamp: Date;
      audioChunkId?: string;
    }
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      // Add to session transcriptions
      session.transcriptions.push({
        id: uuidv4(),
        ...transcription,
      });

      // Update metrics
      session.metrics.transcriptionAccuracy = 
        (session.metrics.transcriptionAccuracy + transcription.confidence) / 2;

      // Store in database if auto-save is enabled
      if (session.config.autoSave) {
        await db.client.from('voice_transcriptions').insert({
          id: uuidv4(),
          session_id: sessionId,
          text: transcription.text,
          confidence: transcription.confidence,
          language: transcription.language,
          audio_chunk_id: transcription.audioChunkId,
          timestamp: transcription.timestamp.toISOString(),
          created_at: new Date().toISOString(),
        });
      }

      voiceLogger.debug('Transcription recorded', {
        sessionId,
        textLength: transcription.text.length,
        confidence: transcription.confidence,
      });
    } catch (error) {
      voiceLogger.error('Transcription recording failed', { sessionId, error });
    }
  }

  /**
   * Record emergency event
   */
  static async recordEmergencyEvent(
    sessionId: string,
    emergencyData: {
      type: string;
      confidence: number;
      urgencyLevel: string;
      audioFeatures?: any;
      textFeatures?: any;
      notificationsSent: number;
    }
  ): Promise<void> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const emergencyEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        ...emergencyData,
      };

      session.emergencyEvents.push(emergencyEvent);
      session.metrics.emergencyDetections++;

      // Store in database
      await db.client.from('session_emergency_events').insert({
        id: emergencyEvent.id,
        session_id: sessionId,
        user_id: session.userId,
        emergency_type: emergencyData.type,
        confidence: emergencyData.confidence,
        urgency_level: emergencyData.urgencyLevel,
        audio_features: emergencyData.audioFeatures,
        text_features: emergencyData.textFeatures,
        notifications_sent: emergencyData.notificationsSent,
        timestamp: emergencyEvent.timestamp.toISOString(),
        created_at: new Date().toISOString(),
      });

      voiceLogger.warn('Emergency event recorded', {
        sessionId,
        emergencyType: emergencyData.type,
        confidence: emergencyData.confidence,
        urgencyLevel: emergencyData.urgencyLevel,
      });
    } catch (error) {
      voiceLogger.error('Emergency event recording failed', { sessionId, error });
    }
  }

  /**
   * End session and generate summary
   */
  static async endSession(sessionId: string): Promise<VoiceSessionSummary> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const endTime = new Date();
      const duration = endTime.getTime() - session.startTime.getTime();

      // Update metrics
      session.metrics.totalDuration = duration;

      // Generate conversation summary
      const conversationSummary = await this.generateConversationSummary(session);

      // Extract action items
      const actionItems = await this.extractActionItems(session);

      // Check for document generation requests
      const documentsGenerated = await this.getGeneratedDocuments(sessionId);

      // Check for lawyer consultation requests
      const lawyerConsultationRequested = await this.checkLawyerConsultationRequests(sessionId);

      // Create session summary
      const summary: VoiceSessionSummary = {
        sessionId,
        userId: session.userId,
        startTime: session.startTime,
        endTime,
        duration,
        language: session.config.language,
        totalTranscriptions: session.transcriptions.length,
        emergencyDetected: session.emergencyEvents.length > 0,
        conversationSummary,
        actionItems,
        documentsGenerated,
        lawyerConsultationRequested,
        metrics: session.metrics,
      };

      // Update database
      await db.client
        .from('voice_sessions')
        .update({
          status: 'ended',
          ended_at: endTime.toISOString(),
          total_duration: duration,
          transcriptions_count: session.transcriptions.length,
          emergency_events_count: session.emergencyEvents.length,
          conversation_summary: conversationSummary,
          action_items: actionItems,
          quality_metrics: session.metrics,
          session_summary: summary,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);

      // Save all transcriptions if not auto-saved
      if (!session.config.autoSave && session.transcriptions.length > 0) {
        await this.saveFinalTranscriptions(sessionId, session.transcriptions);
      }

      // Remove from active sessions
      this.activeSessions.delete(sessionId);
      const userSessionIds = this.userSessions.get(session.userId);
      if (userSessionIds) {
        const index = userSessionIds.indexOf(sessionId);
        if (index > -1) {
          userSessionIds.splice(index, 1);
        }
      }

      // Log session completion
      await db.createAuditLog({
        user_id: session.userId,
        action: 'VOICE_SESSION_ENDED',
        resource_type: 'voice_sessions',
        resource_id: sessionId,
        old_values: { status: 'active' },
        new_values: { status: 'ended', duration },
        success: true,
        ndpr_relevant: true,
        retention_date: new Date(Date.now() + (session.config.retentionDays * 24 * 60 * 60 * 1000)),
      });

      voiceLogger.info('Voice session ended', {
        sessionId,
        userId: session.userId,
        duration: `${Math.round(duration / 1000)}s`,
        transcriptions: session.transcriptions.length,
        emergencyEvents: session.emergencyEvents.length,
      });

      return summary;
    } catch (error) {
      voiceLogger.error('Session end failed', { sessionId, error });
      throw error;
    }
  }

  /**
   * Get session by ID
   */
  static getSession(sessionId: string): any {
    return this.activeSessions.get(sessionId);
  }

  /**
   * Get user's active sessions
   */
  static getUserActiveSessions(userId: string): string[] {
    return this.userSessions.get(userId) || [];
  }

  /**
   * Get session history for user
   */
  static async getSessionHistory(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      fromDate?: Date;
      toDate?: Date;
      language?: Language;
    } = {}
  ): Promise<{
    sessions: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;

      // Build query
      let query = db.client
        .from('voice_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('started_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (options.fromDate) {
        query = query.gte('started_at', options.fromDate.toISOString());
      }

      if (options.toDate) {
        query = query.lte('started_at', options.toDate.toISOString());
      }

      if (options.language) {
        query = query.eq('language', options.language);
      }

      const { data: sessions, count } = await query;

      return {
        sessions: sessions || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
        },
      };
    } catch (error) {
      voiceLogger.error('Session history retrieval failed', { userId, error });
      throw error;
    }
  }

  /**
   * Clean up expired sessions (NDPR compliance)
   */
  private static async cleanupExpiredSessions(): Promise<void> {
    try {
      const now = new Date();

      // Clean up audio data past retention period
      await db.client
        .from('voice_sessions')
        .update({ audio_data_deleted: true })
        .lt('audio_retention_date', now.toISOString())
        .eq('audio_data_deleted', false);

      // Clean up transcript data past retention period
      await db.client
        .from('voice_sessions')
        .update({ transcript_data_deleted: true })
        .lt('transcript_retention_date', now.toISOString())
        .eq('transcript_data_deleted', false);

      // Remove sessions that are completely expired
      const { data: expiredSessions } = await db.client
        .from('voice_sessions')
        .select('id')
        .lt('transcript_retention_date', now.toISOString())
        .eq('audio_data_deleted', true)
        .eq('transcript_data_deleted', true);

      if (expiredSessions && expiredSessions.length > 0) {
        // Archive before deletion (if required by business rules)
        // await this.archiveExpiredSessions(expiredSessions);

        // Delete expired sessions
        await db.client
          .from('voice_sessions')
          .delete()
          .in('id', expiredSessions.map(s => s.id));

        voiceLogger.info('Expired sessions cleaned up', {
          cleanedCount: expiredSessions.length,
        });
      }

      // Clean up active sessions that have exceeded max duration
      for (const [sessionId, session] of this.activeSessions.entries()) {
        const sessionDuration = Date.now() - session.startTime.getTime();
        if (sessionDuration > this.MAX_SESSION_DURATION) {
          await this.endSession(sessionId);
          voiceLogger.warn('Session force-ended due to max duration', {
            sessionId,
            duration: sessionDuration,
          });
        }
      }
    } catch (error) {
      voiceLogger.error('Session cleanup failed', { error });
    }
  }

  // Helper methods
  private static async generateConversationSummary(session: any): Promise<string> {
    if (session.transcriptions.length === 0) {
      return 'No conversation recorded.';
    }

    const fullText = session.transcriptions.map((t: any) => t.text).join(' ');
    
    // Simple summary for now - could use AI for better summarization
    if (fullText.length > 200) {
      return fullText.substring(0, 197) + '...';
    }
    
    return fullText;
  }

  private static async extractActionItems(session: any): Promise<string[]> {
    const actionItems: string[] = [];
    
    // Look for action-oriented phrases in transcriptions
    const actionPhrases = [
      'need to', 'should', 'will', 'going to', 'plan to',
      'create document', 'contact lawyer', 'schedule', 'follow up'
    ];

    for (const transcription of session.transcriptions) {
      const text = transcription.text.toLowerCase();
      for (const phrase of actionPhrases) {
        if (text.includes(phrase)) {
          const sentence = text.split(/[.!?]/).find(s => s.includes(phrase));
          if (sentence && sentence.trim().length > 10) {
            actionItems.push(sentence.trim());
          }
        }
      }
    }

    return [...new Set(actionItems)]; // Remove duplicates
  }

  private static async getGeneratedDocuments(sessionId: string): Promise<string[]> {
    try {
      const { data: documents } = await db.client
        .from('documents')
        .select('title, document_type')
        .eq('session_id', sessionId);

      return documents?.map(d => `${d.document_type}: ${d.title}`) || [];
    } catch (error) {
      return [];
    }
  }

  private static async checkLawyerConsultationRequests(sessionId: string): Promise<boolean> {
    try {
      const { data: consultations } = await db.client
        .from('consultations')
        .select('id')
        .eq('session_id', sessionId)
        .limit(1);

      return (consultations?.length || 0) > 0;
    } catch (error) {
      return false;
    }
  }

  private static async saveFinalTranscriptions(sessionId: string, transcriptions: any[]): Promise<void> {
    try {
      const transcriptionRecords = transcriptions.map(t => ({
        id: t.id || uuidv4(),
        session_id: sessionId,
        text: t.text,
        confidence: t.confidence,
        language: t.language,
        audio_chunk_id: t.audioChunkId,
        timestamp: t.timestamp.toISOString(),
        created_at: new Date().toISOString(),
      }));

      await db.client.from('voice_transcriptions').insert(transcriptionRecords);
    } catch (error) {
      voiceLogger.error('Final transcriptions save failed', { sessionId, error });
    }
  }
}

export default VoiceSessionManager;
