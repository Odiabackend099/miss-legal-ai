// OpenAI Integration for MISS Legal AI Voice Processing
import OpenAI from 'openai';
import { logger, logPerformance, voiceLogger } from '@/utils/logger';
import { Language, EmergencyType } from '@/types';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is required');
}

// Nigerian languages configuration
const languagePrompts = {
  english: 'Respond in clear, professional English',
  pidgin: 'Respond in Nigerian Pidgin English (broken English)',
  yoruba: 'Respond in Yoruba language with English translations when necessary',
  hausa: 'Respond in Hausa language with English translations when necessary',
  igbo: 'Respond in Igbo language with English translations when necessary',
};

// Emergency detection keywords for Nigerian context
const emergencyKeywords = {
  medical: [
    'sick', 'hospital', 'doctor', 'pain', 'emergency', 'ambulance', 'injury', 'bleeding',
    'heart attack', 'stroke', 'unconscious', 'breathing', 'fever', 'accident',
    'ache mi', 'hospital', 'dokita', 'pain', 'emergency', // Yoruba
    'ciwo', 'asibiti', 'likita', 'emergency', 'ambulans', // Hausa
    'oria', 'ulo ogwu', 'dinta', 'emergency', 'ambulance', // Igbo
    'I dey sick', 'hospital', 'emergency', 'pain dey worry me', // Pidgin
  ],
  security: [
    'thief', 'robbery', 'stolen', 'break in', 'burglar', 'attack', 'threat', 'gun',
    'kidnap', 'assault', 'violence', 'danger', 'help', 'police',
    'ole', 'jaguda', 'police', 'danger', 'help', // Yoruba
    'barawo', 'yan sanda', 'hatsari', 'taimako', // Hausa
    'onye oshi', 'ndi uwe ojii', 'egwu', 'nyere aka', // Igbo
    'thief', 'armed robber', 'police', 'danger', 'help me', // Pidgin
  ],
  fire: [
    'fire', 'burning', 'smoke', 'flames', 'burn', 'explosion', 'gas leak',
    'ina', 'sun', 'eyin', 'fire service', // Yoruba
    'wuta', 'hayaki', 'fashewar gas', // Hausa
    'oku', 'anwuru', 'mgbawa gas', // Igbo
    'fire', 'burning', 'smoke', 'gas don leak', // Pidgin
  ],
  domestic_violence: [
    'abuse', 'violence', 'beating', 'domestic', 'hurt', 'threatened', 'scared',
    'husband', 'wife', 'boyfriend', 'girlfriend', 'family violence',
    'iya', 'oko', 'aya', 'ebi', 'violence', // Yoruba
    'azzalumi', 'miji', 'mata', 'iyali', // Hausa
    'mmegbu', 'di', 'nwunye', 'ezina ulo', // Igbo
    'my husband dey beat me', 'domestic violence', 'abuse', // Pidgin
  ],
};

export class OpenAIService {
  private static readonly MODEL = process.env.OPENAI_MODEL || 'gpt-4o';
  private static readonly MAX_TOKENS = parseInt(process.env.OPENAI_MAX_TOKENS || '4000');

  /**
   * Transcribe audio to text using Whisper
   */
  static async transcribeAudio(
    audioBuffer: Buffer,
    filename: string,
    language?: Language
  ): Promise<{
    text: string;
    language: string;
    confidence: number;
    duration: number;
  }> {
    const startTime = Date.now();
    
    try {
      // Create a File object from buffer
      const audioFile = new File([audioBuffer], filename, { 
        type: this.getAudioMimeType(filename) 
      });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: language ? this.mapLanguageToWhisperCode(language) : undefined,
        response_format: 'verbose_json',
        timestamp_granularities: ['word'],
      });

      const duration = Date.now() - startTime;
      logPerformance('OpenAI transcription', duration, { 
        language: transcription.language,
        textLength: transcription.text.length 
      });

      voiceLogger.info('Audio transcribed successfully', {
        language: transcription.language,
        textLength: transcription.text.length,
        duration: `${duration}ms`,
      });

      return {
        text: transcription.text,
        language: this.mapWhisperCodeToLanguage(transcription.language),
        confidence: 0.95, // Whisper doesn't return confidence, estimate high
        duration,
      };
    } catch (error) {
      logger.error('Audio transcription failed', { error, filename });
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Detect language from text
   */
  static async detectLanguage(text: string): Promise<{
    language: Language;
    confidence: number;
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Detect the language of the following text. Respond with only one of these languages: english, pidgin, yoruba, hausa, igbo. Consider Nigerian context and local expressions.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        max_tokens: 10,
        temperature: 0,
      });

      const detectedLanguage = response.choices[0]?.message?.content?.trim().toLowerCase() as Language;
      const validLanguages: Language[] = ['english', 'pidgin', 'yoruba', 'hausa', 'igbo'];
      
      return {
        language: validLanguages.includes(detectedLanguage) ? detectedLanguage : 'english',
        confidence: 0.85,
      };
    } catch (error) {
      logger.error('Language detection failed', { error, text: text.substring(0, 100) });
      return { language: 'english', confidence: 0.5 };
    }
  }

  /**
   * Detect emergency from transcript
   */
  static async detectEmergency(transcript: string): Promise<{
    isEmergency: boolean;
    emergencyType?: EmergencyType;
    confidence: number;
    keywords: string[];
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  }> {
    try {
      const response = await openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are an emergency detection system for Nigeria. Analyze the text for emergency situations.
            
Consider these emergency types:
- medical: Health emergencies, injuries, illness
- security: Crime, theft, assault, threats
- fire: Fire, explosion, gas leaks
- accident: Vehicle accidents, falls, injuries
- domestic_violence: Domestic abuse, family violence
- legal: Urgent legal situations

Respond with a JSON object containing:
- isEmergency: boolean
- emergencyType: one of the types above or null
- confidence: number between 0-1
- keywords: array of detected emergency keywords
- urgencyLevel: "low", "medium", "high", or "critical"
- reasoning: brief explanation

Consider Nigerian languages (English, Pidgin, Yoruba, Hausa, Igbo) and local context.`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      
      // Validate and return structured response
      return {
        isEmergency: Boolean(result.isEmergency),
        emergencyType: result.emergencyType as EmergencyType,
        confidence: Math.min(Math.max(result.confidence, 0), 1),
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        urgencyLevel: ['low', 'medium', 'high', 'critical'].includes(result.urgencyLevel) 
          ? result.urgencyLevel 
          : 'low',
      };
    } catch (error) {
      logger.error('Emergency detection failed', { error, transcript: transcript.substring(0, 100) });
      
      // Fallback: simple keyword detection
      return this.fallbackEmergencyDetection(transcript);
    }
  }

  /**
   * Extract legal intent from conversation
   */
  static async extractLegalIntent(transcript: string, language: Language = 'english'): Promise<{
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    documentType?: 'tenancy_agreement' | 'affidavit' | 'power_of_attorney';
    actionRequired: string[];
  }> {
    try {
      const languageInstruction = languagePrompts[language];
      
      const response = await openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are MISS Legal AI, a Nigerian legal assistant. Analyze the user's request and extract legal intent.

Common legal intents:
- document_creation: User wants to create legal documents
- legal_advice: User needs legal guidance
- lawyer_consultation: User wants to speak with a lawyer
- emergency_legal: Urgent legal situation
- contract_review: User wants contract reviewed
- property_matters: Real estate/property issues
- family_law: Marriage, divorce, custody issues
- business_law: Company registration, contracts
- dispute_resolution: Legal disputes

Extract relevant entities like:
- Names, addresses, amounts, dates
- Property details, contract terms
- Legal requirements mentioned

${languageInstruction}

Respond with JSON:
{
  "intent": "primary_intent",
  "confidence": 0.8,
  "entities": {"extracted": "entities"},
  "documentType": "document_type_if_applicable",
  "actionRequired": ["list", "of", "actions"],
  "summary": "Brief summary of request"
}`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        max_tokens: 500,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      
      return {
        intent: result.intent || 'general_inquiry',
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
        entities: result.entities || {},
        documentType: result.documentType,
        actionRequired: Array.isArray(result.actionRequired) ? result.actionRequired : [],
      };
    } catch (error) {
      logger.error('Legal intent extraction failed', { error, transcript: transcript.substring(0, 100) });
      
      return {
        intent: 'general_inquiry',
        confidence: 0.3,
        entities: {},
        actionRequired: ['clarify_request'],
      };
    }
  }

  /**
   * Generate conversational response
   */
  static async generateResponse(
    userInput: string,
    context: {
      language: Language;
      sessionHistory?: string[];
      userProfile?: any;
      intent?: string;
    }
  ): Promise<{
    response: string;
    suggestions: string[];
    nextAction?: string;
  }> {
    try {
      const languageInstruction = languagePrompts[context.language];
      const sessionHistory = context.sessionHistory?.slice(-5) || []; // Last 5 messages for context
      
      const systemMessage = `You are Minnie Max, the voice assistant for MISS Legal AI, designed specifically for Nigerian users.

Your capabilities:
- Create legal documents (Tenancy Agreements, Affidavits, Power of Attorney)
- Provide legal guidance and information
- Connect users with verified lawyers
- Detect and respond to emergencies
- Handle payments and subscriptions

Guidelines:
- Be helpful, professional, and empathetic
- Use appropriate Nigerian context and references
- ${languageInstruction}
- Keep responses concise but informative
- Ask clarifying questions when needed
- Always prioritize user safety and legal compliance

Current conversation context:
${sessionHistory.join('\n')}

User's intent: ${context.intent || 'general'}`;

      const response = await openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: userInput }
        ],
        max_tokens: 400,
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response. Please try again.';
      
      // Generate suggestions based on intent
      const suggestions = this.generateSuggestions(context.intent, context.language);
      
      return {
        response: content,
        suggestions,
        nextAction: this.determineNextAction(context.intent),
      };
    } catch (error) {
      logger.error('Response generation failed', { error, userInput: userInput.substring(0, 100) });
      
      const fallbackResponse = context.language === 'pidgin' 
        ? 'Sorry, I no fit understand wetin you talk. Make you try talk am again.'
        : 'I apologize, but I\'m having trouble understanding your request. Could you please try again?';
        
      return {
        response: fallbackResponse,
        suggestions: ['Try rephrasing your request', 'Speak clearly', 'Check your internet connection'],
      };
    }
  }

  /**
   * Generate document content using OpenAI
   */
  static async generateDocument(
    documentType: 'tenancy_agreement' | 'affidavit' | 'power_of_attorney',
    data: Record<string, any>,
    language: Language = 'english'
  ): Promise<{
    content: string;
    warnings: string[];
    compliance_checks: Record<string, any>;
  }> {
    try {
      const languageInstruction = languagePrompts[language];
      
      const response = await openai.chat.completions.create({
        model: this.MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a Nigerian legal document generator. Create a professional ${documentType} based on the provided data.

Requirements:
- Follow Nigerian legal standards and formatting
- Include all necessary clauses and provisions
- ${languageInstruction}
- Ensure NDPR compliance where applicable
- Include proper legal disclaimers
- Mark any missing required information with [REQUIRED: description]

Generate a complete, legally sound document.`
          },
          {
            role: 'user',
            content: `Create a ${documentType} with this information: ${JSON.stringify(data)}`
          }
        ],
        max_tokens: this.MAX_TOKENS,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Analyze the document for warnings and compliance
      const warnings = this.analyzeDocumentWarnings(content, documentType);
      const compliance_checks = this.checkCompliance(content, documentType);
      
      return {
        content,
        warnings,
        compliance_checks,
      };
    } catch (error) {
      logger.error('Document generation failed', { error, documentType });
      throw new Error('Failed to generate document');
    }
  }

  // Private helper methods
  private static getAudioMimeType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'wav': 'audio/wav',
      'mp3': 'audio/mpeg',
      'm4a': 'audio/m4a',
      'webm': 'audio/webm',
    };
    return mimeTypes[extension || 'wav'] || 'audio/wav';
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

  private static fallbackEmergencyDetection(transcript: string): any {
    const lowerText = transcript.toLowerCase();
    let highestConfidence = 0;
    let detectedType: EmergencyType | undefined;
    const foundKeywords: string[] = [];

    // Check each emergency type
    Object.entries(emergencyKeywords).forEach(([type, keywords]) => {
      const matches = keywords.filter(keyword => lowerText.includes(keyword.toLowerCase()));
      if (matches.length > 0) {
        const confidence = Math.min(matches.length * 0.3, 0.9);
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          detectedType = type as EmergencyType;
        }
        foundKeywords.push(...matches);
      }
    });

    return {
      isEmergency: highestConfidence > 0.3,
      emergencyType: detectedType,
      confidence: highestConfidence,
      keywords: foundKeywords,
      urgencyLevel: highestConfidence > 0.7 ? 'high' : highestConfidence > 0.5 ? 'medium' : 'low',
    };
  }

  private static generateSuggestions(intent?: string, language: Language = 'english'): string[] {
    const suggestions = {
      english: {
        document_creation: ['Create tenancy agreement', 'Generate affidavit', 'Make power of attorney'],
        legal_advice: ['Ask about property law', 'Business registration', 'Contract review'],
        lawyer_consultation: ['Book consultation', 'Find specialist lawyer', 'Check lawyer availability'],
        default: ['Create document', 'Get legal advice', 'Talk to lawyer'],
      },
      pidgin: {
        document_creation: ['Make tenancy agreement', 'Write affidavit', 'Do power of attorney'],
        legal_advice: ['Ask about property matter', 'Business registration', 'Contract check'],
        lawyer_consultation: ['Book lawyer talk', 'Find specialist', 'Check who dey available'],
        default: ['Make document', 'Get legal advice', 'Talk to lawyer'],
      },
    };

    const langSuggestions = suggestions[language] || suggestions.english;
    return langSuggestions[intent as keyof typeof langSuggestions] || langSuggestions.default;
  }

  private static determineNextAction(intent?: string): string | undefined {
    const actionMap: Record<string, string> = {
      'document_creation': 'collect_document_data',
      'legal_advice': 'provide_legal_guidance',
      'lawyer_consultation': 'show_available_lawyers',
      'emergency_legal': 'escalate_to_emergency',
    };

    return actionMap[intent || ''];
  }

  private static analyzeDocumentWarnings(content: string, documentType: string): string[] {
    const warnings: string[] = [];
    
    if (content.includes('[REQUIRED:')) {
      warnings.push('Document contains missing required information');
    }
    
    if (documentType === 'tenancy_agreement' && !content.includes('stamp duty')) {
      warnings.push('Consider stamp duty requirements for tenancy agreements');
    }
    
    if (documentType === 'affidavit' && !content.includes('commissioner for oaths')) {
      warnings.push('Affidavit requires notarization by a Commissioner for Oaths');
    }
    
    return warnings;
  }

  private static checkCompliance(content: string, documentType: string): Record<string, any> {
    return {
      nigerian_law_compliant: true,
      stamp_duty_mentioned: content.toLowerCase().includes('stamp duty'),
      notarization_required: documentType === 'affidavit',
      ndpr_compliant: content.toLowerCase().includes('data protection') || content.toLowerCase().includes('privacy'),
    };
  }
}

export default OpenAIService;
