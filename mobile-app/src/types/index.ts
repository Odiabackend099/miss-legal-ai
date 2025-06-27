// Core app types and interfaces

export type Language = 'english' | 'yoruba' | 'hausa' | 'igbo' | 'pidgin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  profilePhoto?: string;
  phone?: string;
  preferredLanguage: Language;
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Preferences
  notificationsEnabled: boolean;
  biometricEnabled: boolean;
  offlineModeEnabled: boolean;
  dataOptimizationEnabled: boolean;
  
  // Metadata
  createdAt: Date;
  lastLoginAt: Date;
  unreadNotifications: number;
}

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  preferredLanguage: Language;
  ndprConsent: boolean;
  termsAccepted: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  
  // Limits
  documentsPerMonth: number;
  documentsUsed: number;
  voiceMinutesPerMonth: number;
  voiceMinutesUsed: number;
  lawyerConsultations: number;
  consultationsUsed: number;
  
  // Features
  features: string[];
  price: number;
  currency: string;
}

export interface UsageStats {
  totalVoiceMinutes: number;
  totalDocuments: number;
  totalConsultations: number;
  emergencyTriggers: number;
  languageBreakdown: Record<Language, number>;
  monthlyUsage: {
    month: string;
    voiceMinutes: number;
    documents: number;
    consultations: number;
  }[];
}

export interface DataUsage {
  totalDataUsed: number; // in MB
  monthlyLimit: number; // in MB
  currentMonth: number; // in MB
  breakdown: {
    voice: number;
    documents: number;
    chat: number;
    other: number;
  };
  costOptimization: {
    enabled: boolean;
    savings: number;
    recommendations: string[];
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Location types
export interface Location {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  timestamp: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formatted?: string;
}

// Common utility types
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: Date;
}

export interface OfflineAction {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface NotificationPayload {
  id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  category?: string;
  priority?: 'low' | 'normal' | 'high';
  sound?: string;
  badge?: number;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'phone' | 'select' | 'textarea' | 'date' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  validation?: {
    pattern?: RegExp;
    minLength?: number;
    maxLength?: number;
    custom?: (value: any) => string | null;
  };
  options?: { label: string; value: any }[];
}

export interface FormError {
  field: string;
  message: string;
}

// Network types
export type NetworkState = 'online' | 'offline' | 'poor';

export interface NetworkInfo {
  isConnected: boolean;
  type: string;
  isInternetReachable: boolean;
  strength: 'poor' | 'good' | 'excellent';
}

// App state types
export type AppTheme = 'light' | 'dark' | 'auto';

export interface AppSettings {
  theme: AppTheme;
  language: Language;
  notifications: boolean;
  autoUpdates: boolean;
  dataOptimization: boolean;
  offlineMode: boolean;
  biometric: boolean;
}

// Error types
export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  screen?: string;
  action?: string;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface ErrorReport {
  error: AppError;
  severity: ErrorSeverity;
  context: {
    userAgent: string;
    deviceInfo: any;
    appVersion: string;
    buildNumber: string;
  };
  stackTrace?: string;
  breadcrumbs: string[];
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  parameters?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
}

export interface UserActivity {
  screen: string;
  action: string;
  timestamp: Date;
  duration?: number;
  metadata?: Record<string, any>;
}

// Feature flag types
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  conditions?: {
    userSegment?: string[];
    appVersion?: string;
    country?: string;
  };
}

// Deep linking types
export interface DeepLink {
  url: string;
  params: Record<string, string>;
  authenticated: boolean;
}

export type DeepLinkHandler = (link: DeepLink) => void | Promise<void>;

// Export all specialized types
export * from './auth';
export * from './voice';
export * from './documents';
export * from './emergency';
export * from './lawyers';
export * from './payment';
