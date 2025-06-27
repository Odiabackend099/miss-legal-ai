# MISS Legal AI - N8N Automation Workflows

## Overview

This repository contains comprehensive N8N automation workflows that orchestrate the entire MISS Legal AI system, integrating voice AI, document generation, emergency response, payments, and lawyer consultations into seamless automated processes optimized for the Nigerian market.

## 🚀 Quick Start

### Prerequisites

1. **N8N Instance**: Running N8N server (v1.0.0 or higher)
2. **Supabase Database**: PostgreSQL database with proper schema
3. **API Keys**: All required service credentials (see Environment Variables)
4. **Webhook URLs**: Configured N8N webhook endpoints

### Installation

1. **Import Workflows**:
   ```bash
   # Import all workflows to your N8N instance
   curl -X POST https://your-n8n-instance.com/api/v1/workflows/import \
     -H "Content-Type: application/json" \
     -d @01-user-onboarding-workflow.json
   ```

2. **Configure Environment Variables** (see Configuration section)

3. **Activate Workflows**:
   - Enable all workflows in N8N interface
   - Test webhook endpoints
   - Verify database connections

## 📋 Workflow Overview

### 1. User Onboarding & Registration
**File**: `01-user-onboarding-workflow.json`
**Webhook**: `/webhook/user-onboarding`

**Purpose**: Automates new user registration with Nigerian market optimization.

**Features**:
- Multi-language welcome messages (English, Yoruba, Hausa, Igbo, Pidgin)
- NDPR compliance setup
- Emergency contact configuration
- WhatsApp and email notifications
- Registration analytics tracking
- Default subscription tier assignment

**Triggers**:
- New user registration via API
- Google OAuth completion
- Email verification

### 2. Voice Session Management
**File**: `02-voice-session-management-workflow.json`
**Webhook**: `/webhook/voice-session`

**Purpose**: Manages voice AI interactions with intent classification and routing.

**Features**:
- Real-time voice session tracking
- Intent analysis and classification
- Emergency keyword detection
- Legal service routing
- Session quality metrics
- Multi-language processing

**Triggers**:
- Voice session initiation
- Audio data processing
- Session state changes

### 3. Emergency Detection & Response
**File**: `03-emergency-detection-response-workflow.json`
**Webhook**: `/webhook/emergency-response`

**Purpose**: Handles emergency situations with immediate response protocols.

**Features**:
- Multi-language emergency detection
- WhatsApp alerts to emergency contacts
- Nigerian emergency services integration (199, 123)
- Cultural sensitivity in messaging
- Follow-up monitoring
- False positive filtering

**Triggers**:
- Emergency keyword detection
- High confidence emergency classification
- Manual emergency activation

### 4. Legal Document Generation
**File**: `04-legal-document-generation-workflow.json`
**Webhook**: `/webhook/document-generation`

**Purpose**: Automates legal document creation with Nigerian legal compliance.

**Features**:
- Voice-to-document conversion
- Nigerian legal template system
- State-specific compliance (all 36 states + FCT)
- Multi-language document generation
- Legal validation and review
- PDF/Word generation with professional formatting

**Supported Documents**:
- Tenancy Agreements
- Affidavits
- Power of Attorney
- Custom legal documents

**Triggers**:
- Voice document request
- Direct document generation API call
- Template-based generation

### 5. Payment Processing & Subscription
**File**: `05-payment-processing-subscription-workflow.json`
**Webhook**: `/webhook/payment-callback`

**Purpose**: Handles Flutterwave payments and subscription management.

**Features**:
- Flutterwave payment verification
- Subscription tier management
- Multi-language payment confirmations
- Revenue analytics and reporting
- Failed payment retry mechanisms
- Nigerian payment method optimization

**Subscription Tiers**:
- **Free**: 2 documents/day, 1 emergency contact
- **Basic**: 5 documents/day, 3 emergency contacts, 1 consultation/month
- **Premium**: 25 documents/day, 10 emergency contacts, 5 consultations/month
- **Enterprise**: Unlimited access, custom features

**Triggers**:
- Flutterwave webhook notifications
- Subscription upgrade requests
- Payment failures

### 6. Lawyer Escalation & Consultation
**File**: `06-lawyer-escalation-workflow.json`
**Webhook**: `/webhook/lawyer-escalation`

**Purpose**: Connects users with qualified Nigerian lawyers.

**Features**:
- Lawyer matching by specialization and language
- Calendar integration and scheduling
- Multi-language consultation setup
- Payment processing for consultations
- Cultural and gender preferences
- Lawyer notification system

**Legal Areas**:
- Property Law
- Family Law
- Corporate Law
- Criminal Law
- Immigration Law
- General Legal Advice

**Triggers**:
- Voice request for lawyer consultation
- Complex legal matter escalation
- Document review requests

### 7. Quality Monitoring & Analytics
**File**: `07-quality-monitoring-analytics-workflow.json`
**Scheduler**: Every 6 hours + Daily reports

**Purpose**: Comprehensive system monitoring and business intelligence.

**Features**:
- Real-time performance monitoring
- Nigerian market analytics
- Quality score calculation
- Business intelligence reporting
- Critical alert system
- System optimization recommendations

**Metrics Tracked**:
- Voice processing accuracy
- Emergency detection precision
- Document generation success rates
- Payment processing reliability
- User engagement and retention
- Revenue and growth metrics

**Triggers**:
- Scheduled analytics collection
- Critical system alerts
- Performance threshold breaches

## 🔧 Configuration

### Environment Variables

Create `.env` file with the following variables:

```bash
# N8N Configuration
N8N_WEBHOOK_SECRET=your_webhook_secret
N8N_ENCRYPTION_KEY=your_encryption_key

# Supabase Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Backend API
BACKEND_API_URL=https://api.misslegai.com
BACKEND_API_KEY=your_backend_api_key

# Flutterwave Payment Processing
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxx
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-xxx
FLUTTERWAVE_WEBHOOK_SECRET=your_flw_webhook_secret

# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_SECRET=your_whatsapp_secret

# OpenAI API
OPENAI_API_KEY=sk-xxx
OPENAI_MODEL=gpt-4o

# Twilio (Voice & SMS)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Admin Notifications
ADMIN_EMAIL=admin@misslegai.com
ADMIN_WHATSAPP_NUMBER=2348123456789
```

### Webhook URLs

Configure the following webhook URLs in your N8N instance:

```bash
# Main webhook URL format
https://n8n.odia.ltd/webhook/{webhook-path}

# Specific webhook endpoints
USER_ONBOARDING: https://n8n.odia.ltd/webhook/user-onboarding
VOICE_SESSION: https://n8n.odia.ltd/webhook/voice-session
EMERGENCY_RESPONSE: https://n8n.odia.ltd/webhook/emergency-response
DOCUMENT_GENERATION: https://n8n.odia.ltd/webhook/document-generation
PAYMENT_CALLBACK: https://n8n.odia.ltd/webhook/payment-callback
LAWYER_ESCALATION: https://n8n.odia.ltd/webhook/lawyer-escalation
```

### Database Schema

Ensure your Supabase database has the following tables:

```sql
-- Core user management
users, user_analytics, emergency_contacts

-- Voice and session management
voice_sessions, session_analytics

-- Emergency system
emergencies, emergency_contacts

-- Document generation
documents, document_analytics, document_templates

-- Payment and subscription
payments, payment_analytics, subscription_plans

-- Lawyer consultation
lawyers, consultations, consultation_analytics

-- Analytics and monitoring
analytics_reports, system_alerts
```

## 🎯 Nigerian Market Optimizations

### Multi-Language Support

**Supported Languages**:
- **English**: Primary business language
- **Yoruba**: Southwest Nigeria
- **Hausa**: Northern Nigeria
- **Igbo**: Southeast Nigeria
- **Nigerian Pidgin**: Common across all regions

### Cultural Adaptations

**Naming Conventions**:
- Traditional titles: Chief, Alhaji, Alhaja, Oba, Emir
- Multi-part names with cultural sensitivity
- Religious considerations

**Communication Patterns**:
- Respectful greetings and closings
- Cultural context in emergency responses
- Religious and traditional holiday awareness

### Legal Compliance

**State-Specific Requirements**:
- All 36 Nigerian states + FCT
- State-specific stamp duty rates
- Local legal requirements and procedures
- Court-specific document formatting

**Nigerian Laws Integration**:
- Evidence Act 2011
- Nigerian Data Protection Regulation (NDPR)
- Stamp Duties Act
- State-specific property and tenancy laws

### Payment Optimization

**Local Payment Methods**:
- Bank transfers
- Mobile money (MTN, Airtel, 9mobile)
- Card payments
- USSD codes
- Digital wallets

**Currency Handling**:
- Nigerian Naira (₦) primary
- Proper number formatting
- Exchange rate considerations

## 📊 Monitoring & Analytics

### Key Performance Indicators (KPIs)

**Voice Processing**:
- Session success rate
- Average confidence score
- Response time
- Language distribution

**Emergency Detection**:
- Detection accuracy
- False positive rate
- Response time
- Resolution rate

**Document Generation**:
- Generation success rate
- Legal compliance rate
- User satisfaction
- Processing time

**Business Metrics**:
- Revenue growth
- User acquisition and retention
- Subscription conversions
- Market penetration by state

### Alert Thresholds

**Critical Alerts** (Immediate attention):
- System health < 70%
- Voice processing errors > 10%
- Payment processing errors > 5%
- Emergency detection false positives > 30%

**Warning Alerts** (Monitor closely):
- Document generation errors > 5%
- User satisfaction < 80%
- Revenue decline > 20%
- API response times > 5 seconds

### Reporting Schedule

**Real-Time**: Critical alerts and emergency responses
**Hourly**: System health checks
**6-Hourly**: Comprehensive analytics collection
**Daily**: Business intelligence reports
**Weekly**: Performance trends and optimization
**Monthly**: Strategic business reviews

## 🔒 Security & Compliance

### Data Protection

**NDPR Compliance**:
- Explicit user consent
- Data minimization
- Right to deletion
- Breach notification
- Regular compliance audits

**Security Measures**:
- End-to-end encryption
- API authentication
- Rate limiting
- Input validation
- Audit logging

### Access Control

**Role-Based Permissions**:
- Admin: Full system access
- Support: User assistance and monitoring
- Legal: Document review and compliance
- Finance: Payment and subscription management

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**:
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Configure production values
   vim .env
   ```

2. **Workflow Import**:
   ```bash
   # Import all workflows
   ./scripts/import-workflows.sh
   
   # Verify imports
   ./scripts/verify-workflows.sh
   ```

3. **Database Migration**:
   ```bash
   # Run database migrations
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

4. **Health Check**:
   ```bash
   # Test all webhook endpoints
   ./scripts/test-webhooks.sh
   
   # Verify integrations
   ./scripts/test-integrations.sh
   ```

### Staging Environment

Use the same deployment process with staging-specific environment variables:

```bash
# Staging environment
ENVIRONMENT=staging
SUPABASE_URL=https://staging-project.supabase.co
BACKEND_API_URL=https://staging-api.misslegai.com
```

## 🐛 Troubleshooting

### Common Issues

**Webhook Failures**:
```bash
# Check webhook logs
curl -X GET https://n8n.odia.ltd/api/v1/executions \
  -H "Authorization: Bearer $N8N_API_KEY"

# Test webhook connectivity
curl -X POST https://n8n.odia.ltd/webhook/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

**Database Connection Issues**:
```bash
# Test Supabase connection
curl -X GET $SUPABASE_URL/rest/v1/users \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"
```

**Payment Processing Issues**:
```bash
# Verify Flutterwave credentials
curl -X GET https://api.flutterwave.com/v3/account \
  -H "Authorization: Bearer $FLUTTERWAVE_SECRET_KEY"
```

### Debug Mode

Enable detailed logging by setting:

```bash
N8N_LOG_LEVEL=debug
N8N_LOG_OUTPUT=console,file
```

### Support

For technical support:
- **Email**: tech@misslegai.com
- **WhatsApp**: +234-XXX-XXXX-XXX
- **Documentation**: https://docs.misslegai.com
- **Status Page**: https://status.misslegai.com

## 📚 Additional Resources

### Documentation
- [API Documentation](../docs/api_specifications.md)
- [Database Schema](../docs/database_schema_design.sql)
- [System Architecture](../docs/miss_legal_ai_system_architecture.md)
- [Deployment Guide](../docs/deployment_guide.md)

### Training Materials
- [Voice AI Pipeline Guide](../docs/voice-ai-pipeline.md)
- [Legal Document Generation](../docs/legal-document-generation.md)
- [Nigerian Legal Compliance](../docs/nigeria-legal-compliance.md)

### Sample Integrations
- [Frontend Integration Examples](../frontend/examples/)
- [Mobile App Integration](../mobile/examples/)
- [Third-party API Examples](../integrations/examples/)

## 🔄 Version History

- **v1.0.0**: Initial release with core workflows
- **v1.1.0**: Enhanced Nigerian market features
- **v1.2.0**: Advanced analytics and monitoring
- **v1.3.0**: Improved emergency response system
- **v1.4.0**: Enhanced lawyer consultation features

## 📄 License

This project is proprietary software owned by MISS Legal AI. All rights reserved.

For licensing inquiries, contact: legal@misslegai.com

---

**MISS Legal AI** - Empowering Nigerian Legal Services with AI Innovation
