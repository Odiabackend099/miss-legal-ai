// Core Types for MISS Legal AI Backend
import { z } from 'zod';

// ==============================================
// USER TYPES
// ==============================================

export const LanguageSchema = z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']);
export const SubscriptionTierSchema = z.enum(['free', 'basic', 'professional', 'enterprise']);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().optional(),
  full_name: z.string(),
  preferred_language: LanguageSchema,
  subscription_tier: SubscriptionTierSchema,
  ndpr_consent: z.boolean(),
  ndpr_consent_date: z.date().optional(),
  ndpr_consent_expiry: z.date().optional(),
  data_retention_preference: z.number().default(180),
  marketing_consent: z.boolean().default(false),
  is_active: z.boolean().default(true),
  email_verified: z.boolean().default(false),
  phone_verified: z.boolean().default(false),
  created_at: z.date(),
  updated_at: z.date(),
  last_login: z.date().optional(),
  emergency_contacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  })).default([]),
  default_location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }).optional(),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  phone: z.string().optional(),
  preferred_language: LanguageSchema.default('english'),
  ndpr_consent: z.boolean(),
  marketing_consent: z.boolean().default(false),
  emergency_contacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string(),
  })).default([]),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUser = z.infer<typeof CreateUserSchema>;
export type Language = z.infer<typeof LanguageSchema>;
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

// ==============================================
// AUTHENTICATION TYPES
// ==============================================

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const AuthResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    user: UserSchema,
    access_token: z.string(),
    refresh_token: z.string(),
    expires_in: z.number(),
  }),
  message: z.string().optional(),
});

export type LoginRequest = z.infer<typeof LoginSchema>;
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// ==============================================
// LEGAL DOCUMENT TYPES
// ==============================================

export const DocumentTypeSchema = z.enum(['tenancy_agreement', 'affidavit', 'power_of_attorney']);
export const DocumentStatusSchema = z.enum(['draft', 'completed', 'signed', 'archived']);

export const LegalDocumentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  template_id: z.string().uuid(),
  document_type: DocumentTypeSchema,
  title: z.string(),
  language: LanguageSchema,
  document_data: z.record(z.any()),
  generated_content: z.string().optional(),
  compliance_checks: z.record(z.any()).optional(),
  legal_warnings: z.array(z.string()).default([]),
  requires_review: z.boolean().default(false),
  status: DocumentStatusSchema.default('draft'),
  signature_hash: z.string().optional(),
  signed_by: z.string().optional(),
  signed_at: z.date().optional(),
  witness_signature: z.string().optional(),
  notary_signature: z.string().optional(),
  ndpr_compliant: z.boolean().default(true),
  auto_delete_at: z.date().optional(),
  generated_at: z.date(),
  last_modified: z.date(),
  attachments: z.array(z.object({
    id: z.string(),
    name: z.string(),
    url: z.string(),
    type: z.string(),
  })).default([]),
});

export const CreateDocumentSchema = z.object({
  document_type: DocumentTypeSchema,
  language: LanguageSchema,
  document_data: z.record(z.any()),
  title: z.string(),
});

export type LegalDocument = z.infer<typeof LegalDocumentSchema>;
export type CreateDocument = z.infer<typeof CreateDocumentSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
export type DocumentStatus = z.infer<typeof DocumentStatusSchema>;

// ==============================================
// VOICE PROCESSING TYPES
// ==============================================

export const VoiceSessionTypeSchema = z.enum(['general', 'document_creation', 'emergency', 'consultation']);

export const VoiceSessionSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_type: VoiceSessionTypeSchema.default('general'),
  session_start: z.date(),
  session_end: z.date().optional(),
  duration_seconds: z.number().optional(),
  language_detected: LanguageSchema.optional(),
  language_confidence: z.number().optional(),
  language_switches: z.array(z.object({
    timestamp: z.date(),
    from_language: z.string(),
    to_language: z.string(),
  })).default([]),
  intent_classification: z.string().optional(),
  intent_confidence: z.number().optional(),
  conversation_summary: z.string().optional(),
  audio_quality_score: z.number().optional(),
  transcription_accuracy: z.number().optional(),
  user_satisfaction: z.number().min(1).max(5).optional(),
  emergency_detected: z.boolean().default(false),
  emergency_confidence: z.number().optional(),
  emergency_type: z.string().optional(),
  audio_retention_days: z.number().default(7),
  auto_delete_at: z.date().optional(),
  created_at: z.date(),
});

export const VoiceConversationSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  turn_number: z.number(),
  speaker: z.enum(['user', 'assistant']),
  audio_url: z.string().optional(),
  audio_duration_ms: z.number().optional(),
  audio_format: z.string().optional(),
  transcript: z.string().optional(),
  transcript_confidence: z.number().optional(),
  language_used: LanguageSchema.optional(),
  intent: z.string().optional(),
  entities: z.record(z.any()).optional(),
  sentiment: z.string().optional(),
  response_generated: z.string().optional(),
  processing_time_ms: z.number().optional(),
  created_at: z.date(),
});

export const ProcessVoiceSchema = z.object({
  audio_data: z.string(), // Base64 encoded audio
  audio_format: z.string().default('wav'),
  session_id: z.string().uuid().optional(),
  session_type: VoiceSessionTypeSchema.default('general'),
  language_hint: LanguageSchema.optional(),
});

export type VoiceSession = z.infer<typeof VoiceSessionSchema>;
export type VoiceConversation = z.infer<typeof VoiceConversationSchema>;
export type ProcessVoiceRequest = z.infer<typeof ProcessVoiceSchema>;
export type VoiceSessionType = z.infer<typeof VoiceSessionTypeSchema>;

// ==============================================
// EMERGENCY TYPES
// ==============================================

export const EmergencyTypeSchema = z.enum(['medical', 'security', 'legal', 'fire', 'accident', 'domestic_violence']);
export const EmergencyStatusSchema = z.enum(['active', 'responding', 'resolved', 'false_alarm']);

export const EmergencySchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  emergency_type: EmergencyTypeSchema,
  status: EmergencyStatusSchema.default('active'),
  confidence_score: z.number(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
    accuracy: z.number().optional(),
  }).optional(),
  audio_evidence_url: z.string().optional(),
  transcript: z.string().optional(),
  detected_keywords: z.array(z.string()).default([]),
  context_data: z.record(z.any()).optional(),
  response_actions: z.array(z.object({
    action_type: z.string(),
    target: z.string(),
    executed_at: z.date(),
    success: z.boolean(),
    response_data: z.record(z.any()).optional(),
  })).default([]),
  notified_contacts: z.array(z.object({
    contact_id: z.string(),
    name: z.string(),
    phone: z.string(),
    notification_method: z.string(),
    notified_at: z.date(),
    delivery_status: z.string(),
  })).default([]),
  emergency_services_notified: z.boolean().default(false),
  emergency_services_response: z.string().optional(),
  resolved_at: z.date().optional(),
  resolution_notes: z.string().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreateEmergencySchema = z.object({
  emergency_type: EmergencyTypeSchema,
  confidence_score: z.number(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
    address: z.string(),
  }).optional(),
  audio_evidence_url: z.string().optional(),
  transcript: z.string().optional(),
  detected_keywords: z.array(z.string()).default([]),
  context_data: z.record(z.any()).optional(),
});

export type Emergency = z.infer<typeof EmergencySchema>;
export type CreateEmergency = z.infer<typeof CreateEmergencySchema>;
export type EmergencyType = z.infer<typeof EmergencyTypeSchema>;
export type EmergencyStatus = z.infer<typeof EmergencyStatusSchema>;

// ==============================================
// PAYMENT TYPES
// ==============================================

export const PaymentStatusSchema = z.enum(['pending', 'completed', 'failed', 'cancelled', 'refunded']);
export const PaymentProviderSchema = z.enum(['flutterwave', 'paystack', 'bank_transfer']);

export const PaymentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  transaction_id: z.string(),
  provider: PaymentProviderSchema,
  provider_transaction_id: z.string(),
  amount: z.number(),
  currency: z.string().default('NGN'),
  description: z.string(),
  status: PaymentStatusSchema,
  payment_method: z.string(),
  subscription_tier: SubscriptionTierSchema.optional(),
  subscription_duration_days: z.number().optional(),
  provider_response: z.record(z.any()).optional(),
  webhook_data: z.record(z.any()).optional(),
  processed_at: z.date().optional(),
  expires_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const CreatePaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('NGN'),
  description: z.string(),
  subscription_tier: SubscriptionTierSchema.optional(),
  subscription_duration_days: z.number().positive().optional(),
  callback_url: z.string().url().optional(),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
});

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type PaymentProvider = z.infer<typeof PaymentProviderSchema>;

// ==============================================
// LAWYER TYPES
// ==============================================

export const LawyerStatusSchema = z.enum(['available', 'busy', 'offline']);
export const ConsultationStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']);

export const LawyerSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  bar_number: z.string(),
  specializations: z.array(z.string()),
  years_experience: z.number(),
  hourly_rate: z.number(),
  available_languages: z.array(LanguageSchema),
  status: LawyerStatusSchema.default('offline'),
  rating: z.number().min(0).max(5).optional(),
  total_reviews: z.number().default(0),
  verification_status: z.boolean().default(false),
  verification_documents: z.array(z.string()).default([]),
  available_hours: z.object({
    monday: z.array(z.string()).default([]),
    tuesday: z.array(z.string()).default([]),
    wednesday: z.array(z.string()).default([]),
    thursday: z.array(z.string()).default([]),
    friday: z.array(z.string()).default([]),
    saturday: z.array(z.string()).default([]),
    sunday: z.array(z.string()).default([]),
  }).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const ConsultationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  lawyer_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
  consultation_type: z.enum(['voice', 'video', 'chat', 'document_review']),
  scheduled_at: z.date(),
  duration_minutes: z.number().default(30),
  status: ConsultationStatusSchema.default('scheduled'),
  rate: z.number(),
  total_cost: z.number(),
  payment_id: z.string().uuid().optional(),
  consultation_notes: z.string().optional(),
  documents_shared: z.array(z.string()).default([]),
  recording_url: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  review_text: z.string().optional(),
  started_at: z.date().optional(),
  ended_at: z.date().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type Lawyer = z.infer<typeof LawyerSchema>;
export type Consultation = z.infer<typeof ConsultationSchema>;
export type LawyerStatus = z.infer<typeof LawyerStatusSchema>;
export type ConsultationStatus = z.infer<typeof ConsultationStatusSchema>;

// ==============================================
// API RESPONSE TYPES
// ==============================================

export const ApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }).optional(),
  meta: z.object({
    page: z.number().optional(),
    limit: z.number().optional(),
    total: z.number().optional(),
    total_pages: z.number().optional(),
  }).optional(),
});

export type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    total_pages?: number;
  };
};

// ==============================================
// MIDDLEWARE TYPES
// ==============================================

export interface AuthenticatedRequest {
  user: User;
  token: string;
}

export interface RateLimitInfo {
  remaining: number;
  reset: Date;
  limit: number;
}

// ==============================================
// INTEGRATION TYPES
// ==============================================

export interface FlutterwaveWebhookEvent {
  event: string;
  data: {
    id: string;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    card?: any;
  };
}

export interface WhatsAppMessage {
  to: string;
  type: 'text' | 'template' | 'location';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components: any[];
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

export interface TwilioCallRequest {
  to: string;
  from: string;
  url: string;
  method?: 'GET' | 'POST';
  fallback_url?: string;
  status_callback?: string;
  timeout?: number;
}

// ==============================================
// ERROR TYPES
// ==============================================

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

// ==============================================
// DOCUMENT GENERATION TYPES
// ==============================================

export const DocumentTypeSchema = z.enum(['tenancy_agreement', 'affidavit', 'power_of_attorney']);
export type DocumentType = z.infer<typeof DocumentTypeSchema>;

export const DocumentDataSchema = z.object({
  documentType: DocumentTypeSchema.optional(),
  
  // Common fields
  state: z.string().optional(),
  language: LanguageSchema.optional(),
  
  // Tenancy Agreement fields
  landlordName: z.string().optional(),
  landlordAddress: z.string().optional(),
  landlordPhone: z.string().optional(),
  tenantName: z.string().optional(),
  tenantAddress: z.string().optional(),
  tenantPhone: z.string().optional(),
  propertyAddress: z.string().optional(),
  propertyType: z.string().optional(),
  propertyDescription: z.string().optional(),
  rentAmount: z.number().positive().optional(),
  depositAmount: z.number().positive().optional(),
  duration: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  noticePeriod: z.number().optional(),
  specialClauses: z.array(z.string()).optional(),
  witness1Name: z.string().optional(),
  witness2Name: z.string().optional(),
  
  // Affidavit fields
  deponentName: z.string().optional(),
  deponentAddress: z.string().optional(),
  deponentOccupation: z.string().optional(),
  deponentAge: z.number().optional(),
  facts: z.string().optional(),
  purpose: z.string().optional(),
  location: z.string().optional(),
  swornDate: z.string().optional(),
  witnessName: z.string().optional(),
  additionalFacts: z.array(z.string()).optional(),
  citizenship: z.string().optional(),
  
  // Power of Attorney fields
  grantorName: z.string().optional(),
  grantorAddress: z.string().optional(),
  grantorOccupation: z.string().optional(),
  attorneyName: z.string().optional(),
  attorneyAddress: z.string().optional(),
  powers: z.string().optional(),
  limitations: z.string().optional(),
  duration: z.string().optional(),
  executionDate: z.string().optional(),
  witness1Name: z.string().optional(),
  witness2Name: z.string().optional(),
  
  // Metadata
  _extractionMetadata: z.object({
    confidence: z.number().optional(),
    missingFields: z.array(z.string()).optional(),
    followUpQuestions: z.array(z.string()).optional(),
    processingTimeMs: z.number().optional(),
    source: z.enum(['voice', 'manual', 'import']).optional(),
  }).optional(),
}).passthrough(); // Allow additional properties

export type DocumentData = z.infer<typeof DocumentDataSchema>;

export const DocumentTemplateSchema = z.object({
  id: z.string().uuid(),
  documentType: DocumentTypeSchema,
  name: z.string(),
  description: z.string(),
  language: LanguageSchema,
  state: z.string(),
  category: z.string(),
  content: z.string(), // Handlebars template content
  legalCompliance: z.object({
    jurisdiction: z.string(),
    applicableLaws: z.array(z.string()),
    requirements: z.array(z.string()),
  }),
  isCustom: z.boolean().default(false),
  baseTemplateId: z.string().optional(),
  customizations: z.any().optional(),
  metadata: z.object({
    rating: z.number().optional(),
    usageCount: z.number().optional(),
    lastUsed: z.string().optional(),
    author: z.string().optional(),
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DocumentTemplate = z.infer<typeof DocumentTemplateSchema>;

export const GeneratedDocumentSchema = z.object({
  id: z.string().uuid(),
  documentType: DocumentTypeSchema,
  title: z.string(),
  content: z.string(),
  template: DocumentTemplateSchema,
  data: DocumentDataSchema,
  language: LanguageSchema,
  state: z.string(),
  version: z.number().positive(),
  status: z.enum(['draft', 'review', 'final', 'signed']),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.object({
    generationMethod: z.enum(['voice-to-document', 'manual', 'template']),
    templateId: z.string(),
    confidence: z.number(),
    wordCount: z.number(),
    legalCompliance: z.boolean(),
  }).passthrough(),
});

export type GeneratedDocument = z.infer<typeof GeneratedDocumentSchema>;

export const VoiceToDocumentSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  documentType: DocumentTypeSchema,
  language: LanguageSchema,
  state: z.string(),
  status: z.enum(['collecting', 'clarifying', 'generating', 'reviewing', 'completed', 'error']),
  voiceTranscript: z.string(),
  extractedData: DocumentDataSchema,
  clarificationHistory: z.array(z.object({
    question: z.string(),
    answer: z.string(),
    timestamp: z.string(),
  })),
  generatedDocument: GeneratedDocumentSchema.optional(),
  confidence: z.number(),
  missingFields: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type VoiceToDocumentSession = z.infer<typeof VoiceToDocumentSessionSchema>;

export interface DocumentGenerationProgress {
  stage: 'extracting' | 'validating' | 'generating' | 'formatting' | 'completed' | 'error';
  percentage: number;
  message: string;
  data?: Record<string, any>;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
  legalReference?: string;
}

export interface LegalValidationResult {
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
  complianceScore: number;
  stateSpecificIssues: string[];
}

export interface DocumentPreview {
  preview: string;
  estimatedLength: number;
  missingFields: string[];
  validationWarnings: string[];
}

export interface StampDutyRequirement {
  required: boolean;
  amount?: number;
  percentage?: number;
  minimumAmount?: number;
  authority: string;
  calculation?: string;
}

export interface WitnessRequirement {
  required: boolean;
  minimumCount: number;
  qualifications?: string[];
}

export interface NotarizationRequirement {
  required: boolean;
  authority: string;
  officialSeal: boolean;
  identification: string[];
}
