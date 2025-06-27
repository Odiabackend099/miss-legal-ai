import { Language, Location } from './index';

export type EmergencyType = 'security' | 'medical' | 'fire' | 'accident' | 'natural_disaster' | 'other';

export type EmergencyStatus = 'active' | 'resolved' | 'false_positive' | 'cancelled';

export type EmergencyPriority = 'low' | 'medium' | 'high' | 'critical';

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
  enabled: boolean;
  preferredContactMethod: 'whatsapp' | 'sms' | 'call';
  language: Language;
  notes?: string;
  lastContacted?: Date;
}

export interface Emergency {
  id: string;
  userId: string;
  type: EmergencyType;
  status: EmergencyStatus;
  priority: EmergencyPriority;
  createdAt: Date;
  resolvedAt?: Date;
  
  // Detection details
  detectionMethod: 'voice' | 'manual' | 'automatic' | 'sensor';
  detectionConfidence: number;
  triggerText?: string;
  audioUri?: string;
  
  // Location information
  location?: Location;
  address?: string;
  locationAccuracy?: number;
  
  // Response details
  contactsNotified: string[]; // Contact IDs
  servicesNotified: string[]; // Emergency service numbers called
  responseTime?: number; // seconds
  
  // Additional context
  description?: string;
  userNotes?: string;
  language: Language;
  deviceInfo?: {
    battery: number;
    network: string;
    deviceId: string;
  };
  
  // Verification
  verificationRequired: boolean;
  verifiedBy?: string;
  verificationMethod?: 'user' | 'contact' | 'service';
  
  // Follow-up
  followUpRequired: boolean;
  followUpAt?: Date;
  followUpNotes?: string;
}

export interface EmergencyService {
  id: string;
  name: Record<Language, string>;
  number: string;
  type: EmergencyType[];
  availability: '24/7' | 'business_hours' | 'on_call';
  coverage: string[]; // States/regions
  description: Record<Language, string>;
  icon: string;
  color: string;
  priority: number;
  capabilities: string[];
}

export interface EmergencyDetectionSettings {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  autoTrigger: boolean;
  confirmationTimeout: number; // seconds
  falsePositiveReduction: boolean;
  backgroundMonitoring: boolean;
  keywordDetection: boolean;
  customKeywords: string[];
  languageSpecific: boolean;
}

export interface EmergencyResponse {
  emergencyId: string;
  timestamp: Date;
  action: 'contact_notified' | 'service_called' | 'location_shared' | 'message_sent';
  target: string; // Contact ID or service number
  success: boolean;
  error?: string;
  response?: string;
  duration?: number;
}

export interface EmergencyAlert {
  id: string;
  emergencyId: string;
  contactId: string;
  method: 'whatsapp' | 'sms' | 'call' | 'push';
  message: string;
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  respondedAt?: Date;
  response?: string;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'responded' | 'failed';
  retryCount: number;
  maxRetries: number;
}

export interface EmergencyLocation {
  timestamp: Date;
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  address?: string;
  landmark?: string;
  emergency_id: string;
}

export interface EmergencyKeyword {
  keyword: string;
  language: Language;
  type: EmergencyType;
  confidence: number;
  context: string[];
  aliases: string[];
  enabled: boolean;
}

export interface EmergencyTemplate {
  id: string;
  type: EmergencyType;
  language: Language;
  title: string;
  message: string;
  urgent: boolean;
  includeLocation: boolean;
  includeAudio: boolean;
  customFields: {
    name: string;
    type: 'text' | 'number' | 'select';
    required: boolean;
    options?: string[];
  }[];
}

export interface EmergencyAnalytics {
  totalEmergencies: number;
  falsePositives: number;
  averageResponseTime: number;
  resolutionRate: number;
  typeBreakdown: Record<EmergencyType, number>;
  timeDistribution: {
    hour: number;
    count: number;
  }[];
  locationHotspots: {
    latitude: number;
    longitude: number;
    count: number;
    radius: number;
  }[];
  contactEffectiveness: {
    contactId: string;
    responseRate: number;
    averageResponseTime: number;
  }[];
}

export interface EmergencyHistory {
  emergencies: Emergency[];
  totalCount: number;
  filters: {
    type?: EmergencyType;
    status?: EmergencyStatus;
    dateRange?: {
      start: Date;
      end: Date;
    };
    location?: string;
  };
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EmergencyNotification {
  id: string;
  emergencyId: string;
  title: string;
  body: string;
  data: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'max';
  category: 'emergency';
  sound: string;
  vibration: boolean;
  ongoing: boolean;
  autoCancel: boolean;
  actions: {
    id: string;
    title: string;
    action: string;
  }[];
}

export interface EmergencyGeofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // meters
  type: 'safe_zone' | 'danger_zone' | 'restricted_area';
  enabled: boolean;
  alertOnEntry: boolean;
  alertOnExit: boolean;
  emergencyContacts: string[];
  customMessage?: string;
}

export interface EmergencyProtocol {
  id: string;
  type: EmergencyType;
  name: string;
  description: string;
  steps: {
    order: number;
    action: string;
    description: string;
    timeLimit?: number;
    required: boolean;
    automated: boolean;
  }[];
  triggers: {
    confidence: number;
    keywords: string[];
    contexts: string[];
  };
  escalation: {
    timeThreshold: number;
    escalationSteps: string[];
  };
}
