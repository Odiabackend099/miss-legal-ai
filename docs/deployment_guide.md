# MISS Legal AI - Deployment Guide

## Prerequisites

### Required Services and Accounts
- Supabase account with PostgreSQL database
- Cloudflare Workers account for edge deployment
- OpenAI API key for GPT-4o and Whisper
- ElevenLabs API key for text-to-speech
- Flutterwave Business Account for payments
- WhatsApp Business API access
- Twilio account for SMS/voice calls
- N8N instance for workflow automation
- Domain name and SSL certificates

### Development Environment
```bash
# Required tools
node >= 18.0.0
npm >= 9.0.0
git
docker (optional, for local development)
```

## Environment Configuration

### Environment Variables

Create `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@host:5432/miss_legal_ai"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Authentication
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# AI Services
OPENAI_API_KEY="sk-proj-your-openai-key"
ELEVENLABS_API_KEY="your-elevenlabs-key"
LEXI_API_URL="https://vaas.lexi-ng.com/api/intent"
LEXI_MINIMAX_TOKEN="your-lexi-token"

# Payment Processing
FLUTTERWAVE_PUBLIC_KEY="FLWPUBK_TEST-your-public-key"
FLUTTERWAVE_SECRET_KEY="FLWSECK_TEST-your-secret-key"
FLUTTERWAVE_WEBHOOK_SECRET="your-webhook-secret"

# Messaging Services
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="+1234567890"
WHATSAPP_PHONE_NUMBER_ID="your-whatsapp-number-id"
WHATSAPP_ACCESS_TOKEN="your-whatsapp-token"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="your-webhook-verify-token"

# N8N Integration
N8N_WEBHOOK_URL="https://n8n.odia.ltd/webhook/voice-crm-nigeria"
N8N_API_KEY="your-n8n-api-key"

# Application Configuration
APP_ENV="development" # development, staging, production
APP_URL="https://miss-legal.odia.ltd"
API_URL="https://api.miss-legal.odia.ltd"
WS_URL="wss://ws.miss-legal.odia.ltd"

# File Storage
STORAGE_BUCKET="miss-legal-documents"
AUDIO_STORAGE_BUCKET="miss-legal-audio"
MAX_FILE_SIZE="10MB"
ALLOWED_FILE_TYPES="pdf,docx,mp3,wav"

# Security
CORS_ORIGINS="https://miss-legal.odia.ltd,https://app.miss-legal.odia.ltd"
RATE_LIMIT_WINDOW="15m"
RATE_LIMIT_MAX_REQUESTS="100"

# NDPR Compliance
DPO_EMAIL="dpo@odia.ltd"
DATA_RETENTION_DAYS="180"
AUDIT_LOG_RETENTION_DAYS="2555"
AUTO_DELETE_ENABLED="true"

# Monitoring
SENTRY_DSN="your-sentry-dsn"
LOG_LEVEL="info"
METRICS_ENABLED="true"
```

## Database Setup

### 1. Create Supabase Project

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to remote project
supabase link --project-ref your-project-ref
```

### 2. Run Database Migrations

```bash
# Apply schema
psql $DATABASE_URL -f docs/database_schema_design.sql

# Or using Supabase CLI
supabase db push
```

### 3. Set up Row Level Security

```sql
-- Enable RLS and create policies (already included in schema)
-- Verify policies are active
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 4. Configure Real-time

```sql
-- Enable real-time for required tables
ALTER publication supabase_realtime ADD TABLE voice_sessions;
ALTER publication supabase_realtime ADD TABLE emergency_events;
ALTER publication supabase_realtime ADD TABLE integration_events;
```

## Application Deployment

### 1. Backend API (Hono.js)

```bash
# Clone repository
git clone https://github.com/odia-intelligence/miss-legal-ai.git
cd miss-legal-ai

# Install dependencies
npm install

# Build application
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

### 2. Frontend Application

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Build for production
npm run build

# Deploy to Cloudflare Pages
npm run deploy
```

### 3. WebSocket Service

```bash
# Deploy WebSocket handler
cd websocket-service
npm install
npm run build
npm run deploy
```

## Voice Processing Pipeline Setup

### 1. Configure Voice Models

```typescript
// config/voice-models.ts
export const VOICE_CONFIG = {
  whisper: {
    model: 'whisper-1',
    language: 'auto',
    response_format: 'json',
    temperature: 0.0
  },
  gpt4o: {
    model: 'gpt-4o',
    max_tokens: 4096,
    temperature: 0.7,
    system_prompt: `You are Minnie Max, a legal assistant for Nigerian users. 
    You speak fluent English, Pidgin, Yoruba, Hausa, and Igbo. 
    You help generate legal documents and detect emergency situations.`
  },
  elevenlabs: {
    model_id: 'eleven_multilingual_v2',
    voice_id: 'your-custom-voice-id',
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.5,
      use_speaker_boost: true
    }
  }
};
```

### 2. Emergency Detection Model

```bash
# Download pre-trained emergency detection model
mkdir -p models/emergency-detection
cd models/emergency-detection

# Install Python dependencies for model serving
pip install torch torchaudio librosa numpy

# Deploy model to edge workers
npm run deploy:emergency-model
```

## Payment System Integration

### 1. Configure Flutterwave

```typescript
// config/payment-plans.ts
export const PAYMENT_PLANS = {
  free: {
    flutterwave_plan_id: null,
    amount: 0,
    interval: 'monthly',
    features: ['2 documents', '30 voice minutes']
  },
  basic: {
    flutterwave_plan_id: 12345,
    amount: 2500,
    interval: 'monthly',
    features: ['10 documents', '120 voice minutes', 'emergency alerts']
  },
  professional: {
    flutterwave_plan_id: 12346,
    amount: 7500,
    interval: 'monthly',
    features: ['50 documents', '300 voice minutes', 'priority support']
  },
  enterprise: {
    flutterwave_plan_id: 12347,
    amount: 25000,
    interval: 'monthly',
    features: ['unlimited documents', 'unlimited voice', 'custom templates']
  }
};
```

### 2. Set up Webhooks

```bash
# Configure Flutterwave webhook URL
curl -X POST https://api.flutterwave.com/v3/webhooks \
  -H "Authorization: Bearer $FLUTTERWAVE_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.miss-legal.odia.ltd/api/v1/payments/webhook/flutterwave",
    "secret_hash": "'$FLUTTERWAVE_WEBHOOK_SECRET'"
  }'
```

## WhatsApp Business API Setup

### 1. Configure Webhook

```bash
# Set WhatsApp webhook URL
curl -X POST "https://graph.facebook.com/v17.0/$WHATSAPP_PHONE_NUMBER_ID/webhooks" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.miss-legal.odia.ltd/api/v1/whatsapp/webhook",
    "verify_token": "'$WHATSAPP_WEBHOOK_VERIFY_TOKEN'"
  }'
```

### 2. Message Templates

```bash
# Create emergency alert template
curl -X POST "https://graph.facebook.com/v17.0/$WHATSAPP_BUSINESS_ACCOUNT_ID/message_templates" \
  -H "Authorization: Bearer $WHATSAPP_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "emergency_alert",
    "category": "ALERT_UPDATE",
    "language": "en",
    "components": [
      {
        "type": "BODY",
        "text": "🚨 EMERGENCY ALERT: {{1}} detected for {{2}}. Location: {{3}}. Emergency services have been notified. Stay safe!"
      }
    ]
  }'
```

## N8N Workflow Integration

### 1. Import Existing Workflows

```bash
# Import ODIA Intelligence workflows
curl -X POST http://n8n.odia.ltd/api/v1/workflows/import \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -F "file=@user_input_files/odia-n8n-workflow.json"

curl -X POST http://n8n.odia.ltd/api/v1/workflows/import \
  -H "Authorization: Bearer $N8N_API_KEY" \
  -F "file=@user_input_files/ODIA-n8n-Payment-Funnel.json"
```

### 2. Configure New MISS Legal AI Workflows

```json
{
  "name": "MISS Legal AI - Emergency Response",
  "nodes": [
    {
      "name": "Emergency Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "miss-legal-emergency",
        "httpMethod": "POST"
      }
    },
    {
      "name": "Send WhatsApp Alert",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://graph.facebook.com/v17.0/{{$env.WHATSAPP_PHONE_NUMBER_ID}}/messages",
        "method": "POST",
        "headers": {
          "Authorization": "Bearer {{$env.WHATSAPP_ACCESS_TOKEN}}"
        },
        "body": {
          "messaging_product": "whatsapp",
          "to": "{{$json.emergency_contact_phone}}",
          "type": "template",
          "template": {
            "name": "emergency_alert",
            "language": {"code": "en"},
            "components": [
              {
                "type": "body",
                "parameters": [
                  {"type": "text", "text": "{{$json.emergency_type}}"},
                  {"type": "text", "text": "{{$json.user_name}}"},
                  {"type": "text", "text": "{{$json.location}}"}
                ]
              }
            ]
          }
        }
      }
    }
  ]
}
```

## Security Configuration

### 1. SSL/TLS Setup

```bash
# Generate SSL certificates (if not using Cloudflare)
certbot certonly --webroot -w /var/www/html -d api.miss-legal.odia.ltd
certbot certonly --webroot -w /var/www/html -d ws.miss-legal.odia.ltd
```

### 2. Firewall Configuration

```bash
# Configure firewall rules
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (redirect to HTTPS)
ufw allow 443/tcp   # HTTPS
ufw allow 5432/tcp  # PostgreSQL (restrict to specific IPs)
ufw enable
```

### 3. API Security Headers

```typescript
// middleware/security.ts
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};
```

## Monitoring and Logging

### 1. Application Monitoring

```typescript
// config/monitoring.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.APP_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ]
});
```

### 2. Performance Monitoring

```bash
# Set up performance monitoring
npm install @cloudflare/workers-web-analytics

# Configure in worker
import { Analytics } from '@cloudflare/workers-web-analytics';

const analytics = new Analytics({
  token: 'your-analytics-token'
});
```

### 3. Health Checks

```typescript
// Create health check endpoints
app.get('/health', async (c) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      voice_processing: await checkVoiceServices(),
      emergency_system: await checkEmergencySystem(),
      payment_system: await checkPaymentSystem()
    }
  };
  
  return c.json(healthCheck);
});
```

## Testing Deployment

### 1. Smoke Tests

```bash
# Test API endpoints
curl -X GET https://api.miss-legal.odia.ltd/health
curl -X POST https://api.miss-legal.odia.ltd/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","full_name":"Test User","ndpr_consent":true}'
```

### 2. Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Run load test
artillery run tests/load-test.yml
```

### 3. Integration Tests

```bash
# Run full test suite
npm run test:integration

# Test specific features
npm run test:voice-processing
npm run test:document-generation
npm run test:emergency-system
```

## Backup and Recovery

### 1. Database Backups

```bash
# Automated daily backups
pg_dump $DATABASE_URL | gzip > "backup-$(date +%Y%m%d).sql.gz"

# Upload to cloud storage
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://miss-legal-backups/
```

### 2. File Backups

```bash
# Backup Supabase storage
supabase storage download --recursive miss-legal-documents ./backups/documents/
supabase storage download --recursive miss-legal-audio ./backups/audio/
```

### 3. Recovery Procedures

```bash
# Database recovery
gunzip -c backup-20250601.sql.gz | psql $DATABASE_URL

# File recovery
supabase storage upload --recursive ./backups/documents/ miss-legal-documents/
```

## Scaling Considerations

### 1. Database Scaling

```sql
-- Add read replicas for heavy read operations
-- Configure connection pooling
-- Implement database sharding for large datasets
```

### 2. API Scaling

```bash
# Configure auto-scaling in Cloudflare Workers
# Set up load balancing across multiple regions
# Implement caching strategies
```

### 3. Voice Processing Scaling

```typescript
// Implement queue system for voice processing
import { Queue } from 'bullmq';

const voiceQueue = new Queue('voice processing', {
  connection: redis
});

voiceQueue.add('process-audio', {
  sessionId,
  audioData,
  userId
});
```

## Maintenance Procedures

### 1. Regular Updates

```bash
# Weekly dependency updates
npm update
npm audit fix

# Monthly security patches
apt update && apt upgrade -y
```

### 2. Performance Optimization

```bash
# Monthly performance review
npm run analyze-bundle
npm run lighthouse-ci
```

### 3. NDPR Compliance Maintenance

```sql
-- Monthly compliance check
SELECT enforce_data_retention();
SELECT update_consent_status();
SELECT generate_compliance_report();
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   ```bash
   # Check connection
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Restart connection pool
   systemctl restart pgbouncer
   ```

2. **Voice Processing Delays**
   ```bash
   # Check OpenAI API status
   curl -X GET https://status.openai.com/api/v2/status.json
   
   # Monitor processing times
   grep "voice_processing_time" /var/log/miss-legal.log
   ```

3. **Payment Webhook Failures**
   ```bash
   # Check Flutterwave webhook logs
   curl -X GET https://api.flutterwave.com/v3/webhooks \
     -H "Authorization: Bearer $FLUTTERWAVE_SECRET_KEY"
   ```

### Log Analysis

```bash
# Analyze application logs
tail -f /var/log/miss-legal.log | grep ERROR
grep "EMERGENCY" /var/log/miss-legal.log | tail -20
awk '/voice_session/ {print $1, $2, $7}' /var/log/miss-legal.log
```

## Support and Maintenance

### Contact Information
- Technical Support: tech-support@odia.ltd
- Security Issues: security@odia.ltd
- NDPR/DPO Contact: dpo@odia.ltd
- Emergency Contact: +234-xxx-xxx-xxxx

### Documentation Updates
- Update this deployment guide with any configuration changes
- Maintain version compatibility matrix
- Document all customizations and integrations

---

**Note**: This deployment guide assumes production deployment. For development or staging environments, modify the configuration accordingly and use appropriate test credentials.
