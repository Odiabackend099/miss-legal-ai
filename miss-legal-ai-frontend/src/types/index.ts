// Core types for MISS Legal AI Frontend Application

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  country: string;
  preferredLanguage: Language;
  subscriptionTier: SubscriptionTier;
  emergencyContacts: EmergencyContact[];
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export type Language = 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo';

export type SubscriptionTier = 'free' | 'premium' | 'taas' | 'daas';

export interface SubscriptionDetails {
  tier: SubscriptionTier;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  nextBillingDate?: Date;
  canceledAt?: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phoneNumber: string;
  relationship: string;
  isPrimary: boolean;
}

// Voice AI Types
export interface VoiceSession {
  sessionId: string;
  language: Language;
  emergencyDetectionEnabled: boolean;
  supportedLanguages: Language[];
  isConnected: boolean;
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor';
  audioMetrics: AudioMetrics;
}

export interface AudioMetrics {
  volume: number;
  quality: number;
  latency: number;
  packetsLost: number;
  jitter: number;
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language: Language;
  isPartial: boolean;
  timestamp: Date;
}

export interface AIResponse {
  text: string;
  intent: string;
  confidence: number;
  actions: string[];
  audio?: string;
  audioFormat?: string;
  requiresHumanEscalation: boolean;
  timestamp: Date;
}

export interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  confidence?: number;
  intent?: string;
  actions?: string[];
  audioUrl?: string;
}

// Emergency Types
export interface EmergencyAlert {
  id: string;
  type: string;
  confidence: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  audioResponse?: string;
  timestamp: Date;
  acknowledged: boolean;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

// Legal Document Types
export interface LegalDocument {
  id: string;
  type: 'tenancy' | 'affidavit' | 'poa' | 'contract';
  title: string;
  content: string;
  status: 'draft' | 'completed' | 'signed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  metadata: DocumentMetadata;
}

export interface DocumentMetadata {
  parties: DocumentParty[];
  jurisdiction: string;
  language: Language;
  requiresNotarization: boolean;
  stampDutyRequired: boolean;
  governorConsentRequired: boolean;
}

export interface DocumentParty {
  id: string;
  name: string;
  role: string;
  address: string;
  phoneNumber?: string;
  email?: string;
}

// Payment Types
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'successful' | 'failed' | 'cancelled';
  paymentMethod: string;
  description: string;
  createdAt: Date;
  flutterwaveReference?: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  amount: number;
  currency: string;
  interval: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'quarterly' | 'bi-annually';
  duration?: number;
  features: string[];
  isActive: boolean;
}

// UI State Types
export interface UIState {
  theme: 'dark' | 'light';
  sidebarOpen: boolean;
  language: Language;
  notifications: Notification[];
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'emergency';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Component Props Types
export interface VoiceChatProps {
  authToken: string;
  language?: Language;
  enableEmergencyDetection?: boolean;
  onEmergencyDetected?: (emergency: EmergencyAlert) => void;
  onSessionUpdate?: (session: VoiceSession) => void;
}

export interface AIOrb extends React.ComponentProps<'div'> {
  isListening?: boolean;
  isSpeaking?: boolean;
  isProcessing?: boolean;
  emergencyAlert?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glowIntensity?: 'low' | 'medium' | 'high';
}

export interface SidebarNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
  user: User | null;
  currentPage: string;
}

// Configuration Types
export interface AppConfig {
  apiBaseUrl: string;
  websocketUrl: string;
  flutterwavePublicKey: string;
  googleMapsApiKey: string;
  supportedLanguages: Language[];
  defaultLanguage: Language;
  emergencyHotlines: EmergencyHotline[];
}

export interface EmergencyHotline {
  name: string;
  number: string;
  description: string;
  isNational: boolean;
  states?: string[];
}

// Form Types
export interface ContactForm {
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  preferredLanguage: Language;
}

export interface DocumentGenerationForm {
  type: 'tenancy' | 'affidavit' | 'poa';
  parties: DocumentParty[];
  details: Record<string, any>;
  language: Language;
  jurisdiction: string;
}

export interface SubscriptionUpgradeForm {
  planId: string;
  paymentMethod: string;
  billingInterval: 'monthly' | 'yearly';
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userFriendlyMessage?: string;
}

// Analytics Types
export interface AnalyticsEvent {
  eventName: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp: Date;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  category?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: string[];
  language?: Language;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
