// Voice-to-Document Data Extraction for Nigerian Legal Documents
import { documentLogger } from '@/utils/logger';
import { DocumentType, Language, DocumentData } from '@/types';
import { OpenAIClient } from '@/integrations/openai/client';

interface ExtractionPrompt {
  systemPrompt: string;
  userPrompt: string;
  requiredFields: string[];
  optionalFields: string[];
  validationRules: Record<string, string>;
}

interface ExtractionResult {
  data: DocumentData;
  confidence: number;
  missingFields: string[];
  ambiguousFields: string[];
  followUpQuestions: string[];
  extractionMetadata: {
    processingTimeMs: number;
    tokensUsed: number;
    model: string;
    language: Language;
  };
}

interface ConversationContext {
  documentType: DocumentType;
  language: Language;
  state: string;
  previousExtractions: DocumentData[];
  clarificationHistory: Array<{
    question: string;
    answer: string;
    timestamp: string;
  }>;
}

export class VoiceExtractor {
  private openAIClient: OpenAIClient;
  private extractionPrompts: Map<DocumentType, ExtractionPrompt> = new Map();
  private nigerianContextPatterns: Map<string, RegExp> = new Map();

  constructor() {
    this.openAIClient = new OpenAIClient();
    this.initializeExtractionPrompts();
    this.initializeNigerianPatterns();
  }

  /**
   * Extract structured document data from voice transcript
   */
  async extractFromVoice(
    transcript: string,
    documentType: DocumentType,
    language: Language = 'english',
    context?: ConversationContext
  ): Promise<DocumentData> {
    const startTime = Date.now();

    try {
      documentLogger.info('Starting voice extraction', {
        documentType,
        language,
        transcriptLength: transcript.length,
        hasContext: !!context,
      });

      // Get extraction prompt for document type
      const prompt = this.extractionPrompts.get(documentType);
      if (!prompt) {
        throw new Error(`No extraction prompt found for document type: ${documentType}`);
      }

      // Pre-process transcript for Nigerian context
      const processedTranscript = await this.preprocessTranscript(transcript, language);

      // Extract data using GPT-4
      const extractionResult = await this.performExtraction(
        processedTranscript,
        prompt,
        documentType,
        language,
        context
      );

      // Validate and normalize extracted data
      const validatedData = await this.validateAndNormalizeData(
        extractionResult.data,
        documentType,
        language
      );

      // Generate follow-up questions for missing critical fields
      const followUpQuestions = await this.generateFollowUpQuestions(
        validatedData,
        prompt.requiredFields,
        documentType,
        language
      );

      const processingTime = Date.now() - startTime;

      documentLogger.info('Voice extraction completed', {
        documentType,
        language,
        confidence: extractionResult.confidence,
        missingFields: extractionResult.missingFields.length,
        followUpQuestions: followUpQuestions.length,
        processingTimeMs: processingTime,
      });

      return {
        ...validatedData,
        _extractionMetadata: {
          confidence: extractionResult.confidence,
          missingFields: extractionResult.missingFields,
          followUpQuestions,
          processingTimeMs: processingTime,
          source: 'voice',
        },
      };
    } catch (error) {
      documentLogger.error('Voice extraction failed', {
        documentType,
        language,
        transcriptLength: transcript.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Extract data with iterative clarification
   */
  async extractWithClarification(
    transcript: string,
    documentType: DocumentType,
    clarifications: Array<{ question: string; answer: string }>,
    language: Language = 'english'
  ): Promise<DocumentData> {
    try {
      // Build enhanced context with clarifications
      const enhancedTranscript = this.buildEnhancedTranscript(transcript, clarifications);

      // Extract with enhanced context
      return await this.extractFromVoice(enhancedTranscript, documentType, language);
    } catch (error) {
      documentLogger.error('Clarification-based extraction failed', {
        documentType,
        clarificationsCount: clarifications.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Validate extracted data for completeness
   */
  async validateExtraction(
    data: DocumentData,
    documentType: DocumentType,
    language: Language = 'english'
  ): Promise<{
    isComplete: boolean;
    missingRequiredFields: string[];
    invalidFields: Array<{ field: string; reason: string }>;
    suggestions: string[];
  }> {
    const prompt = this.extractionPrompts.get(documentType);
    if (!prompt) {
      throw new Error(`No validation prompt found for document type: ${documentType}`);
    }

    const missingRequiredFields = prompt.requiredFields.filter(
      field => !data[field] || data[field] === ''
    );

    const invalidFields: Array<{ field: string; reason: string }> = [];
    const suggestions: string[] = [];

    // Validate each field according to Nigerian legal requirements
    for (const [field, value] of Object.entries(data)) {
      if (value && prompt.validationRules[field]) {
        const validationResult = await this.validateField(
          field,
          value,
          prompt.validationRules[field],
          language
        );

        if (!validationResult.isValid) {
          invalidFields.push({
            field,
            reason: validationResult.reason || 'Invalid format',
          });
          
          if (validationResult.suggestion) {
            suggestions.push(validationResult.suggestion);
          }
        }
      }
    }

    return {
      isComplete: missingRequiredFields.length === 0 && invalidFields.length === 0,
      missingRequiredFields,
      invalidFields,
      suggestions,
    };
  }

  /**
   * Generate clarification questions for missing information
   */
  async generateClarificationQuestions(
    partialData: DocumentData,
    documentType: DocumentType,
    language: Language = 'english'
  ): Promise<string[]> {
    try {
      const prompt = this.extractionPrompts.get(documentType);
      if (!prompt) {
        return [];
      }

      const missingFields = prompt.requiredFields.filter(
        field => !partialData[field] || partialData[field] === ''
      );

      const questions: string[] = [];

      for (const field of missingFields) {
        const question = await this.generateFieldQuestion(field, documentType, language);
        if (question) {
          questions.push(question);
        }
      }

      return questions;
    } catch (error) {
      documentLogger.error('Failed to generate clarification questions', {
        documentType,
        language,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  // Private helper methods

  private async preprocessTranscript(transcript: string, language: Language): Promise<string> {
    let processed = transcript;

    // Normalize Nigerian names and locations
    processed = this.normalizeNigerianNames(processed);
    processed = this.normalizeNigerianLocations(processed);
    processed = this.normalizeNigerianCurrency(processed);
    processed = this.normalizeDates(processed);

    // Handle Nigerian English variations
    if (language === 'english') {
      processed = this.normalizeNigerianEnglish(processed);
    }

    return processed;
  }

  private async performExtraction(
    transcript: string,
    prompt: ExtractionPrompt,
    documentType: DocumentType,
    language: Language,
    context?: ConversationContext
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    // Build context-aware system prompt
    let systemPrompt = prompt.systemPrompt;
    if (context) {
      systemPrompt += this.buildContextualPrompt(context);
    }

    // Build user prompt with transcript
    const userPrompt = `${prompt.userPrompt}\n\nTranscript to analyze:\n"${transcript}"`;

    // Call GPT-4 for extraction
    const response = await this.openAIClient.chat({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 0.1, // Low temperature for consistent extraction
      max_tokens: 2000,
    });

    const processingTime = Date.now() - startTime;

    // Parse response
    let extractedData: any;
    try {
      extractedData = JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      documentLogger.error('Failed to parse extraction response', {
        response: response.choices[0].message.content,
        error,
      });
      throw new Error('Invalid extraction response format');
    }

    // Calculate confidence based on completeness
    const confidence = this.calculateExtractionConfidence(extractedData, prompt);

    // Identify missing and ambiguous fields
    const missingFields = prompt.requiredFields.filter(
      field => !extractedData[field] || extractedData[field] === ''
    );

    const ambiguousFields = Object.keys(extractedData).filter(
      key => extractedData[key] && extractedData[key].toString().includes('unclear')
    );

    return {
      data: extractedData,
      confidence,
      missingFields,
      ambiguousFields,
      followUpQuestions: [],
      extractionMetadata: {
        processingTimeMs: processingTime,
        tokensUsed: response.usage?.total_tokens || 0,
        model: 'gpt-4o',
        language,
      },
    };
  }

  private async validateAndNormalizeData(
    data: DocumentData,
    documentType: DocumentType,
    language: Language
  ): Promise<DocumentData> {
    const normalized = { ...data };

    // Normalize Nigerian-specific fields
    if (normalized.propertyAddress) {
      normalized.propertyAddress = this.normalizeNigerianAddress(normalized.propertyAddress);
    }

    if (normalized.rentAmount || normalized.depositAmount) {
      normalized.rentAmount = this.normalizeAmount(normalized.rentAmount);
      normalized.depositAmount = this.normalizeAmount(normalized.depositAmount);
    }

    if (normalized.startDate || normalized.endDate || normalized.swornDate) {
      normalized.startDate = this.normalizeDate(normalized.startDate);
      normalized.endDate = this.normalizeDate(normalized.endDate);
      normalized.swornDate = this.normalizeDate(normalized.swornDate);
    }

    // Normalize names
    if (normalized.landlordName) {
      normalized.landlordName = this.normalizeName(normalized.landlordName);
    }
    if (normalized.tenantName) {
      normalized.tenantName = this.normalizeName(normalized.tenantName);
    }
    if (normalized.deponentName) {
      normalized.deponentName = this.normalizeName(normalized.deponentName);
    }

    return normalized;
  }

  private async generateFollowUpQuestions(
    data: DocumentData,
    requiredFields: string[],
    documentType: DocumentType,
    language: Language
  ): Promise<string[]> {
    const missingFields = requiredFields.filter(
      field => !data[field] || data[field] === ''
    );

    const questions: string[] = [];

    for (const field of missingFields) {
      const question = await this.generateFieldQuestion(field, documentType, language);
      if (question) {
        questions.push(question);
      }
    }

    return questions;
  }

  private async generateFieldQuestion(
    field: string,
    documentType: DocumentType,
    language: Language
  ): Promise<string | null> {
    const questionMap: Record<string, Record<DocumentType, string>> = {
      landlordName: {
        tenancy_agreement: 'What is the full name of the landlord or property owner?',
        affidavit: '',
        power_of_attorney: '',
      },
      tenantName: {
        tenancy_agreement: 'What is the full name of the tenant?',
        affidavit: '',
        power_of_attorney: '',
      },
      propertyAddress: {
        tenancy_agreement: 'What is the complete address of the property being rented?',
        affidavit: '',
        power_of_attorney: '',
      },
      rentAmount: {
        tenancy_agreement: 'What is the annual rent amount in Nigerian Naira?',
        affidavit: '',
        power_of_attorney: '',
      },
      duration: {
        tenancy_agreement: 'What is the duration of the tenancy in months?',
        affidavit: '',
        power_of_attorney: '',
      },
      startDate: {
        tenancy_agreement: 'What is the start date of the tenancy?',
        affidavit: '',
        power_of_attorney: '',
      },
      depositAmount: {
        tenancy_agreement: 'What is the security deposit amount?',
        affidavit: '',
        power_of_attorney: '',
      },
      deponentName: {
        tenancy_agreement: '',
        affidavit: 'What is the full name of the person making this affidavit?',
        power_of_attorney: '',
      },
      facts: {
        tenancy_agreement: '',
        affidavit: 'What are the specific facts you want to swear to in this affidavit?',
        power_of_attorney: '',
      },
      purpose: {
        tenancy_agreement: '',
        affidavit: 'What is the purpose of this affidavit?',
        power_of_attorney: 'What is the purpose of this power of attorney?',
      },
      grantorName: {
        tenancy_agreement: '',
        affidavit: '',
        power_of_attorney: 'What is the full name of the person granting the power?',
      },
      attorneyName: {
        tenancy_agreement: '',
        affidavit: '',
        power_of_attorney: 'What is the full name of the attorney-in-fact?',
      },
      powers: {
        tenancy_agreement: '',
        affidavit: '',
        power_of_attorney: 'What specific powers are being granted to the attorney?',
      },
    };

    return questionMap[field]?.[documentType] || null;
  }

  private buildEnhancedTranscript(
    originalTranscript: string,
    clarifications: Array<{ question: string; answer: string }>
  ): string {
    let enhanced = originalTranscript;

    enhanced += '\n\nAdditional clarifications provided:\n';
    clarifications.forEach((clarification, index) => {
      enhanced += `Q${index + 1}: ${clarification.question}\n`;
      enhanced += `A${index + 1}: ${clarification.answer}\n\n`;
    });

    return enhanced;
  }

  private buildContextualPrompt(context: ConversationContext): string {
    let contextPrompt = '\n\nAdditional context:\n';
    
    contextPrompt += `- Document type: ${context.documentType}\n`;
    contextPrompt += `- Nigerian state: ${context.state}\n`;
    contextPrompt += `- Language: ${context.language}\n`;

    if (context.previousExtractions.length > 0) {
      contextPrompt += '- Previous extraction attempts available for reference\n';
    }

    if (context.clarificationHistory.length > 0) {
      contextPrompt += '- Previous clarifications:\n';
      context.clarificationHistory.forEach((item, index) => {
        contextPrompt += `  ${index + 1}. Q: ${item.question} A: ${item.answer}\n`;
      });
    }

    return contextPrompt;
  }

  private async validateField(
    field: string,
    value: any,
    validationRule: string,
    language: Language
  ): Promise<{
    isValid: boolean;
    reason?: string;
    suggestion?: string;
  }> {
    // Basic validation for common fields
    switch (field) {
      case 'rentAmount':
      case 'depositAmount':
        const amount = parseFloat(value);
        if (isNaN(amount) || amount <= 0) {
          return {
            isValid: false,
            reason: 'Amount must be a positive number',
            suggestion: 'Please provide the amount in Nigerian Naira as a number',
          };
        }
        return { isValid: true };

      case 'duration':
        const duration = parseInt(value);
        if (isNaN(duration) || duration <= 0) {
          return {
            isValid: false,
            reason: 'Duration must be a positive number of months',
            suggestion: 'Please specify the duration in months (e.g., 12 for one year)',
          };
        }
        return { isValid: true };

      case 'startDate':
      case 'endDate':
      case 'swornDate':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          return {
            isValid: false,
            reason: 'Invalid date format',
            suggestion: 'Please provide date in DD/MM/YYYY or YYYY-MM-DD format',
          };
        }
        return { isValid: true };

      default:
        // For other fields, check if they contain reasonable content
        if (typeof value === 'string' && value.trim().length < 2) {
          return {
            isValid: false,
            reason: 'Field appears to be incomplete',
            suggestion: 'Please provide more detailed information',
          };
        }
        return { isValid: true };
    }
  }

  private calculateExtractionConfidence(data: any, prompt: ExtractionPrompt): number {
    const requiredFieldsProvided = prompt.requiredFields.filter(
      field => data[field] && data[field] !== ''
    ).length;

    const optionalFieldsProvided = prompt.optionalFields.filter(
      field => data[field] && data[field] !== ''
    ).length;

    const requiredCompleteness = requiredFieldsProvided / prompt.requiredFields.length;
    const optionalCompleteness = prompt.optionalFields.length > 0 ? 
      optionalFieldsProvided / prompt.optionalFields.length : 1;

    // Weight required fields more heavily
    return Math.min(1, (requiredCompleteness * 0.8) + (optionalCompleteness * 0.2));
  }

  // Normalization helper methods

  private normalizeNigerianNames(text: string): string {
    // Common Nigerian name patterns and normalizations
    const namePatterns: Record<string, string> = {
      'mr\\.?\\s+': 'Mr. ',
      'mrs\\.?\\s+': 'Mrs. ',
      'dr\\.?\\s+': 'Dr. ',
      'prof\\.?\\s+': 'Prof. ',
      'chief\\s+': 'Chief ',
      'alhaji\\s+': 'Alhaji ',
      'alhaja\\s+': 'Alhaja ',
    };

    let normalized = text;
    for (const [pattern, replacement] of Object.entries(namePatterns)) {
      normalized = normalized.replace(new RegExp(pattern, 'gi'), replacement);
    }

    return normalized;
  }

  private normalizeNigerianLocations(text: string): string {
    // Nigerian state and city normalizations
    const locationPatterns: Record<string, string> = {
      'lag[o]?s': 'Lagos',
      'abj|abuja|fct': 'Abuja',
      'ph|port\\s*harcourt': 'Port Harcourt',
      'kano': 'Kano',
      'ibadan': 'Ibadan',
      'kaduna': 'Kaduna',
      'jos': 'Jos',
      'calabar': 'Calabar',
      'maiduguri': 'Maiduguri',
      'zaria': 'Zaria',
    };

    let normalized = text;
    for (const [pattern, replacement] of Object.entries(locationPatterns)) {
      normalized = normalized.replace(new RegExp(`\\b${pattern}\\b`, 'gi'), replacement);
    }

    return normalized;
  }

  private normalizeNigerianCurrency(text: string): string {
    // Normalize Nigerian currency mentions
    return text
      .replace(/\b(naira|ngn|₦)\b/gi, 'Naira')
      .replace(/\b(\d+)\s*(k|thousand)\b/gi, (match, num) => {
        return (parseInt(num) * 1000).toString();
      })
      .replace(/\b(\d+)\s*(m|million)\b/gi, (match, num) => {
        return (parseInt(num) * 1000000).toString();
      });
  }

  private normalizeDates(text: string): string {
    // Normalize common date formats used in Nigeria
    return text
      .replace(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g, (match, day, month, year) => {
        const fullYear = year.length === 2 ? `20${year}` : year;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${fullYear}`;
      });
  }

  private normalizeNigerianEnglish(text: string): string {
    // Handle Nigerian English variations
    const variations: Record<string, string> = {
      'at the back of': 'behind',
      'on top of': 'above',
      'how far': 'how are you',
      'no wahala': 'no problem',
    };

    let normalized = text;
    for (const [variation, standard] of Object.entries(variations)) {
      normalized = normalized.replace(new RegExp(variation, 'gi'), standard);
    }

    return normalized;
  }

  private normalizeNigerianAddress(address: string): string {
    if (!address) return address;

    return address
      .replace(/\bst\.?\b/gi, 'Street')
      .replace(/\brd\.?\b/gi, 'Road')
      .replace(/\bave\.?\b/gi, 'Avenue')
      .replace(/\bclose?\b/gi, 'Close')
      .replace(/\bcrescent?\b/gi, 'Crescent')
      .replace(/\bestate?\b/gi, 'Estate')
      .replace(/\bgra\b/gi, 'GRA')
      .replace(/\bvictoria island\b/gi, 'Victoria Island')
      .replace(/\bikoyi\b/gi, 'Ikoyi')
      .replace(/\blagos island\b/gi, 'Lagos Island');
  }

  private normalizeAmount(amount: any): number | undefined {
    if (!amount) return undefined;
    
    const numStr = amount.toString().replace(/[₦,\s]/g, '');
    const num = parseFloat(numStr);
    
    return isNaN(num) ? undefined : num;
  }

  private normalizeDate(date: any): string | undefined {
    if (!date) return undefined;
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return undefined;
      
      return dateObj.toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  }

  private normalizeName(name: any): string | undefined {
    if (!name || typeof name !== 'string') return undefined;
    
    return name
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private initializeExtractionPrompts(): void {
    // Tenancy Agreement Extraction Prompt
    const tenancyPrompt: ExtractionPrompt = {
      systemPrompt: `You are an expert Nigerian legal document assistant specializing in extracting information from voice conversations to create tenancy agreements. Your task is to extract structured data from the conversation transcript.

Extract the following information for a Nigerian tenancy agreement:
- Landlord details (name, address, contact)
- Tenant details (name, address, contact)
- Property details (address, type, description)
- Financial terms (rent amount, deposit, payment schedule)
- Tenancy terms (duration, start date, end date)
- Special conditions or clauses mentioned

Return the extracted data as a JSON object. If information is unclear or missing, use null values. Be precise with amounts and dates. Consider Nigerian naming conventions and address formats.

Required fields: landlordName, tenantName, propertyAddress, rentAmount, duration, startDate
Optional fields: landlordAddress, tenantAddress, depositAmount, endDate, propertyType, specialClauses, noticePeriod`,

      userPrompt: `Extract tenancy agreement information from the following Nigerian voice conversation transcript. Pay attention to:

1. Names and titles (Mr., Mrs., Chief, Alhaji, etc.)
2. Nigerian addresses (GRA, Victoria Island, estate names, etc.)
3. Currency amounts in Naira (₦)
4. Duration in months or years
5. Nigerian date formats
6. Property types common in Nigeria

Return only valid JSON with the extracted information.`,

      requiredFields: ['landlordName', 'tenantName', 'propertyAddress', 'rentAmount', 'duration', 'startDate'],
      optionalFields: ['landlordAddress', 'tenantAddress', 'depositAmount', 'endDate', 'propertyType', 'specialClauses', 'noticePeriod'],
      validationRules: {
        rentAmount: 'Must be a positive number in Naira',
        duration: 'Must be a positive number of months',
        startDate: 'Must be a valid date in DD/MM/YYYY format',
      },
    };

    this.extractionPrompts.set('tenancy_agreement', tenancyPrompt);

    // Affidavit Extraction Prompt
    const affidavitPrompt: ExtractionPrompt = {
      systemPrompt: `You are an expert Nigerian legal document assistant specializing in extracting information from voice conversations to create affidavits. Extract structured data for a Nigerian affidavit.

Extract the following information:
- Deponent details (name, address, occupation, age)
- Facts being sworn to
- Purpose of the affidavit
- Location where sworn
- Date of swearing
- Supporting details or evidence mentioned

Return as JSON object. Consider Nigerian legal terminology and Evidence Act 2011 requirements.

Required fields: deponentName, facts, purpose, location, swornDate
Optional fields: deponentAddress, deponentOccupation, deponentAge, witnessName, additionalFacts`,

      userPrompt: `Extract affidavit information from the following Nigerian voice conversation transcript. Pay attention to:

1. The person making the affidavit (deponent)
2. Specific facts being sworn to
3. Purpose or reason for the affidavit
4. Nigerian locations and jurisdictions
5. Legal terminology and requirements

Return only valid JSON with the extracted information.`,

      requiredFields: ['deponentName', 'facts', 'purpose', 'location', 'swornDate'],
      optionalFields: ['deponentAddress', 'deponentOccupation', 'deponentAge', 'witnessName', 'additionalFacts'],
      validationRules: {
        facts: 'Must contain specific factual statements',
        swornDate: 'Must be a valid date',
      },
    };

    this.extractionPrompts.set('affidavit', affidavitPrompt);

    // Power of Attorney Extraction Prompt
    const poaPrompt: ExtractionPrompt = {
      systemPrompt: `You are an expert Nigerian legal document assistant specializing in extracting information from voice conversations to create power of attorney documents. Extract structured data for a Nigerian power of attorney.

Extract the following information:
- Principal/Grantor details (name, address)
- Attorney-in-fact details (name, address)
- Powers being granted (specific or general)
- Duration of the power
- Purpose or reason for granting power
- Limitations or restrictions
- Execution details

Return as JSON object. Consider Nigerian Powers of Attorney Act requirements.

Required fields: grantorName, attorneyName, powers, purpose
Optional fields: grantorAddress, attorneyAddress, duration, limitations, executionDate, witnessNames`,

      userPrompt: `Extract power of attorney information from the following Nigerian voice conversation transcript. Pay attention to:

1. The person granting the power (principal/grantor)
2. The person receiving the power (attorney-in-fact)
3. Specific powers being granted
4. Duration and limitations
5. Purpose for granting the power

Return only valid JSON with the extracted information.`,

      requiredFields: ['grantorName', 'attorneyName', 'powers', 'purpose'],
      optionalFields: ['grantorAddress', 'attorneyAddress', 'duration', 'limitations', 'executionDate', 'witnessNames'],
      validationRules: {
        powers: 'Must specify the powers being granted',
        purpose: 'Must state the purpose for granting power',
      },
    };

    this.extractionPrompts.set('power_of_attorney', poaPrompt);
  }

  private initializeNigerianPatterns(): void {
    // Nigerian-specific patterns for better extraction
    this.nigerianContextPatterns.set(
      'currency',
      /(?:₦|naira|ngn)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    );

    this.nigerianContextPatterns.set(
      'states',
      /\b(lagos|abuja|kano|rivers|kaduna|oyo|edo|delta|anambra|imo|abia|enugu|cross river|akwa ibom|bayelsa|benue|borno|ebonyi|ekiti|gombe|jigawa|kebbi|kogi|kwara|nasarawa|niger|ogun|ondo|osun|plateau|sokoto|taraba|yobe|zamfara|adamawa|bauchi|federal capital territory|fct)\b/gi
    );

    this.nigerianContextPatterns.set(
      'titles',
      /\b(mr|mrs|miss|dr|prof|chief|alhaji|alhaja|sir|dame|justice|hon|rt\.?\s*hon|his|her)\b\.?\s*/gi
    );

    this.nigerianContextPatterns.set(
      'locations',
      /\b(victoria island|ikoyi|lekki|surulere|ikeja|yaba|lagos island|mainland|gra|government reserved area|estate|close|crescent|street|road|avenue)\b/gi
    );
  }
}

export default VoiceExtractor;
