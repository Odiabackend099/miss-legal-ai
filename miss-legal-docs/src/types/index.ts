// Types for MISS Legal AI Documentation System

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  documentsGenerated: number;
  voiceSessions: number;
  emergencyAlerts: number;
  uptime: number;
  responseTime: number;
  errorRate: number;
}

export interface DeploymentStatus {
  frontend: {
    status: 'deployed' | 'pending' | 'failed';
    url: string;
    version: string;
    lastUpdated: Date;
  };
  backend: {
    status: 'deployed' | 'pending' | 'failed';
    url: string;
    version: string;
    lastUpdated: Date;
  };
  mobile: {
    status: 'deployed' | 'pending' | 'failed';
    platform: 'ios' | 'android' | 'both';
    version: string;
    lastUpdated: Date;
  };
  workflows: {
    status: 'deployed' | 'pending' | 'failed';
    active: number;
    total: number;
    lastUpdated: Date;
  };
}

export interface DocumentationSection {
  id: string;
  title: string;
  description: string;
  icon: string;
  sections: DocumentationSubSection[];
  priority: 'high' | 'medium' | 'low';
}

export interface DocumentationSubSection {
  id: string;
  title: string;
  content: string;
  lastUpdated: Date;
  author: string;
  tags: string[];
}

export interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  parameters?: ApiParameter[];
  requestBody?: any;
  responses: ApiResponse[];
  example: {
    request: any;
    response: any;
  };
  authentication: boolean;
  rateLimit?: string;
}

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface ApiResponse {
  status: number;
  description: string;
  schema: any;
}

export interface LaunchReadinessCheck {
  category: string;
  items: LaunchReadinessItem[];
  overallScore: number;
  status: 'ready' | 'needs-attention' | 'not-ready';
}

export interface LaunchReadinessItem {
  name: string;
  status: 'completed' | 'in-progress' | 'pending' | 'failed';
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  assignee?: string;
  dueDate?: Date;
  notes?: string;
}

export interface SystemHealth {
  service: string;
  status: 'healthy' | 'warning' | 'critical' | 'unknown';
  responseTime: number;
  uptime: number;
  lastCheck: Date;
  errorCount: number;
  dependencies: string[];
}

export interface UserJourney {
  step: number;
  title: string;
  description: string;
  completed: boolean;
  timeToComplete?: number;
  successRate?: number;
  commonIssues?: string[];
}

export interface SecurityCheck {
  check: string;
  status: 'passed' | 'failed' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  remediation?: string;
  lastChecked: Date;
}

export interface ComplianceCheck {
  regulation: string;
  status: 'compliant' | 'non-compliant' | 'partial';
  requirements: ComplianceRequirement[];
  lastAudit: Date;
  nextAudit: Date;
  auditor?: string;
}

export interface ComplianceRequirement {
  requirement: string;
  status: 'met' | 'not-met' | 'partial';
  evidence?: string;
  notes?: string;
}

export interface MarketMetrics {
  nigerianUsers: number;
  languageDistribution: Record<string, number>;
  stateDistribution: Record<string, number>;
  deviceTypes: Record<string, number>;
  networkQuality: Record<string, number>;
  paymentMethodUsage: Record<string, number>;
}

export type Language = 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo';

export interface Translation {
  [key: string]: string;
}

export interface MultiLanguageContent {
  english: string;
  pidgin?: string;
  yoruba?: string;
  hausa?: string;
  igbo?: string;
}
