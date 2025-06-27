import { Language } from './index';

export type DocumentType = 
  | 'tenancy_agreement' 
  | 'affidavit' 
  | 'power_of_attorney' 
  | 'will' 
  | 'contract' 
  | 'business_registration' 
  | 'employment_contract' 
  | 'loan_agreement' 
  | 'sale_agreement' 
  | 'lease_agreement'
  | 'divorce_petition'
  | 'custody_agreement'
  | 'partnership_agreement'
  | 'license_application'
  | 'court_filing';

export type DocumentStatus = 
  | 'draft' 
  | 'processing' 
  | 'review_required' 
  | 'completed' 
  | 'signed' 
  | 'notarized' 
  | 'filed' 
  | 'rejected' 
  | 'expired'
  | 'cancelled';

export type DocumentFormat = 'pdf' | 'docx' | 'txt' | 'html';

export interface Document {
  id: string;
  userId: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  format: DocumentFormat;
  language: Language;
  
  // Content
  content: string;
  templateId?: string;
  version: number;
  wordCount: number;
  
  // Generation details
  generatedFrom: 'voice' | 'text' | 'template' | 'upload';
  sourceTranscript?: string;
  sourceAudioUri?: string;
  
  // Legal requirements
  state: string; // Nigerian state
  jurisdiction: string;
  legalCompliance: {
    verified: boolean;
    requirements: string[];
    stamps: {
      required: boolean;
      amount?: number;
      applied: boolean;
    };
    witnesses: {
      required: number;
      added: number;
    };
    notarization: {
      required: boolean;
      completed: boolean;
    };
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  expiresAt?: Date;
  
  // File information
  fileSize: number;
  fileUrl?: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  
  // Sharing and access
  isPublic: boolean;
  sharedWith: string[];
  accessLevel: 'view' | 'edit' | 'sign';
  
  // Offline support
  isOfflineAvailable: boolean;
  offlineContent?: string;
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  
  // Analytics
  viewCount: number;
  downloadCount: number;
  lastViewed?: Date;
  
  // AI enhancement
  aiSuggestions: {
    id: string;
    type: 'improvement' | 'legal_issue' | 'missing_clause' | 'formatting';
    suggestion: string;
    severity: 'low' | 'medium' | 'high';
    applied: boolean;
  }[];
  
  // Signatures
  signatures: DocumentSignature[];
  signingOrder?: string[];
  
  // Revisions
  revisions: DocumentRevision[];
  parentDocumentId?: string;
  
  // Tags and categories
  tags: string[];
  category?: string;
  customFields: Record<string, any>;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  description: string;
  language: Language;
  content: string;
  
  // Customization
  variables: DocumentVariable[];
  sections: DocumentSection[];
  
  // Legal information
  jurisdiction: string[];
  legalRequirements: string[];
  
  // Usage
  isPublic: boolean;
  isPremium: boolean;
  usageCount: number;
  rating: number;
  
  // Metadata
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  
  // Preview
  previewUrl?: string;
  thumbnailUrl?: string;
}

export interface DocumentVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean' | 'address' | 'currency';
  required: boolean;
  defaultValue?: any;
  placeholder?: string;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  options?: { label: string; value: any }[];
  description?: string;
  section?: string;
}

export interface DocumentSection {
  id: string;
  name: string;
  order: number;
  required: boolean;
  content: string;
  variables: string[];
  conditions?: {
    variable: string;
    operator: '==' | '!=' | '>' | '<' | 'contains' | 'exists';
    value: any;
  }[];
}

export interface DocumentSignature {
  id: string;
  signerName: string;
  signerEmail: string;
  signerPhone?: string;
  signatureUrl: string;
  signedAt: Date;
  ipAddress: string;
  location?: string;
  method: 'digital' | 'electronic' | 'biometric';
  verified: boolean;
  order: number;
}

export interface DocumentRevision {
  id: string;
  version: number;
  description: string;
  changes: {
    type: 'added' | 'modified' | 'deleted';
    section: string;
    oldValue?: string;
    newValue?: string;
    position?: number;
  }[];
  createdBy: string;
  createdAt: Date;
  fileUrl?: string;
}

export interface DocumentGenerationRequest {
  type: DocumentType;
  templateId?: string;
  language: Language;
  state: string;
  
  // Input data
  voiceTranscript?: string;
  textInput?: string;
  formData?: Record<string, any>;
  
  // Preferences
  includeWitnesses: boolean;
  includeNotarization: boolean;
  includeStamps: boolean;
  format: DocumentFormat;
  
  // AI options
  useAIEnhancement: boolean;
  legalReview: boolean;
  customInstructions?: string;
}

export interface DocumentGenerationResult {
  documentId: string;
  status: 'success' | 'partial' | 'failed';
  document?: Document;
  missingInformation?: {
    field: string;
    description: string;
    required: boolean;
  }[];
  suggestions?: string[];
  warnings?: string[];
  errors?: string[];
  processingTime: number;
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  analysisType: 'legal_review' | 'compliance_check' | 'quality_assessment' | 'risk_analysis';
  
  results: {
    score: number; // 0-100
    issues: {
      type: 'error' | 'warning' | 'suggestion';
      category: 'legal' | 'formatting' | 'content' | 'compliance';
      description: string;
      suggestion?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      location?: {
        section: string;
        paragraph: number;
        line: number;
      };
    }[];
    strengths: string[];
    recommendations: string[];
  };
  
  compliance: {
    state: string;
    requirements: {
      name: string;
      met: boolean;
      description: string;
      reference?: string;
    }[];
    stampDuty: {
      required: boolean;
      amount?: number;
      category: string;
    };
  };
  
  createdAt: Date;
  analyzedBy: 'ai' | 'lawyer' | 'system';
  confidence: number;
}

export interface DocumentShareRequest {
  documentId: string;
  recipientEmail: string;
  accessLevel: 'view' | 'edit' | 'sign';
  message?: string;
  expiresAt?: Date;
  password?: string;
  notifyByEmail: boolean;
  notifyByWhatsApp: boolean;
}

export interface DocumentSearchFilter {
  query?: string;
  type?: DocumentType;
  status?: DocumentStatus;
  language?: Language;
  state?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  sortBy?: 'created' | 'updated' | 'title' | 'type' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface DocumentStats {
  total: number;
  byType: Record<DocumentType, number>;
  byStatus: Record<DocumentStatus, number>;
  byMonth: {
    month: string;
    count: number;
  }[];
  averageProcessingTime: number;
  completionRate: number;
  popularTemplates: {
    templateId: string;
    name: string;
    usageCount: number;
  }[];
}

export interface DocumentWorkflow {
  id: string;
  name: string;
  documentType: DocumentType;
  steps: {
    id: string;
    name: string;
    type: 'review' | 'approval' | 'signature' | 'notarization' | 'filing';
    order: number;
    assignedTo?: string;
    dueDate?: Date;
    status: 'pending' | 'in_progress' | 'completed' | 'skipped';
    completedAt?: Date;
    notes?: string;
  }[];
  status: 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentBackup {
  id: string;
  documentId: string;
  version: number;
  content: string;
  metadata: any;
  createdAt: Date;
  size: number;
  checksum: string;
  encrypted: boolean;
}

export interface DocumentPermission {
  userId: string;
  documentId: string;
  role: 'owner' | 'editor' | 'viewer' | 'signer';
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
    share: boolean;
    sign: boolean;
  };
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

export interface DocumentNotification {
  id: string;
  documentId: string;
  type: 'created' | 'updated' | 'shared' | 'signed' | 'completed' | 'expired' | 'reminder';
  title: string;
  message: string;
  recipientId: string;
  method: 'push' | 'email' | 'whatsapp' | 'sms';
  sentAt: Date;
  readAt?: Date;
  actionTaken?: string;
}
