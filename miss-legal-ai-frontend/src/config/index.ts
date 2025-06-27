// Application Configuration for MISS Legal AI

import { AppConfig, EmergencyHotline, Language } from '../types';

// Nigerian Emergency Hotlines
export const NIGERIA_EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    name: 'Nigeria Police Force',
    number: '199',
    description: 'National Police Emergency Line',
    isNational: true,
  },
  {
    name: 'Fire Service',
    number: '112',
    description: 'National Fire Emergency Service',
    isNational: true,
  },
  {
    name: 'Medical Emergency',
    number: '112',
    description: 'National Medical Emergency Service',
    isNational: true,
  },
  {
    name: 'Lagos State Emergency',
    number: '767',
    description: 'Lagos State Emergency Response Unit',
    isNational: false,
    states: ['Lagos'],
  },
  {
    name: 'Abuja Emergency',
    number: '112',
    description: 'FCT Emergency Response Service',
    isNational: false,
    states: ['FCT'],
  },
  {
    name: 'NEMA',
    number: '112',
    description: 'National Emergency Management Agency',
    isNational: true,
  },
  {
    name: 'Road Traffic Emergency',
    number: '122',
    description: 'Federal Road Safety Corps Emergency',
    isNational: true,
  },
];

export const APP_CONFIG: AppConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  websocketUrl: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3000',
  flutterwavePublicKey: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY || '',
  googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  supportedLanguages: ['english', 'pidgin', 'yoruba', 'hausa', 'igbo'],
  defaultLanguage: 'english',
  emergencyHotlines: NIGERIA_EMERGENCY_HOTLINES,
};

// Language Configuration
export const LANGUAGE_CONFIG = {
  english: {
    name: 'English',
    code: 'en',
    rtl: false,
    voiceCode: 'en-NG', // Nigerian English
    flag: '🇳🇬',
  },
  pidgin: {
    name: 'Nigerian Pidgin',
    code: 'pcm',
    rtl: false,
    voiceCode: 'en-NG',
    flag: '🇳🇬',
  },
  yoruba: {
    name: 'Yorùbá',
    code: 'yo',
    rtl: false,
    voiceCode: 'yo-NG',
    flag: '🇳🇬',
  },
  hausa: {
    name: 'Hausa',
    code: 'ha',
    rtl: false,
    voiceCode: 'ha-NG',
    flag: '🇳🇬',
  },
  igbo: {
    name: 'Igbo',
    code: 'ig',
    rtl: false,
    voiceCode: 'ig-NG',
    flag: '🇳🇬',
  },
};

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'NGN',
    interval: 'monthly' as const,
    features: [
      'Basic legal consultation (5 questions/month)',
      'Emergency detection',
      'Basic document templates',
      'Email support',
    ],
    limits: {
      monthlyQuestions: 5,
      documentGeneration: 1,
      voiceMinutes: 30,
    },
  },
  premium: {
    name: 'Premium',
    price: 1000,
    currency: 'NGN',
    interval: 'monthly' as const,
    features: [
      'Unlimited legal consultation',
      'Priority emergency response',
      'Advanced document generation',
      'Multi-language support',
      'Phone & email support',
      'Legal document review',
    ],
    limits: {
      monthlyQuestions: -1, // unlimited
      documentGeneration: -1,
      voiceMinutes: -1,
    },
  },
  taas: {
    name: 'TaaS (Teams)',
    price: 50000,
    currency: 'NGN',
    interval: 'monthly' as const,
    features: [
      'Everything in Premium',
      'Team management (up to 100 users)',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'Custom branding',
    ],
    limits: {
      teamSize: 100,
      monthlyQuestions: -1,
      documentGeneration: -1,
      voiceMinutes: -1,
    },
  },
  daas: {
    name: 'DaaS (Per Document)',
    price: 200,
    currency: 'NGN',
    interval: 'per-document' as const,
    priceRange: { min: 200, max: 500 },
    features: [
      'Pay per document generated',
      'Professional legal review',
      'Notarization assistance',
      'Legal compliance check',
      'Stamp duty guidance',
    ],
    limits: {
      documentComplexity: 'any',
    },
  },
};

// Voice AI Configuration
export const VOICE_CONFIG = {
  sampleRate: 22050,
  windowSize: 450, // ms
  windowOverlap: 112, // ms
  audioFormat: 'webm;codecs=opus',
  emergencyDetectionThreshold: 0.75,
  confidenceThreshold: 0.6,
  maxRecordingDuration: 300000, // 5 minutes
  silenceDetectionTimeout: 3000, // 3 seconds
  reconnectAttempts: 3,
  reconnectDelay: 1000, // 1 second
};

// UI Theme Configuration
export const THEME_CONFIG = {
  dark: {
    primary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    background: {
      primary: '#0A0A0B',
      secondary: '#111114',
      tertiary: '#1a1a1d',
      card: '#1e1e21',
      hover: '#2a2a2d',
    },
    text: {
      primary: '#ffffff',
      secondary: '#f3f4f6',
      muted: '#9ca3af',
      inverse: '#111827',
    },
    border: {
      primary: '#374151',
      secondary: '#4b5563',
      accent: '#9333ea',
    },
    glow: {
      purple: '0 0 20px rgba(168, 85, 247, 0.5)',
      purpleHover: '0 0 30px rgba(168, 85, 247, 0.8)',
      emergency: '0 0 20px rgba(239, 68, 68, 0.6)',
    },
  },
};

// Legal Document Templates
export const DOCUMENT_TEMPLATES = {
  tenancy: {
    title: 'Tenancy Agreement',
    requiredFields: [
      'landlordName',
      'landlordAddress',
      'tenantName',
      'tenantAddress',
      'propertyAddress',
      'rentAmount',
      'leaseDuration',
      'paymentSchedule',
      'securityDeposit',
    ],
    optionalFields: [
      'agentName',
      'agentCommission',
      'specialTerms',
      'maintenanceResponsibilities',
    ],
    legalRequirements: {
      stampDuty: true,
      governorConsent: 'conditionalOnDuration', // > 3 years
      witnessRequired: true,
      minimumNoticePeriod: 'oneMonth',
    },
  },
  affidavit: {
    title: 'Affidavit',
    requiredFields: [
      'deponentName',
      'deponentAddress',
      'deponentOccupation',
      'affidavitContent',
      'swearingAuthority',
      'swearingLocation',
    ],
    optionalFields: [
      'witnessName',
      'witnessAddress',
      'attachments',
    ],
    legalRequirements: {
      stampDuty: true,
      notarization: true,
      witnessRequired: false,
      swearingFee: true,
    },
  },
  poa: {
    title: 'Power of Attorney',
    requiredFields: [
      'principalName',
      'principalAddress',
      'attorneyName',
      'attorneyAddress',
      'powersGranted',
      'duration',
      'limitations',
    ],
    optionalFields: [
      'witnessName',
      'witnessAddress',
      'specialInstructions',
      'revocationClause',
    ],
    legalRequirements: {
      stampDuty: true,
      governorConsent: 'conditionalOnType',
      witnessRequired: true,
      notarization: true,
    },
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    googleAuth: '/auth/google',
  },
  voice: {
    session: '/voice/session',
    stream: '/voice/stream',
    transcription: '/voice/transcription',
    emergency: '/voice/emergency',
  },
  documents: {
    generate: '/documents/generate',
    list: '/documents',
    download: '/documents/:id/download',
    delete: '/documents/:id',
  },
  payment: {
    plans: '/payment/plans',
    subscribe: '/payment/subscribe',
    webhook: '/payment/webhook',
    history: '/payment/history',
  },
  users: {
    profile: '/users/profile',
    preferences: '/users/preferences',
    emergencyContacts: '/users/emergency-contacts',
  },
  emergency: {
    alert: '/emergency/alert',
    contacts: '/emergency/contacts',
    history: '/emergency/history',
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  emergencyDetection: true,
  multiLanguageSupport: true,
  paymentIntegration: true,
  documentGeneration: true,
  voiceChat: true,
  googleMapsIntegration: true,
  analyticsTracking: true,
  pushNotifications: true,
  offlineMode: false, // Coming soon
  videoChat: false, // Coming soon
};

// Error Messages
export const ERROR_MESSAGES = {
  network: 'Network connection error. Please check your internet connection.',
  authentication: 'Authentication failed. Please log in again.',
  permission: 'You do not have permission to perform this action.',
  validation: 'Please check your input and try again.',
  payment: 'Payment processing failed. Please try again or contact support.',
  voiceConnection: 'Voice connection failed. Please check your microphone permissions.',
  emergencyAlert: 'Emergency alert could not be sent. Please call emergency services directly.',
  documentGeneration: 'Document generation failed. Please try again.',
  unknown: 'An unexpected error occurred. Please try again.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  login: 'Successfully logged in',
  register: 'Account created successfully',
  documentGenerated: 'Document generated successfully',
  paymentSuccessful: 'Payment processed successfully',
  emergencyAlertSent: 'Emergency alert sent successfully',
  profileUpdated: 'Profile updated successfully',
  subscriptionUpdated: 'Subscription updated successfully',
};

export default APP_CONFIG;
