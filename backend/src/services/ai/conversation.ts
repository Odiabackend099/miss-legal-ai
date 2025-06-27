// AI Conversation Management Service for MISS Legal AI
import OpenAI from 'openai';
import { voiceLogger, emergencyLogger } from '@/utils/logger';
import { Language, EmergencyType, User } from '@/types';
import { db } from '@/integrations/supabase/client';

interface ConversationContext {
  sessionId: string;
  userId: string;
  user: User;
  conversationHistory: ConversationTurn[];
  currentIntent?: string;
  documentInProgress?: {
    type: string;
    data: Record<string, any>;
    stage: string;
  };
  emergencyContext?: {
    detected: boolean;
    type?: EmergencyType;
    confidence: number;
    acknowledged: boolean;
  };
  language: Language;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
}

interface ConversationTurn {
  turnNumber: number;
  timestamp: Date;
  userInput: string;
  assistantResponse: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  language: Language;
}

interface AIResponse {
  text: string;
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  actions: string[];
  nextExpectedInput?: string;
  requiresHumanEscalation: boolean;
  emergencyDetected?: {
    isEmergency: boolean;
    type?: EmergencyType;
    confidence: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  documentProgress?: {
    type: string;
    completionPercentage: number;
    nextRequiredField: string;
    missingFields: string[];
  };
}

export class ConversationService {
  private static readonly openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!,
  });

  private static readonly conversationContexts = new Map<string, ConversationContext>();

  // Nigerian Legal Context and Knowledge Base
  private static readonly NIGERIAN_LEGAL_CONTEXT = `
You are Minnie Max, a friendly and professional AI legal assistant specifically designed for Nigerian users. You help with:

1. **Legal Document Creation**: Tenancy agreements, affidavits, power of attorney documents
2. **Emergency Response**: Detect and respond to emergency situations immediately
3. **Legal Guidance**: Provide information about Nigerian laws and legal procedures
4. **Lawyer Connections**: Help users connect with verified Nigerian lawyers

**Nigerian Legal Context:**
- Nigerian Constitution and legal system
- State-specific laws (Lagos, Abuja, Kano, etc.)
- Traditional and customary laws
- NDPR (Nigerian Data Protection Regulation) compliance
- Nigerian Bar Association requirements

**Languages**: English, Nigerian Pidgin, Yoruba, Hausa, Igbo
**Cultural Context**: Respectful of Nigerian customs, greetings, and social norms
**Emergency Numbers**: 199 (Nigeria Emergency), 123 (Lagos Emergency)

**Response Guidelines:**
- Be warm, professional, and culturally sensitive
- Use appropriate Nigerian expressions when speaking local languages
- Always prioritize emergency situations
- Provide disclaimers for legal advice
- Respect cultural and religious sensitivities
- Use "oga," "ma," or appropriate titles when culturally appropriate
`;

  /**
   * Initialize conversation context
   */
  static async initializeConversation(
    sessionId: string,
    userId: string,
    user: User,
    language: Language = 'english'
  ): Promise<ConversationContext> {
    const context: ConversationContext = {
      sessionId,
      userId,
      user,
      conversationHistory: [],
      language,
      location: user.default_location,
    };

    this.conversationContexts.set(sessionId, context);

    voiceLogger.info('Conversation initialized', {
      sessionId,
      userId,
      language,
      userName: user.full_name,
    });

    return context;
  }

  /**
   * Process user input and generate AI response
   */
  static async processUserInput(
    sessionId: string,
    userInput: string,
    options: {
      language?: Language;
      audioConfidence?: number;
      turnNumber?: number;
    } = {}
  ): Promise<AIResponse> {
    try {
      const context = this.conversationContexts.get(sessionId);
      if (!context) {
        throw new Error(`Conversation context not found for session ${sessionId}`);
      }

      // Update language if provided
      if (options.language) {
        context.language = options.language;
      }

      // Detect emergency first (highest priority)
      const emergencyDetection = await this.detectEmergency(userInput, context);
      
      if (emergencyDetection.isEmergency && emergencyDetection.confidence > 0.7) {
        context.emergencyContext = {
          detected: true,
          type: emergencyDetection.type,
          confidence: emergencyDetection.confidence,
          acknowledged: false,
        };

        return this.handleEmergencyResponse(userInput, context, emergencyDetection);
      }

      // Extract intent and entities
      const intentAnalysis = await this.analyzeIntent(userInput, context);
      
      // Generate contextual response
      const response = await this.generateResponse(userInput, context, intentAnalysis);

      // Update conversation history
      const turn: ConversationTurn = {
        turnNumber: options.turnNumber || context.conversationHistory.length + 1,
        timestamp: new Date(),
        userInput,
        assistantResponse: response.text,
        intent: response.intent,
        entities: response.entities,
        confidence: options.audioConfidence || 0.9,
        language: context.language,
      };

      context.conversationHistory.push(turn);
      context.currentIntent = response.intent;

      // Handle document creation workflow
      if (response.intent.includes('document_creation')) {
        this.updateDocumentProgress(context, response);
      }

      voiceLogger.info('User input processed', {
        sessionId,
        userId: context.userId,
        intent: response.intent,
        confidence: response.confidence,
        emergencyDetected: !!response.emergencyDetected?.isEmergency,
      });

      return response;
    } catch (error) {
      voiceLogger.error('Failed to process user input', {
        sessionId,
        userInput: userInput.substring(0, 100),
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return fallback response
      return {
        text: "I'm sorry, I'm having trouble understanding you right now. Could you please repeat that?",
        intent: 'clarification_needed',
        confidence: 0.1,
        entities: {},
        actions: ['request_repeat'],
        requiresHumanEscalation: true,
      };
    }
  }

  /**
   * Handle emergency situations with immediate response
   */
  private static async handleEmergencyResponse(
    userInput: string,
    context: ConversationContext,
    emergencyDetection: any
  ): Promise<AIResponse> {
    emergencyLogger.error('Emergency detected in conversation', {
      sessionId: context.sessionId,
      userId: context.userId,
      emergencyType: emergencyDetection.type,
      confidence: emergencyDetection.confidence,
      userInput: userInput.substring(0, 200),
    });

    // Generate emergency-specific response
    const emergencyResponse = await this.generateEmergencyResponse(
      userInput,
      context,
      emergencyDetection
    );

    // Mark emergency as acknowledged
    if (context.emergencyContext) {
      context.emergencyContext.acknowledged = true;
    }

    return {
      ...emergencyResponse,
      emergencyDetected: emergencyDetection,
      actions: ['emergency_dispatch', 'notify_contacts', 'activate_emergency_protocol'],
      requiresHumanEscalation: true,
    };
  }

  /**
   * Detect emergency from user input
   */
  private static async detectEmergency(
    userInput: string,
    context: ConversationContext
  ): Promise<{
    isEmergency: boolean;
    type?: EmergencyType;
    confidence: number;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
    keywords: string[];
  }> {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an emergency detection system for Nigeria. Analyze text for emergency situations.

Emergency types to detect:
- medical: Health emergencies, injuries, illness, hospital needs
- security: Crime, theft, assault, threats, kidnapping
- fire: Fire, explosion, gas leaks, burning
- accident: Vehicle accidents, falls, workplace accidents
- domestic_violence: Domestic abuse, family violence, threats at home
- legal: Urgent legal situations requiring immediate attention

Consider Nigerian context, languages (English, Pidgin, Yoruba, Hausa, Igbo), and local expressions.

Response format (JSON only):
{
  "isEmergency": boolean,
  "type": "emergency_type_or_null",
  "confidence": 0.0-1.0,
  "urgencyLevel": "low|medium|high|critical",
  "keywords": ["detected", "keywords"],
  "reasoning": "brief_explanation"
}`
          },
          {
            role: 'user',
            content: `Analyze for emergency: "${userInput}"\n\nUser location: ${context.location?.address || 'Nigeria'}\nLanguage: ${context.language}`
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      
      return {
        isEmergency: Boolean(result.isEmergency),
        type: result.type as EmergencyType,
        confidence: Math.min(Math.max(result.confidence, 0), 1),
        urgencyLevel: result.urgencyLevel || 'low',
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
      };
    } catch (error) {
      voiceLogger.error('Emergency detection failed', {
        sessionId: context.sessionId,
        error,
      });

      // Fallback to keyword-based detection
      return this.fallbackEmergencyDetection(userInput);
    }
  }

  /**
   * Analyze user intent and extract entities
   */
  private static async analyzeIntent(
    userInput: string,
    context: ConversationContext
  ): Promise<{
    intent: string;
    entities: Record<string, any>;
    confidence: number;
  }> {
    try {
      const conversationHistory = context.conversationHistory.slice(-3).map(turn => 
        `User: ${turn.userInput}\nAssistant: ${turn.assistantResponse}`
      ).join('\n\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Analyze user intent for a Nigerian legal assistant conversation.

Common intents:
- greeting: Greetings, introduction
- document_creation_tenancy: Create tenancy agreement
- document_creation_affidavit: Create affidavit
- document_creation_poa: Create power of attorney
- legal_advice: Ask for legal guidance
- lawyer_consultation: Want to speak with lawyer
- payment_subscription: Payment or subscription related
- emergency_help: Non-emergency help requests
- clarification: Need clarification or explanation
- complaint: Issues or complaints
- goodbye: Ending conversation

Extract relevant entities like names, amounts, dates, locations, document types.

Respond in JSON format:
{
  "intent": "primary_intent",
  "entities": {
    "entity_type": "entity_value"
  },
  "confidence": 0.0-1.0
}`
          },
          {
            role: 'user',
            content: `Current input: "${userInput}"

Recent conversation:
${conversationHistory}

User language: ${context.language}
Current intent: ${context.currentIntent || 'none'}`
          }
        ],
        max_tokens: 400,
        temperature: 0.2,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content);
      
      return {
        intent: result.intent || 'general_inquiry',
        entities: result.entities || {},
        confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1),
      };
    } catch (error) {
      voiceLogger.error('Intent analysis failed', {
        sessionId: context.sessionId,
        error,
      });

      return {
        intent: 'general_inquiry',
        entities: {},
        confidence: 0.3,
      };
    }
  }

  /**
   * Generate contextual AI response
   */
  private static async generateResponse(
    userInput: string,
    context: ConversationContext,
    intentAnalysis: any
  ): Promise<AIResponse> {
    try {
      const systemPrompt = this.buildSystemPrompt(context, intentAnalysis);
      const conversationHistory = this.buildConversationHistory(context);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `${conversationHistory}\n\nUser: ${userInput}` }
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });

      const responseText = response.choices[0]?.message?.content || 
        "I'm here to help you with your legal needs. How can I assist you today?";

      // Determine actions based on intent
      const actions = this.determineActions(intentAnalysis.intent, intentAnalysis.entities);

      // Check if human escalation is needed
      const requiresHumanEscalation = this.requiresHumanEscalation(intentAnalysis.intent, responseText);

      return {
        text: responseText,
        intent: intentAnalysis.intent,
        confidence: intentAnalysis.confidence,
        entities: intentAnalysis.entities,
        actions,
        requiresHumanEscalation,
        nextExpectedInput: this.getNextExpectedInput(intentAnalysis.intent),
      };
    } catch (error) {
      voiceLogger.error('Response generation failed', {
        sessionId: context.sessionId,
        error,
      });

      return {
        text: "I apologize, but I'm experiencing some technical difficulties. Please try again in a moment.",
        intent: 'system_error',
        confidence: 0.1,
        entities: {},
        actions: ['retry'],
        requiresHumanEscalation: true,
      };
    }
  }

  /**
   * Generate emergency-specific response
   */
  private static async generateEmergencyResponse(
    userInput: string,
    context: ConversationContext,
    emergencyDetection: any
  ): Promise<AIResponse> {
    const emergencyPrompt = `You are responding to an emergency situation. Be calm, clear, and helpful.

Emergency type: ${emergencyDetection.type}
Urgency level: ${emergencyDetection.urgencyLevel}
User location: ${context.location?.address || 'Nigeria'}

Provide immediate guidance and reassurance. Mention that emergency contacts are being notified.
Keep response brief and actionable. Include emergency numbers for Nigeria (199, 123 for Lagos).

Respond in ${context.language === 'pidgin' ? 'Nigerian Pidgin' : context.language}.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: emergencyPrompt },
          { role: 'user', content: userInput }
        ],
        max_tokens: 300,
        temperature: 0.3,
      });

      const responseText = response.choices[0]?.message?.content || 
        "I understand this is an emergency. I'm notifying your emergency contacts now. Please stay calm and call 199 for immediate assistance.";

      return {
        text: responseText,
        intent: `emergency_${emergencyDetection.type}`,
        confidence: emergencyDetection.confidence,
        entities: { emergency_type: emergencyDetection.type },
        actions: ['emergency_dispatch', 'notify_contacts'],
        requiresHumanEscalation: true,
      };
    } catch (error) {
      // Fallback emergency response
      return {
        text: "I understand this is an emergency. Your emergency contacts are being notified. Please call 199 for immediate assistance or 123 if you're in Lagos.",
        intent: `emergency_${emergencyDetection.type}`,
        confidence: emergencyDetection.confidence,
        entities: { emergency_type: emergencyDetection.type },
        actions: ['emergency_dispatch', 'notify_contacts'],
        requiresHumanEscalation: true,
      };
    }
  }

  /**
   * Get conversation context
   */
  static getConversationContext(sessionId: string): ConversationContext | undefined {
    return this.conversationContexts.get(sessionId);
  }

  /**
   * Update conversation context
   */
  static updateConversationContext(sessionId: string, updates: Partial<ConversationContext>): void {
    const context = this.conversationContexts.get(sessionId);
    if (context) {
      Object.assign(context, updates);
    }
  }

  /**
   * Clear conversation context (cleanup)
   */
  static clearConversationContext(sessionId: string): void {
    this.conversationContexts.delete(sessionId);
    voiceLogger.info('Conversation context cleared', { sessionId });
  }

  // Private helper methods
  private static buildSystemPrompt(context: ConversationContext, intentAnalysis: any): string {
    let prompt = this.NIGERIAN_LEGAL_CONTEXT;
    
    prompt += `\n\nUser Information:
- Name: ${context.user.full_name}
- Language: ${context.language}
- Subscription: ${context.user.subscription_tier}
- Location: ${context.location?.address || 'Nigeria'}`;

    if (context.documentInProgress) {
      prompt += `\n\nDocument in Progress:
- Type: ${context.documentInProgress.type}
- Stage: ${context.documentInProgress.stage}
- Completion: ${this.calculateDocumentCompletion(context.documentInProgress)}%`;
    }

    prompt += `\n\nCurrent Intent: ${intentAnalysis.intent}
Respond in ${context.language === 'pidgin' ? 'Nigerian Pidgin English' : context.language}.
Be helpful, professional, and culturally appropriate.`;

    return prompt;
  }

  private static buildConversationHistory(context: ConversationContext): string {
    return context.conversationHistory.slice(-3).map(turn => 
      `User: ${turn.userInput}\nMinnie Max: ${turn.assistantResponse}`
    ).join('\n\n');
  }

  private static determineActions(intent: string, entities: Record<string, any>): string[] {
    const actionMap: Record<string, string[]> = {
      'document_creation_tenancy': ['start_document_flow', 'collect_tenancy_details'],
      'document_creation_affidavit': ['start_document_flow', 'collect_affidavit_details'],
      'document_creation_poa': ['start_document_flow', 'collect_poa_details'],
      'lawyer_consultation': ['show_available_lawyers', 'schedule_consultation'],
      'payment_subscription': ['show_subscription_plans', 'process_payment'],
      'legal_advice': ['provide_legal_info', 'add_disclaimer'],
    };

    return actionMap[intent] || ['continue_conversation'];
  }

  private static requiresHumanEscalation(intent: string, response: string): boolean {
    const escalationIntents = [
      'emergency_',
      'complaint',
      'complex_legal_advice',
      'lawyer_consultation',
      'system_error'
    ];

    return escalationIntents.some(escalationIntent => intent.includes(escalationIntent)) ||
           response.toLowerCase().includes('lawyer') ||
           response.toLowerCase().includes('escalate');
  }

  private static getNextExpectedInput(intent: string): string | undefined {
    const expectedInputs: Record<string, string> = {
      'document_creation_tenancy': 'landlord and tenant information',
      'document_creation_affidavit': 'affidavit purpose and details',
      'document_creation_poa': 'grantor and attorney information',
      'lawyer_consultation': 'preferred consultation type and time',
      'payment_subscription': 'subscription plan preference',
    };

    return expectedInputs[intent];
  }

  private static updateDocumentProgress(context: ConversationContext, response: AIResponse): void {
    // Update document creation progress
    if (!context.documentInProgress) {
      const documentType = response.intent.replace('document_creation_', '');
      context.documentInProgress = {
        type: documentType,
        data: {},
        stage: 'initiated',
      };
    }

    // Update with extracted entities
    Object.assign(context.documentInProgress.data, response.entities);
  }

  private static calculateDocumentCompletion(documentProgress: any): number {
    const requiredFields: Record<string, string[]> = {
      'tenancy': ['landlord', 'tenant', 'property', 'rent_amount', 'duration'],
      'affidavit': ['deponent', 'facts', 'purpose'],
      'poa': ['grantor', 'attorney', 'powers', 'duration'],
    };

    const required = requiredFields[documentProgress.type] || [];
    const completed = required.filter(field => documentProgress.data[field]).length;
    
    return Math.round((completed / required.length) * 100);
  }

  private static fallbackEmergencyDetection(userInput: string): any {
    const emergencyKeywords = {
      medical: ['sick', 'hospital', 'doctor', 'pain', 'emergency', 'injury', 'bleeding', 'unconscious'],
      security: ['thief', 'robbery', 'stolen', 'attack', 'threat', 'gun', 'kidnap', 'danger'],
      fire: ['fire', 'burning', 'smoke', 'flames', 'explosion', 'gas leak'],
      domestic_violence: ['abuse', 'violence', 'beating', 'hurt', 'threatened', 'scared'],
    };

    const lowerInput = userInput.toLowerCase();
    let highestConfidence = 0;
    let detectedType: EmergencyType | undefined;

    Object.entries(emergencyKeywords).forEach(([type, keywords]) => {
      const matches = keywords.filter(keyword => lowerInput.includes(keyword));
      if (matches.length > 0) {
        const confidence = Math.min(matches.length * 0.3, 0.9);
        if (confidence > highestConfidence) {
          highestConfidence = confidence;
          detectedType = type as EmergencyType;
        }
      }
    });

    return {
      isEmergency: highestConfidence > 0.3,
      type: detectedType,
      confidence: highestConfidence,
      urgencyLevel: highestConfidence > 0.7 ? 'high' : 'medium',
      keywords: [],
    };
  }
}

export default ConversationService;
