// Legal Document Template Manager for MISS Legal AI
import { documentLogger } from '@/utils/logger';
import { DocumentTemplate, DocumentType, Language, DocumentData } from '@/types';
import Handlebars from 'handlebars';
import { v4 as uuidv4 } from 'uuid';

interface TemplateContext {
  documentType: DocumentType;
  language: Language;
  state: string;
  data: DocumentData;
  legalYear: number;
  currentDate: string;
  helpers: Record<string, any>;
}

interface TemplateProcessingOptions {
  preview?: boolean;
  skipValidation?: boolean;
  customHelpers?: Record<string, Function>;
}

interface TemplateCustomization {
  additionalClauses?: string[];
  removedClauses?: string[];
  customSections?: Record<string, string>;
  formatting?: {
    fontSize?: number;
    fontFamily?: string;
    lineSpacing?: number;
    margins?: { top: number; bottom: number; left: number; right: number };
  };
}

export class TemplateManager {
  private templates: Map<string, DocumentTemplate> = new Map();
  private compiledTemplates: Map<string, HandlebarsTemplateDelegate> = new Map();
  private clauseLibrary: Map<string, string> = new Map();

  constructor() {
    this.initializeHandlebarsHelpers();
    this.loadDefaultTemplates();
    this.loadClauseLibrary();
  }

  /**
   * Get template by type and criteria
   */
  async getTemplate(
    documentType: DocumentType,
    templateId?: string,
    language: Language = 'english',
    state: string = 'Lagos'
  ): Promise<DocumentTemplate> {
    try {
      // If specific template ID is provided, use it
      if (templateId) {
        const template = this.templates.get(templateId);
        if (template) {
          return template;
        }
      }

      // Find best matching template
      const templateKey = this.generateTemplateKey(documentType, language, state);
      let template = this.templates.get(templateKey);

      // Fallback to default state/language if specific not found
      if (!template) {
        const fallbackKey = this.generateTemplateKey(documentType, 'english', 'Lagos');
        template = this.templates.get(fallbackKey);
      }

      if (!template) {
        throw new Error(`Template not found for ${documentType}`);
      }

      return template;
    } catch (error) {
      documentLogger.error('Template retrieval failed', {
        documentType,
        templateId,
        language,
        state,
        error,
      });
      throw error;
    }
  }

  /**
   * Get all templates for a specific document type
   */
  async getTemplatesByType(
    documentType: DocumentType,
    language: Language = 'english',
    state?: string
  ): Promise<DocumentTemplate[]> {
    const templates = Array.from(this.templates.values()).filter(template => {
      return template.documentType === documentType &&
             template.language === language &&
             (!state || template.state === state);
    });

    return templates.sort((a, b) => {
      // Prioritize state-specific templates
      if (a.state === state && b.state !== state) return -1;
      if (b.state === state && a.state !== state) return 1;
      
      // Then by rating/usage
      return (b.metadata?.rating || 0) - (a.metadata?.rating || 0);
    });
  }

  /**
   * Process template with data to generate document content
   */
  async processTemplate(
    template: DocumentTemplate,
    data: DocumentData,
    options: TemplateProcessingOptions = {}
  ): Promise<string> {
    try {
      // Get or compile template
      let compiledTemplate = this.compiledTemplates.get(template.id);
      if (!compiledTemplate) {
        compiledTemplate = Handlebars.compile(template.content);
        this.compiledTemplates.set(template.id, compiledTemplate);
      }

      // Prepare context
      const context = this.prepareTemplateContext(template, data, options);

      // Process template
      const result = compiledTemplate(context);

      // Post-process if needed
      return options.preview ? this.generatePreview(result) : result;
    } catch (error) {
      documentLogger.error('Template processing failed', {
        templateId: template.id,
        documentType: template.documentType,
        error,
      });
      throw error;
    }
  }

  /**
   * Customize template with additional clauses and modifications
   */
  async customizeTemplate(
    baseTemplate: DocumentTemplate,
    customizations: TemplateCustomization
  ): Promise<DocumentTemplate> {
    try {
      let customizedContent = baseTemplate.content;

      // Add additional clauses
      if (customizations.additionalClauses && customizations.additionalClauses.length > 0) {
        const additionalClausesText = customizations.additionalClauses
          .map(clauseId => this.clauseLibrary.get(clauseId))
          .filter(Boolean)
          .join('\n\n');

        customizedContent = customizedContent.replace(
          '{{#additionalClauses}}',
          additionalClausesText + '\n\n{{#additionalClauses}}'
        );
      }

      // Remove specified clauses
      if (customizations.removedClauses && customizations.removedClauses.length > 0) {
        customizations.removedClauses.forEach(clauseId => {
          const clausePattern = new RegExp(`{{#${clauseId}}}[\\s\\S]*?{{/${clauseId}}}`, 'g');
          customizedContent = customizedContent.replace(clausePattern, '');
        });
      }

      // Add custom sections
      if (customizations.customSections) {
        Object.entries(customizations.customSections).forEach(([sectionId, content]) => {
          const placeholder = `{{customSection_${sectionId}}}`;
          customizedContent = customizedContent.replace(placeholder, content);
        });
      }

      // Create customized template
      const customizedTemplate: DocumentTemplate = {
        ...baseTemplate,
        id: uuidv4(),
        name: `${baseTemplate.name} (Customized)`,
        content: customizedContent,
        isCustom: true,
        baseTemplateId: baseTemplate.id,
        customizations,
        updatedAt: new Date().toISOString(),
      };

      return customizedTemplate;
    } catch (error) {
      documentLogger.error('Template customization failed', {
        baseTemplateId: baseTemplate.id,
        error,
      });
      throw error;
    }
  }

  /**
   * Validate template content and structure
   */
  async validateTemplate(template: DocumentTemplate): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check template compilation
      const compiled = Handlebars.compile(template.content);
      
      // Test with sample data
      const sampleData = this.generateSampleData(template.documentType);
      const context = this.prepareTemplateContext(template, sampleData);
      compiled(context);

    } catch (error) {
      errors.push(`Template compilation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Check for required sections
    const requiredSections = this.getRequiredSections(template.documentType);
    requiredSections.forEach(section => {
      if (!template.content.includes(`{{${section}}`) && !template.content.includes(`{{#${section}}`)) {
        warnings.push(`Missing recommended section: ${section}`);
      }
    });

    // Check for legal language requirements
    if (template.documentType === 'affidavit' && !template.content.includes('sworn') && !template.content.includes('affirm')) {
      errors.push('Affidavit template must include swearing/affirmation language');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get missing fields for a template with given data
   */
  getMissingFields(template: DocumentTemplate, data: DocumentData): string[] {
    const missingFields: string[] = [];
    
    // Extract all template variables
    const variableRegex = /\{\{\s*(\w+)\s*\}\}/g;
    const matches = template.content.matchAll(variableRegex);
    
    for (const match of matches) {
      const fieldName = match[1];
      if (!data[fieldName] && !this.isHelperOrReserved(fieldName)) {
        missingFields.push(fieldName);
      }
    }

    return [...new Set(missingFields)]; // Remove duplicates
  }

  /**
   * Create a new template
   */
  async createTemplate(templateData: Omit<DocumentTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<DocumentTemplate> {
    const template: DocumentTemplate = {
      ...templateData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validate template
    const validation = await this.validateTemplate(template);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // Store template
    this.templates.set(template.id, template);
    
    // Generate template key for quick lookup
    const templateKey = this.generateTemplateKey(template.documentType, template.language, template.state);
    this.templates.set(templateKey, template);

    documentLogger.info('Template created successfully', {
      templateId: template.id,
      documentType: template.documentType,
      language: template.language,
      state: template.state,
    });

    return template;
  }

  /**
   * Update existing template
   */
  async updateTemplate(templateId: string, updates: Partial<DocumentTemplate>): Promise<DocumentTemplate> {
    const existingTemplate = this.templates.get(templateId);
    if (!existingTemplate) {
      throw new Error('Template not found');
    }

    const updatedTemplate: DocumentTemplate = {
      ...existingTemplate,
      ...updates,
      id: templateId, // Preserve original ID
      updatedAt: new Date().toISOString(),
    };

    // Validate updated template
    const validation = await this.validateTemplate(updatedTemplate);
    if (!validation.isValid) {
      throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
    }

    // Update stored template
    this.templates.set(templateId, updatedTemplate);

    return updatedTemplate;
  }

  // Private helper methods

  private initializeHandlebarsHelpers(): void {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: string | Date, format: string = 'MMMM Do, YYYY') => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    });

    // Currency formatting helper
    Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'NGN') => {
      return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
      }).format(amount);
    });

    // Number to words helper
    Handlebars.registerHelper('numberToWords', (num: number) => {
      return this.numberToWords(num);
    });

    // Uppercase helper
    Handlebars.registerHelper('upper', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Title case helper
    Handlebars.registerHelper('title', (str: string) => {
      return str ? str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
      ) : '';
    });

    // Conditional helper for Nigerian states
    Handlebars.registerHelper('ifState', (state: string, targetState: string, options: any) => {
      return state === targetState ? options.fn(this) : options.inverse(this);
    });

    // Legal clause inclusion helper
    Handlebars.registerHelper('includeClause', (clauseId: string) => {
      return this.clauseLibrary.get(clauseId) || '';
    });

    // Plural helper
    Handlebars.registerHelper('plural', (count: number, singular: string, plural: string) => {
      return count === 1 ? singular : (plural || `${singular}s`);
    });
  }

  private prepareTemplateContext(
    template: DocumentTemplate,
    data: DocumentData,
    options: TemplateProcessingOptions = {}
  ): TemplateContext {
    const currentDate = new Date();
    
    return {
      documentType: template.documentType,
      language: template.language,
      state: template.state,
      data,
      legalYear: currentDate.getFullYear(),
      currentDate: currentDate.toISOString().split('T')[0],
      helpers: {
        ...options.customHelpers,
        isPreview: options.preview || false,
      },
    };
  }

  private generateTemplateKey(documentType: DocumentType, language: Language, state: string): string {
    return `${documentType}_${language}_${state}`;
  }

  private generatePreview(content: string): string {
    // Truncate content for preview and add ellipsis
    const words = content.split(/\s+/);
    if (words.length > 150) {
      return words.slice(0, 150).join(' ') + '...\n\n[Preview truncated - Full document will contain additional content]';
    }
    return content + '\n\n[Preview - Full document will be formatted as PDF]';
  }

  private getRequiredSections(documentType: DocumentType): string[] {
    const requiredSections: Record<DocumentType, string[]> = {
      'tenancy_agreement': [
        'parties', 'property', 'term', 'rent', 'deposit', 'obligations', 'termination'
      ],
      'affidavit': [
        'deponent', 'facts', 'swearing', 'signature', 'notarization'
      ],
      'power_of_attorney': [
        'grantor', 'attorney', 'powers', 'duration', 'limitations', 'execution'
      ],
    };

    return requiredSections[documentType] || [];
  }

  private generateSampleData(documentType: DocumentType): DocumentData {
    const sampleData: Record<DocumentType, DocumentData> = {
      'tenancy_agreement': {
        landlordName: 'John Doe',
        tenantName: 'Jane Smith',
        propertyAddress: '123 Main Street, Lagos',
        rentAmount: 500000,
        duration: 12,
        startDate: '2024-01-01',
        depositAmount: 1000000,
      },
      'affidavit': {
        deponentName: 'John Doe',
        facts: 'Sample facts for testing',
        purpose: 'Identity Verification',
        swornDate: '2024-01-01',
        location: 'Lagos State',
      },
      'power_of_attorney': {
        grantorName: 'John Doe',
        attorneyName: 'Jane Smith',
        powers: 'General business powers',
        duration: 'Until revoked',
        purpose: 'Business management',
      },
    };

    return sampleData[documentType] || {};
  }

  private isHelperOrReserved(fieldName: string): boolean {
    const reservedWords = [
      'if', 'unless', 'each', 'with', 'lookup', 'log',
      'formatDate', 'formatCurrency', 'numberToWords', 'upper', 'title',
      'ifState', 'includeClause', 'plural', 'currentDate', 'legalYear'
    ];
    
    return reservedWords.includes(fieldName);
  }

  private numberToWords(num: number): string {
    const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const teens = ['ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];

    if (num === 0) return 'zero';
    if (num < 0) return 'negative ' + this.numberToWords(-num);

    let result = '';

    if (num >= 1000000) {
      result += this.numberToWords(Math.floor(num / 1000000)) + ' million ';
      num %= 1000000;
    }

    if (num >= 1000) {
      result += this.numberToWords(Math.floor(num / 1000)) + ' thousand ';
      num %= 1000;
    }

    if (num >= 100) {
      result += ones[Math.floor(num / 100)] + ' hundred ';
      num %= 100;
    }

    if (num >= 20) {
      result += tens[Math.floor(num / 10)];
      if (num % 10 !== 0) {
        result += '-' + ones[num % 10];
      }
    } else if (num >= 10) {
      result += teens[num - 10];
    } else if (num > 0) {
      result += ones[num];
    }

    return result.trim();
  }

  private loadDefaultTemplates(): void {
    // Load built-in templates - this would typically load from files or database
    // For now, we'll define basic templates inline
    
    // Nigerian Tenancy Agreement Template
    const tenancyTemplate: DocumentTemplate = {
      id: 'tenancy_agreement_lagos_english',
      documentType: 'tenancy_agreement',
      name: 'Standard Lagos Tenancy Agreement',
      description: 'Standard residential tenancy agreement for Lagos State',
      language: 'english',
      state: 'Lagos',
      category: 'residential',
      content: `TENANCY AGREEMENT

THIS AGREEMENT is made this {{formatDate data.startDate}} between:

LANDLORD: {{upper data.landlordName}} (hereinafter called "the Landlord")
of {{data.landlordAddress}}

AND

TENANT: {{upper data.tenantName}} (hereinafter called "the Tenant")
of {{data.tenantAddress}}

WHEREAS the Landlord is the owner of the property described as:
{{data.propertyAddress}} (hereinafter called "the Premises")

NOW THEREFORE, the parties agree as follows:

1. TERM OF TENANCY
The Landlord hereby lets to the Tenant the above-described premises for a term of {{data.duration}} {{plural data.duration "month" "months"}} commencing from {{formatDate data.startDate}} and ending on {{formatDate data.endDate}}.

2. RENT
The Tenant shall pay to the Landlord the sum of {{formatCurrency data.rentAmount}} ({{title (numberToWords data.rentAmount)}} Naira) annually as rent for the said premises.

3. SECURITY DEPOSIT
The Tenant has paid a security deposit of {{formatCurrency data.depositAmount}} ({{title (numberToWords data.depositAmount)}} Naira) which shall be refunded upon termination of this agreement, less any deductions for damages or unpaid rent.

4. TENANT'S OBLIGATIONS
The Tenant shall:
a) Pay rent punctually when due
b) Use the premises for residential purposes only
c) Keep the premises clean and in good condition
d) Not sublet without written consent from the Landlord
e) Comply with all applicable laws and regulations

5. LANDLORD'S OBLIGATIONS
The Landlord shall:
a) Provide peaceful enjoyment of the premises
b) Maintain the structure in good repair
c) Ensure proper utilities connection
d) Comply with applicable housing laws

6. TERMINATION
This agreement may be terminated by either party giving {{data.noticePeriod || 30}} days written notice.

IN WITNESS WHEREOF, the parties have executed this agreement on the day and year first above written.

LANDLORD: _________________________    DATE: ____________
{{upper data.landlordName}}

TENANT: ___________________________    DATE: ____________
{{upper data.tenantName}}

WITNESS 1: ________________________    DATE: ____________
{{data.witness1Name}}

WITNESS 2: ________________________    DATE: ____________
{{data.witness2Name}}`,
      legalCompliance: {
        jurisdiction: 'Lagos State',
        applicableLaws: ['Lagos State Tenancy Law', 'Property and Conveyancing Law'],
        requirements: ['Two witnesses', 'Stamp duty payment'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(tenancyTemplate.id, tenancyTemplate);
    this.templates.set(
      this.generateTemplateKey('tenancy_agreement', 'english', 'Lagos'),
      tenancyTemplate
    );

    // Nigerian Affidavit Template
    const affidavitTemplate: DocumentTemplate = {
      id: 'affidavit_general_english',
      documentType: 'affidavit',
      name: 'General Affidavit',
      description: 'General purpose affidavit template for Nigerian courts',
      language: 'english',
      state: 'Lagos',
      category: 'general',
      content: `AFFIDAVIT

I, {{upper data.deponentName}}, {{data.occupation || 'of lawful age'}}, do hereby make oath and say as follows:

1. That I am a {{data.citizenship || 'Nigerian citizen'}} and reside at {{data.deponentAddress}}.

2. That I am the deponent in this matter and I am conversant with the facts herein deposed to.

3. {{data.facts}}

4. That this affidavit is made in good faith and for the purpose of {{data.purpose}}.

5. That I know that it is an offence under Section 117 of the Criminal Code to knowingly make a false statement on oath.

SWORN TO at {{data.location || 'Lagos'}}
this {{formatDate data.swornDate}} day of {{formatDate data.swornDate "MMMM, YYYY"}}

                    _________________________
                    {{upper data.deponentName}}
                    (DEPONENT)

SWORN TO before me and I know the deponent:

_________________________
COMMISSIONER FOR OATHS / NOTARY PUBLIC

(OFFICIAL SEAL)`,
      legalCompliance: {
        jurisdiction: 'Federal Republic of Nigeria',
        applicableLaws: ['Evidence Act 2011', 'Criminal Code Act'],
        requirements: ['Commissioner for Oaths', 'Official seal', 'Proper identification'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(affidavitTemplate.id, affidavitTemplate);
    this.templates.set(
      this.generateTemplateKey('affidavit', 'english', 'Lagos'),
      affidavitTemplate
    );

    // Power of Attorney Template
    const poaTemplate: DocumentTemplate = {
      id: 'power_of_attorney_general_english',
      documentType: 'power_of_attorney',
      name: 'General Power of Attorney',
      description: 'General power of attorney for business and personal matters',
      language: 'english',
      state: 'Lagos',
      category: 'general',
      content: `POWER OF ATTORNEY

KNOW ALL MEN BY THESE PRESENTS that I, {{upper data.grantorName}}, {{data.grantorOccupation || 'of lawful age'}}, residing at {{data.grantorAddress}}, do hereby make, constitute and appoint {{upper data.attorneyName}} of {{data.attorneyAddress}} as my true and lawful Attorney-in-Fact.

I hereby grant unto my said Attorney-in-Fact full power and authority to do and perform every act and thing whatsoever requisite and necessary to be done in and about the following matters as fully to all intents and purposes as I might or could do if personally present:

{{data.powers}}

{{#if data.limitations}}
LIMITATIONS: This power of attorney is subject to the following limitations:
{{data.limitations}}
{{/if}}

{{#if data.duration}}
DURATION: This power of attorney shall {{data.duration}}.
{{else}}
DURATION: This power of attorney shall remain in full force and effect until revoked by me in writing.
{{/if}}

I hereby ratify and confirm all that my said Attorney-in-Fact shall lawfully do or cause to be done by virtue of these presents.

IN WITNESS WHEREOF, I have hereunto set my hand and seal this {{formatDate data.executionDate}} day of {{formatDate data.executionDate "MMMM, YYYY"}}.

                    _________________________    SEAL
                    {{upper data.grantorName}}
                    (PRINCIPAL/GRANTOR)

SIGNED, SEALED AND DELIVERED in the presence of:

WITNESS 1: _________________________    DATE: ____________
{{data.witness1Name}}
{{data.witness1Address}}

WITNESS 2: _________________________    DATE: ____________
{{data.witness2Name}}
{{data.witness2Address}}

ACKNOWLEDGMENT

State of {{data.state || 'Lagos'}}
Before me, the undersigned authority, personally appeared {{upper data.grantorName}}, who proved to me on the basis of satisfactory evidence to be the person whose name is subscribed to the within instrument and acknowledged to me that he/she executed the same in his/her authorized capacity.

_________________________
NOTARY PUBLIC / COMMISSIONER FOR OATHS

(OFFICIAL SEAL)`,
      legalCompliance: {
        jurisdiction: 'Federal Republic of Nigeria',
        applicableLaws: ['Powers of Attorney Act', 'Evidence Act 2011'],
        requirements: ['Two witnesses', 'Notarization', 'Proper execution'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.templates.set(poaTemplate.id, poaTemplate);
    this.templates.set(
      this.generateTemplateKey('power_of_attorney', 'english', 'Lagos'),
      poaTemplate
    );
  }

  private loadClauseLibrary(): void {
    // Load common legal clauses for Nigerian documents
    this.clauseLibrary.set('force_majeure', `
FORCE MAJEURE: Neither party shall be liable for any failure or delay in performance under this Agreement which is due to an earthquake, flood, fire, storm, natural disaster, act of God, war, terrorism, armed conflict, labor strike, lockout, boycott, or other similar events which are beyond the reasonable control of such party.`);

    this.clauseLibrary.set('governing_law', `
GOVERNING LAW: This Agreement shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria, and the parties hereby submit to the jurisdiction of the Nigerian courts.`);

    this.clauseLibrary.set('entire_agreement', `
ENTIRE AGREEMENT: This Agreement constitutes the entire agreement between the parties and supersedes all prior understandings, agreements, or representations by or between the parties, written or oral, to the extent they relate in any way to the subject matter hereof.`);

    this.clauseLibrary.set('severability', `
SEVERABILITY: If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect, and such invalid or unenforceable provision shall be replaced by a valid and enforceable provision that most closely approximates the intent of the original provision.`);

    this.clauseLibrary.set('amendment', `
AMENDMENT: This Agreement may not be amended except by a written instrument signed by both parties.`);
  }
}

export default TemplateManager;
