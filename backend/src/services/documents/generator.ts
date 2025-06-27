// Legal Document Generation Engine for MISS Legal AI
import { documentLogger, logPerformance } from '@/utils/logger';
import { DocumentTemplate, DocumentData, GeneratedDocument, DocumentType, Language } from '@/types';
import { TemplateManager } from './template-manager';
import { LegalValidator } from './legal-validator';
import { PDFGenerator } from './pdf-generator';
import { VoiceExtractor } from './voice-extractor';
import { db } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface DocumentGenerationRequest {
  documentType: DocumentType;
  voiceTranscript?: string;
  extractedData?: Record<string, any>;
  language: Language;
  state?: string; // Nigerian state for state-specific requirements
  userId: string;
  sessionId?: string;
  templateId?: string;
  customizations?: Record<string, any>;
}

interface DocumentGenerationResult {
  document: GeneratedDocument;
  pdfBuffer: Buffer;
  wordBuffer?: Buffer;
  validationResults: {
    isCompliant: boolean;
    warnings: string[];
    missingRequirements: string[];
    recommendations: string[];
  };
  confidence: number;
  processingTimeMs: number;
}

interface DocumentGenerationProgress {
  stage: 'extracting' | 'validating' | 'generating' | 'formatting' | 'completed' | 'error';
  percentage: number;
  message: string;
  data?: Record<string, any>;
}

export class DocumentGenerator {
  private templateManager: TemplateManager;
  private legalValidator: LegalValidator;
  private pdfGenerator: PDFGenerator;
  private voiceExtractor: VoiceExtractor;

  constructor() {
    this.templateManager = new TemplateManager();
    this.legalValidator = new LegalValidator();
    this.pdfGenerator = new PDFGenerator();
    this.voiceExtractor = new VoiceExtractor();
  }

  /**
   * Generate a legal document from voice input or structured data
   */
  async generateDocument(
    request: DocumentGenerationRequest,
    onProgress?: (progress: DocumentGenerationProgress) => void
  ): Promise<DocumentGenerationResult> {
    const startTime = Date.now();
    
    try {
      documentLogger.info('Starting document generation', {
        documentType: request.documentType,
        language: request.language,
        userId: request.userId,
        hasVoiceTranscript: !!request.voiceTranscript,
      });

      // Stage 1: Extract structured data from voice/input
      onProgress?.({
        stage: 'extracting',
        percentage: 10,
        message: 'Extracting information from voice input...',
      });

      const extractedData = await this.extractDocumentData(request);

      // Stage 2: Validate legal requirements
      onProgress?.({
        stage: 'validating',
        percentage: 30,
        message: 'Validating legal requirements...',
      });

      const validationResults = await this.validateDocumentData(
        request.documentType,
        extractedData,
        request.state,
        request.language
      );

      // Stage 3: Generate document content
      onProgress?.({
        stage: 'generating',
        percentage: 50,
        message: 'Generating document content...',
      });

      const document = await this.assembleDocument(
        request.documentType,
        extractedData,
        request.templateId,
        request.language,
        request.state,
        request.customizations
      );

      // Stage 4: Format and create output files
      onProgress?.({
        stage: 'formatting',
        percentage: 80,
        message: 'Formatting document and generating PDF...',
      });

      const { pdfBuffer, wordBuffer } = await this.generateOutputFiles(document);

      // Stage 5: Save to database
      const savedDocument = await this.saveDocument(document, request.userId, request.sessionId);

      const processingTime = Date.now() - startTime;

      onProgress?.({
        stage: 'completed',
        percentage: 100,
        message: 'Document generation completed successfully!',
        data: { documentId: savedDocument.id },
      });

      logPerformance('Document generation', processingTime, {
        documentType: request.documentType,
        language: request.language,
        pdfSize: pdfBuffer.length,
        validationScore: validationResults.isCompliant ? 1 : 0.5,
      });

      return {
        document: savedDocument,
        pdfBuffer,
        wordBuffer,
        validationResults,
        confidence: this.calculateConfidence(extractedData, validationResults),
        processingTimeMs: processingTime,
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      documentLogger.error('Document generation failed', {
        documentType: request.documentType,
        userId: request.userId,
        processingTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      onProgress?.({
        stage: 'error',
        percentage: 0,
        message: `Document generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });

      throw error;
    }
  }

  /**
   * Generate multiple documents in batch
   */
  async generateBatchDocuments(
    requests: DocumentGenerationRequest[],
    onProgress?: (overallProgress: number, currentDocument: string) => void
  ): Promise<DocumentGenerationResult[]> {
    const results: DocumentGenerationResult[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      
      onProgress?.(
        Math.round((i / requests.length) * 100),
        `${request.documentType} (${i + 1}/${requests.length})`
      );

      try {
        const result = await this.generateDocument(request);
        results.push(result);
      } catch (error) {
        documentLogger.error('Batch document generation failed for document', {
          documentType: request.documentType,
          index: i,
          error,
        });
        
        // Continue with other documents even if one fails
        continue;
      }
    }

    onProgress?.(100, 'Batch generation completed');
    return results;
  }

  /**
   * Extract structured data from voice transcript or existing data
   */
  private async extractDocumentData(request: DocumentGenerationRequest): Promise<DocumentData> {
    if (request.extractedData) {
      return request.extractedData as DocumentData;
    }

    if (request.voiceTranscript) {
      return await this.voiceExtractor.extractFromVoice(
        request.voiceTranscript,
        request.documentType,
        request.language
      );
    }

    throw new Error('Either voiceTranscript or extractedData must be provided');
  }

  /**
   * Validate document data against legal requirements
   */
  private async validateDocumentData(
    documentType: DocumentType,
    data: DocumentData,
    state?: string,
    language?: Language
  ): Promise<{
    isCompliant: boolean;
    warnings: string[];
    missingRequirements: string[];
    recommendations: string[];
  }> {
    return await this.legalValidator.validateDocument(
      documentType,
      data,
      state || 'Lagos', // Default to Lagos state
      language || 'english'
    );
  }

  /**
   * Assemble the final document from template and data
   */
  private async assembleDocument(
    documentType: DocumentType,
    data: DocumentData,
    templateId?: string,
    language?: Language,
    state?: string,
    customizations?: Record<string, any>
  ): Promise<GeneratedDocument> {
    // Get appropriate template
    const template = await this.templateManager.getTemplate(
      documentType,
      templateId,
      language || 'english',
      state || 'Lagos'
    );

    // Apply customizations if provided
    const finalTemplate = customizations ? 
      await this.templateManager.customizeTemplate(template, customizations) : 
      template;

    // Generate document content
    const content = await this.templateManager.processTemplate(finalTemplate, data);

    // Create document metadata
    const document: GeneratedDocument = {
      id: uuidv4(),
      documentType,
      title: this.generateDocumentTitle(documentType, data),
      content,
      template: finalTemplate,
      data,
      language: language || 'english',
      state: state || 'Lagos',
      version: 1,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {
        generationMethod: 'voice-to-document',
        templateId: finalTemplate.id,
        confidence: this.calculateDataConfidence(data),
        wordCount: content.split(/\s+/).length,
        legalCompliance: true, // Will be updated by validation
      },
    };

    return document;
  }

  /**
   * Generate PDF and Word output files
   */
  private async generateOutputFiles(document: GeneratedDocument): Promise<{
    pdfBuffer: Buffer;
    wordBuffer?: Buffer;
  }> {
    // Generate PDF with professional legal formatting
    const pdfBuffer = await this.pdfGenerator.generatePDF(document, {
      format: 'legal',
      watermark: document.status === 'draft' ? 'DRAFT' : undefined,
      includeSignatureLines: this.requiresSignature(document.documentType),
      includeNotarization: this.requiresNotarization(document.documentType),
    });

    // Generate Word document for editing (optional)
    let wordBuffer: Buffer | undefined;
    try {
      wordBuffer = await this.pdfGenerator.generateWordDocument(document);
    } catch (error) {
      documentLogger.warn('Word document generation failed', {
        documentId: document.id,
        error,
      });
    }

    return { pdfBuffer, wordBuffer };
  }

  /**
   * Save document to database
   */
  private async saveDocument(
    document: GeneratedDocument,
    userId: string,
    sessionId?: string
  ): Promise<GeneratedDocument> {
    try {
      const { data: savedDocument } = await db.client
        .from('documents')
        .insert({
          id: document.id,
          user_id: userId,
          session_id: sessionId,
          document_type: document.documentType,
          title: document.title,
          content: document.content,
          template_data: document.template,
          extracted_data: document.data,
          language: document.language,
          state: document.state,
          version: document.version,
          status: document.status,
          metadata: document.metadata,
          created_at: document.createdAt,
          updated_at: document.updatedAt,
        })
        .select()
        .single();

      if (!savedDocument) {
        throw new Error('Failed to save document to database');
      }

      documentLogger.info('Document saved successfully', {
        documentId: document.id,
        userId,
        documentType: document.documentType,
      });

      return document;
    } catch (error) {
      documentLogger.error('Failed to save document', {
        documentId: document.id,
        userId,
        error,
      });
      throw error;
    }
  }

  /**
   * Get document generation templates for specific type
   */
  async getAvailableTemplates(
    documentType: DocumentType,
    language?: Language,
    state?: string
  ): Promise<DocumentTemplate[]> {
    return await this.templateManager.getTemplatesByType(
      documentType,
      language || 'english',
      state || 'Lagos'
    );
  }

  /**
   * Preview document before final generation
   */
  async previewDocument(
    documentType: DocumentType,
    data: DocumentData,
    templateId?: string,
    language?: Language,
    state?: string
  ): Promise<{
    preview: string;
    estimatedLength: number;
    missingFields: string[];
    validationWarnings: string[];
  }> {
    try {
      // Get template
      const template = await this.templateManager.getTemplate(
        documentType,
        templateId,
        language || 'english',
        state || 'Lagos'
      );

      // Generate preview content
      const preview = await this.templateManager.processTemplate(template, data, { preview: true });

      // Check for missing fields
      const missingFields = this.templateManager.getMissingFields(template, data);

      // Get validation warnings
      const validation = await this.validateDocumentData(documentType, data, state, language);

      return {
        preview,
        estimatedLength: preview.split(/\s+/).length,
        missingFields,
        validationWarnings: validation.warnings,
      };
    } catch (error) {
      documentLogger.error('Document preview failed', {
        documentType,
        error,
      });
      throw error;
    }
  }

  /**
   * Update existing document
   */
  async updateDocument(
    documentId: string,
    updates: Partial<DocumentData>,
    userId: string
  ): Promise<GeneratedDocument> {
    try {
      // Get existing document
      const { data: existingDoc } = await db.client
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();

      if (!existingDoc) {
        throw new Error('Document not found or access denied');
      }

      // Merge updates with existing data
      const updatedData = { ...existingDoc.extracted_data, ...updates };

      // Regenerate document with updated data
      const result = await this.generateDocument({
        documentType: existingDoc.document_type,
        extractedData: updatedData,
        language: existingDoc.language,
        state: existingDoc.state,
        userId,
        templateId: existingDoc.template_data?.id,
      });

      // Update database record
      await db.client
        .from('documents')
        .update({
          content: result.document.content,
          extracted_data: updatedData,
          version: existingDoc.version + 1,
          updated_at: new Date().toISOString(),
          metadata: result.document.metadata,
        })
        .eq('id', documentId);

      return result.document;
    } catch (error) {
      documentLogger.error('Document update failed', {
        documentId,
        userId,
        error,
      });
      throw error;
    }
  }

  // Helper methods

  private calculateConfidence(data: DocumentData, validationResults: any): number {
    const dataCompleteness = this.calculateDataConfidence(data);
    const validationScore = validationResults.isCompliant ? 1.0 : 0.6;
    const warningPenalty = Math.max(0, 1 - (validationResults.warnings.length * 0.1));
    
    return Math.min(1.0, dataCompleteness * validationScore * warningPenalty);
  }

  private calculateDataConfidence(data: DocumentData): number {
    const requiredFields = this.getRequiredFieldsForType(data.documentType || 'tenancy_agreement');
    const providedFields = Object.keys(data).filter(key => 
      data[key] !== null && data[key] !== undefined && data[key] !== ''
    );
    
    return Math.min(1.0, providedFields.length / requiredFields.length);
  }

  private getRequiredFieldsForType(documentType: string): string[] {
    const fieldMap: Record<string, string[]> = {
      'tenancy_agreement': [
        'landlordName', 'tenantName', 'propertyAddress', 'rentAmount', 
        'duration', 'startDate', 'depositAmount'
      ],
      'affidavit': [
        'deponentName', 'facts', 'purpose', 'swornDate', 'location'
      ],
      'power_of_attorney': [
        'grantorName', 'attorneyName', 'powers', 'duration', 'purpose'
      ],
    };

    return fieldMap[documentType] || [];
  }

  private generateDocumentTitle(documentType: DocumentType, data: DocumentData): string {
    const titles: Record<DocumentType, (data: DocumentData) => string> = {
      'tenancy_agreement': (data) => 
        `Tenancy Agreement - ${data.propertyAddress || 'Property'} (${data.startDate || 'Date TBD'})`,
      'affidavit': (data) => 
        `Affidavit of ${data.purpose || 'General Purpose'} - ${data.deponentName || 'Deponent'}`,
      'power_of_attorney': (data) => 
        `Power of Attorney - ${data.purpose || 'General Powers'} (${data.grantorName || 'Grantor'})`,
    };

    return titles[documentType]?.(data) || `${documentType} Document`;
  }

  private requiresSignature(documentType: DocumentType): boolean {
    return ['tenancy_agreement', 'power_of_attorney'].includes(documentType);
  }

  private requiresNotarization(documentType: DocumentType): boolean {
    return ['affidavit', 'power_of_attorney'].includes(documentType);
  }
}

export default DocumentGenerator;
