// tRPC Context Setup for MISS Legal AI
import { Context } from 'hono';
import { User } from '@/types';
import { AuthService } from '@/auth/jwt';
import { logger } from '@/utils/logger';

export interface TRPCContext {
  user?: User;
  isAuthenticated: boolean;
  req: {
    headers: Record<string, string | undefined>;
    ip: string;
    userAgent?: string;
  };
}

/**
 * Create tRPC context from Hono context
 */
export const createTRPCContext = async (opts: { req: Request }): Promise<TRPCContext> => {
  const headers: Record<string, string | undefined> = {};
  
  // Extract headers
  opts.req.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
  const userAgent = headers['user-agent'];

  // Try to authenticate user if Authorization header is present
  let user: User | undefined;
  let isAuthenticated = false;

  const authHeader = headers['authorization'];
  if (authHeader) {
    const tokenMatch = authHeader.match(/^Bearer\s+(.+)$/);
    if (tokenMatch) {
      try {
        user = await AuthService.getUserFromToken(tokenMatch[1]);
        isAuthenticated = true;
      } catch (error) {
        // Silent fail for tRPC context - let individual procedures handle auth
        logger.debug('Failed to authenticate user in tRPC context', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  return {
    user,
    isAuthenticated,
    req: {
      headers,
      ip: Array.isArray(ip) ? ip[0] : ip,
      userAgent,
    },
  };
};

/**
 * Create authenticated context (throws if not authenticated)
 */
export const createAuthenticatedContext = (ctx: TRPCContext) => {
  if (!ctx.isAuthenticated || !ctx.user) {
    throw new Error('Authentication required');
  }
  
  return {
    ...ctx,
    user: ctx.user,
  };
};

export type AuthenticatedContext = ReturnType<typeof createAuthenticatedContext>;
