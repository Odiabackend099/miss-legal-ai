// Advanced Document Generation routes for MISS Legal AI
import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { authMiddleware } from '@/middleware/auth';
import { rateLimitMiddleware } from '@/middleware/rateLimit';
import { db } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { DocumentGenerator } from '@/services/documents/generator';
import { TemplateManager } from '@/services/documents/template-manager';
import { LegalValidator } from '@/services/documents/legal-validator';
import { VoiceExtractor } from '@/services/documents/voice-extractor';
import { 
  DocumentTypeSchema, 
  DocumentDataSchema, 
  LanguageSchema,
  type DocumentType,
  type Language,
  type DocumentData,
} from '@/types';

const documents = new Hono();

// Initialize services
const documentGenerator = new DocumentGenerator();
const templateManager = new TemplateManager();
const legalValidator = new LegalValidator();
const voiceExtractor = new VoiceExtractor();

// Apply middleware
documents.use('*', authMiddleware);
documents.use('*', rateLimitMiddleware('documents'));

// Validation schemas
const generateDocumentSchema = z.object({
  documentType: DocumentTypeSchema,
  language: LanguageSchema.default('english'),
  state: z.string().default('Lagos'),
  voiceTranscript: z.string().optional(),
  extractedData: DocumentDataSchema.optional(),
  templateId: z.string().optional(),
  customizations: z.record(z.any()).optional(),
});

const updateDocumentSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  status: z.enum(['draft', 'review', 'final', 'signed']).optional(),
  data: DocumentDataSchema.optional(),
});

const voiceToDocumentSchema = z.object({
  documentType: DocumentTypeSchema,
  transcript: z.string().min(10),
  language: LanguageSchema.default('english'),
  state: z.string().default('Lagos'),
});

const clarificationSchema = z.object({
  sessionId: z.string().uuid(),
  clarifications: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
});

const previewDocumentSchema = z.object({
  documentType: DocumentTypeSchema,
  data: DocumentDataSchema,
  templateId: z.string().optional(),
  language: LanguageSchema.default('english'),
  state: z.string().default('Lagos'),
});

// ==============================================
// DOCUMENT GENERATION ENDPOINTS
// ==============================================

// Generate document from voice or data
documents.post('/generate', zValidator('json', generateDocumentSchema), async (c) => {
  try {
    const user = c.get('user');
    const requestData = c.req.valid('json');

    logger.info('Starting document generation', {
      userId: user.id,
      documentType: requestData.documentType,
      hasVoiceTranscript: !!requestData.voiceTranscript,
    });

    // Track progress (for WebSocket implementation)
    const progressCallback = (progress: any) => {
      // In a real implementation, this would send progress via WebSocket
      logger.info('Document generation progress', { progress, userId: user.id });
    };

    const result = await documentGenerator.generateDocument({
      documentType: requestData.documentType,
      voiceTranscript: requestData.voiceTranscript,
      extractedData: requestData.extractedData,
      language: requestData.language,
      state: requestData.state,
      userId: user.id,
      templateId: requestData.templateId,
      customizations: requestData.customizations,
    }, progressCallback);

    return c.json({
      success: true,
      data: {
        document: result.document,
        validationResults: result.validationResults,
        confidence: result.confidence,
        processingTimeMs: result.processingTimeMs,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        processingTime: result.processingTimeMs,
      },
    }, 201);
  } catch (error) {
    logger.error('Document generation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: c.get('user')?.id 
    });
    
    return c.json({
      success: false,
      error: {
        code: 'DOCUMENT_GENERATION_FAILED',
        message: 'Failed to generate document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500);
  }
});

// Voice-to-document extraction
documents.post('/voice-extract', zValidator('json', voiceToDocumentSchema), async (c) => {
  try {
    const user = c.get('user');
    const { documentType, transcript, language, state } = c.req.valid('json');

    logger.info('Starting voice extraction', {
      userId: user.id,
      documentType,
      transcriptLength: transcript.length,
    });

    const extractedData = await voiceExtractor.extractFromVoice(
      transcript,
      documentType,
      language
    );

    // Validate extraction
    const validation = await voiceExtractor.validateExtraction(
      extractedData,
      documentType,
      language
    );

    // Generate clarification questions if needed
    const clarificationQuestions = await voiceExtractor.generateClarificationQuestions(
      extractedData,
      documentType,
      language
    );

    return c.json({
      success: true,
      data: {
        extractedData,
        validation,
        clarificationQuestions,
        confidence: extractedData._extractionMetadata?.confidence || 0,
      },
    });
  } catch (error) {
    logger.error('Voice extraction failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: c.get('user')?.id 
    });
    
    return c.json({
      success: false,
      error: {
        code: 'VOICE_EXTRACTION_FAILED',
        message: 'Failed to extract data from voice',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500);
  }
});

// Extract with clarifications
documents.post('/voice-clarify', zValidator('json', clarificationSchema), async (c) => {
  try {
    const user = c.get('user');
    const { sessionId, clarifications } = c.req.valid('json');

    // Get original session data from database
    const { data: sessionData, error } = await db.client
      .from('voice_document_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();

    if (error || !sessionData) {
      return c.json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Voice extraction session not found',
        },
      }, 404);
    }

    // Extract with clarifications
    const extractedData = await voiceExtractor.extractWithClarification(
      sessionData.voice_transcript,
      sessionData.document_type,
      clarifications,
      sessionData.language
    );

    // Update session with new data
    const { error: updateError } = await db.client
      .from('voice_document_sessions')
      .update({
        extracted_data: extractedData,
        clarification_history: [...sessionData.clarification_history, ...clarifications],
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);

    if (updateError) {
      throw updateError;
    }

    return c.json({
      success: true,
      data: { extractedData },
    });
  } catch (error) {
    logger.error('Voice clarification failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: c.get('user')?.id 
    });
    
    return c.json({
      success: false,
      error: {
        code: 'VOICE_CLARIFICATION_FAILED',
        message: 'Failed to process clarifications',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500);
  }
});

// Preview document before generation
documents.post('/preview', zValidator('json', previewDocumentSchema), async (c) => {
  try {
    const user = c.get('user');
    const { documentType, data, templateId, language, state } = c.req.valid('json');

    const preview = await documentGenerator.previewDocument(
      documentType,
      data,
      templateId,
      language,
      state
    );

    return c.json({
      success: true,
      data: preview,
    });
  } catch (error) {
    logger.error('Document preview failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      userId: c.get('user')?.id 
    });
    
    return c.json({
      success: false,
      error: {
        code: 'DOCUMENT_PREVIEW_FAILED',
        message: 'Failed to generate document preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    }, 500);
  }
});

// ==============================================
// TEMPLATE MANAGEMENT ENDPOINTS
// ==============================================

// Get available templates
documents.get('/templates', async (c) => {
  try {
    const documentType = c.req.query('type') as DocumentType;
    const language = (c.req.query('language') as Language) || 'english';
    const state = c.req.query('state') || 'Lagos';

    if (documentType) {
      const templates = await documentGenerator.getAvailableTemplates(
        documentType,
        language,
        state
      );

      return c.json({
        success: true,
        data: templates,
      });
    } else {
      // Get all templates for all document types
      const allTemplates: any[] = [];
      for (const type of ['tenancy_agreement', 'affidavit', 'power_of_attorney'] as DocumentType[]) {
        const templates = await documentGenerator.getAvailableTemplates(
          type,
          language,
          state
        );
        allTemplates.push(...templates);
      }

      return c.json({
        success: true,
        data: allTemplates,
      });
    }
  } catch (error) {
    logger.error('Failed to fetch templates', { 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return c.json({
      success: false,
      error: {
        code: 'FETCH_TEMPLATES_FAILED',
        message: 'Failed to fetch templates',
      },
    }, 500);
  }
});

// ==============================================
// LEGAL VALIDATION ENDPOINTS
// ==============================================

// Validate document compliance
documents.post('/validate', async (c) => {
  try {
    const { documentType, data, state, language } = await c.req.json();

    const validationResult = await legalValidator.validateDocument(
      documentType,
      data,
      state || 'Lagos',
      language || 'english'
    );

    return c.json({
      success: true,
      data: validationResult,
    });
  } catch (error) {
    logger.error('Document validation failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return c.json({
      success: false,
      error: {
        code: 'DOCUMENT_VALIDATION_FAILED',
        message: 'Failed to validate document',
      },
    }, 500);
  }
});

// Get legal requirements
documents.get('/legal-requirements/:documentType', async (c) => {
  try {
    const documentType = c.req.param('documentType') as DocumentType;
    const state = c.req.query('state') || 'Lagos';

    const stampDutyReq = legalValidator.getStampDutyRequirements(documentType, state);
    const witnessReq = legalValidator.getWitnessRequirements(documentType);
    const notarizationRequired = legalValidator.requiresNotarization(documentType);

    return c.json({
      success: true,
      data: {
        stampDuty: stampDutyReq,
        witness: witnessReq,
        notarization: { required: notarizationRequired },
        documentType,
        state,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch legal requirements', { 
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    return c.json({
      success: false,
      error: {
        code: 'FETCH_LEGAL_REQUIREMENTS_FAILED',
        message: 'Failed to fetch legal requirements',
      },
    }, 500);
  }
});

// ==============================================
// DOCUMENT MANAGEMENT ENDPOINTS (CRUD)
// ==============================================

// Get user documents
documents.get('/', async (c) => {
  try {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const type = c.req.query('type');
    const status = c.req.query('status');

    let query = db.client
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (type) {
      query = query.eq('document_type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data: documents, error, count } = await query
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      throw error;
    }

    return c.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: page * limit < (count || 0),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch documents', { error, userId: c.get('user')?.id });
    return c.json({
      success: false,
      error: {
        code: 'FETCH_DOCUMENTS_FAILED',
        message: 'Failed to fetch documents',
      },
    }, 500);
  }
});

// Get specific document
documents.get('/:id', async (c) => {
  try {
    const user = c.get('user');
    const documentId = c.req.param('id');

    const { data: document, error } = await db.client
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        }, 404);
      }
      throw error;
    }

    return c.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error('Failed to fetch document', { error, documentId: c.req.param('id') });
    return c.json({
      success: false,
      error: {
        code: 'FETCH_DOCUMENT_FAILED',
        message: 'Failed to fetch document',
      },
    }, 500);
  }
});

// Update document
documents.put('/:id', zValidator('json', updateDocumentSchema), async (c) => {
  try {
    const user = c.get('user');
    const documentId = c.req.param('id');
    const updates = c.req.valid('json');

    // If data is being updated, regenerate the document
    if (updates.data) {
      const result = await documentGenerator.updateDocument(
        documentId,
        updates.data,
        user.id
      );

      return c.json({
        success: true,
        data: result,
      });
    }

    // Otherwise, update normally
    const { data: document, error } = await db.client
      .from('documents')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return c.json({
          success: false,
          error: {
            code: 'DOCUMENT_NOT_FOUND',
            message: 'Document not found',
          },
        }, 404);
      }
      throw error;
    }

    logger.info('Document updated', { documentId, userId: user.id });

    return c.json({
      success: true,
      data: document,
    });
  } catch (error) {
    logger.error('Failed to update document', { error, documentId: c.req.param('id') });
    return c.json({
      success: false,
      error: {
        code: 'UPDATE_DOCUMENT_FAILED',
        message: 'Failed to update document',
      },
    }, 500);
  }
});

// Download document as PDF
documents.get('/:id/download', async (c) => {
  try {
    const user = c.get('user');
    const documentId = c.req.param('id');
    const format = c.req.query('format') || 'pdf';

    // Get document
    const { data: document, error } = await db.client
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (error || !document) {
      return c.json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found',
        },
      }, 404);
    }

    // Generate PDF or Word document
    const result = await documentGenerator.generateDocument({
      documentType: document.document_type,
      extractedData: document.extracted_data,
      language: document.language,
      state: document.state,
      userId: user.id,
      templateId: document.template_data?.id,
    });

    const buffer = format === 'word' ? result.wordBuffer : result.pdfBuffer;
    const contentType = format === 'word' ? 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
      'application/pdf';
    const extension = format === 'word' ? 'docx' : 'pdf';

    if (!buffer) {
      return c.json({
        success: false,
        error: {
          code: 'DOWNLOAD_FORMAT_NOT_AVAILABLE',
          message: `${format} format not available for this document`,
        },
      }, 400);
    }

    c.header('Content-Type', contentType);
    c.header('Content-Disposition', `attachment; filename="${document.title}.${extension}"`);

    return c.body(buffer);
  } catch (error) {
    logger.error('Failed to download document', { error, documentId: c.req.param('id') });
    return c.json({
      success: false,
      error: {
        code: 'DOWNLOAD_DOCUMENT_FAILED',
        message: 'Failed to download document',
      },
    }, 500);
  }
});

// Delete document
documents.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const documentId = c.req.param('id');

    const { error } = await db.client
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    logger.info('Document deleted', { documentId, userId: user.id });

    return c.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    logger.error('Failed to delete document', { error, documentId: c.req.param('id') });
    return c.json({
      success: false,
      error: {
        code: 'DELETE_DOCUMENT_FAILED',
        message: 'Failed to delete document',
      },
    }, 500);
  }
});

export default documents;
