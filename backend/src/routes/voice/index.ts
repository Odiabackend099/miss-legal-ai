// Voice Processing Routes for MISS Legal AI
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticateJWT } from '@/middleware/auth';
import { voiceRateLimit } from '@/middleware/rateLimit';
import { OpenAIService } from '@/integrations/openai/client';
import { WhatsAppService } from '@/integrations/whatsapp/client';
import { db } from '@/integrations/supabase/client';
import { audioDataSchema, ValidationUtils } from '@/utils/validation';
import { ApiResponse, User, VoiceSessionType, EmergencyType } from '@/types';
import { logger, voiceLogger, emergencyLogger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const voiceRoutes = new Hono();

// Process voice input
voiceRoutes.post(
  '/process',
  authenticateJWT,
  voiceRateLimit,
  zValidator('json', z.object({
    audio_data: z.string().min(1),
    audio_format: z.enum(['wav', 'mp3', 'm4a', 'webm']).default('wav'),
    session_id: z.string().uuid().optional(),
    session_type: z.enum(['general', 'document_creation', 'emergency', 'consultation']).default('general'),
    language_hint: z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']).optional(),
    duration_ms: z.number().positive().max(300000).optional(), // Max 5 minutes
  })),
  async (c) => {
    const startTime = Date.now();
    
    try {
      const user = c.get('user') as User;
      const { audio_data, audio_format, session_id, session_type, language_hint, duration_ms } = c.req.valid('json');

      voiceLogger.info('Voice processing started', {
        userId: user.id,
        sessionId: session_id,
        sessionType: session_type,
        audioFormat: audio_format,
        durationMs: duration_ms,
      });

      // Decode base64 audio data
      const audioBuffer = Buffer.from(audio_data, 'base64');
      const filename = `voice_${Date.now()}.${audio_format}`;

      // Validate audio file size (max 50MB)
      if (audioBuffer.length > 50 * 1024 * 1024) {
        return c.json({
          success: false,
          error: {
            code: 'AUDIO_TOO_LARGE',
            message: 'Audio file is too large. Maximum size is 50MB.',
          },
        } as ApiResponse, 400);
      }

      // Create or get voice session
      let voiceSession;
      if (session_id) {
        voiceSession = await db.getVoiceSession(session_id, user.id);
      }
      
      if (!voiceSession) {
        voiceSession = await db.createVoiceSession({
          id: session_id || uuidv4(),
          user_id: user.id,
          session_type,
          session_start: new Date().toISOString(),
          language_detected: language_hint,
          audio_retention_days: 7,
          auto_delete_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        });
      }

      // Transcribe audio using OpenAI Whisper
      const transcriptionResult = await OpenAIService.transcribeAudio(
        audioBuffer,
        filename,
        language_hint
      );

      // Detect language if not provided
      let detectedLanguage = transcriptionResult.language;
      if (!language_hint && transcriptionResult.text) {
        const languageDetection = await OpenAIService.detectLanguage(transcriptionResult.text);
        detectedLanguage = languageDetection.language;
      }

      // Detect emergency from transcript
      const emergencyDetection = await OpenAIService.detectEmergency(transcriptionResult.text);

      // Extract legal intent
      const intentExtraction = await OpenAIService.extractLegalIntent(
        transcriptionResult.text,
        detectedLanguage
      );

      // Generate response
      const responseGeneration = await OpenAIService.generateResponse(
        transcriptionResult.text,
        {
          language: detectedLanguage,
          sessionHistory: [], // TODO: Get previous conversation history
          userProfile: user,
          intent: intentExtraction.intent,
        }
      );

      // Calculate turn number
      const turnNumber = 1; // TODO: Calculate based on session history

      // Save conversation turn
      const conversation = await db.createVoiceConversation({
        id: uuidv4(),
        session_id: voiceSession.id,
        turn_number: turnNumber,
        speaker: 'user',
        transcript: transcriptionResult.text,
        transcript_confidence: transcriptionResult.confidence,
        language_used: detectedLanguage,
        intent: intentExtraction.intent,
        entities: intentExtraction.entities,
        response_generated: responseGeneration.response,
        processing_time_ms: Date.now() - startTime,
        created_at: new Date().toISOString(),
      });

      // Update session with detected information
      await db.updateVoiceSession(voiceSession.id, {
        language_detected: detectedLanguage,
        language_confidence: transcriptionResult.confidence,
        intent_classification: intentExtraction.intent,
        intent_confidence: intentExtraction.confidence,
        emergency_detected: emergencyDetection.isEmergency,
        emergency_confidence: emergencyDetection.confidence,
        emergency_type: emergencyDetection.emergencyType,
      });

      // Handle emergency if detected
      let emergencyResponse = null;
      if (emergencyDetection.isEmergency && emergencyDetection.confidence > 0.7) {
        emergencyResponse = await handleEmergencyDetection(
          user,
          voiceSession.id,
          emergencyDetection,
          transcriptionResult.text
        );
      }

      const processingTime = Date.now() - startTime;

      voiceLogger.info('Voice processing completed', {
        userId: user.id,
        sessionId: voiceSession.id,
        processingTime,
        emergencyDetected: emergencyDetection.isEmergency,
        intent: intentExtraction.intent,
      });

      // Log voice processing for audit
      await db.createAuditLog({
        user_id: user.id,
        action: 'VOICE_PROCESSED',
        resource_type: 'voice_sessions',
        resource_id: voiceSession.id,
        new_values: {
          intent: intentExtraction.intent,
          language: detectedLanguage,
          emergency_detected: emergencyDetection.isEmergency,
          processing_time_ms: processingTime,
        },
        success: true,
        ndpr_relevant: true,
        retention_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
      });

      return c.json({
        success: true,
        data: {
          session_id: voiceSession.id,
          transcript: transcriptionResult.text,
          language: detectedLanguage,
          language_confidence: transcriptionResult.confidence,
          intent: intentExtraction.intent,
          intent_confidence: intentExtraction.confidence,
          entities: intentExtraction.entities,
          response: responseGeneration.response,
          suggestions: responseGeneration.suggestions,
          next_action: responseGeneration.nextAction,
          emergency_detected: emergencyDetection.isEmergency,
          emergency_confidence: emergencyDetection.confidence,
          emergency_type: emergencyDetection.emergencyType,
          urgency_level: emergencyDetection.urgencyLevel,
          processing_time_ms: processingTime,
          ...(emergencyResponse && { emergency_response: emergencyResponse }),
        },
        message: 'Voice processed successfully',
      } as ApiResponse);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      voiceLogger.error('Voice processing failed', {
        userId: c.get('user')?.id,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return c.json({
        success: false,
        error: {
          code: 'VOICE_PROCESSING_FAILED',
          message: error instanceof Error ? error.message : 'Failed to process voice input',
          details: {
            processing_time_ms: processingTime,
          },
        },
      } as ApiResponse, 500);
    }
  }
);

// Text-to-speech synthesis
voiceRoutes.post(
  '/synthesize',
  authenticateJWT,
  zValidator('json', z.object({
    text: z.string().min(1).max(1000),
    language: z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']).default('english'),
    voice: z.enum(['male', 'female']).default('female'),
    speed: z.number().min(0.5).max(2.0).default(1.0),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { text, language, voice, speed } = c.req.valid('json');

      voiceLogger.info('TTS synthesis requested', {
        userId: user.id,
        textLength: text.length,
        language,
        voice,
        speed,
      });

      // For now, return a placeholder response
      // In production, integrate with a TTS service like ElevenLabs, Azure Speech, or Google Cloud TTS
      const audioUrl = `https://api.miss-legal.odia.ltd/tts/audio_${Date.now()}.mp3`;

      voiceLogger.info('TTS synthesis completed', {
        userId: user.id,
        audioUrl,
      });

      return c.json({
        success: true,
        data: {
          audio_url: audioUrl,
          duration_ms: Math.floor(text.length * 100), // Rough estimation
          language,
          voice,
          speed,
        },
        message: 'Text synthesized successfully',
      } as ApiResponse);
    } catch (error) {
      voiceLogger.error('TTS synthesis failed', {
        userId: c.get('user')?.id,
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'TTS_SYNTHESIS_FAILED',
          message: 'Failed to synthesize speech',
        },
      } as ApiResponse, 500);
    }
  }
);

// Get voice session details
voiceRoutes.get(
  '/session/:id',
  authenticateJWT,
  zValidator('param', z.object({
    id: z.string().uuid(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { id } = c.req.valid('param');

      // Get voice session
      const session = await db.getVoiceSession(id, user.id);
      if (!session) {
        return c.json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Voice session not found',
          },
        } as ApiResponse, 404);
      }

      // Get conversation history for this session
      const { data: conversations } = await db.client
        .from('voice_conversations')
        .select('*')
        .eq('session_id', id)
        .order('turn_number', { ascending: true });

      voiceLogger.info('Voice session retrieved', {
        userId: user.id,
        sessionId: id,
        conversationCount: conversations?.length || 0,
      });

      return c.json({
        success: true,
        data: {
          session: {
            id: session.id,
            session_type: session.session_type,
            session_start: session.session_start,
            session_end: session.session_end,
            duration_seconds: session.duration_seconds,
            language_detected: session.language_detected,
            intent_classification: session.intent_classification,
            conversation_summary: session.conversation_summary,
            emergency_detected: session.emergency_detected,
            emergency_type: session.emergency_type,
            created_at: session.created_at,
          },
          conversations: conversations || [],
        },
      } as ApiResponse);
    } catch (error) {
      voiceLogger.error('Failed to retrieve voice session', {
        userId: c.get('user')?.id,
        sessionId: c.req.param('id'),
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'SESSION_FETCH_FAILED',
          message: 'Failed to retrieve voice session',
        },
      } as ApiResponse, 500);
    }
  }
);

// Get user's voice sessions
voiceRoutes.get(
  '/sessions',
  authenticateJWT,
  zValidator('query', z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(50)).default('10'),
    type: z.enum(['general', 'document_creation', 'emergency', 'consultation']).optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { page, limit, type } = c.req.valid('query');

      const offset = (page - 1) * limit;

      // Build query
      let query = db.client
        .from('voice_sessions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (type) {
        query = query.eq('session_type', type);
      }

      const { data: sessions, count } = await query;

      return c.json({
        success: true,
        data: {
          sessions: sessions || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      voiceLogger.error('Failed to retrieve voice sessions', {
        userId: c.get('user')?.id,
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'SESSIONS_FETCH_FAILED',
          message: 'Failed to retrieve voice sessions',
        },
      } as ApiResponse, 500);
    }
  }
);

// Update voice session (e.g., end session, add summary)
voiceRoutes.put(
  '/session/:id',
  authenticateJWT,
  zValidator('param', z.object({
    id: z.string().uuid(),
  })),
  zValidator('json', z.object({
    session_end: z.string().datetime().optional(),
    conversation_summary: z.string().max(1000).optional(),
    user_satisfaction: z.number().int().min(1).max(5).optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { id } = c.req.valid('param');
      const updates = c.req.valid('json');

      // Check if session exists and belongs to user
      const session = await db.getVoiceSession(id, user.id);
      if (!session) {
        return c.json({
          success: false,
          error: {
            code: 'SESSION_NOT_FOUND',
            message: 'Voice session not found',
          },
        } as ApiResponse, 404);
      }

      // Calculate duration if session is ending
      let duration_seconds;
      if (updates.session_end && session.session_start) {
        const startTime = new Date(session.session_start).getTime();
        const endTime = new Date(updates.session_end).getTime();
        duration_seconds = Math.floor((endTime - startTime) / 1000);
      }

      // Update session
      const updatedSession = await db.updateVoiceSession(id, {
        ...updates,
        duration_seconds,
      });

      voiceLogger.info('Voice session updated', {
        userId: user.id,
        sessionId: id,
        updates: Object.keys(updates),
      });

      return c.json({
        success: true,
        data: { session: updatedSession },
        message: 'Session updated successfully',
      } as ApiResponse);
    } catch (error) {
      voiceLogger.error('Voice session update failed', {
        userId: c.get('user')?.id,
        sessionId: c.req.param('id'),
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'SESSION_UPDATE_FAILED',
          message: 'Failed to update voice session',
        },
      } as ApiResponse, 500);
    }
  }
);

// Helper function to handle emergency detection
async function handleEmergencyDetection(
  user: User,
  sessionId: string,
  emergencyDetection: any,
  transcript: string
): Promise<any> {
  try {
    // Create emergency record
    const emergency = await db.createEmergency({
      id: uuidv4(),
      user_id: user.id,
      session_id: sessionId,
      emergency_type: emergencyDetection.emergencyType,
      confidence_score: emergencyDetection.confidence,
      status: 'active',
      transcript,
      detected_keywords: emergencyDetection.keywords,
      context_data: {
        urgency_level: emergencyDetection.urgencyLevel,
        language: user.preferred_language,
      },
      response_actions: [],
      notified_contacts: [],
      emergency_services_notified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    emergencyLogger.error('Emergency detected and recorded', {
      emergencyId: emergency.id,
      userId: user.id,
      type: emergencyDetection.emergencyType,
      confidence: emergencyDetection.confidence,
      urgencyLevel: emergencyDetection.urgencyLevel,
    });

    // Notify emergency contacts via WhatsApp
    const emergencyContacts = user.emergency_contacts || [];
    if (emergencyContacts.length > 0) {
      const notificationResults = await WhatsAppService.sendEmergencyNotification(
        emergency,
        user,
        emergencyContacts
      );

      // Update emergency record with notification results
      await db.updateEmergency(emergency.id, {
        notified_contacts: notificationResults.map(result => ({
          contact_id: uuidv4(),
          name: result.contact.name,
          phone: result.contact.phone,
          notification_method: 'whatsapp',
          notified_at: new Date().toISOString(),
          delivery_status: result.success ? 'sent' : 'failed',
        })),
        response_actions: [
          {
            action_type: 'emergency_contacts_notified',
            target: 'whatsapp',
            executed_at: new Date().toISOString(),
            success: notificationResults.some(r => r.success),
            response_data: { results: notificationResults },
          },
        ],
      });
    }

    return {
      emergency_id: emergency.id,
      status: 'active',
      contacts_notified: emergencyContacts.length,
      message: 'Emergency response initiated. Your emergency contacts have been notified.',
      emergency_numbers: ['199', '123'], // Nigerian emergency numbers
    };
  } catch (error) {
    emergencyLogger.error('Failed to handle emergency detection', {
      userId: user.id,
      sessionId,
      error,
    });

    return {
      error: 'Failed to process emergency response',
      emergency_numbers: ['199', '123'],
    };
  }
}

export default voiceRoutes;
