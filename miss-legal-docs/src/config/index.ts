// Configuration for MISS Legal AI Documentation System

import { DocumentationSection, ApiEndpoint, LaunchReadinessCheck, SystemMetrics } from '../types';

export const SYSTEM_INFO = {
  name: 'MISS Legal AI',
  version: '1.0.0',
  description: 'Voice-First Legal Assistant for Nigerian Users',
  organization: 'ODIA Intelligence + Mudiame University',
  deploymentUrl: 'https://vhbi5vrcd9.space.minimax.io',
  documentationUrl: 'https://docs.misslegal.ai',
  supportEmail: 'support@misslegal.ai',
  emergencyContact: '+234-xxx-xxx-xxxx',
};

export const DEPLOYMENT_URLS = {
  frontend: 'https://vhbi5vrcd9.space.minimax.io',
  backend: 'https://api.misslegal.ai',
  docs: 'https://docs.misslegal.ai',
  mobile: {
    playStore: 'https://play.google.com/store/apps/details?id=ai.misslegal.app',
    appStore: 'https://apps.apple.com/app/miss-legal-ai',
  },
  admin: 'https://admin.misslegal.ai',
};

export const DOCUMENTATION_SECTIONS: DocumentationSection[] = [
  {
    id: 'overview',
    title: 'System Overview',
    description: 'Comprehensive overview of MISS Legal AI system architecture',
    icon: 'BookOpen',
    priority: 'high',
    sections: [
      {
        id: 'introduction',
        title: 'Introduction to MISS Legal AI',
        content: 'System introduction and capabilities',
        lastUpdated: new Date(),
        author: 'System Team',
        tags: ['overview', 'introduction'],
      },
      {
        id: 'architecture',
        title: 'System Architecture',
        content: 'Complete system architecture documentation',
        lastUpdated: new Date(),
        author: 'System Team',
        tags: ['architecture', 'technical'],
      },
    ],
  },
  {
    id: 'api',
    title: 'API Documentation',
    description: 'Complete API reference with examples',
    icon: 'Code',
    priority: 'high',
    sections: [
      {
        id: 'authentication',
        title: 'Authentication',
        content: 'API authentication methods and examples',
        lastUpdated: new Date(),
        author: 'API Team',
        tags: ['api', 'auth'],
      },
      {
        id: 'endpoints',
        title: 'API Endpoints',
        content: 'Complete list of all API endpoints',
        lastUpdated: new Date(),
        author: 'API Team',
        tags: ['api', 'endpoints'],
      },
    ],
  },
  {
    id: 'deployment',
    title: 'Deployment Guides',
    description: 'Step-by-step deployment instructions',
    icon: 'Rocket',
    priority: 'high',
    sections: [
      {
        id: 'backend',
        title: 'Backend Deployment',
        content: 'Backend deployment guide',
        lastUpdated: new Date(),
        author: 'DevOps Team',
        tags: ['deployment', 'backend'],
      },
      {
        id: 'frontend',
        title: 'Frontend Deployment',
        content: 'Frontend deployment guide',
        lastUpdated: new Date(),
        author: 'DevOps Team',
        tags: ['deployment', 'frontend'],
      },
    ],
  },
  {
    id: 'user-guides',
    title: 'User Guides',
    description: 'User manuals in multiple Nigerian languages',
    icon: 'Users',
    priority: 'high',
    sections: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        content: 'How to get started with MISS Legal AI',
        lastUpdated: new Date(),
        author: 'UX Team',
        tags: ['user-guide', 'getting-started'],
      },
      {
        id: 'voice-interface',
        title: 'Voice Interface Guide',
        content: 'How to use the voice interface effectively',
        lastUpdated: new Date(),
        author: 'UX Team',
        tags: ['user-guide', 'voice'],
      },
    ],
  },
  {
    id: 'compliance',
    title: 'Compliance & Legal',
    description: 'NDPR compliance and Nigerian legal requirements',
    icon: 'Shield',
    priority: 'high',
    sections: [
      {
        id: 'ndpr',
        title: 'NDPR Compliance',
        content: 'Nigerian Data Protection Regulation compliance',
        lastUpdated: new Date(),
        author: 'Legal Team',
        tags: ['compliance', 'ndpr'],
      },
      {
        id: 'emergency',
        title: 'Emergency Protocols',
        content: 'Emergency response procedures',
        lastUpdated: new Date(),
        author: 'Legal Team',
        tags: ['compliance', 'emergency'],
      },
    ],
  },
  {
    id: 'operations',
    title: 'Operations',
    description: 'System monitoring and maintenance procedures',
    icon: 'Activity',
    priority: 'medium',
    sections: [
      {
        id: 'monitoring',
        title: 'System Monitoring',
        content: 'How to monitor system health and performance',
        lastUpdated: new Date(),
        author: 'Operations Team',
        tags: ['operations', 'monitoring'],
      },
      {
        id: 'troubleshooting',
        title: 'Troubleshooting',
        content: 'Common issues and solutions',
        lastUpdated: new Date(),
        author: 'Operations Team',
        tags: ['operations', 'troubleshooting'],
      },
    ],
  },
];

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate user and obtain access token',
    authentication: false,
    requestBody: {
      email: 'string',
      password: 'string',
    },
    responses: [
      {
        status: 200,
        description: 'Successfully authenticated',
        schema: {
          token: 'string',
          user: 'object',
          expiresIn: 'number',
        },
      },
      {
        status: 401,
        description: 'Invalid credentials',
        schema: {
          error: 'string',
          message: 'string',
        },
      },
    ],
    example: {
      request: {
        email: 'user@example.com',
        password: 'securePassword123',
      },
      response: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: '1',
          email: 'user@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
        expiresIn: 3600,
      },
    },
  },
  {
    method: 'POST',
    path: '/api/voice/session',
    description: 'Start a new voice session with MISS',
    authentication: true,
    parameters: [
      {
        name: 'language',
        type: 'string',
        required: false,
        description: 'Preferred language for the session',
        example: 'english',
      },
    ],
    responses: [
      {
        status: 201,
        description: 'Voice session created successfully',
        schema: {
          sessionId: 'string',
          websocketUrl: 'string',
          expiresAt: 'string',
        },
      },
    ],
    example: {
      request: {
        language: 'english',
        emergencyDetection: true,
      },
      response: {
        sessionId: 'vs_1234567890',
        websocketUrl: 'wss://api.misslegal.ai/voice/stream/vs_1234567890',
        expiresAt: '2024-01-01T12:00:00Z',
      },
    },
  },
  {
    method: 'POST',
    path: '/api/documents/generate',
    description: 'Generate legal document based on voice input or form data',
    authentication: true,
    requestBody: {
      type: 'string',
      data: 'object',
      language: 'string',
    },
    responses: [
      {
        status: 201,
        description: 'Document generated successfully',
        schema: {
          documentId: 'string',
          downloadUrl: 'string',
          type: 'string',
        },
      },
    ],
    example: {
      request: {
        type: 'tenancy',
        data: {
          landlordName: 'John Doe',
          tenantName: 'Jane Smith',
          propertyAddress: 'Lagos, Nigeria',
          rentAmount: 1200000,
        },
        language: 'english',
      },
      response: {
        documentId: 'doc_1234567890',
        downloadUrl: 'https://api.misslegal.ai/documents/doc_1234567890/download',
        type: 'tenancy',
      },
    },
  },
];

export const LAUNCH_READINESS_CHECKS: LaunchReadinessCheck[] = [
  {
    category: 'Technical Infrastructure',
    overallScore: 95,
    status: 'ready',
    items: [
      {
        name: 'Frontend Deployment',
        status: 'completed',
        description: 'Frontend application deployed and accessible',
        priority: 'critical',
      },
      {
        name: 'Backend API Deployment',
        status: 'completed',
        description: 'Backend API deployed with all endpoints functional',
        priority: 'critical',
      },
      {
        name: 'Database Setup',
        status: 'completed',
        description: 'Production database configured and secured',
        priority: 'critical',
      },
      {
        name: 'Voice AI Pipeline',
        status: 'completed',
        description: 'Voice processing pipeline operational',
        priority: 'critical',
      },
      {
        name: 'Emergency Detection System',
        status: 'completed',
        description: 'Emergency detection and response system active',
        priority: 'critical',
      },
    ],
  },
  {
    category: 'Security & Compliance',
    overallScore: 90,
    status: 'ready',
    items: [
      {
        name: 'NDPR Compliance Review',
        status: 'completed',
        description: 'NDPR compliance validated and documented',
        priority: 'critical',
      },
      {
        name: 'Security Audit',
        status: 'completed',
        description: 'Complete security audit passed',
        priority: 'critical',
      },
      {
        name: 'Data Encryption',
        status: 'completed',
        description: 'All data encrypted in transit and at rest',
        priority: 'critical',
      },
      {
        name: 'Emergency Protocols',
        status: 'completed',
        description: 'Emergency response protocols implemented',
        priority: 'high',
      },
    ],
  },
  {
    category: 'Nigerian Market Readiness',
    overallScore: 98,
    status: 'ready',
    items: [
      {
        name: 'Multi-language Support',
        status: 'completed',
        description: 'Support for 5 Nigerian languages implemented',
        priority: 'critical',
      },
      {
        name: 'Nigerian Legal Integration',
        status: 'completed',
        description: 'Nigerian legal requirements and procedures integrated',
        priority: 'critical',
      },
      {
        name: 'Flutterwave Integration',
        status: 'completed',
        description: 'Nigerian payment methods integrated',
        priority: 'critical',
      },
      {
        name: 'Emergency Services Integration',
        status: 'completed',
        description: 'Nigerian emergency services contacts configured',
        priority: 'critical',
      },
    ],
  },
  {
    category: 'Quality Assurance',
    overallScore: 92,
    status: 'ready',
    items: [
      {
        name: 'Automated Testing',
        status: 'completed',
        description: 'Comprehensive test suite with 90% coverage',
        priority: 'high',
      },
      {
        name: 'Performance Testing',
        status: 'completed',
        description: 'Load testing completed for Nigerian network conditions',
        priority: 'high',
      },
      {
        name: 'User Acceptance Testing',
        status: 'completed',
        description: 'UAT completed with Nigerian users',
        priority: 'high',
      },
      {
        name: 'Voice Quality Testing',
        status: 'completed',
        description: 'Voice AI quality validated across languages',
        priority: 'critical',
      },
    ],
  },
  {
    category: 'Documentation & Support',
    overallScore: 88,
    status: 'ready',
    items: [
      {
        name: 'API Documentation',
        status: 'completed',
        description: 'Complete API documentation with examples',
        priority: 'high',
      },
      {
        name: 'User Guides',
        status: 'completed',
        description: 'User guides in multiple Nigerian languages',
        priority: 'high',
      },
      {
        name: 'Operations Manual',
        status: 'completed',
        description: 'System operations and maintenance manual',
        priority: 'high',
      },
      {
        name: 'Support Procedures',
        status: 'in-progress',
        description: 'Customer support procedures being finalized',
        priority: 'medium',
      },
    ],
  },
];

export const MOCK_SYSTEM_METRICS: SystemMetrics = {
  totalUsers: 50000,
  activeUsers: 12500,
  documentsGenerated: 25000,
  voiceSessions: 85000,
  emergencyAlerts: 1200,
  uptime: 99.8,
  responseTime: 120,
  errorRate: 0.2,
};

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara',
  'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau',
  'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export const LANGUAGES = {
  english: { name: 'English', flag: '🇬🇧', code: 'en' },
  pidgin: { name: 'Nigerian Pidgin', flag: '🇳🇬', code: 'pcm' },
  yoruba: { name: 'Yorùbá', flag: '🇳🇬', code: 'yo' },
  hausa: { name: 'Hausa', flag: '🇳🇬', code: 'ha' },
  igbo: { name: 'Igbo', flag: '🇳🇬', code: 'ig' },
};
