// Winston Logger Configuration for MISS Legal AI
import winston from 'winston';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors for console output
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(logColors);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Define file format (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport for development
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'debug',
      format: logFormat,
    })
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // HTTP log file
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'http.log'),
      level: 'http',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels: logLevels,
  format: fileFormat,
  transports,
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'exceptions.log'),
      format: fileFormat,
    }),
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'rejections.log'),
      format: fileFormat,
    }),
  ],
  // Exit on handled exceptions
  exitOnError: false,
});

// Create specialized loggers for different domains
export const createDomainLogger = (domain: string) => {
  return logger.child({ domain });
};

// Domain-specific loggers
export const authLogger = createDomainLogger('auth');
export const voiceLogger = createDomainLogger('voice');
export const documentLogger = createDomainLogger('document');
export const emergencyLogger = createDomainLogger('emergency');
export const paymentLogger = createDomainLogger('payment');
export const lawyerLogger = createDomainLogger('lawyer');
export const auditLogger = createDomainLogger('audit');

// HTTP request logger middleware
export const httpLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, url, ip } = req;
    const { statusCode } = res;
    
    logger.http('HTTP Request', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      ip,
      userAgent: req.get('User-Agent'),
    });
  });
  
  next();
};

// Error logger utility
export const logError = (error: Error | unknown, context?: Record<string, any>) => {
  if (error instanceof Error) {
    logger.error(error.message, {
      stack: error.stack,
      name: error.name,
      ...context,
    });
  } else {
    logger.error('Unknown error occurred', {
      error: String(error),
      ...context,
    });
  }
};

// Security event logger
export const logSecurityEvent = (event: string, details: Record<string, any>) => {
  logger.warn(`Security Event: ${event}`, {
    ...details,
    timestamp: new Date().toISOString(),
    category: 'security',
  });
};

// Audit event logger for NDPR compliance
export const logAuditEvent = (
  action: string,
  userId: string | null,
  resourceType: string,
  resourceId?: string,
  details?: Record<string, any>
) => {
  auditLogger.info(`Audit: ${action}`, {
    userId,
    resourceType,
    resourceId,
    ...details,
    timestamp: new Date().toISOString(),
    category: 'audit',
  });
};

// Performance logger
export const logPerformance = (operation: string, duration: number, details?: Record<string, any>) => {
  const level = duration > 1000 ? 'warn' : duration > 500 ? 'info' : 'debug';
  
  logger.log(level, `Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...details,
    category: 'performance',
  });
};

// Structured logging helpers
export const createStructuredLog = (
  level: string,
  message: string,
  data?: Record<string, any>
) => {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...data,
  };
};

// Emergency event logger
export const logEmergencyEvent = (
  userId: string,
  emergencyType: string,
  confidence: number,
  details?: Record<string, any>
) => {
  emergencyLogger.error(`Emergency Detected: ${emergencyType}`, {
    userId,
    emergencyType,
    confidence,
    ...details,
    timestamp: new Date().toISOString(),
    category: 'emergency',
    priority: 'critical',
  });
};

// Voice processing logger
export const logVoiceEvent = (
  sessionId: string,
  event: string,
  details?: Record<string, any>
) => {
  voiceLogger.info(`Voice Event: ${event}`, {
    sessionId,
    ...details,
    timestamp: new Date().toISOString(),
    category: 'voice',
  });
};

// Payment logger
export const logPaymentEvent = (
  transactionId: string,
  event: string,
  amount: number,
  currency: string,
  details?: Record<string, any>
) => {
  paymentLogger.info(`Payment Event: ${event}`, {
    transactionId,
    amount,
    currency,
    ...details,
    timestamp: new Date().toISOString(),
    category: 'payment',
  });
};

// Ensure logs directory exists
import { existsSync, mkdirSync } from 'fs';
const logsDir = path.join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Export default logger
export default logger;
