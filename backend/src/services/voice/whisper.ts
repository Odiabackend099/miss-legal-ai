// Whisper Speech-to-Text Service for MISS Legal AI
import OpenAI from 'openai';
import { voiceLogger, logPerformance } from '@/utils/logger';
import { Language } from '@/types';

interface WhisperTranscriptionResult {
  text: string;
  language: string;
  confidence: number;
  duration: number;
  segments?: Array<{
    start: number;
    end: number;
    text: string;
    confidence: number;
  }>;
}

interface AudioStreamChunk {
  data: Buffer;
  timestamp: number;
  sequenceNumber: number;
}

export class WhisperService {
  private static readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  private static readonly SUPPORTED_FORMATS = ['webm', 'wav', 'mp3', 'm4a', 'ogg'];
  private static readonly MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB limit
  private static readonly CHUNK_DURATION_MS = 2000; // 2 seconds per chunk for streaming

  /**
   * Transcribe audio file using Whisper
   */
  static async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
    options: {
      language?: Language;
      prompt?: string;
      temperature?: number;
      timestamp_granularities?: ('word' | 'segment')[];
    } = {}
  ): Promise<WhisperTranscriptionResult> {
    const startTime = Date.now();

    try {
      // Validate audio size
      if (audioBuffer.length > this.MAX_AUDIO_SIZE) {
        throw new Error(`Audio file too large. Maximum size is ${this.MAX_AUDIO_SIZE / 1024 / 1024}MB`);
      }

      // Validate format
      const extension = filename.split('.').pop()?.toLowerCase();
      if (!extension || !this.SUPPORTED_FORMATS.includes(extension)) {
        throw new Error(`Unsupported audio format. Supported formats: ${this.SUPPORTED_FORMATS.join(', ')}`);
      }

      // Create file object for Whisper API
      const audioFile = new File([audioBuffer], filename, { 
        type: this.getAudioMimeType(extension) 
      });

      // Configure transcription parameters
      const transcriptionParams: any = {
        file: audioFile,
        model: 'whisper-1',
        response_format: 'verbose_json',
        timestamp_granularities: options.timestamp_granularities || ['word', 'segment'],
      };

      // Add language hint if provided
      if (options.language) {
        transcriptionParams.language = this.mapLanguageToWhisperCode(options.language);
      }

      // Add prompt for better accuracy
      if (options.prompt) {
        transcriptionParams.prompt = options.prompt;
      }

      // Set temperature for creativity control
      if (options.temperature !== undefined) {
        transcriptionParams.temperature = Math.max(0, Math.min(1, options.temperature));
      }

      // Call Whisper API
      const response = await this.openai.audio.transcriptions.create(transcriptionParams);

      const duration = Date.now() - startTime;
      const confidence = this.calculateConfidence(response);

      logPerformance('Whisper transcription', duration, {
        audioSize: audioBuffer.length,
        textLength: response.text.length,
        language: response.language,
        confidence,
      });

      voiceLogger.info('Audio transcribed successfully', {
        filename,
        audioSize: audioBuffer.length,
        textLength: response.text.length,
        language: response.language,
        duration: `${duration}ms`,
        confidence,
      });

      return {
        text: response.text,
        language: this.mapWhisperCodeToLanguage(response.language),
        confidence,
        duration,
        segments: response.segments?.map(segment => ({
          start: segment.start,
          end: segment.end,
          text: segment.text,
          confidence: segment.avg_logprob ? Math.exp(segment.avg_logprob) : 0.8,
        })),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      voiceLogger.error('Whisper transcription failed', {
        filename,
        audioSize: audioBuffer.length,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Stream transcription for real-time processing
   */
  static async transcribeStream(
    audioChunks: AudioStreamChunk[],
    options: {
      language?: Language;
      sessionId: string;
      userId: string;
    }
  ): Promise<{
    transcription: string;
    confidence: number;
    language: string;
    isComplete: boolean;
  }> {
    try {
      // Combine audio chunks into a single buffer
      const combinedBuffer = Buffer.concat(audioChunks.map(chunk => chunk.data));
      
      // Create temporary filename with timestamp
      const timestamp = Date.now();
      const filename = `stream_${options.sessionId}_${timestamp}.webm`;

      // Transcribe combined audio
      const result = await this.transcribeAudio(combinedBuffer, filename, {
        language: options.language,
        prompt: this.getContextualPrompt(options.language),
        temperature: 0.2, // Lower temperature for more consistent results
      });

      voiceLogger.info('Stream transcription completed', {
        sessionId: options.sessionId,
        userId: options.userId,
        chunksCount: audioChunks.length,
        combinedSize: combinedBuffer.length,
        textLength: result.text.length,
      });

      return {
        transcription: result.text,
        confidence: result.confidence,
        language: result.language,
        isComplete: true,
      };
    } catch (error) {
      voiceLogger.error('Stream transcription failed', {
        sessionId: options.sessionId,
        userId: options.userId,
        chunksCount: audioChunks.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        transcription: '',
        confidence: 0,
        language: options.language || 'english',
        isComplete: false,
      };
    }
  }

  /**
   * Detect language from audio
   */
  static async detectLanguage(audioBuffer: Buffer, filename: string): Promise<{
    language: Language;
    confidence: number;
  }> {
    try {
      const result = await this.transcribeAudio(audioBuffer, filename, {
        temperature: 0, // Most deterministic for language detection
      });

      return {
        language: result.language as Language,
        confidence: result.confidence,
      };
    } catch (error) {
      voiceLogger.error('Language detection failed', {
        filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return default language
      return {
        language: 'english',
        confidence: 0.5,
      };
    }
  }

  /**
   * Enhanced transcription with Nigerian context
   */
  static async transcribeWithNigerianContext(
    audioBuffer: Buffer,
    filename: string,
    options: {
      language?: Language;
      userLocation?: string;
      conversationHistory?: string[];
    } = {}
  ): Promise<WhisperTranscriptionResult> {
    // Create contextual prompt for Nigerian legal context
    const contextPrompt = this.buildNigerianContextPrompt(options);

    return this.transcribeAudio(audioBuffer, filename, {
      language: options.language,
      prompt: contextPrompt,
      temperature: 0.3,
      timestamp_granularities: ['word', 'segment'],
    });
  }

  /**
   * Quality assessment for transcription
   */
  static assessTranscriptionQuality(result: WhisperTranscriptionResult): {
    overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    factors: {
      confidence: number;
      textLength: number;
      segmentConsistency: number;
      languageDetection: number;
    };
    recommendations: string[];
  } {
    const factors = {
      confidence: result.confidence,
      textLength: Math.min(result.text.length / 100, 1), // Normalize to 0-1
      segmentConsistency: this.calculateSegmentConsistency(result.segments || []),
      languageDetection: result.language !== 'english' ? 0.9 : 1.0,
    };

    const averageScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / Object.keys(factors).length;

    let overallQuality: 'excellent' | 'good' | 'fair' | 'poor';
    if (averageScore >= 0.8) overallQuality = 'excellent';
    else if (averageScore >= 0.6) overallQuality = 'good';
    else if (averageScore >= 0.4) overallQuality = 'fair';
    else overallQuality = 'poor';

    const recommendations: string[] = [];
    if (factors.confidence < 0.7) recommendations.push('Consider recording in a quieter environment');
    if (factors.textLength < 0.3) recommendations.push('Speak for longer periods for better context');
    if (factors.segmentConsistency < 0.6) recommendations.push('Try to speak more clearly and consistently');

    return {
      overallQuality,
      factors,
      recommendations,
    };
  }

  // Private helper methods
  private static getAudioMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      'webm': 'audio/webm',
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'm4a': 'audio/m4a',
      'ogg': 'audio/ogg',
    };
    return mimeTypes[extension] || 'audio/wav';
  }

  private static mapLanguageToWhisperCode(language: Language): string {
    const languageMap: Record<Language, string> = {
      'english': 'en',
      'pidgin': 'en', // Closest to English
      'yoruba': 'yo',
      'hausa': 'ha',
      'igbo': 'ig',
    };
    return languageMap[language] || 'en';
  }

  private static mapWhisperCodeToLanguage(whisperCode: string): Language {
    const codeMap: Record<string, Language> = {
      'en': 'english',
      'yo': 'yoruba',
      'ha': 'hausa',
      'ig': 'igbo',
    };
    return codeMap[whisperCode] || 'english';
  }

  private static calculateConfidence(response: any): number {
    // Calculate confidence based on Whisper's log probabilities
    if (response.segments && response.segments.length > 0) {
      const avgLogProb = response.segments.reduce((sum: number, segment: any) => 
        sum + (segment.avg_logprob || -1), 0) / response.segments.length;
      
      // Convert log probability to confidence score (0-1)
      return Math.max(0, Math.min(1, Math.exp(avgLogProb)));
    }
    
    // Default confidence if no segments available
    return 0.85;
  }

  private static calculateSegmentConsistency(segments: any[]): number {
    if (segments.length === 0) return 1.0;

    const confidences = segments.map(s => s.confidence || 0.8);
    const mean = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
    const variance = confidences.reduce((sum, conf) => sum + Math.pow(conf - mean, 2), 0) / confidences.length;
    
    // Lower variance means higher consistency
    return Math.max(0, 1 - variance);
  }

  private static getContextualPrompt(language?: Language): string {
    const prompts: Record<string, string> = {
      'english': 'Legal conversation, Nigerian context, formal language, legal terms',
      'pidgin': 'Nigerian pidgin English, legal matter, formal but conversational',
      'yoruba': 'Yoruba language, Nigerian legal context, traditional greetings',
      'hausa': 'Hausa language, Northern Nigeria, legal discussion, respectful tone',
      'igbo': 'Igbo language, Eastern Nigeria, legal conversation, cultural context',
    };

    return prompts[language || 'english'] || prompts.english;
  }

  private static buildNigerianContextPrompt(options: {
    language?: Language;
    userLocation?: string;
    conversationHistory?: string[];
  }): string {
    let prompt = 'Nigerian legal assistant conversation. ';
    
    if (options.language) {
      prompt += `Language: ${options.language}. `;
    }
    
    if (options.userLocation) {
      prompt += `Location: ${options.userLocation}. `;
    }
    
    if (options.conversationHistory && options.conversationHistory.length > 0) {
      const recentContext = options.conversationHistory.slice(-3).join(' ');
      prompt += `Previous context: ${recentContext.substring(0, 100)}. `;
    }
    
    prompt += 'Legal terms, Nigerian law, formal but conversational tone.';
    
    return prompt;
  }
}

export default WhisperService;
