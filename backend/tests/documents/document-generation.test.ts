// Tests for Document Generation System
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { DocumentGenerator } from '@/services/documents/generator';
import { TemplateManager } from '@/services/documents/template-manager';
import { LegalValidator } from '@/services/documents/legal-validator';
import { VoiceExtractor } from '@/services/documents/voice-extractor';
import { PDFGenerator } from '@/services/documents/pdf-generator';
import { DocumentType, Language, DocumentData } from '@/types';

// Mock external dependencies
vi.mock('@/integrations/openai/client');
vi.mock('@/integrations/supabase/client');
vi.mock('@/utils/logger');

describe('Document Generation System', () => {
  let documentGenerator: DocumentGenerator;
  let templateManager: TemplateManager;
  let legalValidator: LegalValidator;
  let voiceExtractor: VoiceExtractor;
  let pdfGenerator: PDFGenerator;

  beforeEach(() => {
    documentGenerator = new DocumentGenerator();
    templateManager = new TemplateManager();
    legalValidator = new LegalValidator();
    voiceExtractor = new VoiceExtractor();
    pdfGenerator = new PDFGenerator();
  });

  describe('DocumentGenerator', () => {
    test('should generate a tenancy agreement from voice input', async () => {
      const voiceTranscript = `
        I want to create a tenancy agreement. The landlord is John Doe and the tenant is Jane Smith.
        The property is located at 123 Lagos Street, Victoria Island, Lagos. 
        The annual rent is 500,000 naira and the tenancy is for 12 months starting January 1st, 2024.
      `;

      const result = await documentGenerator.generateDocument({
        documentType: 'tenancy_agreement',
        voiceTranscript,
        language: 'english',
        state: 'Lagos',
        userId: 'test-user-id',
      });

      expect(result).toBeDefined();
      expect(result.document).toBeDefined();
      expect(result.document.documentType).toBe('tenancy_agreement');
      expect(result.document.title).toContain('Tenancy Agreement');
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.validationResults).toBeDefined();
    });

    test('should generate an affidavit from structured data', async () => {
      const extractedData: DocumentData = {
        documentType: 'affidavit',
        deponentName: 'John Doe',
        facts: 'I am the rightful owner of the property at 123 Main Street',
        purpose: 'Property ownership verification',
        location: 'Lagos',
        swornDate: '2024-01-15',
      };

      const result = await documentGenerator.generateDocument({
        documentType: 'affidavit',
        extractedData,
        language: 'english',
        state: 'Lagos',
        userId: 'test-user-id',
      });

      expect(result).toBeDefined();
      expect(result.document.documentType).toBe('affidavit');
      expect(result.document.data.deponentName).toBe('John Doe');
      expect(result.pdfBuffer).toBeDefined();
    });

    test('should generate power of attorney document', async () => {
      const extractedData: DocumentData = {
        documentType: 'power_of_attorney',
        grantorName: 'John Doe',
        attorneyName: 'Jane Smith',
        powers: 'General business management and property transactions',
        purpose: 'Business management while traveling',
      };

      const result = await documentGenerator.generateDocument({
        documentType: 'power_of_attorney',
        extractedData,
        language: 'english',
        state: 'Lagos',
        userId: 'test-user-id',
      });

      expect(result).toBeDefined();
      expect(result.document.documentType).toBe('power_of_attorney');
      expect(result.document.data.grantorName).toBe('John Doe');
      expect(result.document.data.attorneyName).toBe('Jane Smith');
    });

    test('should handle missing required fields', async () => {
      const incompleteData: DocumentData = {
        documentType: 'tenancy_agreement',
        landlordName: 'John Doe',
        // Missing required fields like tenant name, property address, etc.
      };

      const result = await documentGenerator.generateDocument({
        documentType: 'tenancy_agreement',
        extractedData: incompleteData,
        language: 'english',
        state: 'Lagos',
        userId: 'test-user-id',
      });

      expect(result.validationResults.missingRequirements.length).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThan(0.5);
    });

    test('should update existing document', async () => {
      // First create a document
      const initialData: DocumentData = {
        documentType: 'tenancy_agreement',
        landlordName: 'John Doe',
        tenantName: 'Jane Smith',
        propertyAddress: '123 Lagos Street',
        rentAmount: 500000,
        duration: 12,
        startDate: '2024-01-01',
      };

      const initialResult = await documentGenerator.generateDocument({
        documentType: 'tenancy_agreement',
        extractedData: initialData,
        language: 'english',
        state: 'Lagos',
        userId: 'test-user-id',
      });

      // Then update it
      const updates: Partial<DocumentData> = {
        rentAmount: 600000,
        depositAmount: 1200000,
      };

      const updatedResult = await documentGenerator.updateDocument(
        initialResult.document.id,
        updates,
        'test-user-id'
      );

      expect(updatedResult.data.rentAmount).toBe(600000);
      expect(updatedResult.data.depositAmount).toBe(1200000);
      expect(updatedResult.version).toBeGreaterThan(initialResult.document.version);
    });
  });

  describe('VoiceExtractor', () => {
    test('should extract tenancy agreement data from voice', async () => {
      const transcript = `
        I need a tenancy agreement. The landlord is Mr. Adebayo Johnson and the tenant is 
        Miss Grace Okafor. The property is at 45 Admiralty Way, Lekki Phase 1, Lagos State.
        The rent is one million naira per year and the agreement is for two years.
        The tenancy starts on March 1st, 2024.
      `;

      const result = await voiceExtractor.extractFromVoice(
        transcript,
        'tenancy_agreement',
        'english'
      );

      expect(result).toBeDefined();
      expect(result.landlordName).toContain('Adebayo Johnson');
      expect(result.tenantName).toContain('Grace Okafor');
      expect(result.propertyAddress).toContain('Admiralty Way');
      expect(result.rentAmount).toBe(1000000);
      expect(result.duration).toBe(24); // 2 years = 24 months
    });

    test('should extract affidavit data from voice', async () => {
      const transcript = `
        I want to make an affidavit. My name is Dr. Emeka Nwankwo. I am swearing that
        I am the legitimate owner of the vehicle with registration number ABC-123-DE.
        I need this for insurance purposes. I am making this oath in Lagos on today's date.
      `;

      const result = await voiceExtractor.extractFromVoice(
        transcript,
        'affidavit',
        'english'
      );

      expect(result).toBeDefined();
      expect(result.deponentName).toContain('Emeka Nwankwo');
      expect(result.facts).toContain('vehicle');
      expect(result.facts).toContain('ABC-123-DE');
      expect(result.purpose).toContain('insurance');
      expect(result.location).toBe('Lagos');
    });

    test('should validate extracted data completeness', async () => {
      const incompleteData: DocumentData = {
        landlordName: 'John Doe',
        // Missing other required fields
      };

      const validation = await voiceExtractor.validateExtraction(
        incompleteData,
        'tenancy_agreement',
        'english'
      );

      expect(validation.isComplete).toBe(false);
      expect(validation.missingRequiredFields.length).toBeGreaterThan(0);
      expect(validation.missingRequiredFields).toContain('tenantName');
      expect(validation.missingRequiredFields).toContain('propertyAddress');
    });

    test('should generate clarification questions', async () => {
      const partialData: DocumentData = {
        documentType: 'power_of_attorney',
        grantorName: 'John Doe',
        // Missing attorney name and powers
      };

      const questions = await voiceExtractor.generateClarificationQuestions(
        partialData,
        'power_of_attorney',
        'english'
      );

      expect(questions.length).toBeGreaterThan(0);
      expect(questions.some(q => q.includes('attorney'))).toBe(true);
      expect(questions.some(q => q.includes('power'))).toBe(true);
    });

    test('should process Nigerian context correctly', async () => {
      const transcript = `
        I want tenancy agreement for my property in GRA Ikeja. 
        The tenant name na Chief Olumide Adebayo. Rent be 2 million naira yearly.
        The agreement go start January first, 2024.
      `;

      const result = await voiceExtractor.extractFromVoice(
        transcript,
        'tenancy_agreement',
        'pidgin'
      );

      expect(result).toBeDefined();
      expect(result.tenantName).toContain('Olumide Adebayo');
      expect(result.propertyAddress).toContain('GRA Ikeja');
      expect(result.rentAmount).toBe(2000000);
    });
  });

  describe('LegalValidator', () => {
    test('should validate tenancy agreement requirements', async () => {
      const data: DocumentData = {
        landlordName: 'John Doe',
        tenantName: 'Jane Smith',
        propertyAddress: '123 Lagos Street, VI, Lagos',
        rentAmount: 500000,
        duration: 12,
        startDate: '2024-01-01',
        depositAmount: 1000000,
      };

      const result = await legalValidator.validateDocument(
        'tenancy_agreement',
        data,
        'Lagos',
        'english'
      );

      expect(result.isCompliant).toBe(true);
      expect(result.complianceScore).toBeGreaterThan(0.8);
      expect(result.missingRequirements.length).toBe(0);
    });

    test('should identify missing affidavit requirements', async () => {
      const incompleteData: DocumentData = {
        deponentName: 'John Doe',
        // Missing facts, purpose, etc.
      };

      const result = await legalValidator.validateDocument(
        'affidavit',
        incompleteData,
        'Lagos',
        'english'
      );

      expect(result.isCompliant).toBe(false);
      expect(result.missingRequirements.length).toBeGreaterThan(0);
      expect(result.missingRequirements.some(req => req.includes('facts'))).toBe(true);
    });

    test('should provide state-specific requirements', async () => {
      const data: DocumentData = {
        landlordName: 'John Doe',
        tenantName: 'Jane Smith',
        propertyAddress: '123 Abuja Street, Garki, FCT',
        rentAmount: 800000,
        duration: 12,
        startDate: '2024-01-01',
      };

      const lagosResult = await legalValidator.validateDocument(
        'tenancy_agreement',
        data,
        'Lagos',
        'english'
      );

      const abujaResult = await legalValidator.validateDocument(
        'tenancy_agreement',
        data,
        'Abuja',
        'english'
      );

      // Different states may have different compliance scores
      expect(lagosResult.stateSpecificIssues).toBeDefined();
      expect(abujaResult.stateSpecificIssues).toBeDefined();
    });

    test('should check stamp duty requirements', async () => {
      const tenancyReq = legalValidator.getStampDutyRequirements('tenancy_agreement', 'Lagos', 500000);
      expect(tenancyReq.required).toBe(true);
      expect(tenancyReq.percentage).toBe(0.78); // 0.78% for Lagos

      const affidavitReq = legalValidator.getStampDutyRequirements('affidavit', 'Lagos');
      expect(affidavitReq.required).toBe(true);
      expect(affidavitReq.amount).toBe(50);
    });

    test('should check witness requirements', async () => {
      const tenancyWitness = legalValidator.getWitnessRequirements('tenancy_agreement');
      expect(tenancyWitness.required).toBe(true);
      expect(tenancyWitness.minimumCount).toBe(2);

      const affidavitWitness = legalValidator.getWitnessRequirements('affidavit');
      expect(affidavitWitness.required).toBe(true);
      expect(affidavitWitness.minimumCount).toBe(1);
    });

    test('should check notarization requirements', async () => {
      expect(legalValidator.requiresNotarization('affidavit')).toBe(true);
      expect(legalValidator.requiresNotarization('power_of_attorney')).toBe(true);
      expect(legalValidator.requiresNotarization('tenancy_agreement')).toBe(false);
    });
  });

  describe('TemplateManager', () => {
    test('should get template for document type', async () => {
      const template = await templateManager.getTemplate(
        'tenancy_agreement',
        undefined,
        'english',
        'Lagos'
      );

      expect(template).toBeDefined();
      expect(template.documentType).toBe('tenancy_agreement');
      expect(template.language).toBe('english');
      expect(template.state).toBe('Lagos');
      expect(template.content).toBeDefined();
    });

    test('should process template with data', async () => {
      const template = await templateManager.getTemplate('tenancy_agreement', undefined, 'english', 'Lagos');
      
      const data: DocumentData = {
        landlordName: 'John Doe',
        tenantName: 'Jane Smith',
        propertyAddress: '123 Lagos Street',
        rentAmount: 500000,
        duration: 12,
        startDate: '2024-01-01',
      };

      const result = await templateManager.processTemplate(template, data);

      expect(result).toBeDefined();
      expect(result).toContain('John Doe');
      expect(result).toContain('Jane Smith');
      expect(result).toContain('123 Lagos Street');
      expect(result).toContain('500,000'); // Formatted currency
    });

    test('should validate template content', async () => {
      const template = await templateManager.getTemplate('affidavit', undefined, 'english', 'Lagos');
      
      const validation = await templateManager.validateTemplate(template);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should identify missing template fields', async () => {
      const template = await templateManager.getTemplate('tenancy_agreement', undefined, 'english', 'Lagos');
      
      const partialData: DocumentData = {
        landlordName: 'John Doe',
        // Missing other required fields
      };

      const missingFields = templateManager.getMissingFields(template, partialData);

      expect(missingFields.length).toBeGreaterThan(0);
      expect(missingFields).toContain('tenantName');
      expect(missingFields).toContain('propertyAddress');
    });

    test('should customize template with additional clauses', async () => {
      const baseTemplate = await templateManager.getTemplate('tenancy_agreement', undefined, 'english', 'Lagos');
      
      const customizations = {
        additionalClauses: ['force_majeure', 'governing_law'],
        customSections: {
          'special_terms': 'This property includes parking space and 24-hour security.'
        }
      };

      const customizedTemplate = await templateManager.customizeTemplate(baseTemplate, customizations);

      expect(customizedTemplate.id).not.toBe(baseTemplate.id);
      expect(customizedTemplate.isCustom).toBe(true);
      expect(customizedTemplate.baseTemplateId).toBe(baseTemplate.id);
      expect(customizedTemplate.content).toContain('force majeure');
    });
  });

  describe('PDFGenerator', () => {
    test('should generate PDF for document', async () => {
      const document = {
        id: 'test-doc-id',
        documentType: 'tenancy_agreement' as DocumentType,
        title: 'Test Tenancy Agreement',
        content: 'TENANCY AGREEMENT\n\nThis agreement is between...',
        template: await templateManager.getTemplate('tenancy_agreement', undefined, 'english', 'Lagos'),
        data: {
          landlordName: 'John Doe',
          tenantName: 'Jane Smith',
        },
        language: 'english' as Language,
        state: 'Lagos',
        version: 1,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          generationMethod: 'voice-to-document' as const,
          templateId: 'test-template',
          confidence: 0.95,
          wordCount: 100,
          legalCompliance: true,
        },
      };

      const pdfBuffer = await pdfGenerator.generatePDF(document);

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(0);
      expect(pdfBuffer).toBeInstanceOf(Buffer);
    });

    test('should generate PDF with signature lines for tenancy agreement', async () => {
      const document = {
        id: 'test-doc-id',
        documentType: 'tenancy_agreement' as DocumentType,
        title: 'Test Tenancy Agreement',
        content: 'TENANCY AGREEMENT\n\nThis agreement is between...',
        template: await templateManager.getTemplate('tenancy_agreement', undefined, 'english', 'Lagos'),
        data: {},
        language: 'english' as Language,
        state: 'Lagos',
        version: 1,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          generationMethod: 'voice-to-document' as const,
          templateId: 'test-template',
          confidence: 0.95,
          wordCount: 100,
          legalCompliance: true,
        },
      };

      const pdfBuffer = await pdfGenerator.generatePDF(document, {
        format: 'legal',
        includeSignatureLines: true,
        includeNotarization: false,
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('should generate PDF with notarization for affidavit', async () => {
      const document = {
        id: 'test-doc-id',
        documentType: 'affidavit' as DocumentType,
        title: 'Test Affidavit',
        content: 'AFFIDAVIT\n\nI, John Doe, do hereby make oath...',
        template: await templateManager.getTemplate('affidavit', undefined, 'english', 'Lagos'),
        data: {},
        language: 'english' as Language,
        state: 'Lagos',
        version: 1,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          generationMethod: 'voice-to-document' as const,
          templateId: 'test-template',
          confidence: 0.95,
          wordCount: 100,
          legalCompliance: true,
        },
      };

      const pdfBuffer = await pdfGenerator.generatePDF(document, {
        format: 'legal',
        includeSignatureLines: true,
        includeNotarization: true,
        watermark: 'DRAFT',
      });

      expect(pdfBuffer).toBeDefined();
      expect(pdfBuffer.length).toBeGreaterThan(0);
    });

    test('should generate Word document', async () => {
      const document = {
        id: 'test-doc-id',
        documentType: 'power_of_attorney' as DocumentType,
        title: 'Test Power of Attorney',
        content: 'POWER OF ATTORNEY\n\nKnow all men by these presents...',
        template: await templateManager.getTemplate('power_of_attorney', undefined, 'english', 'Lagos'),
        data: {},
        language: 'english' as Language,
        state: 'Lagos',
        version: 1,
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          generationMethod: 'voice-to-document' as const,
          templateId: 'test-template',
          confidence: 0.95,
          wordCount: 100,
          legalCompliance: true,
        },
      };

      const wordBuffer = await pdfGenerator.generateWordDocument(document);

      expect(wordBuffer).toBeDefined();
      expect(wordBuffer.length).toBeGreaterThan(0);
      expect(wordBuffer).toBeInstanceOf(Buffer);
    });
  });

  describe('End-to-End Integration Tests', () => {
    test('should complete full voice-to-PDF workflow', async () => {
      const voiceTranscript = `
        I need to create a power of attorney. I am James Okafor and I want to give 
        power to my brother David Okafor to manage my business affairs while I travel abroad.
        He should be able to sign contracts, manage bank accounts, and handle property matters.
        This power should last until I return or until I revoke it in writing.
      `;

      // Step 1: Extract data from voice
      const extractedData = await voiceExtractor.extractFromVoice(
        voiceTranscript,
        'power_of_attorney',
        'english'
      );

      expect(extractedData.grantorName).toContain('James Okafor');
      expect(extractedData.attorneyName).toContain('David Okafor');

      // Step 2: Validate the data
      const validation = await legalValidator.validateDocument(
        'power_of_attorney',
        extractedData,
        'Lagos',
        'english'
      );

      expect(validation).toBeDefined();

      // Step 3: Generate the document
      const result = await documentGenerator.generateDocument({
        documentType: 'power_of_attorney',
        extractedData,
        language: 'english',
        state: 'Lagos',
        userId: 'test-user-id',
      });

      expect(result.document).toBeDefined();
      expect(result.pdfBuffer).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);

      // Step 4: Verify PDF generation
      expect(result.pdfBuffer.length).toBeGreaterThan(0);
    });

    test('should handle multi-language document generation', async () => {
      const data: DocumentData = {
        landlordName: 'Alhaji Musa Ibrahim',
        tenantName: 'Fatima Hassan',
        propertyAddress: 'No. 15 Ahmadu Bello Way, Kaduna',
        rentAmount: 300000,
        duration: 12,
        startDate: '2024-01-01',
      };

      // Generate in English
      const englishResult = await documentGenerator.generateDocument({
        documentType: 'tenancy_agreement',
        extractedData: data,
        language: 'english',
        state: 'Kaduna',
        userId: 'test-user-id',
      });

      // Generate in Hausa (if supported)
      const hausaResult = await documentGenerator.generateDocument({
        documentType: 'tenancy_agreement',
        extractedData: data,
        language: 'hausa',
        state: 'Kaduna',
        userId: 'test-user-id',
      });

      expect(englishResult.document).toBeDefined();
      expect(hausaResult.document).toBeDefined();
      expect(englishResult.document.language).toBe('english');
      expect(hausaResult.document.language).toBe('hausa');
    });

    test('should handle state-specific legal requirements', async () => {
      const data: DocumentData = {
        landlordName: 'Chief Emeka Nwosu',
        tenantName: 'Ada Okonkwo',
        propertyAddress: 'Plot 123, Independence Layout, Enugu',
        rentAmount: 400000,
        duration: 12,
        startDate: '2024-01-01',
      };

      const lagosResult = await documentGenerator.generateDocument({
        documentType: 'tenancy_agreement',
        extractedData: data,
        language: 'english',
        state: 'Lagos',
        userId: 'test-user-id',
      });

      const enuguResult = await documentGenerator.generateDocument({
        documentType: 'tenancy_agreement',
        extractedData: data,
        language: 'english',
        state: 'Enugu',
        userId: 'test-user-id',
      });

      expect(lagosResult.document.state).toBe('Lagos');
      expect(enuguResult.document.state).toBe('Enugu');
      
      // State-specific requirements may affect validation
      expect(lagosResult.validationResults).toBeDefined();
      expect(enuguResult.validationResults).toBeDefined();
    });
  });
});
