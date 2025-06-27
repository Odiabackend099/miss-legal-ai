// Documentation Page for MISS Legal AI System
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  ChevronRight,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Code,
  Shield,
  Zap,
  Globe,
  Users,
  Settings,
  Database,
  Smartphone,
  Workflow
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { DOCUMENTATION_SECTIONS } from '@/config';

const DocumentationPage: React.FC = () => {
  const { section, subsection } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const documentationSections = [
    {
      id: 'overview',
      title: 'System Overview',
      icon: BookOpen,
      description: 'Complete system architecture and capabilities',
      subsections: [
        { id: 'introduction', title: 'Introduction to MISS Legal AI' },
        { id: 'architecture', title: 'System Architecture' },
        { id: 'features', title: 'Core Features' },
        { id: 'technology-stack', title: 'Technology Stack' },
      ]
    },
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Zap,
      description: 'Quick start guide and initial setup',
      subsections: [
        { id: 'installation', title: 'Installation Guide' },
        { id: 'configuration', title: 'Configuration' },
        { id: 'first-steps', title: 'First Steps' },
        { id: 'authentication', title: 'Authentication Setup' },
      ]
    },
    {
      id: 'voice-ai',
      title: 'Voice AI System',
      icon: Globe,
      description: 'Voice processing and AI conversation system',
      subsections: [
        { id: 'voice-pipeline', title: 'Voice Processing Pipeline' },
        { id: 'language-support', title: 'Multi-language Support' },
        { id: 'emergency-detection', title: 'Emergency Detection' },
        { id: 'voice-quality', title: 'Voice Quality Optimization' },
      ]
    },
    {
      id: 'legal-documents',
      title: 'Legal Document Generation',
      icon: FileText,
      description: 'Document generation and Nigerian legal compliance',
      subsections: [
        { id: 'document-types', title: 'Supported Document Types' },
        { id: 'templates', title: 'Document Templates' },
        { id: 'validation', title: 'Legal Validation' },
        { id: 'compliance', title: 'Nigerian Legal Compliance' },
      ]
    },
    {
      id: 'integrations',
      title: 'Integrations',
      icon: Workflow,
      description: 'Third-party integrations and APIs',
      subsections: [
        { id: 'flutterwave', title: 'Flutterwave Payment Integration' },
        { id: 'whatsapp', title: 'WhatsApp Emergency Integration' },
        { id: 'n8n-workflows', title: 'N8N Automation Workflows' },
        { id: 'supabase', title: 'Supabase Database Integration' },
      ]
    },
    {
      id: 'deployment',
      title: 'Deployment',
      icon: Settings,
      description: 'Production deployment and DevOps',
      subsections: [
        { id: 'backend-deployment', title: 'Backend Deployment' },
        { id: 'frontend-deployment', title: 'Frontend Deployment' },
        { id: 'mobile-deployment', title: 'Mobile App Deployment' },
        { id: 'monitoring', title: 'Monitoring & Logging' },
      ]
    },
    {
      id: 'security',
      title: 'Security & Compliance',
      icon: Shield,
      description: 'Security measures and NDPR compliance',
      subsections: [
        { id: 'data-protection', title: 'Data Protection (NDPR)' },
        { id: 'encryption', title: 'Encryption Standards' },
        { id: 'access-control', title: 'Access Control' },
        { id: 'audit-logs', title: 'Audit Logging' },
      ]
    },
    {
      id: 'mobile',
      title: 'Mobile Application',
      icon: Smartphone,
      description: 'React Native mobile app documentation',
      subsections: [
        { id: 'mobile-setup', title: 'Mobile Setup' },
        { id: 'features', title: 'Mobile Features' },
        { id: 'offline-support', title: 'Offline Support' },
        { id: 'push-notifications', title: 'Push Notifications' },
      ]
    }
  ];

  const codeExamples = {
    'voice-session': `// Start a voice session with MISS Legal AI
const startVoiceSession = async () => {
  try {
    const response = await fetch('/api/voice/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({
        language: 'english',
        emergencyDetection: true
      })
    });
    
    const session = await response.json();
    
    // Connect to WebSocket for real-time voice streaming
    const ws = new WebSocket(session.websocketUrl);
    
    ws.onopen = () => {
      console.log('Voice session connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleVoiceResponse(data);
    };
    
    return session;
  } catch (error) {
    console.error('Failed to start voice session:', error);
  }
};`,

    'document-generation': `// Generate a legal document
const generateDocument = async (documentData) => {
  try {
    const response = await fetch('/api/documents/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${token}\`
      },
      body: JSON.stringify({
        type: 'tenancy',
        data: {
          landlordName: 'John Doe',
          tenantName: 'Jane Smith',
          propertyAddress: 'Lagos, Nigeria',
          rentAmount: 1200000,
          duration: 12,
          startDate: '2024-01-01'
        },
        language: 'english'
      })
    });
    
    const document = await response.json();
    
    // Download the generated PDF
    window.open(document.downloadUrl, '_blank');
    
    return document;
  } catch (error) {
    console.error('Failed to generate document:', error);
  }
};`,

    'emergency-detection': `// Emergency detection configuration
const configureEmergencyDetection = () => {
  const emergencyConfig = {
    keywords: [
      'help', 'emergency', 'police', 'fire', 'medical',
      'danger', 'attack', 'accident', 'urgent'
    ],
    nigerianKeywords: [
      'wahala', 'problem', 'police', 'fire service',
      'hospital', 'danger', 'help me'
    ],
    confidenceThreshold: 0.8,
    responseTime: 30, // seconds
    escalationContacts: [
      { type: 'police', number: '199' },
      { type: 'emergency', number: '112' },
      { type: 'fire', number: '123' }
    ]
  };
  
  return emergencyConfig;
};`
  };

  const getCurrentSectionContent = () => {
    if (!section) return null;

    const currentSection = documentationSections.find(s => s.id === section);
    if (!currentSection) return null;

    switch (section) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                MISS Legal AI System Overview
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                MISS Legal AI is a comprehensive voice-first legal assistant system designed specifically 
                for the Nigerian market. It combines advanced AI technology with deep understanding of 
                Nigerian legal requirements to provide accessible legal assistance to all Nigerians.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Core Capabilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center mr-3 mt-1">
                      <Globe className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Multi-language Voice AI</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Support for English, Pidgin, Yoruba, Hausa, and Igbo languages
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center mr-3 mt-1">
                      <FileText className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Legal Document Generation</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Automated generation of tenancy, affidavit, and power of attorney documents
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center mr-3 mt-1">
                      <Shield className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">Emergency Detection</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Real-time emergency detection with instant WhatsApp notifications
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-3 mt-1">
                      <Database className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">NDPR Compliance</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Full Nigerian Data Protection Regulation compliance
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <pre className="text-sm overflow-x-auto">
{`┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend Web  │    │   Mobile App    │    │ Documentation   │
│   (React/Vite)  │    │ (React Native)  │    │   (React)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Backend API   │
                    │  (Hono + tRPC)  │
                    └─────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Voice AI      │    │   Legal Docs    │    │   Emergency     │
│   Pipeline      │    │   Generator     │    │   Detection     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐               │
         │              │    Supabase     │               │
         │              │    Database     │               │
         │              └─────────────────┘               │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Whisper +     │    │   Flutterwave   │    │   WhatsApp      │
│   ElevenLabs    │    │   Payment       │    │   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘`}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'voice-ai':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Voice AI System
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                The voice AI system is the core of MISS Legal AI, providing natural language 
                processing and conversation capabilities in multiple Nigerian languages.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Voice Processing Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Voice Session Implementation</h4>
                    <div className="relative">
                      <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                        <code>{codeExamples['voice-session']}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyCode(codeExamples['voice-session'], 'voice-session')}
                      >
                        {copiedCode === 'voice-session' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Language Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Supported Languages</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center">
                        <span className="w-6 h-6 rounded bg-blue-100 text-blue-600 text-xs flex items-center justify-center mr-2">🇬🇧</span>
                        English (Primary)
                      </li>
                      <li className="flex items-center">
                        <span className="w-6 h-6 rounded bg-green-100 text-green-600 text-xs flex items-center justify-center mr-2">🇳🇬</span>
                        Nigerian Pidgin
                      </li>
                      <li className="flex items-center">
                        <span className="w-6 h-6 rounded bg-purple-100 text-purple-600 text-xs flex items-center justify-center mr-2">🇳🇬</span>
                        Yorùbá
                      </li>
                      <li className="flex items-center">
                        <span className="w-6 h-6 rounded bg-orange-100 text-orange-600 text-xs flex items-center justify-center mr-2">🇳🇬</span>
                        Hausa
                      </li>
                      <li className="flex items-center">
                        <span className="w-6 h-6 rounded bg-red-100 text-red-600 text-xs flex items-center justify-center mr-2">🇳🇬</span>
                        Igbo
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Voice Quality Features</h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li>• Real-time speech recognition</li>
                      <li>• Natural voice synthesis</li>
                      <li>• Accent adaptation</li>
                      <li>• Background noise filtering</li>
                      <li>• Network optimization</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'legal-documents':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Legal Document Generation
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
                Automated generation of Nigerian legal documents with full compliance validation.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Document Generation API</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Generate Legal Document</h4>
                    <div className="relative">
                      <pre className="text-sm bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto">
                        <code>{codeExamples['document-generation']}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2"
                        onClick={() => handleCopyCode(codeExamples['document-generation'], 'document-generation')}
                      >
                        {copiedCode === 'document-generation' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Supported Document Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Tenancy Agreement</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Comprehensive landlord-tenant agreements compliant with Nigerian property law.
                    </p>
                    <Badge variant="outline">Most Popular</Badge>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Affidavit</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Sworn statements for various legal purposes including name change, age declaration.
                    </p>
                    <Badge variant="outline">Common</Badge>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Power of Attorney</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      Legal documents granting authority to act on behalf of another person.
                    </p>
                    <Badge variant="outline">Specialized</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Section Coming Soon
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              This documentation section is being prepared. Please check back soon.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete system documentation for MISS Legal AI
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button variant="outline" size="sm">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Source
          </Button>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative max-w-md"
      >
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search documentation..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-1"
        >
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Documentation Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {documentationSections.map((docSection) => {
                const Icon = docSection.icon;
                const isActive = section === docSection.id;
                
                return (
                  <div key={docSection.id}>
                    <Link
                      to={`/docs/${docSection.id}`}
                      className={`flex items-center p-3 rounded-lg transition-colors ${
                        isActive 
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      <span className="font-medium">{docSection.title}</span>
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </Link>
                    
                    {isActive && docSection.subsections && (
                      <div className="ml-7 mt-2 space-y-1">
                        {docSection.subsections.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/docs/${docSection.id}/${sub.id}`}
                            className={`block p-2 text-sm rounded transition-colors ${
                              subsection === sub.id
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                            }`}
                          >
                            {sub.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-3"
        >
          {section ? (
            getCurrentSectionContent()
          ) : (
            <div className="space-y-8">
              {/* Welcome Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Welcome to MISS Legal AI Documentation</CardTitle>
                  <CardDescription>
                    Comprehensive documentation for the voice-first legal assistant system 
                    designed for Nigerian users.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Popular Sections
                      </h4>
                      <div className="space-y-2">
                        <Link 
                          to="/docs/overview" 
                          className="flex items-center text-purple-600 hover:text-purple-700 text-sm"
                        >
                          <BookOpen className="w-4 h-4 mr-2" />
                          System Overview
                        </Link>
                        <Link 
                          to="/docs/getting-started" 
                          className="flex items-center text-purple-600 hover:text-purple-700 text-sm"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Getting Started
                        </Link>
                        <Link 
                          to="/docs/voice-ai" 
                          className="flex items-center text-purple-600 hover:text-purple-700 text-sm"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Voice AI System
                        </Link>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Quick Links
                      </h4>
                      <div className="space-y-2">
                        <Link 
                          to="/api" 
                          className="flex items-center text-purple-600 hover:text-purple-700 text-sm"
                        >
                          <Code className="w-4 h-4 mr-2" />
                          API Reference
                        </Link>
                        <Link 
                          to="/guides" 
                          className="flex items-center text-purple-600 hover:text-purple-700 text-sm"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          User Guides
                        </Link>
                        <Link 
                          to="/compliance" 
                          className="flex items-center text-purple-600 hover:text-purple-700 text-sm"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Compliance & Legal
                        </Link>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Section Overview */}
              <div className="grid md:grid-cols-2 gap-6">
                {documentationSections.slice(0, 6).map((docSection) => {
                  const Icon = docSection.icon;
                  return (
                    <Link key={docSection.id} to={`/docs/${docSection.id}`}>
                      <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
                        <CardContent className="p-6">
                          <div className="flex items-start">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mr-4 group-hover:bg-purple-200 transition-colors">
                              <Icon className="w-5 h-5 text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                                {docSection.title}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {docSection.description}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default DocumentationPage;