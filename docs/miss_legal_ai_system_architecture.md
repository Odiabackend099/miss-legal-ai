# MISS Legal AI - Comprehensive System Architecture Specification

## Executive Summary

MISS Legal AI is a voice-first legal assistant designed for Nigerian users, created by ODIA Intelligence + Mudiame University. The system features "Minnie Max," a multilingual voice agent capable of generating legal documents, detecting emergencies, and providing legal guidance across English, Pidgin, Yoruba, Hausa, and Igbo languages.

## 1. System Overview

### 1.1 Core Features
- **Voice Agent "Minnie Max"**: Real-time voice processing with emergency response capabilities
- **Legal Document Generation**: Automated creation of Tenancy Agreements, Affidavits, and Power of Attorney documents
- **Multi-language Support**: Native processing for Nigerian languages (Pidgin, Yoruba, Hausa, Igbo, English)
- **Emergency Dispatch**: Real-time emergency detection with WhatsApp notifications
- **Payment Integration**: Tiered subscription model from free to enterprise levels
- **NDPR Compliance**: Full compliance with Nigerian Data Protection regulations

### 1.2 Technology Stack
- **Backend**: Hono.js + tRPC + Supabase
- **Voice Processing**: Whisper (STT) + GPT-4o + ElevenLabs (TTS)
- **Emergency Detection**: CNN-based audio analysis
- **Payments**: Flutterwave integration with subscription management
- **Messaging**: WhatsApp Business API + Twilio
- **Automation**: N8N workflow automation
- **Database**: PostgreSQL (via Supabase) with real-time capabilities

## 2. Architecture Design

### 2.1 High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Voice Client   │────│  API Gateway    │────│  Core Services  │
│   (Web/Mobile)   │    │   (Hono.js)     │    │     (tRPC)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Voice Processing │    │   Real-time     │    │    Database     │
│   Pipeline       │    │   Services      │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Emergency System │    │   Integration   │    │   Workflow      │
│   (Detection)    │    │   Services      │    │  Automation     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 2.2 Voice Processing Pipeline Architecture

```
Audio Input → Voice Activity Detection → STT (Whisper) → Intent Processing (GPT-4o) → 
Response Generation → TTS (ElevenLabs) → Audio Output
      ↓                     ↓                    ↓
Emergency Detection → Emergency Response → WhatsApp Alert
```

#### 2.2.1 Real-Time Voice Processing Components

**Speech-to-Text (STT)**
- **Primary**: OpenAI Whisper (multilingual support)
- **Latency**: ~280ms TTFT (Time to First Token)
- **Languages**: English, Yoruba, Hausa, Igbo, Nigerian Pidgin
- **Streaming**: Partial transcription for reduced latency

**Language Model Processing**
- **Primary**: GPT-4o with Nigerian legal document training
- **Token Speed**: ~70-100 tokens/second
- **Context Window**: 32K tokens
- **Specialized**: Legal document generation, Nigerian law compliance

**Text-to-Speech (TTS)**
- **Primary**: ElevenLabs for high-quality voice synthesis
- **Fallback**: OpenAI TTS for cost optimization
- **Languages**: All supported Nigerian languages
- **Voice Customization**: Custom "Minnie Max" voice profile

#### 2.2.2 Emergency Detection System

**Audio Analysis Pipeline**
```
Audio Stream → Feature Extraction (Mel Spectrogram + MFCCs) → 
Multi-Headed 2D CNN → Classification → Emergency Response
```

**Technical Specifications**
- **Sampling Rate**: 22,050 Hz
- **Window Size**: 450 ms with 112 ms overlap
- **Model**: Multi-Headed 2D CNN (79.67% accuracy)
- **Detection Classes**: Distress shouts, Help calls, Background noise
- **Response Time**: <1 second for emergency detection
- **False Positive Rate**: <4%

## 3. Database Schema Design

### 3.1 Core Entities

```sql
-- Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    full_name VARCHAR(255),
    preferred_language VARCHAR(10) DEFAULT 'english',
    subscription_tier VARCHAR(20) DEFAULT 'free',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    ndpr_consent BOOLEAN DEFAULT false,
    ndpr_consent_date TIMESTAMP
);

-- Legal Documents
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    document_type VARCHAR(50) NOT NULL, -- 'tenancy', 'affidavit', 'power_of_attorney'
    title VARCHAR(255),
    content JSONB, -- Structured document data
    template_version VARCHAR(10),
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'completed', 'signed'
    language VARCHAR(10) DEFAULT 'english',
    generated_at TIMESTAMP DEFAULT NOW(),
    signed_at TIMESTAMP,
    hash_signature VARCHAR(255), -- For document integrity
    ndpr_compliant BOOLEAN DEFAULT true
);

-- Voice Sessions
CREATE TABLE voice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_start TIMESTAMP DEFAULT NOW(),
    session_end TIMESTAMP,
    duration_seconds INTEGER,
    language_detected VARCHAR(10),
    intent_classification VARCHAR(50),
    conversation_log JSONB, -- Structured conversation data
    emergency_detected BOOLEAN DEFAULT false,
    quality_score DECIMAL(3,2), -- Voice quality metrics
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emergency Events
CREATE TABLE emergency_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES voice_sessions(id),
    event_type VARCHAR(50), -- 'distress_call', 'help_request', 'medical_emergency'
    confidence_score DECIMAL(3,2),
    audio_features JSONB, -- Mel spectrogram features for analysis
    location_data JSONB, -- GPS coordinates if available
    response_triggered BOOLEAN DEFAULT false,
    response_time_ms INTEGER,
    contact_notified VARCHAR(255), -- Phone/WhatsApp contact
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Payments and Subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    plan_name VARCHAR(50), -- 'free', 'basic', 'professional', 'enterprise'
    flutterwave_plan_id INTEGER,
    flutterwave_subscription_id VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'NGN',
    interval VARCHAR(20), -- 'monthly', 'yearly'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'cancelled', 'expired'
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    cancelled_at TIMESTAMP
);

-- Compliance and Audit
CREATE TABLE ndpr_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50), -- 'data_access', 'data_modification', 'data_deletion'
    data_type VARCHAR(50), -- 'voice_data', 'document_data', 'personal_info'
    legal_basis VARCHAR(50), -- 'consent', 'legitimate_interest', 'contract'
    purpose VARCHAR(255),
    retention_period INTEGER, -- Days
    auto_delete_at TIMESTAMP,
    performed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Integration Events
CREATE TABLE integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50), -- 'whatsapp_sent', 'payment_received', 'document_generated'
    payload JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    external_id VARCHAR(255), -- Reference to external system
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);
```

### 3.2 Indexes and Performance Optimization

```sql
-- Performance indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_created_at ON voice_sessions(created_at);
CREATE INDEX idx_emergency_events_user_id ON emergency_events(user_id);
CREATE INDEX idx_emergency_events_created_at ON emergency_events(created_at);
CREATE INDEX idx_legal_documents_user_id ON legal_documents(user_id);
CREATE INDEX idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- NDPR compliance indexes
CREATE INDEX idx_ndpr_audit_user_id ON ndpr_audit_logs(user_id);
CREATE INDEX idx_ndpr_audit_created_at ON ndpr_audit_logs(created_at);
CREATE INDEX idx_ndpr_audit_auto_delete ON ndpr_audit_logs(auto_delete_at);
```

## 4. API Endpoint Specifications

### 4.1 Voice Processing Endpoints

```typescript
// Voice Session Management
POST /api/v1/voice/session/start
POST /api/v1/voice/session/end
GET /api/v1/voice/session/{sessionId}
POST /api/v1/voice/process-audio
GET /api/v1/voice/sessions

// Real-time WebSocket endpoints
WS /api/v1/voice/stream
WS /api/v1/emergency/alerts
```

### 4.2 Legal Document Endpoints

```typescript
// Document Generation
POST /api/v1/documents/generate
GET /api/v1/documents/{documentId}
PUT /api/v1/documents/{documentId}
DELETE /api/v1/documents/{documentId}
GET /api/v1/documents/templates
POST /api/v1/documents/{documentId}/sign

// Document Types
POST /api/v1/documents/tenancy-agreement
POST /api/v1/documents/affidavit
POST /api/v1/documents/power-of-attorney
```

### 4.3 Emergency System Endpoints

```typescript
// Emergency Management
POST /api/v1/emergency/trigger
GET /api/v1/emergency/events
PUT /api/v1/emergency/{eventId}/resolve
POST /api/v1/emergency/test-alert
GET /api/v1/emergency/contacts
```

### 4.4 Payment and Subscription Endpoints

```typescript
// Subscription Management
GET /api/v1/subscriptions
POST /api/v1/subscriptions/create
PUT /api/v1/subscriptions/{subscriptionId}/cancel
POST /api/v1/payments/webhook/flutterwave
GET /api/v1/payments/plans
```

## 5. Nigerian Legal Document Compliance

### 5.1 Tenancy Agreement Requirements

**Essential Clauses (Nigerian Law)**
- Parties identification (Landlord and Tenant details)
- Property description and address
- Lease term (start/end dates)
- Rent amount and payment schedule
- Security deposit terms
- Repair and maintenance responsibilities
- Subletting restrictions
- Termination notice periods (minimum 1 month for monthly, 3 months for yearly)
- Governor's consent requirement (for leases >3 years)
- Stamp duty compliance

**Template Structure**
```json
{
  "document_type": "tenancy_agreement",
  "parties": {
    "landlord": {
      "name": "string",
      "address": "string",
      "phone": "string",
      "email": "string"
    },
    "tenant": {
      "name": "string",
      "address": "string",
      "phone": "string",
      "email": "string"
    }
  },
  "property": {
    "address": "string",
    "type": "residential|commercial",
    "description": "string"
  },
  "terms": {
    "lease_start": "date",
    "lease_end": "date",
    "rent_amount": "number",
    "payment_frequency": "monthly|yearly",
    "security_deposit": "number",
    "notice_period": "string"
  },
  "compliance": {
    "stamp_duty_required": "boolean",
    "governors_consent_required": "boolean",
    "state_law_applicable": "string"
  }
}
```

### 5.2 Affidavit Requirements

**Mandatory Components (Evidence Act 2011)**
- Court heading
- Case number and parties
- Deponent information (name, gender, citizenship, occupation, address)
- Statement of facts only (no arguments or conclusions)
- Oath clause compliance
- Commissioner for Oaths attestation
- Date and signature requirements

### 5.3 Power of Attorney Requirements

**Legal Compliance Standards**
- Proper execution under seal for deed execution
- Witness requirements (Notary Public, Judge, or Magistrate)
- Clear scope of authority
- Revocation procedures
- Stamp duty compliance
- Registration requirements for land-related matters
- Governor's consent for state land transactions

## 6. NDPR Compliance Framework

### 6.1 Data Protection Requirements (GAID 2025)

**Core Compliance Measures**
- Explicit consent for sensitive data processing
- Data Protection Officer (DPO) appointment
- Privacy Champion designation for multi-platform interfaces
- Licensed DPCO engagement for audits
- Data Protection Impact Assessment (DPIA) for AI systems
- Cross-border transfer approval
- Data retention limits (6 months post-purpose achievement)

**Technical Implementation**
```typescript
// NDPR Consent Management
interface NDPRConsent {
  userId: string;
  consentType: 'explicit' | 'constructive';
  dataTypes: string[];
  purposes: string[];
  legalBasis: 'consent' | 'legitimate_interest' | 'contract';
  consentDate: Date;
  expiryDate?: Date;
  withdrawn: boolean;
  withdrawalDate?: Date;
}

// Data Retention Policy
interface DataRetentionPolicy {
  dataType: string;
  retentionPeriodDays: number;
  autoDeleteEnabled: boolean;
  legalBasisForRetention: string;
  deletionMethod: 'hard_delete' | 'anonymization';
}
```

### 6.2 Audit and Compliance Monitoring

**Automated Compliance Checks**
- Real-time data access logging
- Automated retention period enforcement
- Consent status monitoring
- Cross-border transfer approval validation
- DPIA requirement triggers for AI processing

## 7. Integration Specifications

### 7.1 WhatsApp Business API Integration

**Emergency Notification System**
```typescript
// WhatsApp Emergency Alert
interface EmergencyAlert {
  recipientPhone: string;
  messageType: 'text' | 'location' | 'media';
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  message: {
    text: string;
    location?: {
      latitude: number;
      longitude: number;
      address: string;
    };
    mediaUrl?: string;
  };
  followUpRequired: boolean;
  escalationContacts: string[];
}
```

**Integration Pattern**
- Webhook endpoint: `/api/v1/whatsapp/webhook`
- Authentication: Bearer token with signature verification
- Message templates for emergency types
- Delivery status tracking
- Two-way communication support

### 7.2 Flutterwave Payment Integration

**Subscription Management**
```typescript
// Payment Plan Configuration
interface PaymentPlan {
  name: string;
  amount: number;
  currency: 'NGN';
  interval: 'monthly' | 'yearly';
  duration?: number; // months
  features: string[];
  documentLimit: number;
  voiceMinutes: number;
  emergencyAlerts: boolean;
}

// Subscription Tiers
const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    amount: 0,
    documentLimit: 2,
    voiceMinutes: 30,
    emergencyAlerts: false
  },
  basic: {
    name: 'Basic',
    amount: 2500,
    documentLimit: 10,
    voiceMinutes: 120,
    emergencyAlerts: true
  },
  professional: {
    name: 'Professional',
    amount: 7500,
    documentLimit: 50,
    voiceMinutes: 300,
    emergencyAlerts: true
  },
  enterprise: {
    name: 'Enterprise',
    amount: 25000,
    documentLimit: -1, // unlimited
    voiceMinutes: -1, // unlimited
    emergencyAlerts: true
  }
};
```

### 7.3 N8N Workflow Automation

**Existing Workflow Integration**
- Revenue trigger webhook: `/webhook/voice-crm-nigeria`
- Payment success processing via Flutterwave webhooks
- Voice onboarding automation
- Lexi API integration for voice calls
- Twilio SMS notifications
- Supabase logging integration

## 8. Security and Compliance Framework

### 8.1 Data Security Measures

**Encryption Standards**
- End-to-end encryption for voice communications
- AES-256 encryption for stored documents
- TLS 1.3 for all API communications
- Hash-based document integrity verification

**Access Control**
```typescript
// Role-Based Access Control
interface UserRole {
  role: 'user' | 'admin' | 'dpo' | 'support';
  permissions: Permission[];
  dataAccessLevel: 'own' | 'department' | 'organization';
  auditRequired: boolean;
}

interface Permission {
  resource: string;
  actions: ('create' | 'read' | 'update' | 'delete')[];
  conditions?: Record<string, any>;
}
```

### 8.2 Voice Data Protection

**Real-time Processing Security**
- Audio stream encryption during transmission
- Temporary audio storage with automatic deletion
- Voice fingerprint anonymization
- Emergency audio retention for legal requirements only

## 9. Deployment Strategy

### 9.1 Infrastructure Architecture

**Cloud Provider**: Primary deployment on Cloudflare Workers + Supabase
**CDN**: Cloudflare for global edge deployment
**Database**: Supabase PostgreSQL with real-time capabilities
**File Storage**: Supabase Storage for documents and audio files
**Monitoring**: Real-time performance and security monitoring

### 9.2 Scalability Considerations

**TaaS Model (Technology as a Service)**
- Target: 100 concurrent users
- Voice processing: Edge-based deployment for low latency
- Database connections: Connection pooling and read replicas
- Emergency detection: Real-time processing with <1s response time

**DaaS Model (Data as a Service)**
- Enterprise clients with dedicated instances
- Custom voice models and legal templates
- Dedicated database schemas
- SLA guarantees for uptime and response times

### 9.3 Monitoring and Analytics

**Performance Metrics**
- Voice processing latency (target: <500ms end-to-end)
- Emergency detection accuracy (target: >95%)
- Document generation success rate (target: >99%)
- User satisfaction scores
- NDPR compliance metrics

**Operational Monitoring**
- Real-time system health dashboards
- Automated alerting for system failures
- User behavior analytics
- Security incident monitoring
- Compliance audit trails

## 10. Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-4)
- Hono + tRPC + Supabase backend setup
- Database schema implementation
- Basic authentication and user management
- NDPR compliance framework

### Phase 2: Voice Processing Pipeline (Weeks 5-8)
- Whisper STT integration
- GPT-4o processing with Nigerian legal training
- ElevenLabs TTS integration
- Real-time voice streaming setup

### Phase 3: Legal Document Generation (Weeks 9-12)
- Nigerian legal document templates
- Document generation API
- Digital signature integration
- Compliance validation

### Phase 4: Emergency Detection System (Weeks 13-16)
- CNN model training for Nigerian audio patterns
- Real-time audio analysis pipeline
- WhatsApp emergency notification system
- Emergency response workflows

### Phase 5: Payment and Subscription System (Weeks 17-20)
- Flutterwave integration
- Subscription tier management
- Payment webhook processing
- Revenue analytics

### Phase 6: Testing and Deployment (Weeks 21-24)
- Comprehensive system testing
- NDPR compliance audit
- Performance optimization
- Production deployment
- User training and documentation

## 11. Risk Assessment and Mitigation

### 11.1 Technical Risks
- **Voice processing latency**: Mitigated by edge deployment and caching
- **Emergency false positives**: Addressed by multi-model validation
- **Data breach**: Prevented by encryption and access controls
- **System downtime**: Reduced by redundancy and monitoring

### 11.2 Compliance Risks
- **NDPR violations**: Mitigated by automated compliance checks
- **Legal document validity**: Addressed by expert review and validation
- **Cross-border data issues**: Managed by approval processes

### 11.3 Business Risks
- **User adoption**: Mitigated by free tier and gradual onboarding
- **Competition**: Addressed by unique Nigerian focus and multilingual support
- **Revenue model**: Validated by existing ODIA Intelligence customer base

## Conclusion

The MISS Legal AI system represents a comprehensive solution for voice-first legal assistance in Nigeria. By leveraging modern AI technologies, robust security frameworks, and deep understanding of Nigerian legal requirements, the system provides a scalable, compliant, and user-friendly platform for legal document generation and emergency response.

The architecture is designed for high availability, low latency, and strict compliance with NDPR regulations while maintaining cost-effectiveness through tiered subscription models. The phased implementation approach ensures systematic development and testing of each component while maintaining system reliability and user experience.
