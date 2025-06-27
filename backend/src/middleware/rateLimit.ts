// Rate Limiting Middleware for MISS Legal AI
import { Context, Next } from 'hono';
import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { RateLimitError, User } from '@/types';
import { logger } from '@/utils/logger';

// Redis client for distributed rate limiting
let redisClient: Redis | null = null;

if (process.env.REDIS_URL) {
  try {
    redisClient = new Redis(process.env.REDIS_URL);
    logger.info('Redis connected for rate limiting');
  } catch (error) {
    logger.warn('Failed to connect to Redis, using memory rate limiter', { error });
  }
}

// Rate limit configurations based on subscription tier
const rateLimitConfigs = {
  free: {
    points: 100, // Number of requests
    duration: 900, // Per 15 minutes (900 seconds)
    blockDuration: 900, // Block for 15 minutes
  },
  basic: {
    points: 500,
    duration: 900,
    blockDuration: 300, // Block for 5 minutes
  },
  professional: {
    points: 2000,
    duration: 900,
    blockDuration: 60, // Block for 1 minute
  },
  enterprise: {
    points: 10000,
    duration: 900,
    blockDuration: 30, // Block for 30 seconds
  },
};

// Special rate limits for specific endpoints
const endpointRateLimits = {
  '/auth/login': {
    points: 5,
    duration: 900, // 5 attempts per 15 minutes
    blockDuration: 1800, // Block for 30 minutes
  },
  '/auth/register': {
    points: 3,
    duration: 3600, // 3 attempts per hour
    blockDuration: 3600, // Block for 1 hour
  },
  '/auth/password-reset': {
    points: 3,
    duration: 3600, // 3 attempts per hour
    blockDuration: 3600,
  },
  '/emergency/dispatch': {
    points: 10,
    duration: 300, // 10 emergency calls per 5 minutes
    blockDuration: 60,
  },
  '/voice/process': {
    points: 50,
    duration: 600, // 50 voice requests per 10 minutes for free tier
    blockDuration: 300,
  },
  '/documents/generate': {
    points: 20,
    duration: 3600, // 20 documents per hour for free tier
    blockDuration: 1800,
  },
};

// Create rate limiters
const createRateLimiter = (config: any, keyPrefix: string) => {
  if (redisClient) {
    return new RateLimiterRedis({
      storeClient: redisClient,
      keyPrefix,
      ...config,
    });
  } else {
    return new RateLimiterMemory({
      keyPrefix,
      ...config,
    });
  }
};

// Subscription-based rate limiters
const subscriptionLimiters = {
  free: createRateLimiter(rateLimitConfigs.free, 'rl_free'),
  basic: createRateLimiter(rateLimitConfigs.basic, 'rl_basic'),
  professional: createRateLimiter(rateLimitConfigs.professional, 'rl_prof'),
  enterprise: createRateLimiter(rateLimitConfigs.enterprise, 'rl_ent'),
};

// Endpoint-specific rate limiters
const endpointLimiters: Record<string, any> = {};
Object.entries(endpointRateLimits).forEach(([endpoint, config]) => {
  endpointLimiters[endpoint] = createRateLimiter(config, `rl_endpoint_${endpoint.replace(/\//g, '_')}`);
});

// Global rate limiter for unauthenticated requests
const globalLimiter = createRateLimiter({
  points: 50,
  duration: 900,
  blockDuration: 900,
}, 'rl_global');

/**
 * Main rate limiting middleware
 */
export const rateLimitMiddleware = async (c: Context, next: Next) => {
  try {
    const user = c.get('user') as User | undefined;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const path = c.req.path;
    const method = c.req.method;

    // Check endpoint-specific rate limits first
    if (endpointLimiters[path]) {
      const key = user ? `user_${user.id}` : `ip_${ip}`;
      
      try {
        await endpointLimiters[path].consume(key);
      } catch (rateLimiterRes) {
        const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
        
        logger.warn('Endpoint rate limit exceeded', {
          endpoint: path,
          key,
          remainingTime,
          totalHits: rateLimiterRes.totalHits,
        });

        return c.json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded for ${path}. Try again in ${remainingTime} seconds.`,
            details: {
              remainingTime,
              totalHits: rateLimiterRes.totalHits,
              limit: endpointRateLimits[path].points,
            },
          },
        }, 429);
      }
    }

    // Apply subscription-based rate limiting for authenticated users
    if (user) {
      const tier = user.subscription_tier as keyof typeof subscriptionLimiters;
      const limiter = subscriptionLimiters[tier] || subscriptionLimiters.free;
      const key = `user_${user.id}`;

      try {
        const result = await limiter.consume(key);
        
        // Add rate limit headers
        c.header('X-RateLimit-Limit', rateLimitConfigs[tier]?.points.toString() || '100');
        c.header('X-RateLimit-Remaining', result.remainingPoints?.toString() || '0');
        c.header('X-RateLimit-Reset', new Date(Date.now() + result.msBeforeNext).toISOString());

      } catch (rateLimiterRes) {
        const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
        
        logger.warn('Subscription rate limit exceeded', {
          userId: user.id,
          tier: user.subscription_tier,
          path,
          method,
          remainingTime,
          totalHits: rateLimiterRes.totalHits,
        });

        // Add rate limit headers even when rate limited
        c.header('X-RateLimit-Limit', rateLimitConfigs[tier]?.points.toString() || '100');
        c.header('X-RateLimit-Remaining', '0');
        c.header('X-RateLimit-Reset', new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString());

        return c.json({
          success: false,
          error: {
            code: 'SUBSCRIPTION_RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded for ${tier} subscription. Try again in ${remainingTime} seconds or upgrade your plan.`,
            details: {
              currentTier: tier,
              remainingTime,
              totalHits: rateLimiterRes.totalHits,
              limit: rateLimitConfigs[tier]?.points || 100,
              upgradeUrl: '/subscription/upgrade',
            },
          },
        }, 429);
      }
    } else {
      // Apply global rate limiting for unauthenticated requests
      const key = `ip_${ip}`;

      try {
        const result = await globalLimiter.consume(key);
        
        // Add rate limit headers
        c.header('X-RateLimit-Limit', '50');
        c.header('X-RateLimit-Remaining', result.remainingPoints?.toString() || '0');
        c.header('X-RateLimit-Reset', new Date(Date.now() + result.msBeforeNext).toISOString());

      } catch (rateLimiterRes) {
        const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
        
        logger.warn('Global rate limit exceeded', {
          ip,
          path,
          method,
          remainingTime,
          totalHits: rateLimiterRes.totalHits,
        });

        return c.json({
          success: false,
          error: {
            code: 'GLOBAL_RATE_LIMIT_EXCEEDED',
            message: `Rate limit exceeded. Please authenticate or try again in ${remainingTime} seconds.`,
            details: {
              remainingTime,
              totalHits: rateLimiterRes.totalHits,
              limit: 50,
              authUrl: '/auth/login',
            },
          },
        }, 429);
      }
    }

    await next();
  } catch (error) {
    logger.error('Rate limiting middleware error', { error, path: c.req.path });
    // Continue without rate limiting if there's an error
    await next();
  }
};

/**
 * Create custom rate limiter for specific use cases
 */
export const createCustomRateLimit = (config: {
  points: number;
  duration: number;
  blockDuration?: number;
  keyGenerator?: (c: Context) => string;
}) => {
  const limiter = createRateLimiter({
    points: config.points,
    duration: config.duration,
    blockDuration: config.blockDuration || config.duration,
  }, 'rl_custom');

  return async (c: Context, next: Next) => {
    try {
      const key = config.keyGenerator ? config.keyGenerator(c) : 
        c.get('user') ? `user_${c.get('user').id}` : 
        `ip_${c.req.header('x-forwarded-for') || 'unknown'}`;

      await limiter.consume(key);
      await next();
    } catch (rateLimiterRes) {
      const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
      
      return c.json({
        success: false,
        error: {
          code: 'CUSTOM_RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
          details: {
            remainingTime,
            limit: config.points,
          },
        },
      }, 429);
    }
  };
};

/**
 * Voice processing rate limiter (more restrictive for free users)
 */
export const voiceRateLimit = async (c: Context, next: Next) => {
  const user = c.get('user') as User;
  
  if (!user) {
    return c.json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required for voice processing',
      },
    }, 401);
  }

  // Stricter limits for voice processing
  const voiceLimits = {
    free: { points: 10, duration: 3600 }, // 10 per hour
    basic: { points: 100, duration: 3600 }, // 100 per hour
    professional: { points: 500, duration: 3600 }, // 500 per hour
    enterprise: { points: 2000, duration: 3600 }, // 2000 per hour
  };

  const tierConfig = voiceLimits[user.subscription_tier as keyof typeof voiceLimits] || voiceLimits.free;
  const limiter = createRateLimiter(tierConfig, 'rl_voice');

  try {
    await limiter.consume(`voice_${user.id}`);
    await next();
  } catch (rateLimiterRes) {
    const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
    
    logger.warn('Voice processing rate limit exceeded', {
      userId: user.id,
      tier: user.subscription_tier,
      remainingTime,
    });

    return c.json({
      success: false,
      error: {
        code: 'VOICE_RATE_LIMIT_EXCEEDED',
        message: `Voice processing limit exceeded for ${user.subscription_tier} subscription. Try again in ${remainingTime} seconds.`,
        details: {
          currentTier: user.subscription_tier,
          remainingTime,
          limit: tierConfig.points,
          upgradeUrl: '/subscription/upgrade',
        },
      },
    }, 429);
  }
};

/**
 * Emergency rate limiter (allows burst but prevents abuse)
 */
export const emergencyRateLimit = async (c: Context, next: Next) => {
  const user = c.get('user') as User;
  const ip = c.req.header('x-forwarded-for') || 'unknown';
  
  // More lenient for emergencies but still prevent abuse
  const emergencyLimiter = createRateLimiter({
    points: 5, // 5 emergency calls
    duration: 300, // per 5 minutes
    blockDuration: 60, // block for 1 minute only
  }, 'rl_emergency');

  const key = user ? `emergency_user_${user.id}` : `emergency_ip_${ip}`;

  try {
    await emergencyLimiter.consume(key);
    await next();
  } catch (rateLimiterRes) {
    const remainingTime = Math.round(rateLimiterRes.msBeforeNext / 1000);
    
    logger.warn('Emergency rate limit exceeded', {
      userId: user?.id,
      ip,
      remainingTime,
    });

    // Even for emergencies, we still rate limit to prevent abuse
    return c.json({
      success: false,
      error: {
        code: 'EMERGENCY_RATE_LIMIT_EXCEEDED',
        message: `Too many emergency requests. Please wait ${remainingTime} seconds before trying again.`,
        details: {
          remainingTime,
          emergencyNumbers: ['199', '123'], // Nigerian emergency numbers
        },
      },
    }, 429);
  }
};

/**
 * Get rate limit status for a user
 */
export const getRateLimitStatus = async (userId: string, tier: string) => {
  try {
    const limiter = subscriptionLimiters[tier as keyof typeof subscriptionLimiters] || subscriptionLimiters.free;
    const result = await limiter.get(`user_${userId}`);
    
    const config = rateLimitConfigs[tier as keyof typeof rateLimitConfigs] || rateLimitConfigs.free;
    
    return {
      limit: config.points,
      remaining: result ? config.points - result.totalHits : config.points,
      reset: result ? new Date(Date.now() + result.msBeforeNext) : new Date(),
      blocked: result ? result.totalHits >= config.points : false,
    };
  } catch (error) {
    logger.error('Failed to get rate limit status', { userId, tier, error });
    return null;
  }
};

/**
 * Reset rate limit for a user (admin function)
 */
export const resetRateLimit = async (userId: string, tier: string) => {
  try {
    const limiter = subscriptionLimiters[tier as keyof typeof subscriptionLimiters] || subscriptionLimiters.free;
    await limiter.delete(`user_${userId}`);
    
    logger.info('Rate limit reset', { userId, tier });
    return true;
  } catch (error) {
    logger.error('Failed to reset rate limit', { userId, tier, error });
    return false;
  }
};

export default rateLimitMiddleware;
