# Voice AI Pipeline Documentation - MISS Legal AI

## Overview

The Voice AI Pipeline is a comprehensive real-time voice processing system that enables natural conversation with Minnie Max, the AI legal assistant. The system provides speech-to-text, emergency detection, AI conversation processing, and text-to-speech capabilities optimized for Nigerian users and languages.

## Architecture

### Core Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   WebSocket     │    │   Backend       │
│   Voice UI      │◄──►│   Streaming     │◄──►│   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   OpenAI        │    │   ElevenLabs    │
                       │   Whisper/GPT-4o│◄──►│   TTS           │
                       └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Emergency     │    │   WhatsApp      │
                       │   Detection     │◄──►│   Notifications │
                       └─────────────────┘    └─────────────────┘
```

### Data Flow

1. **Audio Capture** → Frontend captures audio via WebRTC
2. **Real-time Streaming** → Audio chunks sent via WebSocket
3. **Speech-to-Text** → Whisper processes audio to text
4. **Emergency Detection** → AI analyzes for emergency situations
5. **Conversation Processing** → GPT-4o generates contextual responses
6. **Text-to-Speech** → ElevenLabs synthesizes voice responses
7. **Audio Playback** → Frontend plays synthesized audio

## Features

### 🎤 Speech Recognition (Whisper)
- **Multi-language Support**: English, Nigerian Pidgin, Yoruba, Hausa, Igbo
- **Real-time Transcription**: Streaming audio processing
- **Nigerian Context Optimization**: Enhanced for local accents and expressions
- **High Accuracy**: Confidence scoring and quality assessment
- **Audio Enhancement**: Noise reduction and volume normalization

### 🤖 AI Conversation (GPT-4o)
- **Legal Context Awareness**: Nigerian law and legal procedures
- **Intent Recognition**: Document generation, legal advice, emergency help
- **Multi-language Understanding**: Code-switching support
- **Conversation Memory**: Session-based context preservation
- **Cultural Sensitivity**: Nigerian customs and expressions

### 🔊 Text-to-Speech (ElevenLabs)
- **Minnie Max Voice Profiles**: Custom voice for different contexts
- **Multi-language Synthesis**: Natural speech in Nigerian languages
- **Emotional Adaptation**: Different tones for emergency vs normal conversations
- **Real-time Streaming**: Low-latency audio generation
- **Quality Optimization**: Optimized for Nigerian accents

### 🚨 Emergency Detection
- **Real-time Analysis**: Multi-modal emergency detection
- **Nigerian Context**: Local emergency patterns and expressions
- **Confidence Scoring**: Reduces false positives
- **Immediate Response**: Automatic contact notification
- **Multi-language Support**: Emergency detection in all supported languages

### 📱 WebSocket Streaming
- **Real-time Communication**: Bidirectional voice streaming
- **Session Management**: Persistent conversation contexts
- **Quality Monitoring**: Connection and audio quality tracking
- **Error Recovery**: Reconnection and fallback mechanisms
- **Performance Optimization**: Low-latency processing pipeline

## Installation & Setup

### Prerequisites

```bash
# Node.js 18+ required
node --version

# Install dependencies
npm install
```

### Environment Variables

```bash
# AI Services
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Communication
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# Server
PORT=3000
NODE_ENV=development
```

### Database Setup

```sql
-- Run migration
npm run migrate

-- Seed initial data
npm run db:seed
```

### Start Development Server

```bash
# Start backend with voice streaming
npm run dev

# Start frontend (separate terminal)
cd frontend && npm run dev
```

## API Documentation

### WebSocket Events

#### Client → Server

```typescript
// Start voice session
socket.emit('start-voice-session', {
  language: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo',
  enableEmergencyDetection: boolean,
  audioQuality: 'low' | 'medium' | 'high',
  realTimeTranscription: boolean,
  bufferSize: number
});

// Send audio chunk
socket.emit('audio-chunk', {
  data: Uint8Array,
  timestamp: number,
  sequenceNumber: number,
  sampleRate: number,
  channels: number
});

// Send text input (fallback)
socket.emit('text-input', string);

// Change language
socket.emit('change-language', 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo');

// End session
socket.emit('end-voice-session');
```

#### Server → Client

```typescript
// Session started
socket.on('session-started', {
  sessionId: string,
  language: string,
  emergencyDetectionEnabled: boolean,
  supportedLanguages: string[]
});

// Real-time transcription
socket.on('transcription', {
  text: string,
  confidence: number,
  language: string,
  isPartial: boolean
});

// AI response
socket.on('ai-response', {
  text: string,
  intent: string,
  confidence: number,
  actions: string[],
  audio: string, // base64 encoded
  audioFormat: string,
  requiresHumanEscalation: boolean
});

// Emergency detected
socket.on('emergency-detected', {
  type: string,
  confidence: number,
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical',
  message: string,
  audioResponse: string // base64 encoded
});
```

### REST API Endpoints

#### Voice Status
```http
GET /api/voice/status
```

Response:
```json
{
  "success": true,
  "data": {
    "activeSessions": 5,
    "supportedLanguages": ["english", "pidgin", "yoruba", "hausa", "igbo"],
    "features": {
      "realTimeTranscription": true,
      "emergencyDetection": true,
      "multiLanguageSupport": true,
      "voiceSynthesis": true,
      "qualityOptimization": true
    }
  }
}
```

#### Session History
```http
GET /api/voice/sessions?page=1&limit=10
Authorization: Bearer <token>
```

#### Voice Settings
```http
PUT /api/voice/settings
Authorization: Bearer <token>

{
  "language": "english",
  "enableEmergencyDetection": true,
  "audioQuality": "high"
}
```

## Frontend Integration

### React Component Usage

```tsx
import { VoiceChat } from '@/components/voice/VoiceChat';

function App() {
  const handleEmergencyDetected = (emergency) => {
    // Handle emergency alert
    console.log('Emergency:', emergency);
  };

  return (
    <VoiceChat
      authToken="your-jwt-token"
      language="english"
      enableEmergencyDetection={true}
      onEmergencyDetected={handleEmergencyDetected}
    />
  );
}
```

### Custom Hook Usage

```tsx
import { useVoiceSession } from '@/hooks/useVoiceSession';

function CustomVoiceInterface() {
  const {
    isConnected,
    isRecording,
    startRecording,
    stopRecording,
    conversationHistory,
    emergencyAlert,
    acknowledgeEmergency
  } = useVoiceSession('your-jwt-token');

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop' : 'Start'} Recording
      </button>
      
      {emergencyAlert && (
        <div className="emergency-alert">
          <p>{emergencyAlert.message}</p>
          <button onClick={acknowledgeEmergency}>Acknowledge</button>
        </div>
      )}
    </div>
  );
}
```

## Configuration

### Audio Settings

```typescript
const AUDIO_SETTINGS = {
  sampleRate: 16000,     // 16kHz for speech recognition
  channels: 1,           // Mono audio
  bitsPerSample: 16,     // 16-bit PCM
  chunkDuration: 1000,   // 1-second chunks
  bufferSize: 1024,      // Buffer size for processing
};
```

### Voice Profiles (ElevenLabs)

```typescript
const VOICE_PROFILES = {
  minnie_max_english: {
    voice_id: 'pNInz6obpgDQGcFmaJgB',
    name: 'Minnie Max - English',
    settings: {
      stability: 0.75,
      similarity_boost: 0.85,
      style: 0.2
    }
  },
  minnie_max_emergency: {
    voice_id: 'ErXwobaYiN019PkySvjV',
    name: 'Minnie Max - Emergency',
    settings: {
      stability: 0.85,
      similarity_boost: 0.90,
      style: 0.4
    }
  }
};
```

### Emergency Detection Patterns

```typescript
const EMERGENCY_PATTERNS = {
  medical: {
    english: ['help me', 'emergency', 'hospital', 'doctor', 'sick'],
    pidgin: ['help me', 'emergency', 'hospital', 'dokita', 'sick'],
    yoruba: ['egba mi', 'emergency', 'ile iwosan', 'dokita', 'aisan']
  },
  security: {
    english: ['thief', 'robbery', 'stolen', 'attack', 'threat'],
    pidgin: ['tiff', 'robbery', 'steal', 'attack', 'threat'],
    yoruba: ['ole', 'ole ja mi', 'ji mi', 'kolu', 'ihaleru']
  }
};
```

## Performance Optimization

### Network Conditions

The system automatically adapts to different network conditions:

- **Excellent**: High-quality audio (128kbps, 22kHz)
- **Good**: Medium compression (96kbps, 16kHz)
- **Fair**: Moderate compression (64kbps, 16kHz)
- **Poor**: Aggressive compression (32kbps, 8kHz)

### Audio Processing

```typescript
// Optimize for Nigerian accents
const enhancedAudio = await AudioProcessor.enhanceForNigerianAccents(audioBuffer);

// Detect voice activity
const voiceActivity = await AudioProcessor.detectVoiceActivity(audioBuffer);

// Optimize for network
const optimizedAudio = await AudioProcessor.optimizeForNetwork(audioBuffer, 'poor');
```

### Caching Strategy

- **Voice Responses**: Cache common responses
- **Audio Processing**: Cache processed audio chunks
- **Transcriptions**: Store for conversation context
- **Emergency Patterns**: Pre-load for fast detection

## Security & Privacy

### NDPR Compliance

```typescript
// Data retention policies
const RETENTION_POLICIES = {
  audioData: 7,        // 7 days
  transcripts: 30,     // 30 days (configurable)
  emergencyLogs: 2555, // 7 years (legal requirement)
  sessionMetadata: 90  // 90 days
};

// Automatic cleanup
setInterval(cleanupExpiredData, 24 * 60 * 60 * 1000); // Daily
```

### Data Encryption

- **Audio Transmission**: TLS 1.3 encryption
- **Database Storage**: AES-256 encryption
- **Voice Biometrics**: No permanent storage
- **Session Data**: Encrypted with user-specific keys

### Access Control

```typescript
// JWT-based authentication
const authMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const user = await verifyJWT(token);
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
};
```

## Monitoring & Analytics

### Performance Metrics

```typescript
interface VoiceMetrics {
  sessionDuration: number;
  audioQuality: number;
  transcriptionAccuracy: number;
  responseLatency: number;
  emergencyDetections: number;
  userSatisfaction: number;
}
```

### Health Checks

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "services": {
    "database": "ok",
    "openai": "ok",
    "elevenlabs": "ok",
    "whatsapp": "ok",
    "redis": "ok"
  },
  "voiceAI": {
    "activeSessions": 12,
    "averageLatency": 250,
    "errorRate": 0.02
  }
}
```

### Logging

```typescript
// Structured logging with Winston
voiceLogger.info('Voice session started', {
  sessionId,
  userId,
  language,
  emergencyDetection: enabled
});

emergencyLogger.error('Emergency detected', {
  sessionId,
  userId,
  emergencyType,
  confidence,
  location
});
```

## Testing

### Unit Tests

```bash
# Run voice pipeline tests
npm test voice-pipeline

# Run with coverage
npm run test:coverage
```

### Integration Tests

```bash
# Test WebSocket connections
npm test websocket

# Test emergency detection
npm test emergency

# Test full pipeline
npm test e2e
```

### Performance Tests

```bash
# Load testing
npm run test:load

# Latency testing
npm run test:latency

# Concurrent sessions
npm run test:concurrent
```

## Deployment

### Docker Setup

```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration

```yaml
# docker-compose.yml
services:
  voice-ai:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
    depends_on:
      - postgres
      - redis
```

### Production Checklist

- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations applied
- [ ] Redis cache configured
- [ ] Load balancer setup for WebSocket
- [ ] Monitoring and alerting configured
- [ ] Backup and recovery procedures
- [ ] NDPR compliance verified

## Troubleshooting

### Common Issues

#### WebSocket Connection Fails
```bash
# Check server status
curl http://localhost:3000/health

# Verify WebSocket endpoint
wscat -c ws://localhost:3000/socket.io/?EIO=4&transport=websocket
```

#### Audio Quality Issues
```typescript
// Check audio settings
const metrics = await AudioProcessor.assessAudioQuality(audioBuffer);
console.log('Quality:', metrics.quality);

// Enable audio enhancement
const enhanced = await AudioProcessor.enhanceForNigerianAccents(audioBuffer);
```

#### Emergency Detection Not Working
```typescript
// Test emergency patterns
const result = await EmergencyDetectionService.detectEmergencyFromText(
  'Help me, there is an emergency!',
  'english'
);
console.log('Detection result:', result);
```

#### High Latency
- Check network connection quality
- Verify server load and CPU usage
- Monitor OpenAI and ElevenLabs API response times
- Consider adjusting audio chunk size

### Debugging Tools

```typescript
// Enable debug logging
process.env.DEBUG = 'voice:*';

// Monitor WebSocket connections
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', (reason) => console.log('Disconnected:', reason));

// Track audio processing performance
const startTime = Date.now();
await processAudio(audioBuffer);
console.log('Processing time:', Date.now() - startTime);
```

## Support & Resources

### Documentation
- [API Reference](./api-reference.md)
- [WebSocket Protocol](./websocket-protocol.md)
- [Emergency Response Guide](./emergency-guide.md)

### Community
- [GitHub Repository](https://github.com/odia-intelligence/miss-legal-ai)
- [Discord Community](https://discord.gg/miss-legal-ai)
- [Stack Overflow Tag](https://stackoverflow.com/tags/miss-legal-ai)

### Technical Support
- Email: tech-support@odia-intelligence.com
- Phone: +234-xxx-xxx-xxxx
- Documentation: [docs.miss-legal-ai.com](https://docs.miss-legal-ai.com)

---

**Last Updated**: December 2024
**Version**: 1.0.0
**Author**: ODIA Intelligence + Mudiame University
