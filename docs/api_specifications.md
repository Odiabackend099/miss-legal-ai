# MISS Legal AI - API Specifications

## Overview

The MISS Legal AI API is built using Hono.js and tRPC for type-safe, high-performance operations. All endpoints are NDPR compliant and include comprehensive audit logging.

## Base Configuration

```typescript
// API Base URL
const API_BASE_URL = "https://api.miss-legal.odia.ltd"

// WebSocket Base URL  
const WS_BASE_URL = "wss://ws.miss-legal.odia.ltd"

// Authentication
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Authentication Endpoints

### POST /auth/register
Register a new user with NDPR consent

**Request Body:**
```typescript
{
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  preferred_language: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo';
  ndpr_consent: boolean;
  marketing_consent?: boolean;
  emergency_contacts?: Array<{
    name: string;
    phone: string;
    relationship: string;
  }>;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    user: User;
    access_token: string;
    refresh_token: string;
  };
  message: string;
}
```

### POST /auth/login
User authentication

**Request Body:**
```typescript
{
  email: string;
  password: string;
  remember_me?: boolean;
}
```

### POST /auth/refresh
Refresh access token

**Request Body:**
```typescript
{
  refresh_token: string;
}
```

### POST /auth/logout
Logout user and invalidate tokens

### POST /auth/forgot-password
Initiate password reset

**Request Body:**
```typescript
{
  email: string;
}
```

## Voice Processing Endpoints

### POST /api/v1/voice/session/start
Start a new voice session

**Request Body:**
```typescript
{
  session_type: 'general' | 'document_creation' | 'emergency' | 'consultation';
  language_preference?: string;
  expected_duration?: number; // minutes
}
```

**Response:**
```typescript
{
  session_id: string;
  websocket_url: string;
  session_token: string;
  expires_at: string;
}
```

### POST /api/v1/voice/session/end
End voice session

**Request Body:**
```typescript
{
  session_id: string;
  user_satisfaction?: number; // 1-5 rating
  feedback?: string;
}
```

### GET /api/v1/voice/sessions
Get user's voice session history

**Query Parameters:**
- `limit`: number (default: 20, max: 100)
- `offset`: number (default: 0)
- `session_type`: string (optional filter)
- `from_date`: ISO date string
- `to_date`: ISO date string

**Response:**
```typescript
{
  sessions: Array<{
    id: string;
    session_type: string;
    duration_seconds: number;
    language_detected: string;
    intent_classification: string;
    emergency_detected: boolean;
    created_at: string;
  }>;
  total: number;
  has_more: boolean;
}
```

### WebSocket /api/v1/voice/stream
Real-time voice processing

**Connection:**
```typescript
const ws = new WebSocket(`${WS_BASE_URL}/api/v1/voice/stream?token=${session_token}`);
```

**Message Types:**

```typescript
// Client to Server
type ClientMessage = 
  | { type: 'audio_chunk'; data: ArrayBuffer; sequence: number }
  | { type: 'language_switch'; language: string }
  | { type: 'end_utterance' }
  | { type: 'emergency_override'; cancel: boolean };

// Server to Client  
type ServerMessage =
  | { type: 'transcript'; text: string; language: string; confidence: number; is_final: boolean }
  | { type: 'response_audio'; data: ArrayBuffer; sequence: number }
  | { type: 'intent_detected'; intent: string; confidence: number; entities: any[] }
  | { type: 'emergency_detected'; confidence: number; type: string }
  | { type: 'processing_status'; status: 'listening' | 'processing' | 'responding' }
  | { type: 'error'; code: string; message: string };
```

## Legal Document Endpoints

### POST /api/v1/documents/generate
Generate a new legal document

**Request Body:**
```typescript
{
  document_type: 'tenancy_agreement' | 'affidavit' | 'power_of_attorney';
  template_id?: string; // Use specific template
  language: string;
  document_data: {
    // Dynamic based on document type
    [key: string]: any;
  };
  auto_validate?: boolean; // Run compliance checks
}
```

**Response:**
```typescript
{
  document_id: string;
  status: 'draft' | 'completed';
  content: string; // Generated document text
  compliance_checks: {
    passed: boolean;
    warnings: string[];
    required_actions: string[];
  };
  estimated_cost?: number; // For stamp duty etc.
}
```

### GET /api/v1/documents/{documentId}
Get document by ID

**Response:**
```typescript
{
  id: string;
  document_type: string;
  title: string;
  language: string;
  status: string;
  content: string;
  compliance_checks: object;
  signature_hash?: string;
  generated_at: string;
  signed_at?: string;
}
```

### PUT /api/v1/documents/{documentId}
Update document

**Request Body:**
```typescript
{
  title?: string;
  document_data?: object;
  status?: 'draft' | 'completed' | 'signed';
}
```

### DELETE /api/v1/documents/{documentId}
Delete document (NDPR compliant)

### POST /api/v1/documents/{documentId}/sign
Digitally sign document

**Request Body:**
```typescript
{
  signature_method: 'digital' | 'wet_signature';
  signatory_name: string;
  witness_name?: string;
  notary_details?: {
    name: string;
    registration_number: string;
    jurisdiction: string;
  };
}
```

### GET /api/v1/documents/templates
Get available document templates

**Query Parameters:**
- `document_type`: string (optional filter)
- `language`: string (optional filter)

**Response:**
```typescript
{
  templates: Array<{
    id: string;
    template_name: string;
    document_type: string;
    language: string;
    required_fields: string[];
    compliance_requirements: object;
  }>;
}
```

## Emergency System Endpoints

### POST /api/v1/emergency/trigger
Manually trigger emergency alert

**Request Body:**
```typescript
{
  emergency_type: 'medical' | 'security' | 'fire' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  contact_specific_people?: string[]; // Emergency contact IDs
}
```

**Response:**
```typescript
{
  emergency_id: string;
  contacts_notified: string[];
  estimated_response_time: number; // minutes
  tracking_code: string;
}
```

### GET /api/v1/emergency/events
Get emergency event history

**Response:**
```typescript
{
  events: Array<{
    id: string;
    event_type: string;
    severity_level: string;
    confidence_score: number;
    status: string;
    response_time_ms: number;
    created_at: string;
    resolved_at?: string;
  }>;
}
```

### PUT /api/v1/emergency/{eventId}/resolve
Mark emergency as resolved

**Request Body:**
```typescript
{
  resolution_notes: string;
  false_alarm?: boolean;
}
```

### GET /api/v1/emergency/contacts
Get emergency contacts

### POST /api/v1/emergency/contacts
Add emergency contact

**Request Body:**
```typescript
{
  contact_name: string;
  relationship: string;
  phone_number: string;
  whatsapp_number?: string;
  email?: string;
  contact_priority: number;
  preferred_method: 'whatsapp' | 'sms' | 'voice_call' | 'email';
  emergency_types?: string[];
}
```

### WebSocket /api/v1/emergency/alerts
Real-time emergency notifications

```typescript
type EmergencyAlert = {
  type: 'emergency_detected' | 'emergency_resolved' | 'false_alarm';
  emergency_id: string;
  event_type: string;
  severity: string;
  location?: object;
  message: string;
  timestamp: string;
};
```

## Payment and Subscription Endpoints

### GET /api/v1/subscriptions
Get current subscription details

**Response:**
```typescript
{
  subscription: {
    id: string;
    plan_name: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
    amount: number;
    currency: string;
  };
  usage_stats: {
    documents_used: number;
    voice_minutes_used: number;
    documents_remaining: number;
    voice_minutes_remaining: number;
  };
  next_billing_date: string;
}
```

### POST /api/v1/subscriptions/create
Create new subscription

**Request Body:**
```typescript
{
  plan_id: string;
  payment_method: 'card' | 'bank_transfer';
  return_url?: string;
}
```

**Response:**
```typescript
{
  subscription_id: string;
  payment_url?: string; // For Flutterwave checkout
  status: 'pending' | 'active';
}
```

### PUT /api/v1/subscriptions/{subscriptionId}/cancel
Cancel subscription

**Request Body:**
```typescript
{
  cancellation_reason?: string;
  cancel_immediately?: boolean; // Default: false (cancel at period end)
}
```

### POST /api/v1/payments/webhook/flutterwave
Flutterwave webhook endpoint (internal)

### GET /api/v1/payments/plans
Get available subscription plans

**Response:**
```typescript
{
  plans: Array<{
    id: string;
    plan_name: string;
    display_name: string;
    amount: number;
    currency: string;
    billing_interval: string;
    features: string[];
    limits_config: object;
  }>;
}
```

## User Management Endpoints

### GET /api/v1/user/profile
Get user profile

### PUT /api/v1/user/profile
Update user profile

**Request Body:**
```typescript
{
  full_name?: string;
  phone?: string;
  preferred_language?: string;
  emergency_contacts?: Array<EmergencyContact>;
  marketing_consent?: boolean;
}
```

### POST /api/v1/user/export-data
Request data export (NDPR compliance)

**Response:**
```typescript
{
  export_id: string;
  estimated_completion: string;
  download_url?: string; // Available when ready
}
```

### DELETE /api/v1/user/account
Delete user account (NDPR right to erasure)

**Request Body:**
```typescript
{
  confirmation: 'DELETE_MY_ACCOUNT';
  reason?: string;
  feedback?: string;
}
```

### POST /api/v1/user/consent/withdraw
Withdraw specific consent

**Request Body:**
```typescript
{
  consent_type: 'marketing' | 'voice_processing' | 'emergency_services';
  withdrawal_reason?: string;
}
```

## Analytics and Monitoring Endpoints

### GET /api/v1/analytics/usage
Get usage analytics (admin only)

**Query Parameters:**
- `from_date`: ISO date string
- `to_date`: ISO date string
- `group_by`: 'day' | 'week' | 'month'

### GET /api/v1/health
System health check

**Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    voice_processing: 'up' | 'down';
    emergency_system: 'up' | 'down';
    payment_system: 'up' | 'down';
  };
  response_time_ms: number;
}
```

## Error Handling

### Standard Error Response Format

```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: object;
    trace_id: string;
  };
  timestamp: string;
}
```

### Common Error Codes

- `AUTH_001`: Invalid credentials
- `AUTH_002`: Token expired
- `AUTH_003`: Insufficient permissions
- `VOICE_001`: Audio processing failed
- `VOICE_002`: Language not supported
- `DOC_001`: Invalid document template
- `DOC_002`: Compliance validation failed
- `EMRG_001`: Emergency system unavailable
- `PAY_001`: Payment processing failed
- `NDPR_001`: Consent required
- `NDPR_002`: Data retention violation
- `RATE_001`: Rate limit exceeded
- `SYS_001`: Internal server error

## Rate Limiting

### Default Limits by Subscription Tier

```typescript
const RATE_LIMITS = {
  free: {
    voice_sessions: '10/hour',
    document_generation: '5/day',
    api_calls: '1000/day'
  },
  basic: {
    voice_sessions: '30/hour',
    document_generation: '20/day',
    api_calls: '5000/day'
  },
  professional: {
    voice_sessions: '100/hour',
    document_generation: '100/day',
    api_calls: '25000/day'
  },
  enterprise: {
    voice_sessions: '500/hour',
    document_generation: 'unlimited',
    api_calls: '100000/day'
  }
};
```

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 3600
```

## Webhooks

### Webhook Security

All webhooks include signature verification:

```typescript
// Verify webhook signature
const signature = request.headers['x-miss-signature'];
const payload = request.body;
const expectedSignature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  throw new Error('Invalid webhook signature');
}
```

### Webhook Events

```typescript
type WebhookEvent = {
  id: string;
  type: 'emergency.triggered' | 'document.generated' | 'subscription.changed' | 'payment.completed';
  data: object;
  timestamp: string;
  version: string;
};
```

## SDK Examples

### JavaScript/TypeScript SDK

```typescript
import { MissLegalAI } from '@miss-legal/sdk';

const client = new MissLegalAI({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.miss-legal.odia.ltd'
});

// Start voice session
const session = await client.voice.startSession({
  session_type: 'document_creation',
  language_preference: 'english'
});

// Generate document
const document = await client.documents.generate({
  document_type: 'tenancy_agreement',
  language: 'english',
  document_data: {
    landlord: { name: 'John Doe', address: '123 Lagos Street' },
    tenant: { name: 'Jane Smith', address: '456 Abuja Road' },
    property: { address: '789 Property Lane', type: 'residential' },
    terms: {
      rent_amount: 500000,
      lease_start: '2025-01-01',
      lease_end: '2025-12-31'
    }
  }
});
```

### Python SDK

```python
from miss_legal_ai import MissLegalAI

client = MissLegalAI(api_key='your-api-key')

# Generate document
document = client.documents.generate(
    document_type='tenancy_agreement',
    language='english',
    document_data={
        'landlord': {'name': 'John Doe'},
        'tenant': {'name': 'Jane Smith'},
        'property': {'address': '789 Property Lane'},
        'terms': {'rent_amount': 500000}
    }
)
```

## Testing

### Test Environment

- Base URL: `https://api-test.miss-legal.odia.ltd`
- Test API Keys available in dashboard
- Sandbox mode for payments
- Mock emergency alerts

### Example Test Cases

```typescript
// Voice processing test
describe('Voice Processing', () => {
  it('should start voice session', async () => {
    const response = await client.voice.startSession({
      session_type: 'general'
    });
    expect(response.session_id).toBeDefined();
  });
});

// Document generation test
describe('Document Generation', () => {
  it('should generate tenancy agreement', async () => {
    const document = await client.documents.generate({
      document_type: 'tenancy_agreement',
      language: 'english',
      document_data: mockTenancyData
    });
    expect(document.status).toBe('completed');
  });
});
```

## Support and Documentation

- API Documentation: https://docs.miss-legal.odia.ltd
- SDK Repository: https://github.com/odia-intelligence/miss-legal-sdk
- Support Email: api-support@odia.ltd
- Status Page: https://status.miss-legal.odia.ltd
