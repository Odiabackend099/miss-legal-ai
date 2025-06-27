// Emergency Detection Service for MISS Legal AI
import { voiceLogger, emergencyLogger } from '@/utils/logger';
import { EmergencyType, Language } from '@/types';
import { WhisperService } from '@/services/voice/whisper';
import { ConversationService } from '@/services/ai/conversation';

interface EmergencyDetectionResult {
  isEmergency: boolean;
  type?: EmergencyType;
  confidence: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  keywords: string[];
  audioFeatures?: {
    volume: number;
    pitch: number;
    speechRate: number;
    stressIndicators: number;
  };
  textFeatures?: {
    urgentWords: string[];
    emotionalTone: 'calm' | 'stressed' | 'panicked' | 'angry';
    coherence: number;
  };
  multimodalScore: number;
  recommendation: 'ignore' | 'monitor' | 'alert' | 'immediate_response';
}

interface AudioFeatures {
  volume: number;
  pitch: number;
  speechRate: number;
  silenceRatio: number;
  voiceQuality: number;
}

export class EmergencyDetectionService {
  // Nigerian-specific emergency keywords and phrases
  private static readonly EMERGENCY_PATTERNS = {
    medical: {
      english: [
        'help me', 'emergency', 'hospital', 'doctor', 'sick', 'pain', 'injury', 'bleeding',
        'unconscious', 'heart attack', 'stroke', 'accident', 'ambulance', 'dying', 'breathe'
      ],
      pidgin: [
        'help me', 'emergency', 'hospital', 'dokita', 'sick', 'pain', 'injury', 'blood dey comot',
        'person don faint', 'heart attack', 'accident', 'ambulance', 'person dey die', 'no fit breathe'
      ],
      yoruba: [
        'egba mi', 'emergency', 'ile iwosan', 'dokita', 'aisan', 'irora', 'ipalara', 'eje n jade',
        'ti daku', 'ikun ti dun', 'accident', 'ambulance', 'n ku', 'ko le mi'
      ],
      hausa: [
        'taimake ni', 'emergency', 'asibiti', 'likita', 'ciwo', 'zafi', 'rauni', 'jini yana fitowa',
        'ya suma', 'bugun zuciya', 'accident', 'ambulance', 'yana mutuwa', 'ba ya numfashi'
      ],
      igbo: [
        'nyere m aka', 'emergency', 'ulo ogwu', 'dibia', 'oria', 'ihe mgbu', 'mmebi', 'obara na apu',
        'adala', 'nkuku obi', 'accident', 'ambulance', 'na anwu', 'enweghị iku ume'
      ],
    },
    security: {
      english: [
        'thief', 'robbery', 'stolen', 'attack', 'threat', 'gun', 'knife', 'kidnap', 'danger',
        'rape', 'assault', 'break in', 'burglar', 'armed robber', 'help police'
      ],
      pidgin: [
        'tiff', 'robbery', 'steal', 'attack', 'threat', 'gun', 'knife', 'kidnap', 'danger',
        'rape', 'beat', 'break house', 'ole', 'armed robber', 'call police'
      ],
      yoruba: [
        'ole', 'ole ja mi', 'ji mi', 'kolu', 'ihaleru', 'ibon', 'obe', 'gbe mi lo', 'ewu',
        'fi ipa ba', 'kolu', 'wo ile', 'ole', 'ologun ole', 'pe ologun'
      ],
      hausa: [
        'barawo', 'fashi', 'sata', 'hari', 'barazana', 'bindiga', 'wuka', 'sace', 'hadari',
        'fyade', 'duka', 'shiga gida', 'barawo', 'makami barawo', 'kira yan sanda'
      ],
      igbo: [
        'onye ohi', 'ihi aka', 'zuru', 'wakpo', 'egwu', 'egbe', 'mma', 'toro', 'ize ndụ',
        'mmetọ', 'iti aka', 'banye ulo', 'onye ohi', 'onye ohi egbe', 'kpoo ndi uwe ojii'
      ],
    },
    fire: {
      english: [
        'fire', 'burning', 'smoke', 'flames', 'explosion', 'gas leak', 'burning building',
        'fire brigade', 'extinguisher', 'evacuation', 'trapped', 'burn'
      ],
      pidgin: [
        'fire', 'dey burn', 'smoke', 'flame', 'explosion', 'gas leak', 'house dey burn',
        'fire service', 'fire extinguisher', 'evacuation', 'trap', 'burn'
      ],
      yoruba: [
        'ina', 'n jo', 'eefin', 'ina', 'bugbamu', 'gas ti tu', 'ile n jo',
        'elegbe ina', 'epo ina', 'sa jade', 'di mo', 'jo'
      ],
      hausa: [
        'wuta', 'yana kone', 'hayaki', 'wuta', 'fashewa', 'gas ya fita', 'gida yana kone',
        'ma kashe wuta', 'kashe wuta', 'ficewa', 'makale', 'kone'
      ],
      igbo: [
        'oku', 'na ere', 'anwuru', 'oku', 'mgbawa', 'gas gbapuru', 'ulo na ere',
        'ndi mgba oku', 'ihe mgba oku', 'gbapuru', 'kpuchiri', 'gbaa'
      ],
    },
    domestic_violence: {
      english: [
        'abuse', 'violence', 'beating', 'hurt', 'threatened', 'scared', 'domestic violence',
        'hit me', 'bruise', 'family violence', 'spouse abuse', 'child abuse'
      ],
      pidgin: [
        'abuse', 'violence', 'dey beat', 'hurt', 'threaten', 'fear', 'house violence',
        'hit me', 'wound', 'family violence', 'husband abuse', 'pikin abuse'
      ],
      yoruba: [
        'iwa ika', 'wahala', 'na', 'se mi lese', 'haleru', 'beru', 'wahala ile',
        'na mi', 'gbe', 'wahala ebi', 'oko na', 'omo abuse'
      ],
      hausa: [
        'zalunci', 'tashin hankali', 'duka', 'cutar', 'barazana', 'tsoro', 'tashin hankalin gida',
        'buga ni', 'rauni', 'tashin hankalin iyali', 'miji zalunci', 'yaro zalunci'
      ],
      igbo: [
        'mmegbu', 'ime ihe ike', 'iti', 'mebiri', 'yi egwu', 'ụjọ', 'ime ihe ike uno',
        'tie m', 'ọnya', 'ime ihe ike ezinụlọ', 'di mmegbu', 'nwata mmegbu'
      ],
    },
    legal: {
      english: [
        'arrest', 'police', 'court', 'lawyer needed', 'legal help', 'detained', 'warrant',
        'rights violated', 'false accusation', 'urgent legal', 'bail', 'custody'
      ],
      pidgin: [
        'arrest', 'police', 'court', 'need lawyer', 'legal help', 'detain', 'warrant',
        'rights violate', 'false accusation', 'urgent legal', 'bail', 'custody'
      ],
      yoruba: [
        'mu', 'ologun', 'ile ejo', 'gbodo lawyer', 'iranlowo legal', 'fa mo', 'iwe ase',
        'eto ti ru', 'ebi eke', 'kiakia legal', 'bail', 'asotito'
      ],
      hausa: [
        'kama', 'yan sanda', 'kotu', 'bukatar lauya', 'taimakon shari\'a', 'tsare', 'sammaci',
        'hakki sun karya', 'zarge karya', 'gaggawan shari\'a', 'beli', 'hannun shari\'a'
      ],
      igbo: [
        'jide', 'ndi uwe ojii', 'ụlọ ikpe', 'chọrọ ọkàikpe', 'enyemaka iwu', 'jigide', 'akwụkwọ ikpe',
        'ikike mebiri', 'ebubo ụgha', 'iwu ngwa ngwa', 'mgbapụta', 'njigide'
      ],
    },
  };

  // Audio pattern indicators for stress and urgency
  private static readonly STRESS_INDICATORS = {
    highPitch: { threshold: 300, weight: 0.3 },
    fastSpeech: { threshold: 180, weight: 0.25 }, // words per minute
    loudVolume: { threshold: 0.8, weight: 0.2 },
    irregularPauses: { threshold: 0.4, weight: 0.15 },
    voiceShaking: { threshold: 0.3, weight: 0.1 },
  };

  /**
   * Main emergency detection function with multimodal analysis
   */
  static async detectEmergency(
    audioBuffer: Buffer,
    filename: string,
    options: {
      sessionId: string;
      userId: string;
      language?: Language;
      location?: { latitude: number; longitude: number; address: string };
    }
  ): Promise<EmergencyDetectionResult> {
    const startTime = Date.now();

    try {
      // Step 1: Audio feature extraction
      const audioFeatures = await this.extractAudioFeatures(audioBuffer);

      // Step 2: Speech-to-text transcription
      const transcription = await WhisperService.transcribeWithNigerianContext(
        audioBuffer,
        filename,
        { language: options.language }
      );

      // Step 3: Text-based emergency detection
      const textDetection = await this.detectEmergencyFromText(
        transcription.text,
        options.language || 'english'
      );

      // Step 4: Audio-based stress detection
      const audioStressScore = this.calculateAudioStressScore(audioFeatures);

      // Step 5: Multimodal fusion
      const multimodalResult = this.fuseMultimodalEvidence(
        textDetection,
        audioStressScore,
        audioFeatures
      );

      const processingTime = Date.now() - startTime;

      emergencyLogger.info('Emergency detection completed', {
        sessionId: options.sessionId,
        userId: options.userId,
        isEmergency: multimodalResult.isEmergency,
        confidence: multimodalResult.confidence,
        type: multimodalResult.type,
        processingTime: `${processingTime}ms`,
        textLength: transcription.text.length,
      });

      return multimodalResult;
    } catch (error) {
      emergencyLogger.error('Emergency detection failed', {
        sessionId: options.sessionId,
        userId: options.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return safe fallback
      return {
        isEmergency: false,
        confidence: 0,
        urgencyLevel: 'low',
        keywords: [],
        multimodalScore: 0,
        recommendation: 'ignore',
      };
    }
  }

  /**
   * Real-time streaming emergency detection
   */
  static async detectEmergencyFromStream(
    audioChunks: Buffer[],
    partialTranscription: string,
    options: {
      sessionId: string;
      userId: string;
      language?: Language;
    }
  ): Promise<{
    isEmergency: boolean;
    confidence: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    shouldTriggerAlert: boolean;
  }> {
    try {
      // Quick text-based detection for immediate response
      const textDetection = await this.detectEmergencyFromText(
        partialTranscription,
        options.language || 'english'
      );

      // Simple audio analysis for streaming
      const combinedAudio = Buffer.concat(audioChunks);
      const quickAudioFeatures = await this.quickAudioAnalysis(combinedAudio);

      const streamingConfidence = this.calculateStreamingConfidence(
        textDetection,
        quickAudioFeatures
      );

      const shouldTriggerAlert = streamingConfidence.confidence > 0.7 && 
                                textDetection.isEmergency;

      voiceLogger.info('Streaming emergency detection', {
        sessionId: options.sessionId,
        isEmergency: textDetection.isEmergency,
        confidence: streamingConfidence.confidence,
        shouldTrigger: shouldTriggerAlert,
      });

      return {
        isEmergency: textDetection.isEmergency,
        confidence: streamingConfidence.confidence,
        urgencyLevel: streamingConfidence.urgencyLevel,
        shouldTriggerAlert,
      };
    } catch (error) {
      voiceLogger.error('Streaming emergency detection failed', {
        sessionId: options.sessionId,
        error,
      });

      return {
        isEmergency: false,
        confidence: 0,
        urgencyLevel: 'low',
        shouldTriggerAlert: false,
      };
    }
  }

  /**
   * Extract audio features for stress and urgency detection
   */
  private static async extractAudioFeatures(audioBuffer: Buffer): Promise<AudioFeatures> {
    try {
      // Basic audio feature extraction (would use audio processing library in production)
      const sampleRate = 16000; // Assuming 16kHz
      const duration = audioBuffer.length / (sampleRate * 2); // 16-bit audio
      
      // Simplified feature extraction
      const features: AudioFeatures = {
        volume: this.calculateVolume(audioBuffer),
        pitch: this.estimatePitch(audioBuffer, sampleRate),
        speechRate: this.estimateSpeechRate(audioBuffer, duration),
        silenceRatio: this.calculateSilenceRatio(audioBuffer),
        voiceQuality: this.assessVoiceQuality(audioBuffer),
      };

      return features;
    } catch (error) {
      voiceLogger.error('Audio feature extraction failed', { error });
      
      // Return default features
      return {
        volume: 0.5,
        pitch: 150,
        speechRate: 120,
        silenceRatio: 0.2,
        voiceQuality: 0.7,
      };
    }
  }

  /**
   * Detect emergency patterns from text using Nigerian context
   */
  private static async detectEmergencyFromText(
    text: string,
    language: Language
  ): Promise<{
    isEmergency: boolean;
    type?: EmergencyType;
    confidence: number;
    keywords: string[];
    emotionalTone: 'calm' | 'stressed' | 'panicked' | 'angry';
  }> {
    const normalizedText = text.toLowerCase().trim();
    const words = normalizedText.split(/\s+/);

    let maxConfidence = 0;
    let detectedType: EmergencyType | undefined;
    let allMatchedKeywords: string[] = [];

    // Check each emergency type
    Object.entries(this.EMERGENCY_PATTERNS).forEach(([type, patterns]) => {
      const languagePatterns = patterns[language] || patterns.english;
      const matchedKeywords: string[] = [];

      languagePatterns.forEach(pattern => {
        if (normalizedText.includes(pattern.toLowerCase())) {
          matchedKeywords.push(pattern);
        }
      });

      if (matchedKeywords.length > 0) {
        // Calculate confidence based on keyword matches and context
        const keywordScore = matchedKeywords.length * 0.3;
        const contextScore = this.analyzeEmergencyContext(normalizedText, type as EmergencyType);
        const urgencyScore = this.analyzeUrgencyIndicators(normalizedText);
        
        const typeConfidence = Math.min(
          keywordScore + contextScore + urgencyScore,
          1.0
        );

        if (typeConfidence > maxConfidence) {
          maxConfidence = typeConfidence;
          detectedType = type as EmergencyType;
          allMatchedKeywords = matchedKeywords;
        }
      }
    });

    // Analyze emotional tone
    const emotionalTone = this.analyzeEmotionalTone(normalizedText);

    return {
      isEmergency: maxConfidence > 0.3,
      type: detectedType,
      confidence: maxConfidence,
      keywords: allMatchedKeywords,
      emotionalTone,
    };
  }

  /**
   * Calculate stress indicators from audio features
   */
  private static calculateAudioStressScore(features: AudioFeatures): number {
    let stressScore = 0;

    // High pitch indicates stress
    if (features.pitch > this.STRESS_INDICATORS.highPitch.threshold) {
      stressScore += this.STRESS_INDICATORS.highPitch.weight;
    }

    // Fast speech indicates urgency
    if (features.speechRate > this.STRESS_INDICATORS.fastSpeech.threshold) {
      stressScore += this.STRESS_INDICATORS.fastSpeech.weight;
    }

    // Loud volume indicates distress
    if (features.volume > this.STRESS_INDICATORS.loudVolume.threshold) {
      stressScore += this.STRESS_INDICATORS.loudVolume.weight;
    }

    // Low voice quality indicates stress or environmental factors
    if (features.voiceQuality < 0.5) {
      stressScore += this.STRESS_INDICATORS.voiceShaking.weight;
    }

    return Math.min(stressScore, 1.0);
  }

  /**
   * Fuse evidence from multiple modalities
   */
  private static fuseMultimodalEvidence(
    textDetection: any,
    audioStressScore: number,
    audioFeatures: AudioFeatures
  ): EmergencyDetectionResult {
    // Weighted fusion of text and audio evidence
    const textWeight = 0.7;
    const audioWeight = 0.3;

    const combinedConfidence = 
      (textDetection.confidence * textWeight) + 
      (audioStressScore * audioWeight);

    // Determine urgency level
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (combinedConfidence > 0.8) urgencyLevel = 'critical';
    else if (combinedConfidence > 0.6) urgencyLevel = 'high';
    else if (combinedConfidence > 0.4) urgencyLevel = 'medium';

    // Determine recommendation
    let recommendation: 'ignore' | 'monitor' | 'alert' | 'immediate_response' = 'ignore';
    if (urgencyLevel === 'critical') recommendation = 'immediate_response';
    else if (urgencyLevel === 'high') recommendation = 'alert';
    else if (urgencyLevel === 'medium') recommendation = 'monitor';

    return {
      isEmergency: combinedConfidence > 0.4,
      type: textDetection.type,
      confidence: combinedConfidence,
      urgencyLevel,
      keywords: textDetection.keywords,
      audioFeatures: {
        volume: audioFeatures.volume,
        pitch: audioFeatures.pitch,
        speechRate: audioFeatures.speechRate,
        stressIndicators: audioStressScore,
      },
      textFeatures: {
        urgentWords: textDetection.keywords,
        emotionalTone: textDetection.emotionalTone,
        coherence: this.calculateTextCoherence(textDetection.keywords),
      },
      multimodalScore: combinedConfidence,
      recommendation,
    };
  }

  // Helper methods for audio processing
  private static calculateVolume(audioBuffer: Buffer): number {
    if (audioBuffer.length === 0) return 0;
    
    let sum = 0;
    for (let i = 0; i < audioBuffer.length; i += 2) {
      const sample = audioBuffer.readInt16LE(i);
      sum += Math.abs(sample);
    }
    
    return Math.min(sum / (audioBuffer.length / 2) / 32768, 1.0);
  }

  private static estimatePitch(audioBuffer: Buffer, sampleRate: number): number {
    // Simplified pitch estimation (would use FFT in production)
    return 150 + Math.random() * 100; // Placeholder
  }

  private static estimateSpeechRate(audioBuffer: Buffer, duration: number): number {
    // Estimate words per minute based on audio characteristics
    const estimatedWords = Math.max(1, Math.floor(duration * 2.5)); // Rough estimate
    return Math.min((estimatedWords / duration) * 60, 300);
  }

  private static calculateSilenceRatio(audioBuffer: Buffer): number {
    // Calculate ratio of silence to speech
    const threshold = 1000; // Silence threshold
    let silentSamples = 0;
    
    for (let i = 0; i < audioBuffer.length; i += 2) {
      const sample = Math.abs(audioBuffer.readInt16LE(i));
      if (sample < threshold) silentSamples++;
    }
    
    return silentSamples / (audioBuffer.length / 2);
  }

  private static assessVoiceQuality(audioBuffer: Buffer): number {
    // Assess voice quality based on signal characteristics
    const volume = this.calculateVolume(audioBuffer);
    const silenceRatio = this.calculateSilenceRatio(audioBuffer);
    
    // Higher volume and lower silence ratio indicate better quality
    return Math.min(volume * (1 - silenceRatio), 1.0);
  }

  private static analyzeEmergencyContext(text: string, type: EmergencyType): number {
    // Context-specific analysis for better accuracy
    const contextIndicators: Record<EmergencyType, string[]> = {
      medical: ['call ambulance', 'need doctor', 'hospital', 'pain level', 'can\'t breathe'],
      security: ['call police', 'stolen', 'threatened', 'dangerous', 'escape'],
      fire: ['fire department', 'evacuate', 'smoke', 'burning smell', 'get out'],
      accident: ['crashed', 'hit', 'collision', 'injured', 'call help'],
      domestic_violence: ['hurt me', 'scared', 'hiding', 'won\'t stop', 'safe place'],
      legal: ['arrested', 'detained', 'rights', 'lawyer', 'police station'],
    };

    const indicators = contextIndicators[type] || [];
    const matches = indicators.filter(indicator => 
      text.toLowerCase().includes(indicator.toLowerCase())
    );

    return Math.min(matches.length * 0.2, 0.4);
  }

  private static analyzeUrgencyIndicators(text: string): number {
    const urgencyWords = [
      'now', 'immediately', 'urgent', 'quickly', 'fast', 'hurry', 'emergency',
      'please', 'help', 'asap', 'right away', 'can\'t wait'
    ];

    const matches = urgencyWords.filter(word => 
      text.toLowerCase().includes(word.toLowerCase())
    );

    return Math.min(matches.length * 0.1, 0.3);
  }

  private static analyzeEmotionalTone(text: string): 'calm' | 'stressed' | 'panicked' | 'angry' {
    const panicWords = ['help', 'emergency', 'please', 'hurry', 'dying', 'can\'t'];
    const stressWords = ['worried', 'concerned', 'trouble', 'problem', 'difficult'];
    const angerWords = ['angry', 'furious', 'mad', 'hate', 'terrible', 'awful'];

    const panicCount = panicWords.filter(w => text.toLowerCase().includes(w)).length;
    const stressCount = stressWords.filter(w => text.toLowerCase().includes(w)).length;
    const angerCount = angerWords.filter(w => text.toLowerCase().includes(w)).length;

    if (panicCount >= 2) return 'panicked';
    if (angerCount >= 2) return 'angry';
    if (stressCount >= 1 || panicCount >= 1) return 'stressed';
    return 'calm';
  }

  private static calculateTextCoherence(keywords: string[]): number {
    // Simple coherence measure based on keyword relevance
    return keywords.length > 0 ? Math.min(keywords.length * 0.2, 1.0) : 0.5;
  }

  private static async quickAudioAnalysis(audioBuffer: Buffer): Promise<{ stressLevel: number }> {
    const volume = this.calculateVolume(audioBuffer);
    const quality = this.assessVoiceQuality(audioBuffer);
    
    return {
      stressLevel: Math.max(0, 1 - quality) * volume,
    };
  }

  private static calculateStreamingConfidence(
    textDetection: any,
    audioAnalysis: { stressLevel: number }
  ): { confidence: number; urgencyLevel: 'low' | 'medium' | 'high' | 'critical' } {
    const confidence = (textDetection.confidence * 0.8) + (audioAnalysis.stressLevel * 0.2);
    
    let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (confidence > 0.8) urgencyLevel = 'critical';
    else if (confidence > 0.6) urgencyLevel = 'high';
    else if (confidence > 0.4) urgencyLevel = 'medium';

    return { confidence, urgencyLevel };
  }
}

export default EmergencyDetectionService;
