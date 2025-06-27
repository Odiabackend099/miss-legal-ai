// MISS Legal AI Backend Server
// Main entry point with Hono.js + tRPC integration

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createServer } from 'http';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { compress } from 'hono/compress';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';
import { trpcServer } from '@trpc/server/adapters/fetch';
import 'dotenv/config';

// Import utilities and middleware
import { logger, httpLogger } from '@/utils/logger';
import { rateLimitMiddleware } from '@/middleware/rateLimit';
import { ApiResponse } from '@/types';

// Import route handlers
import authRoutes from '@/routes/auth';
import emergencyRoutes from '@/routes/emergency';
import documentsRoutes from '@/routes/documents';
import voiceRoutes from '@/routes/voice';
import paymentRoutes from '@/routes/payment';
import lawyersRoutes from '@/routes/lawyers';

// Import tRPC router
import { appRouter } from '@/trpc/router';
import { createTRPCContext } from '@/trpc/context';

// Import WebSocket voice streaming service
import VoiceStreamingService from '@/websocket/voice-stream';

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'OPENAI_API_KEY',
  'FLUTTERWAVE_PUBLIC_KEY',
  'FLUTTERWAVE_SECRET_KEY',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Initialize Hono app
const app = new Hono();

// Security headers
app.use('*', secureHeaders({
  crossOriginOpenerPolicy: 'same-origin',
  crossOriginEmbedderPolicy: 'require-corp',
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", "https://api.openai.com", "https://api.flutterwave.com"],
  },
}));

// CORS configuration
app.use('*', cors({
  origin: (origin) => {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'https://miss-legal.odia.ltd',
      'https://voicecrm.odia.ltd',
    ];
    
    // Allow requests without origin (mobile apps, Postman, etc.)
    if (!origin) return true;
    
    return allowedOrigins.includes(origin);
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: [
    'Content-Type',
    'Authorization',
    'X-API-Key',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposeHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
}));

// Compression for better performance
app.use('*', compress());

// Pretty JSON in development
if (process.env.NODE_ENV !== 'production') {
  app.use('*', prettyJSON());
}

// Request logging
app.use('*', honoLogger((message) => {
  logger.http(message);
}));

// Rate limiting
app.use('*', rateLimitMiddleware);

// Health check endpoint
app.get('/health', (c) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };

  return c.json({
    success: true,
    data: health,
  } as ApiResponse);
});

// API documentation endpoint
app.get('/docs', (c) => {
  const docs = {
    title: 'MISS Legal AI API',
    version: '1.0.0',
    description: 'Voice-first legal assistant API for Nigerian users',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    endpoints: {
      authentication: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        'google-oauth': 'GET /api/auth/google',
        refresh: 'POST /api/auth/refresh',
        logout: 'POST /api/auth/logout',
      },
      emergency: {
        dispatch: 'POST /api/emergency/dispatch',
        status: 'GET /api/emergency/status',
        contacts: 'GET /api/emergency/contacts',
      },
      documents: {
        generate: 'POST /api/documents/generate',
        list: 'GET /api/documents',
        download: 'GET /api/documents/:id/download',
      },
      voice: {
        process: 'POST /api/voice/process',
        synthesize: 'POST /api/voice/synthesize',
        session: 'GET /api/voice/session/:id',
      },
      payment: {
        initialize: 'POST /api/payment/initialize',
        verify: 'POST /api/payment/verify',
        callback: 'POST /api/payment/callback',
        plans: 'GET /api/payment/plans',
      },
      lawyers: {
        available: 'GET /api/lawyers/available',
        schedule: 'POST /api/lawyers/schedule',
        consultations: 'GET /api/lawyers/consultations',
      },
    },
    tRPC: {
      endpoint: '/trpc',
      documentation: 'Visit /trpc for interactive tRPC endpoints',
    },
  };

  return c.json({
    success: true,
    data: docs,
  } as ApiResponse);
});

// Mount REST API routes
const apiRoutes = new Hono();

apiRoutes.route('/auth', authRoutes);
apiRoutes.route('/emergency', emergencyRoutes);
apiRoutes.route('/documents', documentsRoutes);
apiRoutes.route('/voice', voiceRoutes);
apiRoutes.route('/payment', paymentRoutes);
apiRoutes.route('/lawyers', lawyersRoutes);

app.route('/api', apiRoutes);

// Mount tRPC
app.use(
  '/trpc/*',
  trpcServer({
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ error, path, input }) => {
      logger.error('tRPC error', {
        path,
        input,
        error: error.message,
        stack: error.stack,
      });
    },
  })
);

// Global error handler
app.onError((err, c) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return c.json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? err.message : 'An internal server error occurred',
      ...(isDevelopment && { stack: err.stack }),
    },
  } as ApiResponse, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${c.req.path} not found`,
      availableEndpoints: [
        '/health',
        '/docs',
        '/api/*',
        '/trpc/*',
      ],
    },
  } as ApiResponse, 404);
});

// Graceful shutdown handling
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  try {
    // Close voice streaming service and end active sessions
    const activeSessions = voiceStreamingService.getActiveSessionsCount();
    if (activeSessions > 0) {
      logger.info(`Ending ${activeSessions} active voice sessions...`);
      // Force end all active sessions would be implemented here
    }
    
    // Close HTTP server
    server.close((err) => {
      if (err) {
        logger.error('Error closing HTTP server', { error: err.message });
        process.exit(1);
      } else {
        logger.info('HTTP server closed successfully');
        process.exit(0);
      }
    });
    
    // Force exit after timeout
    setTimeout(() => {
      logger.warn('Forced shutdown due to timeout');
      process.exit(1);
    }, 10000); // 10 seconds timeout
    
  } catch (error) {
    logger.error('Error during graceful shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
    stack: reason instanceof Error ? reason.stack : undefined,
    promise: promise.toString(),
  });
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  
  // Exit the process as the application is in an unstable state
  process.exit(1);
});

// Start server with WebSocket support
const port = parseInt(process.env.PORT || '3000');
const host = process.env.HOST || '0.0.0.0';

logger.info('Starting MISS Legal AI Backend Server with Voice AI Pipeline...', {
  port,
  host,
  environment: process.env.NODE_ENV || 'development',
  nodeVersion: process.version,
});

// Create HTTP server
const server = createServer(serve({ fetch: app.fetch, port, hostname: host }));

// Initialize WebSocket voice streaming service
const voiceStreamingService = new VoiceStreamingService(server);

// Store voice streaming service in app context for access in routes
app.use('*', async (c, next) => {
  c.set('voiceStreamingService', voiceStreamingService);
  await next();
});

// Start the server
server.listen(port, host, () => {
  logger.info('🚀 MISS Legal AI Backend Server with Voice AI started successfully!', {
    url: `http://${host}:${port}`,
    port,
    host,
    features: [
      'Real-time Voice Streaming',
      'Emergency Detection',
      'Multi-language Support',
      'AI Conversation with GPT-4o',
      'Text-to-Speech with ElevenLabs',
      'Speech-to-Text with Whisper',
    ],
    endpoints: {
      health: `http://${host}:${port}/health`,
      docs: `http://${host}:${port}/docs`,
      api: `http://${host}:${port}/api`,
      trpc: `http://${host}:${port}/trpc`,
      websocket: `ws://${host}:${port}`,
    },
  });
});

// Export app for testing
export default app;
export { appRouter } from '@/trpc/router';
export type { AppRouter } from '@/trpc/router';
