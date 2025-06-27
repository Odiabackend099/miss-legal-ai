// ElevenLabs Text-to-Speech Service for MISS Legal AI
import axios, { AxiosInstance } from 'axios';
import { voiceLogger, logPerformance } from '@/utils/logger';
import { Language } from '@/types';

interface VoiceSettings {
  stability: number;
  similarity_boost: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface TTSOptions {
  voice_id: string;
  text: string;
  voice_settings?: VoiceSettings;
  model_id?: string;
  language_code?: string;
  output_format?: 'mp3_22050_32' | 'mp3_44100_64' | 'mp3_44100_96' | 'mp3_44100_128' | 'mp3_44100_192' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
}

interface StreamingTTSOptions extends TTSOptions {
  chunk_length_schedule?: number[];
}

interface VoiceProfile {
  voice_id: string;
  name: string;
  description: string;
  language: Language;
  gender: 'female' | 'male';
  accent: string;
  settings: VoiceSettings;
}

export class ElevenLabsService {
  private static readonly API_KEY = process.env.ELEVENLABS_API_KEY;
  private static readonly BASE_URL = 'https://api.elevenlabs.io/v1';
  private static client: AxiosInstance;

  // Minnie Max voice profiles for different languages and contexts
  private static readonly VOICE_PROFILES: Record<string, VoiceProfile> = {
    'minnie_max_english': {
      voice_id: 'pNInz6obpgDQGcFmaJgB', // ElevenLabs voice ID
      name: 'Minnie Max - English',
      description: 'Professional Nigerian female voice for legal assistance',
      language: 'english',
      gender: 'female',
      accent: 'Nigerian',
      settings: {
        stability: 0.75,
        similarity_boost: 0.85,
        style: 0.2,
        use_speaker_boost: true,
      },
    },
    'minnie_max_emergency': {
      voice_id: 'ErXwobaYiN019PkySvjV', // More urgent voice
      name: 'Minnie Max - Emergency',
      description: 'Urgent, clear voice for emergency situations',
      language: 'english',
      gender: 'female',
      accent: 'Nigerian',
      settings: {
        stability: 0.85,
        similarity_boost: 0.90,
        style: 0.4,
        use_speaker_boost: true,
      },
    },
    'minnie_max_pidgin': {
      voice_id: 'AZnzlk1XvdvUeBnXmlld', // Nigerian Pidgin voice
      name: 'Minnie Max - Pidgin',
      description: 'Friendly Nigerian Pidgin voice',
      language: 'pidgin',
      gender: 'female',
      accent: 'Nigerian',
      settings: {
        stability: 0.70,
        similarity_boost: 0.80,
        style: 0.3,
        use_speaker_boost: true,
      },
    },
  };

  static {
    if (!this.API_KEY) {
      voiceLogger.warn('ElevenLabs API key not configured. TTS will be disabled.');
    }

    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'xi-api-key': this.API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      voiceLogger.debug('ElevenLabs API request', {
        method: config.method,
        url: config.url,
      });
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        voiceLogger.debug('ElevenLabs API response', {
          status: response.status,
          contentLength: response.headers['content-length'],
        });
        return response;
      },
      (error) => {
        voiceLogger.error('ElevenLabs API error', {
          status: error.response?.status,
          error: error.response?.data || error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Generate speech from text using appropriate Minnie Max voice
   */
  static async synthesizeSpeech(
    text: string,
    options: {
      language?: Language;
      context?: 'normal' | 'emergency' | 'legal' | 'friendly';
      userId?: string;
      sessionId?: string;
      emotion?: 'neutral' | 'concerned' | 'professional' | 'warm';
      speed?: number; // 0.5 to 2.0
    } = {}
  ): Promise<{
    audioBuffer: Buffer;
    audioUrl?: string;
    duration: number;
    voiceUsed: string;
    quality: 'high' | 'medium' | 'low';
  }> {
    const startTime = Date.now();

    try {
      if (!this.API_KEY) {
        throw new Error('ElevenLabs API key not configured');
      }

      // Select appropriate voice profile
      const voiceProfile = this.selectVoiceProfile(options.language, options.context);
      
      // Optimize text for TTS
      const optimizedText = this.optimizeTextForTTS(text, options.language);
      
      // Adjust voice settings based on context and emotion
      const voiceSettings = this.adjustVoiceSettings(voiceProfile.settings, options);

      // Prepare TTS options
      const ttsOptions: TTSOptions = {
        voice_id: voiceProfile.voice_id,
        text: optimizedText,
        voice_settings: voiceSettings,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128', // Good quality for mobile
      };

      // Generate speech
      const response = await this.client.post(`/text-to-speech/${voiceProfile.voice_id}`, {
        text: ttsOptions.text,
        voice_settings: ttsOptions.voice_settings,
        model_id: ttsOptions.model_id,
      }, {
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'audio/mpeg',
        },
      });

      const audioBuffer = Buffer.from(response.data);
      const duration = Date.now() - startTime;

      // Estimate audio duration (rough calculation)
      const estimatedAudioDuration = this.estimateAudioDuration(optimizedText);

      logPerformance('ElevenLabs TTS', duration, {
        textLength: optimizedText.length,
        audioSize: audioBuffer.length,
        voiceId: voiceProfile.voice_id,
        language: options.language || 'english',
      });

      voiceLogger.info('Speech synthesized successfully', {
        userId: options.userId,
        sessionId: options.sessionId,
        textLength: optimizedText.length,
        audioSize: audioBuffer.length,
        voiceProfile: voiceProfile.name,
        context: options.context,
        duration: `${duration}ms`,
      });

      return {
        audioBuffer,
        duration: estimatedAudioDuration,
        voiceUsed: voiceProfile.name,
        quality: this.determineAudioQuality(audioBuffer.length, optimizedText.length),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      voiceLogger.error('Speech synthesis failed', {
        userId: options.userId,
        sessionId: options.sessionId,
        textLength: text.length,
        duration: `${duration}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return fallback empty audio
      return {
        audioBuffer: Buffer.alloc(0),
        duration: 0,
        voiceUsed: 'fallback',
        quality: 'low',
      };
    }
  }

  /**
   * Stream TTS for real-time conversation
   */
  static async synthesizeStreamingSpeech(
    text: string,
    options: {
      language?: Language;
      context?: 'normal' | 'emergency' | 'legal' | 'friendly';
      userId?: string;
      sessionId?: string;
      onChunk?: (chunk: Buffer) => void;
    } = {}
  ): Promise<{
    audioStream: Buffer[];
    totalDuration: number;
    voiceUsed: string;
  }> {
    try {
      if (!this.API_KEY) {
        throw new Error('ElevenLabs API key not configured');
      }

      const voiceProfile = this.selectVoiceProfile(options.language, options.context);
      const optimizedText = this.optimizeTextForTTS(text, options.language);
      const voiceSettings = this.adjustVoiceSettings(voiceProfile.settings, options);

      const streamingOptions: StreamingTTSOptions = {
        voice_id: voiceProfile.voice_id,
        text: optimizedText,
        voice_settings: voiceSettings,
        model_id: 'eleven_multilingual_v2',
        output_format: 'mp3_44100_128',
        chunk_length_schedule: [120, 160, 250, 290], // Optimize for streaming
      };

      const response = await this.client.post(
        `/text-to-speech/${voiceProfile.voice_id}/stream`,
        streamingOptions,
        {
          responseType: 'stream',
          headers: {
            'Accept': 'audio/mpeg',
          },
        }
      );

      const audioChunks: Buffer[] = [];
      let totalSize = 0;

      return new Promise((resolve, reject) => {
        response.data.on('data', (chunk: Buffer) => {
          audioChunks.push(chunk);
          totalSize += chunk.length;
          
          // Call chunk callback if provided
          if (options.onChunk) {
            options.onChunk(chunk);
          }
        });

        response.data.on('end', () => {
          const totalDuration = this.estimateAudioDuration(optimizedText);
          
          voiceLogger.info('Streaming TTS completed', {
            userId: options.userId,
            sessionId: options.sessionId,
            textLength: optimizedText.length,
            totalSize,
            chunksCount: audioChunks.length,
            voiceProfile: voiceProfile.name,
          });

          resolve({
            audioStream: audioChunks,
            totalDuration,
            voiceUsed: voiceProfile.name,
          });
        });

        response.data.on('error', (error: Error) => {
          voiceLogger.error('Streaming TTS failed', {
            userId: options.userId,
            sessionId: options.sessionId,
            error: error.message,
          });
          reject(error);
        });
      });
    } catch (error) {
      voiceLogger.error('Streaming TTS initialization failed', {
        userId: options.userId,
        sessionId: options.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Generate speech with emotional context for emergencies
   */
  static async synthesizeEmergencyResponse(
    text: string,
    options: {
      urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
      userId: string;
      sessionId: string;
      emergencyType?: string;
    }
  ): Promise<{
    audioBuffer: Buffer;
    duration: number;
    voiceUsed: string;
  }> {
    // Add urgency markers to text for better emotional delivery
    const urgencyText = this.addEmergencyUrgencyToText(text, options.urgencyLevel);

    return this.synthesizeSpeech(urgencyText, {
      language: 'english',
      context: 'emergency',
      userId: options.userId,
      sessionId: options.sessionId,
      emotion: options.urgencyLevel === 'critical' ? 'concerned' : 'professional',
    });
  }

  /**
   * Get available voices for different languages
   */
  static async getAvailableVoices(): Promise<VoiceProfile[]> {
    try {
      const response = await this.client.get('/voices');
      
      // Filter and map to our voice profiles
      const availableVoices = response.data.voices
        .filter((voice: any) => voice.category === 'premade')
        .map((voice: any) => ({
          voice_id: voice.voice_id,
          name: voice.name,
          description: voice.description || '',
          language: 'english' as Language, // Default, would need language detection
          gender: voice.labels?.gender || 'female',
          accent: voice.labels?.accent || 'American',
          settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            style: 0.2,
            use_speaker_boost: true,
          },
        }));

      return [...Object.values(this.VOICE_PROFILES), ...availableVoices];
    } catch (error) {
      voiceLogger.error('Failed to get available voices', { error });
      return Object.values(this.VOICE_PROFILES);
    }
  }

  /**
   * Clone voice for custom Minnie Max profiles (Premium feature)
   */
  static async cloneVoiceProfile(
    name: string,
    description: string,
    audioSamples: Buffer[],
    options: {
      language: Language;
      accent: string;
    }
  ): Promise<VoiceProfile> {
    try {
      // This would implement ElevenLabs voice cloning
      // For now, return a mock profile
      const voiceProfile: VoiceProfile = {
        voice_id: `custom_${Date.now()}`,
        name,
        description,
        language: options.language,
        gender: 'female',
        accent: options.accent,
        settings: {
          stability: 0.75,
          similarity_boost: 0.85,
          style: 0.2,
          use_speaker_boost: true,
        },
      };

      voiceLogger.info('Voice profile cloned', {
        name,
        language: options.language,
        accent: options.accent,
        samplesCount: audioSamples.length,
      });

      return voiceProfile;
    } catch (error) {
      voiceLogger.error('Voice cloning failed', { error, name });
      throw error;
    }
  }

  // Private helper methods
  private static selectVoiceProfile(language?: Language, context?: string): VoiceProfile {
    // Select voice based on context and language
    if (context === 'emergency') {
      return this.VOICE_PROFILES.minnie_max_emergency;
    }
    
    if (language === 'pidgin') {
      return this.VOICE_PROFILES.minnie_max_pidgin;
    }

    // Default to English Minnie Max
    return this.VOICE_PROFILES.minnie_max_english;
  }

  private static optimizeTextForTTS(text: string, language?: Language): string {
    let optimizedText = text;

    // Remove excessive punctuation
    optimizedText = optimizedText.replace(/[.]{2,}/g, '.');
    optimizedText = optimizedText.replace(/[!]{2,}/g, '!');
    optimizedText = optimizedText.replace(/[?]{2,}/g, '?');

    // Add pauses for better speech flow
    optimizedText = optimizedText.replace(/\. /g, '. <break time="0.5s"/> ');
    optimizedText = optimizedText.replace(/! /g, '! <break time="0.3s"/> ');
    optimizedText = optimizedText.replace(/\? /g, '? <break time="0.4s"/> ');

    // Handle Nigerian expressions and terms
    if (language === 'pidgin') {
      optimizedText = this.optimizePidginText(optimizedText);
    }

    // Ensure text length is within limits (2500 characters for ElevenLabs)
    if (optimizedText.length > 2500) {
      optimizedText = optimizedText.substring(0, 2497) + '...';
    }

    return optimizedText;
  }

  private static optimizePidginText(text: string): string {
    // Optimize Nigerian Pidgin for better pronunciation
    const pidginOptimizations: Record<string, string> = {
      'wetin': 'what tin',
      'wahala': 'wa-ha-la',
      'oya': 'oh-ya',
      'abeg': 'ah-beg',
      'dey': 'day',
      'make': 'ma-ke',
      'sabi': 'sa-bi',
    };

    let optimized = text;
    Object.entries(pidginOptimizations).forEach(([pidgin, pronunciation]) => {
      const regex = new RegExp(`\\b${pidgin}\\b`, 'gi');
      optimized = optimized.replace(regex, pronunciation);
    });

    return optimized;
  }

  private static adjustVoiceSettings(
    baseSettings: VoiceSettings,
    options: {
      context?: string;
      emotion?: string;
      speed?: number;
    }
  ): VoiceSettings {
    const adjusted = { ...baseSettings };

    // Adjust based on context
    if (options.context === 'emergency') {
      adjusted.stability = Math.min(0.95, adjusted.stability + 0.1);
      adjusted.similarity_boost = Math.min(0.95, adjusted.similarity_boost + 0.05);
    }

    // Adjust based on emotion
    if (options.emotion === 'concerned') {
      adjusted.style = Math.min(1.0, (adjusted.style || 0.2) + 0.2);
    } else if (options.emotion === 'warm') {
      adjusted.style = Math.max(0.0, (adjusted.style || 0.2) - 0.1);
    }

    return adjusted;
  }

  private static estimateAudioDuration(text: string): number {
    // Rough estimation: average speaking rate is about 150 words per minute
    const words = text.split(/\s+/).length;
    const wordsPerSecond = 150 / 60; // 2.5 words per second
    return Math.ceil((words / wordsPerSecond) * 1000); // Return in milliseconds
  }

  private static determineAudioQuality(audioSize: number, textLength: number): 'high' | 'medium' | 'low' {
    const bytesPerCharacter = audioSize / textLength;
    
    if (bytesPerCharacter > 1000) return 'high';
    if (bytesPerCharacter > 500) return 'medium';
    return 'low';
  }

  private static addEmergencyUrgencyToText(text: string, urgencyLevel: string): string {
    const urgencyPrefixes: Record<string, string> = {
      'low': '',
      'medium': '<emphasis level="moderate">',
      'high': '<emphasis level="strong">',
      'critical': '<emphasis level="strong"><prosody rate="fast">',
    };

    const urgencySuffixes: Record<string, string> = {
      'low': '',
      'medium': '</emphasis>',
      'high': '</emphasis>',
      'critical': '</prosody></emphasis>',
    };

    const prefix = urgencyPrefixes[urgencyLevel] || '';
    const suffix = urgencySuffixes[urgencyLevel] || '';

    return `${prefix}${text}${suffix}`;
  }
}

export default ElevenLabsService;
