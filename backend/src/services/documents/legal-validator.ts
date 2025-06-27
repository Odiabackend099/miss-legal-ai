// Legal Compliance Validator for Nigerian Documents
import { documentLogger } from '@/utils/logger';
import { DocumentType, Language, DocumentData } from '@/types';

interface LegalValidationRule {
  id: string;
  name: string;
  description: string;
  required: boolean;
  category: 'content' | 'format' | 'legal' | 'procedural';
  validator: (data: DocumentData, content?: string) => ValidationResult;
}

interface ValidationResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  legalReference?: string;
}

interface StateSpecificRequirement {
  state: string;
  requirements: LegalValidationRule[];
  stampDuty?: {
    required: boolean;
    amount?: number;
    calculation?: string;
  };
  registration?: {
    required: boolean;
    authority: string;
    timeLimit?: string;
  };
}

interface LegalComplianceResult {
  isCompliant: boolean;
  warnings: string[];
  missingRequirements: string[];
  recommendations: string[];
  validationDetails: {
    contentValidation: ValidationResult[];
    formatValidation: ValidationResult[];
    legalValidation: ValidationResult[];
    proceduralValidation: ValidationResult[];
  };
  complianceScore: number; // 0-1 scale
  stateSpecificIssues: string[];
}

export class LegalValidator {
  private validationRules: Map<DocumentType, LegalValidationRule[]> = new Map();
  private stateRequirements: Map<string, StateSpecificRequirement[]> = new Map();
  private legalPhrasePatterns: Map<DocumentType, string[]> = new Map();

  constructor() {
    this.initializeValidationRules();
    this.initializeStateRequirements();
    this.initializeLegalPatterns();
  }

  /**
   * Validate document data and content for legal compliance
   */
  async validateDocument(
    documentType: DocumentType,
    data: DocumentData,
    state: string = 'Lagos',
    language: Language = 'english'
  ): Promise<LegalComplianceResult> {
    try {
      documentLogger.info('Starting legal validation', {
        documentType,
        state,
        language,
        dataFields: Object.keys(data).length,
      });

      // Get validation rules for document type
      const rules = this.validationRules.get(documentType) || [];
      
      // Get state-specific requirements
      const stateReqs = this.stateRequirements.get(state) || [];

      // Perform validation
      const contentValidation = await this.validateContent(rules, data, 'content');
      const formatValidation = await this.validateFormat(rules, data, 'format');
      const legalValidation = await this.validateLegalRequirements(rules, data, 'legal');
      const proceduralValidation = await this.validateProcedural(rules, data, 'procedural');

      // State-specific validation
      const stateSpecificIssues = await this.validateStateRequirements(
        documentType,
        data,
        state,
        stateReqs
      );

      // Compile results
      const allValidations = [
        ...contentValidation,
        ...formatValidation,
        ...legalValidation,
        ...proceduralValidation,
      ];

      const errors = allValidations.filter(v => !v.passed && v.severity === 'error');
      const warnings = allValidations.filter(v => !v.passed && v.severity === 'warning');
      const recommendations = allValidations.filter(v => v.severity === 'info').map(v => v.message);

      const isCompliant = errors.length === 0 && stateSpecificIssues.length === 0;
      const complianceScore = this.calculateComplianceScore(allValidations, stateSpecificIssues);

      const result: LegalComplianceResult = {
        isCompliant,
        warnings: warnings.map(w => w.message),
        missingRequirements: errors.map(e => e.message),
        recommendations,
        validationDetails: {
          contentValidation,
          formatValidation,
          legalValidation,
          proceduralValidation,
        },
        complianceScore,
        stateSpecificIssues,
      };

      documentLogger.info('Legal validation completed', {
        documentType,
        state,
        isCompliant,
        complianceScore,
        errorsCount: errors.length,
        warningsCount: warnings.length,
      });

      return result;
    } catch (error) {
      documentLogger.error('Legal validation failed', {
        documentType,
        state,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Return failed validation result
      return {
        isCompliant: false,
        warnings: [],
        missingRequirements: ['Validation process failed'],
        recommendations: ['Please retry validation or contact support'],
        validationDetails: {
          contentValidation: [],
          formatValidation: [],
          legalValidation: [],
          proceduralValidation: [],
        },
        complianceScore: 0,
        stateSpecificIssues: ['Validation system error'],
      };
    }
  }

  /**
   * Validate specific legal requirements for Nigerian law
   */
  async validateNigerianLegalRequirements(
    documentType: DocumentType,
    data: DocumentData,
    content: string
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Document-specific validations
    switch (documentType) {
      case 'tenancy_agreement':
        results.push(...await this.validateTenancyAgreement(data, content));
        break;
      
      case 'affidavit':
        results.push(...await this.validateAffidavit(data, content));
        break;
      
      case 'power_of_attorney':
        results.push(...await this.validatePowerOfAttorney(data, content));
        break;
    }

    // General Nigerian legal requirements
    results.push(...await this.validateGeneralNigerianRequirements(data, content));

    return results;
  }

  /**
   * Check if document requires notarization
   */
  requiresNotarization(documentType: DocumentType): boolean {
    const notarizationRequired: DocumentType[] = ['affidavit', 'power_of_attorney'];
    return notarizationRequired.includes(documentType);
  }

  /**
   * Check if document requires witnesses
   */
  getWitnessRequirements(documentType: DocumentType): {
    required: boolean;
    minimumCount: number;
    qualifications?: string[];
  } {
    const witnessRequirements: Record<DocumentType, any> = {
      'tenancy_agreement': {
        required: true,
        minimumCount: 2,
        qualifications: ['Adult witnesses', 'Literate preferred'],
      },
      'affidavit': {
        required: true,
        minimumCount: 1,
        qualifications: ['Commissioner for Oaths', 'Notary Public'],
      },
      'power_of_attorney': {
        required: true,
        minimumCount: 2,
        qualifications: ['Adult witnesses', 'Notary Public for acknowledgment'],
      },
    };

    return witnessRequirements[documentType] || { required: false, minimumCount: 0 };
  }

  /**
   * Get stamp duty requirements for document
   */
  getStampDutyRequirements(documentType: DocumentType, state: string, amount?: number): {
    required: boolean;
    amount?: number;
    percentage?: number;
    minimumAmount?: number;
    authority: string;
  } {
    const stampDutyRates: Record<string, Record<DocumentType, any>> = {
      'Lagos': {
        'tenancy_agreement': {
          required: true,
          percentage: 0.78, // 0.78% of annual rent
          minimumAmount: 5000,
          authority: 'Lagos State Internal Revenue Service',
        },
        'affidavit': {
          required: true,
          amount: 50,
          authority: 'Lagos State Internal Revenue Service',
        },
        'power_of_attorney': {
          required: true,
          amount: 1000,
          authority: 'Lagos State Internal Revenue Service',
        },
      },
      'Abuja': {
        'tenancy_agreement': {
          required: true,
          percentage: 0.5,
          minimumAmount: 5000,
          authority: 'FCT Internal Revenue Service',
        },
        'affidavit': {
          required: true,
          amount: 50,
          authority: 'FCT Internal Revenue Service',
        },
        'power_of_attorney': {
          required: true,
          amount: 1000,
          authority: 'FCT Internal Revenue Service',
        },
      },
    };

    const defaultRequirement = {
      required: true,
      amount: 50,
      authority: 'State Internal Revenue Service',
    };

    return stampDutyRates[state]?.[documentType] || defaultRequirement;
  }

  // Private validation methods

  private async validateContent(
    rules: LegalValidationRule[],
    data: DocumentData,
    category: string
  ): Promise<ValidationResult[]> {
    return rules
      .filter(rule => rule.category === category)
      .map(rule => rule.validator(data));
  }

  private async validateFormat(
    rules: LegalValidationRule[],
    data: DocumentData,
    category: string
  ): Promise<ValidationResult[]> {
    return rules
      .filter(rule => rule.category === category)
      .map(rule => rule.validator(data));
  }

  private async validateLegalRequirements(
    rules: LegalValidationRule[],
    data: DocumentData,
    category: string
  ): Promise<ValidationResult[]> {
    return rules
      .filter(rule => rule.category === category)
      .map(rule => rule.validator(data));
  }

  private async validateProcedural(
    rules: LegalValidationRule[],
    data: DocumentData,
    category: string
  ): Promise<ValidationResult[]> {
    return rules
      .filter(rule => rule.category === category)
      .map(rule => rule.validator(data));
  }

  private async validateStateRequirements(
    documentType: DocumentType,
    data: DocumentData,
    state: string,
    stateReqs: StateSpecificRequirement[]
  ): Promise<string[]> {
    const issues: string[] = [];

    // Find state-specific requirements
    const stateReq = stateReqs.find(req => req.state === state);
    if (!stateReq) {
      issues.push(`No specific requirements found for ${state} state`);
      return issues;
    }

    // Validate state-specific rules
    for (const rule of stateReq.requirements) {
      const result = rule.validator(data);
      if (!result.passed && rule.required) {
        issues.push(`${state} requirement: ${result.message}`);
      }
    }

    return issues;
  }

  private async validateTenancyAgreement(data: DocumentData, content: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Required parties
    results.push({
      passed: !!(data.landlordName && data.tenantName),
      message: 'Landlord and tenant names must be specified',
      severity: 'error',
      suggestion: 'Ensure both landlord and tenant full names are provided',
      legalReference: 'Tenancy Laws of Nigeria',
    });

    // Property description
    results.push({
      passed: !!data.propertyAddress,
      message: 'Property must be clearly described with full address',
      severity: 'error',
      suggestion: 'Include street address, city, and state',
      legalReference: 'Property and Conveyancing Law',
    });

    // Rent amount
    results.push({
      passed: !!(data.rentAmount && data.rentAmount > 0),
      message: 'Rent amount must be specified',
      severity: 'error',
      suggestion: 'Specify annual rent amount in Naira',
    });

    // Term/duration
    results.push({
      passed: !!(data.duration && data.duration > 0),
      message: 'Tenancy duration must be specified',
      severity: 'error',
      suggestion: 'Specify duration in months or years',
    });

    // Security deposit
    results.push({
      passed: data.depositAmount !== undefined,
      message: 'Security deposit amount should be specified',
      severity: 'warning',
      suggestion: 'Include security deposit amount for clarity',
    });

    // Legal language check
    const hasLegalTerms = content.includes('hereby') && content.includes('whereas');
    results.push({
      passed: hasLegalTerms,
      message: 'Document should use proper legal language',
      severity: 'warning',
      suggestion: 'Include standard legal phrases like "hereby" and "whereas"',
    });

    return results;
  }

  private async validateAffidavit(data: DocumentData, content: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Deponent identification
    results.push({
      passed: !!data.deponentName,
      message: 'Deponent name must be specified',
      severity: 'error',
      suggestion: 'Include full name of the person making the affidavit',
      legalReference: 'Evidence Act 2011, Section 115',
    });

    // Facts/content
    results.push({
      passed: !!data.facts,
      message: 'Affidavit facts/content must be provided',
      severity: 'error',
      suggestion: 'Include the facts being sworn to',
    });

    // Purpose
    results.push({
      passed: !!data.purpose,
      message: 'Purpose of affidavit should be stated',
      severity: 'warning',
      suggestion: 'Clearly state why the affidavit is being made',
    });

    // Oath language
    const hasOathLanguage = content.includes('sworn') || content.includes('affirm');
    results.push({
      passed: hasOathLanguage,
      message: 'Affidavit must include oath or affirmation language',
      severity: 'error',
      suggestion: 'Include phrases like "I do hereby make oath and say" or "I do solemnly affirm"',
      legalReference: 'Evidence Act 2011',
    });

    // Criminal Code reference
    const hasCriminalCodeRef = content.includes('Criminal Code') || content.includes('Section 117');
    results.push({
      passed: hasCriminalCodeRef,
      message: 'Should reference Criminal Code Section 117 (false statement penalty)',
      severity: 'warning',
      suggestion: 'Include reference to criminal penalties for false statements',
      legalReference: 'Criminal Code Act, Section 117',
    });

    // Commissioner/Notary provision
    const hasNotarySection = content.includes('Commissioner') || content.includes('Notary');
    results.push({
      passed: hasNotarySection,
      message: 'Must include section for Commissioner for Oaths/Notary Public',
      severity: 'error',
      suggestion: 'Include signature line and seal area for Commissioner for Oaths',
    });

    return results;
  }

  private async validatePowerOfAttorney(data: DocumentData, content: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Principal/Grantor
    results.push({
      passed: !!data.grantorName,
      message: 'Principal/Grantor name must be specified',
      severity: 'error',
      suggestion: 'Include full name of person granting the power',
      legalReference: 'Powers of Attorney Act',
    });

    // Attorney-in-fact
    results.push({
      passed: !!data.attorneyName,
      message: 'Attorney-in-fact name must be specified',
      severity: 'error',
      suggestion: 'Include full name of person receiving the power',
    });

    // Powers granted
    results.push({
      passed: !!data.powers,
      message: 'Powers granted must be clearly specified',
      severity: 'error',
      suggestion: 'List specific powers being granted to the attorney',
    });

    // Duration
    results.push({
      passed: !!data.duration,
      message: 'Duration or termination conditions should be specified',
      severity: 'warning',
      suggestion: 'Specify when the power of attorney expires or how it can be revoked',
    });

    // Witness requirements
    const hasWitnessSection = content.includes('WITNESS') || content.includes('presence of');
    results.push({
      passed: hasWitnessSection,
      message: 'Must include witness signatures section',
      severity: 'error',
      suggestion: 'Include signature lines for at least two witnesses',
    });

    // Acknowledgment section
    const hasAcknowledgment = content.includes('ACKNOWLEDGMENT') || content.includes('Before me');
    results.push({
      passed: hasAcknowledgment,
      message: 'Should include notarial acknowledgment section',
      severity: 'warning',
      suggestion: 'Include section for notary public acknowledgment',
    });

    return results;
  }

  private async validateGeneralNigerianRequirements(data: DocumentData, content: string): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Date format validation
    const hasProperDate = content.includes('day of') && content.includes('20');
    results.push({
      passed: hasProperDate,
      message: 'Document should use proper Nigerian date format',
      severity: 'info',
      suggestion: 'Use format: "this [day] day of [month], [year]"',
    });

    // Nigerian currency
    if (content.includes('₦') || content.includes('Naira') || content.includes('NGN')) {
      results.push({
        passed: true,
        message: 'Currency correctly specified as Nigerian Naira',
        severity: 'info',
      });
    }

    // Legal language formality
    const hasLegalFormality = content.includes('WHEREAS') || content.includes('NOW THEREFORE');
    results.push({
      passed: hasLegalFormality,
      message: 'Document uses appropriate legal formality',
      severity: 'info',
      suggestion: 'Consider adding "WHEREAS" and "NOW THEREFORE" clauses for legal formality',
    });

    return results;
  }

  private calculateComplianceScore(validations: ValidationResult[], stateIssues: string[]): number {
    if (validations.length === 0) return 0;

    const errors = validations.filter(v => !v.passed && v.severity === 'error').length;
    const warnings = validations.filter(v => !v.passed && v.severity === 'warning').length;
    
    const errorPenalty = errors * 0.2; // Each error reduces score by 20%
    const warningPenalty = warnings * 0.1; // Each warning reduces score by 10%
    const statePenalty = stateIssues.length * 0.15; // Each state issue reduces by 15%
    
    const score = Math.max(0, 1 - errorPenalty - warningPenalty - statePenalty);
    return Math.round(score * 100) / 100; // Round to 2 decimal places
  }

  private initializeValidationRules(): void {
    // Tenancy Agreement Rules
    const tenancyRules: LegalValidationRule[] = [
      {
        id: 'tenancy_parties_required',
        name: 'Parties Required',
        description: 'Landlord and tenant must be identified',
        required: true,
        category: 'content',
        validator: (data) => ({
          passed: !!(data.landlordName && data.tenantName),
          message: 'Both landlord and tenant names are required',
          severity: 'error',
          suggestion: 'Provide full legal names of both parties',
        }),
      },
      {
        id: 'tenancy_property_description',
        name: 'Property Description',
        description: 'Property must be clearly described',
        required: true,
        category: 'content',
        validator: (data) => ({
          passed: !!data.propertyAddress,
          message: 'Property address and description required',
          severity: 'error',
          suggestion: 'Include complete address with landmarks if necessary',
        }),
      },
      {
        id: 'tenancy_rent_amount',
        name: 'Rent Amount',
        description: 'Rent amount must be specified',
        required: true,
        category: 'legal',
        validator: (data) => ({
          passed: !!(data.rentAmount && data.rentAmount > 0),
          message: 'Valid rent amount is required',
          severity: 'error',
          suggestion: 'Specify annual rent in Nigerian Naira',
        }),
      },
    ];

    this.validationRules.set('tenancy_agreement', tenancyRules);

    // Affidavit Rules
    const affidavitRules: LegalValidationRule[] = [
      {
        id: 'affidavit_deponent_required',
        name: 'Deponent Required',
        description: 'Person making the affidavit must be identified',
        required: true,
        category: 'content',
        validator: (data) => ({
          passed: !!data.deponentName,
          message: 'Deponent name is required',
          severity: 'error',
          suggestion: 'Provide full name of person making the affidavit',
        }),
      },
      {
        id: 'affidavit_facts_required',
        name: 'Facts Required',
        description: 'Facts being sworn to must be provided',
        required: true,
        category: 'content',
        validator: (data) => ({
          passed: !!(data.facts && data.facts.length > 10),
          message: 'Detailed facts are required',
          severity: 'error',
          suggestion: 'Provide specific facts being sworn to',
        }),
      },
    ];

    this.validationRules.set('affidavit', affidavitRules);

    // Power of Attorney Rules
    const poaRules: LegalValidationRule[] = [
      {
        id: 'poa_grantor_required',
        name: 'Grantor Required',
        description: 'Person granting power must be identified',
        required: true,
        category: 'content',
        validator: (data) => ({
          passed: !!data.grantorName,
          message: 'Grantor name is required',
          severity: 'error',
          suggestion: 'Provide full name of person granting the power',
        }),
      },
      {
        id: 'poa_attorney_required',
        name: 'Attorney Required',
        description: 'Attorney-in-fact must be identified',
        required: true,
        category: 'content',
        validator: (data) => ({
          passed: !!data.attorneyName,
          message: 'Attorney-in-fact name is required',
          severity: 'error',
          suggestion: 'Provide full name of attorney-in-fact',
        }),
      },
      {
        id: 'poa_powers_specified',
        name: 'Powers Specified',
        description: 'Powers granted must be clearly defined',
        required: true,
        category: 'legal',
        validator: (data) => ({
          passed: !!(data.powers && data.powers.length > 10),
          message: 'Specific powers must be detailed',
          severity: 'error',
          suggestion: 'List all powers being granted in detail',
        }),
      },
    ];

    this.validationRules.set('power_of_attorney', poaRules);
  }

  private initializeStateRequirements(): void {
    // Lagos State Requirements
    const lagosRequirements: StateSpecificRequirement[] = [
      {
        state: 'Lagos',
        requirements: [
          {
            id: 'lagos_stamp_duty',
            name: 'Lagos Stamp Duty',
            description: 'Document must be stamped according to Lagos rates',
            required: true,
            category: 'procedural',
            validator: () => ({
              passed: true, // Will be checked during actual stamping
              message: 'Stamp duty payment required per Lagos State law',
              severity: 'info',
              suggestion: 'Pay stamp duty before document execution',
            }),
          },
        ],
        stampDuty: {
          required: true,
          calculation: 'Based on document type and value',
        },
      },
    ];

    this.stateRequirements.set('Lagos', lagosRequirements);

    // FCT (Abuja) Requirements  
    const fctRequirements: StateSpecificRequirement[] = [
      {
        state: 'Abuja',
        requirements: [
          {
            id: 'fct_stamp_duty',
            name: 'FCT Stamp Duty',
            description: 'Document must be stamped according to FCT rates',
            required: true,
            category: 'procedural',
            validator: () => ({
              passed: true,
              message: 'Stamp duty payment required per FCT law',
              severity: 'info',
              suggestion: 'Pay stamp duty at FCT IRS office',
            }),
          },
        ],
        stampDuty: {
          required: true,
          calculation: 'Based on FCT rates',
        },
      },
    ];

    this.stateRequirements.set('Abuja', fctRequirements);
  }

  private initializeLegalPatterns(): void {
    // Legal phrases that should appear in different document types
    this.legalPhrasePatterns.set('tenancy_agreement', [
      'hereby lets', 'tenancy agreement', 'landlord', 'tenant', 'premises',
      'rent', 'deposit', 'term', 'obligations', 'witness whereof'
    ]);

    this.legalPhrasePatterns.set('affidavit', [
      'make oath', 'sworn to', 'deponent', 'facts', 'commissioner for oaths',
      'good faith', 'criminal code', 'false statement'
    ]);

    this.legalPhrasePatterns.set('power_of_attorney', [
      'power of attorney', 'attorney-in-fact', 'hereby grant', 'full power',
      'ratify and confirm', 'witness whereof', 'acknowledgment'
    ]);
  }
}

export default LegalValidator;
