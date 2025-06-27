// Authentication Middleware for MISS Legal AI
import { Context, Next } from 'hono';
import { JWTService, AuthService } from '@/auth/jwt';
import { AuthenticationError, AuthorizationError, User } from '@/types';
import { logger } from '@/utils/logger';

// Extend Context to include user information
export interface AuthenticatedContext extends Context {
  get: (key: 'user') => User;
  set: (key: 'user', value: User) => void;
}

/**
 * Authentication middleware - verifies JWT token and loads user
 */
export const authenticateJWT = async (c: Context, next: Next) => {
  try {
    // Extract token from Authorization header
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      throw new AuthenticationError('Authorization header is required');
    }

    // Check if it's a Bearer token
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
    if (!tokenMatch) {
      throw new AuthenticationError('Invalid authorization header format. Use: Bearer <token>');
    }

    const token = tokenMatch[1];

    // Verify token and get user
    const user = await AuthService.getUserFromToken(token);

    // Set user in context
    c.set('user', user);

    await next();
  } catch (error) {
    logger.warn('Authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      path: c.req.path,
      method: c.req.method,
    });

    if (error instanceof AuthenticationError) {
      return c.json({ 
        success: false, 
        error: { 
          code: 'AUTHENTICATION_ERROR', 
          message: error.message 
        } 
      }, 401);
    }

    return c.json({ 
      success: false, 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Authentication failed' 
      } 
    }, 500);
  }
};

/**
 * Optional authentication middleware - sets user if token is provided
 */
export const optionalAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (authHeader) {
      const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        try {
          const user = await AuthService.getUserFromToken(token);
          c.set('user', user);
        } catch (error) {
          // Ignore authentication errors for optional auth
          logger.debug('Optional authentication failed', { error });
        }
      }
    }

    await next();
  } catch (error) {
    // Continue without authentication for optional auth
    await next();
  }
};

/**
 * Subscription tier authorization middleware
 */
export const requireSubscription = (requiredTiers: string[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as User;
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: { 
          code: 'AUTHENTICATION_ERROR', 
          message: 'Authentication required' 
        } 
      }, 401);
    }

    if (!requiredTiers.includes(user.subscription_tier)) {
      logger.warn('Insufficient subscription tier', { 
        userId: user.id,
        userTier: user.subscription_tier,
        requiredTiers,
        path: c.req.path,
      });

      return c.json({ 
        success: false, 
        error: { 
          code: 'INSUFFICIENT_SUBSCRIPTION', 
          message: `This feature requires a subscription tier: ${requiredTiers.join(' or ')}`,
          details: {
            current_tier: user.subscription_tier,
            required_tiers: requiredTiers,
          }
        } 
      }, 403);
    }

    await next();
  };
};

/**
 * NDPR consent verification middleware
 */
export const requireNDPRConsent = async (c: Context, next: Next) => {
  const user = c.get('user') as User;
  
  if (!user) {
    return c.json({ 
      success: false, 
      error: { 
        code: 'AUTHENTICATION_ERROR', 
        message: 'Authentication required' 
      } 
    }, 401);
  }

  if (!user.ndpr_consent) {
    logger.warn('NDPR consent required', { 
      userId: user.id,
      path: c.req.path,
    });

    return c.json({ 
      success: false, 
      error: { 
        code: 'NDPR_CONSENT_REQUIRED', 
        message: 'NDPR consent is required to access this feature',
        details: {
          consent_url: '/auth/ndpr-consent',
        }
      } 
    }, 403);
  }

  // Check if consent has expired
  if (user.ndpr_consent_expiry && new Date() > new Date(user.ndpr_consent_expiry)) {
    logger.warn('NDPR consent expired', { 
      userId: user.id,
      expiryDate: user.ndpr_consent_expiry,
      path: c.req.path,
    });

    return c.json({ 
      success: false, 
      error: { 
        code: 'NDPR_CONSENT_EXPIRED', 
        message: 'NDPR consent has expired and needs to be renewed',
        details: {
          expired_at: user.ndpr_consent_expiry,
          renewal_url: '/auth/ndpr-consent/renew',
        }
      } 
    }, 403);
  }

  await next();
};

/**
 * Email verification requirement middleware
 */
export const requireEmailVerification = async (c: Context, next: Next) => {
  const user = c.get('user') as User;
  
  if (!user) {
    return c.json({ 
      success: false, 
      error: { 
        code: 'AUTHENTICATION_ERROR', 
        message: 'Authentication required' 
      } 
    }, 401);
  }

  if (!user.email_verified) {
    logger.warn('Email verification required', { 
      userId: user.id,
      email: user.email,
      path: c.req.path,
    });

    return c.json({ 
      success: false, 
      error: { 
        code: 'EMAIL_VERIFICATION_REQUIRED', 
        message: 'Email verification is required to access this feature',
        details: {
          verification_url: '/auth/verify-email/resend',
        }
      } 
    }, 403);
  }

  await next();
};

/**
 * Admin role requirement middleware
 */
export const requireAdmin = async (c: Context, next: Next) => {
  const user = c.get('user') as User;
  
  if (!user) {
    return c.json({ 
      success: false, 
      error: { 
        code: 'AUTHENTICATION_ERROR', 
        message: 'Authentication required' 
      } 
    }, 401);
  }

  // Check if user has admin role (for now, check subscription tier)
  // In a real implementation, you might have a separate roles table
  if (user.subscription_tier !== 'enterprise') {
    logger.warn('Admin access denied', { 
      userId: user.id,
      userTier: user.subscription_tier,
      path: c.req.path,
    });

    return c.json({ 
      success: false, 
      error: { 
        code: 'ADMIN_ACCESS_REQUIRED', 
        message: 'Administrator access is required for this operation' 
      } 
    }, 403);
  }

  await next();
};

/**
 * Rate limiting based on subscription tier
 */
export const subscriptionBasedRateLimit = (limits: Record<string, number>) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as User;
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: { 
          code: 'AUTHENTICATION_ERROR', 
          message: 'Authentication required' 
        } 
      }, 401);
    }

    const userLimit = limits[user.subscription_tier] || limits['free'] || 10;
    
    // Store the rate limit in context for use by rate limiting middleware
    c.set('rateLimit', userLimit);

    await next();
  };
};

/**
 * Resource ownership verification middleware
 */
export const requireResourceOwnership = (resourceIdParam: string = 'id') => {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as User;
    const resourceId = c.req.param(resourceIdParam);
    
    if (!user) {
      return c.json({ 
        success: false, 
        error: { 
          code: 'AUTHENTICATION_ERROR', 
          message: 'Authentication required' 
        } 
      }, 401);
    }

    // Store resource info for use in route handlers
    c.set('resourceId', resourceId);
    c.set('userId', user.id);

    await next();
  };
};

/**
 * Developer API key authentication (for system integrations)
 */
export const authenticateAPIKey = async (c: Context, next: Next) => {
  try {
    const apiKey = c.req.header('X-API-Key');
    
    if (!apiKey) {
      throw new AuthenticationError('API key is required');
    }

    // In a real implementation, you would validate the API key against a database
    // For now, we'll use a simple environment variable check
    const validAPIKeys = process.env.VALID_API_KEYS?.split(',') || [];
    
    if (!validAPIKeys.includes(apiKey)) {
      throw new AuthenticationError('Invalid API key');
    }

    // Set a system user context for API key access
    c.set('systemAccess', true);

    await next();
  } catch (error) {
    logger.warn('API key authentication failed', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      path: c.req.path,
      method: c.req.method,
    });

    return c.json({ 
      success: false, 
      error: { 
        code: 'INVALID_API_KEY', 
        message: 'Invalid or missing API key' 
      } 
    }, 401);
  }
};

/**
 * Combine multiple auth middlewares
 */
export const combineAuthMiddleware = (...middlewares: Array<(c: Context, next: Next) => Promise<any>>) => {
  return async (c: Context, next: Next) => {
    for (const middleware of middlewares) {
      await middleware(c, next);
    }
  };
};

// Export commonly used middleware combinations
export const standardAuth = combineAuthMiddleware(authenticateJWT, requireNDPRConsent);
export const verifiedUserAuth = combineAuthMiddleware(authenticateJWT, requireNDPRConsent, requireEmailVerification);
export const premiumAuth = combineAuthMiddleware(authenticateJWT, requireNDPRConsent, requireSubscription(['basic', 'professional', 'enterprise']));
export const professionalAuth = combineAuthMiddleware(authenticateJWT, requireNDPRConsent, requireSubscription(['professional', 'enterprise']));
export const enterpriseAuth = combineAuthMiddleware(authenticateJWT, requireNDPRConsent, requireSubscription(['enterprise']));
