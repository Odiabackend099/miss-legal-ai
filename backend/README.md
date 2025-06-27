# MISS Legal AI Backend API

Voice-first legal assistant backend API for Nigerian users, built with Hono.js, tRPC, and Supabase.

## 🚀 Features

- **Voice Processing**: Real-time speech-to-text with multilingual support (English, Pidgin, Yoruba, Hausa, Igbo)
- **Emergency Detection**: AI-powered emergency detection with automatic contact notification
- **Legal Document Generation**: Automated creation of Nigerian legal documents
- **Lawyer Network**: Connect users with verified lawyers for consultations
- **Payment Integration**: Flutterwave subscription management
- **NDPR Compliance**: Full compliance with Nigerian Data Protection Regulation
- **Multi-language Support**: Native support for Nigerian languages
- **Real-time Notifications**: WhatsApp emergency alerts
- **Audit Logging**: Comprehensive audit trails for compliance

## 🏗️ Architecture

- **Framework**: Hono.js (Fast web framework)
- **API**: tRPC (Type-safe APIs)
- **Database**: Supabase (PostgreSQL with real-time capabilities)
- **Authentication**: JWT + Google OAuth
- **Voice Processing**: OpenAI Whisper + GPT-4o
- **Payments**: Flutterwave API
- **Messaging**: WhatsApp Business API
- **Caching**: Redis
- **File Storage**: Supabase Storage

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 15+ (or Supabase account)
- Redis (optional, for rate limiting)
- Docker & Docker Compose (for containerized setup)

## 🛠️ Environment Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd miss-legal-ai-backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   # Application
   NODE_ENV=development
   PORT=3000
   BASE_URL=https://voicecrm.odia.ltd

   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=24h

   # Supabase
   SUPABASE_URL=your-supabase-project-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

   # OpenAI
   OPENAI_API_KEY=sk-proj-your-openai-api-key

   # Flutterwave
   FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-your-public-key
   FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-secret-key

   # WhatsApp Business API
   WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id

   # Twilio
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token

   # Other configurations...
   ```

## 🗄️ Database Setup

### Using Supabase (Recommended)

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and API keys
3. Run the database migration:
   ```bash
   npm run migrate
   ```

### Using Local PostgreSQL

1. Start PostgreSQL service
2. Create database:
   ```sql
   CREATE DATABASE miss_legal_ai;
   ```
3. Run migrations:
   ```bash
   npm run migrate
   ```

## 🐳 Docker Setup

### Development with Docker Compose

1. **Start all services**:
   ```bash
   docker-compose up -d
   ```

2. **View logs**:
   ```bash
   docker-compose logs -f app
   ```

3. **Stop services**:
   ```bash
   docker-compose down
   ```

### Production Deployment

1. **Build production image**:
   ```bash
   docker build -t miss-legal-ai-backend:latest .
   ```

2. **Run with production profile**:
   ```bash
   docker-compose --profile production up -d
   ```

## 🚀 Development

### Local Development

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Build project**:
   ```bash
   npm run build
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

4. **Type checking**:
   ```bash
   npm run type-check
   ```

### Development Tools

- **Hot Reload**: Automatic restart on file changes
- **TypeScript**: Full type safety
- **ESLint**: Code linting
- **Prettier**: Code formatting

## 📡 API Endpoints

### Authentication

```http
POST /api/auth/register          # User registration
POST /api/auth/login             # Email/password login
GET  /api/auth/google            # Google OAuth URL
POST /api/auth/google/callback   # Google OAuth callback
POST /api/auth/refresh           # Refresh access token
POST /api/auth/logout            # User logout
GET  /api/auth/profile           # Get user profile
PUT  /api/auth/profile           # Update user profile
```

### Voice Processing

```http
POST /api/voice/process          # Process voice input
POST /api/voice/synthesize       # Text-to-speech
GET  /api/voice/session/:id      # Get voice session
GET  /api/voice/sessions         # List user sessions
PUT  /api/voice/session/:id      # Update session
```

### Emergency System

```http
POST /api/emergency/dispatch     # Dispatch emergency
GET  /api/emergency/status       # Get emergency status
GET  /api/emergency/contacts     # Get emergency contacts
PUT  /api/emergency/contacts     # Update emergency contacts
```

### Legal Documents

```http
GET  /api/documents              # List documents
POST /api/documents/generate     # Generate document
GET  /api/documents/:id          # Get document
PUT  /api/documents/:id          # Update document
GET  /api/documents/:id/download # Download PDF
DELETE /api/documents/:id        # Archive document
GET  /api/documents/templates    # Get templates
```

### Payment System

```http
GET  /api/payment/plans          # Get subscription plans
POST /api/payment/initialize     # Initialize payment
POST /api/payment/verify         # Verify payment
POST /api/payment/callback       # Payment webhook
GET  /api/payment/history        # Payment history
```

### Lawyer Network

```http
GET  /api/lawyers/available      # Get available lawyers
POST /api/lawyers/schedule       # Schedule consultation
GET  /api/lawyers/consultations  # Get consultations
PUT  /api/lawyers/consultation/:id # Update consultation
```

## 🔧 tRPC API

The API also provides type-safe tRPC endpoints at `/trpc`:

```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './src/trpc/router';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ],
});

// Usage
const user = await client.auth.me.query();
const documents = await client.documents.list.query({ page: 1 });
```

## 🔒 Security Features

### Authentication & Authorization

- **JWT Tokens**: Secure authentication with refresh tokens
- **Google OAuth**: Social login integration
- **Rate Limiting**: Subscription-based rate limits
- **CORS**: Configurable cross-origin resource sharing

### Data Protection

- **NDPR Compliance**: Nigerian Data Protection Regulation compliance
- **Data Retention**: Automatic data deletion based on retention policies
- **Encryption**: Sensitive data encryption
- **Audit Logging**: Comprehensive audit trails

### API Security

- **Input Validation**: Zod schema validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **Rate Limiting**: Redis-based rate limiting

## 📊 Monitoring & Logging

### Logging

- **Winston Logger**: Structured logging with multiple transports
- **Audit Logs**: NDPR-compliant audit logging
- **Error Tracking**: Comprehensive error logging
- **Performance Monitoring**: Request timing and metrics

### Health Checks

```http
GET /health                      # Application health status
```

Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 3600,
    "memory": {
      "used": 128,
      "total": 256
    }
  }
}
```

## 🌍 Internationalization

### Supported Languages

- **English**: Default language
- **Nigerian Pidgin**: West African Pidgin English
- **Yoruba**: Southwestern Nigeria
- **Hausa**: Northern Nigeria
- **Igbo**: Southeastern Nigeria

### Language Detection

The system automatically detects the user's preferred language from:
1. Voice input analysis
2. User profile settings
3. Browser language headers
4. Geographic location

## 💳 Payment Integration

### Flutterwave Integration

The system integrates with Flutterwave for payment processing:

- **Card Payments**: Visa, Mastercard, Verve
- **Bank Transfer**: Direct bank transfers
- **USSD**: Mobile banking via USSD codes
- **Mobile Money**: MTN, Airtel, 9mobile

### Subscription Plans

```json
{
  "basic": {
    "monthly": { "amount": 2500, "duration": 30 },
    "quarterly": { "amount": 7000, "duration": 90 },
    "yearly": { "amount": 25000, "duration": 365 }
  },
  "professional": {
    "monthly": { "amount": 5000, "duration": 30 },
    "quarterly": { "amount": 14000, "duration": 90 },
    "yearly": { "amount": 50000, "duration": 365 }
  },
  "enterprise": {
    "monthly": { "amount": 15000, "duration": 30 },
    "quarterly": { "amount": 42000, "duration": 90 },
    "yearly": { "amount": 150000, "duration": 365 }
  }
}
```

## 🚨 Emergency System

### Emergency Detection

The AI system detects emergencies from voice input:

- **Medical**: Health emergencies, injuries
- **Security**: Crime, theft, assault
- **Fire**: Fire, explosions, gas leaks
- **Legal**: Urgent legal situations
- **Domestic Violence**: Family violence situations

### Emergency Response

1. **Detection**: AI analyzes voice input for emergency keywords
2. **Verification**: Confidence scoring and context analysis
3. **Notification**: Automatic WhatsApp alerts to emergency contacts
4. **Escalation**: Integration with emergency services (future)

## 📱 WhatsApp Integration

### Emergency Notifications

Automatic WhatsApp messages sent to emergency contacts:

```
🚨 MEDICAL EMERGENCY ALERT

Your contact John Doe has a medical emergency and needs immediate assistance. They are located at 123 Lagos Street, Victoria Island. Please call them immediately at +234 123 456 7890 or contact emergency services.
```

### Multi-language Support

Emergency messages are sent in the user's preferred language:
- English
- Nigerian Pidgin
- Yoruba
- Hausa
- Igbo

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

### Test Structure

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests
├── e2e/           # End-to-end tests
└── fixtures/      # Test data
```

## 📦 Deployment

### Production Deployment

1. **Build Docker image**:
   ```bash
   docker build -t miss-legal-ai-backend:latest .
   ```

2. **Deploy to cloud provider**:
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Instances
   - DigitalOcean App Platform

3. **Environment variables**:
   - Set all production environment variables
   - Use secure secret management
   - Configure SSL certificates

### Health Checks

Configure health checks for production deployment:
- **Endpoint**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Retries**: 3

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `PORT` | Server port | No | `3000` |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key | Yes | - |
| `SUPABASE_URL` | Supabase project URL | Yes | - |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave secret key | Yes | - |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp Business API token | Yes | - |

### Rate Limiting

Rate limits are based on subscription tiers:

| Tier | Requests/15min | Voice Processing/hour |
|------|----------------|----------------------|
| Free | 100 | 10 |
| Basic | 500 | 100 |
| Professional | 2000 | 500 |
| Enterprise | 10000 | 2000 |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Write comprehensive tests
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@miss-legal.odia.ltd or create an issue in the repository.

## 🙏 Acknowledgments

- **ODIA Intelligence**: Primary development
- **Mudiame University**: Legal expertise and validation
- **OpenAI**: AI and language processing capabilities
- **Flutterwave**: Payment processing for Nigeria
- **Supabase**: Database and real-time infrastructure

---

**MISS Legal AI** - Democratizing legal access in Nigeria through voice-first AI technology.
