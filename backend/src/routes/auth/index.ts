// Authentication Routes for MISS Legal AI
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { AuthService, JWTService } from '@/auth/jwt';
import { GoogleOAuthService } from '@/auth/google-oauth';
import { authenticateJWT } from '@/middleware/auth';
import { ValidationUtils, CreateUserSchema, LoginSchema } from '@/utils/validation';
import { ApiResponse, User, AuthenticationError, ValidationError } from '@/types';
import { logger, authLogger } from '@/utils/logger';
import { db } from '@/integrations/supabase/client';

const authRoutes = new Hono();

// User registration
authRoutes.post(
  '/register',
  zValidator('json', CreateUserSchema),
  async (c) => {
    try {
      const userData = c.req.valid('json');
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

      // Register user
      const { user, tokens } = await AuthService.register(userData);

      authLogger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        ip,
      });

      // Generate email verification token
      const verificationToken = AuthService.generateEmailVerificationToken(user.id, user.email);

      return c.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            subscription_tier: user.subscription_tier,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            preferred_language: user.preferred_language,
          },
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          verification_token: verificationToken,
        },
        message: 'Registration successful',
      } as ApiResponse, 201);
    } catch (error) {
      authLogger.error('Registration failed', { error, body: c.req.json });

      if (error instanceof ValidationError) {
        return c.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            details: error.details,
          },
        } as ApiResponse, 400);
      }

      return c.json({
        success: false,
        error: {
          code: 'REGISTRATION_FAILED',
          message: error instanceof Error ? error.message : 'Registration failed',
        },
      } as ApiResponse, 500);
    }
  }
);

// User login
authRoutes.post(
  '/login',
  zValidator('json', LoginSchema),
  async (c) => {
    try {
      const { email, password } = c.req.valid('json');
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

      // Login user
      const { user, tokens } = await AuthService.login(email, password, ip);

      authLogger.info('User logged in successfully', {
        userId: user.id,
        email: user.email,
        ip,
      });

      return c.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            subscription_tier: user.subscription_tier,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            preferred_language: user.preferred_language,
            last_login: user.last_login,
          },
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        },
        message: 'Login successful',
      } as ApiResponse);
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return c.json({
          success: false,
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: error.message,
          },
        } as ApiResponse, 401);
      }

      return c.json({
        success: false,
        error: {
          code: 'LOGIN_FAILED',
          message: 'Login failed',
        },
      } as ApiResponse, 500);
    }
  }
);

// Refresh token
authRoutes.post(
  '/refresh',
  zValidator('json', z.object({
    refresh_token: z.string().min(1),
  })),
  async (c) => {
    try {
      const { refresh_token } = c.req.valid('json');

      // Refresh tokens
      const tokens = await JWTService.refreshAccessToken(refresh_token);

      authLogger.info('Tokens refreshed successfully');

      return c.json({
        success: true,
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
        },
        message: 'Token refreshed successfully',
      } as ApiResponse);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'TOKEN_REFRESH_FAILED',
          message: error instanceof Error ? error.message : 'Token refresh failed',
        },
      } as ApiResponse, 401);
    }
  }
);

// Logout
authRoutes.post('/logout', authenticateJWT, async (c) => {
  try {
    const user = c.get('user') as User;

    // Log logout (token invalidation would be handled by a blacklist in production)
    await db.createAuditLog({
      user_id: user.id,
      action: 'USER_LOGOUT',
      resource_type: 'users',
      resource_id: user.id,
      success: true,
      ndpr_relevant: false,
      retention_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    authLogger.info('User logged out', { userId: user.id });

    return c.json({
      success: true,
      message: 'Logout successful',
    } as ApiResponse);
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: 'Logout failed',
      },
    } as ApiResponse, 500);
  }
});

// Google OAuth - Get authorization URL
authRoutes.get('/google', async (c) => {
  try {
    const state = Math.random().toString(36).substring(7);
    const authUrl = GoogleOAuthService.generateAuthUrl(state);

    return c.json({
      success: true,
      data: {
        auth_url: authUrl,
        state,
      },
      message: 'Google OAuth URL generated',
    } as ApiResponse);
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'OAUTH_URL_GENERATION_FAILED',
        message: 'Failed to generate OAuth URL',
      },
    } as ApiResponse, 500);
  }
});

// Google OAuth callback
authRoutes.post(
  '/google/callback',
  zValidator('json', z.object({
    code: z.string().min(1),
    state: z.string().optional(),
  })),
  async (c) => {
    try {
      const { code } = c.req.valid('json');
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';

      // Handle OAuth callback
      const { user, tokens, isNewUser } = await GoogleOAuthService.handleOAuthCallback(code, ip);

      authLogger.info('Google OAuth callback processed', {
        userId: user.id,
        email: user.email,
        isNewUser,
        ip,
      });

      return c.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            subscription_tier: user.subscription_tier,
            email_verified: user.email_verified,
            phone_verified: user.phone_verified,
            preferred_language: user.preferred_language,
          },
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_in: tokens.expires_in,
          is_new_user: isNewUser,
        },
        message: isNewUser ? 'Account created successfully' : 'Login successful',
      } as ApiResponse, isNewUser ? 201 : 200);
    } catch (error) {
      authLogger.error('Google OAuth callback failed', { error });

      return c.json({
        success: false,
        error: {
          code: 'OAUTH_CALLBACK_FAILED',
          message: error instanceof Error ? error.message : 'OAuth authentication failed',
        },
      } as ApiResponse, 400);
    }
  }
);

// Password reset request
authRoutes.post(
  '/password-reset',
  zValidator('json', z.object({
    email: z.string().email(),
  })),
  async (c) => {
    try {
      const { email } = c.req.valid('json');

      // Generate password reset token
      const resetToken = await AuthService.generatePasswordResetToken(email);

      // In production, send email with reset link
      // For now, return the token (remove this in production)
      authLogger.info('Password reset requested', { email });

      return c.json({
        success: true,
        data: {
          reset_token: resetToken, // Remove this in production
        },
        message: 'Password reset instructions sent to your email',
      } as ApiResponse);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_FAILED',
          message: 'Failed to process password reset request',
        },
      } as ApiResponse, 500);
    }
  }
);

// Password reset confirmation
authRoutes.post(
  '/password-reset/confirm',
  zValidator('json', z.object({
    reset_token: z.string().min(1),
    new_password: z.string().min(8),
  })),
  async (c) => {
    try {
      const { reset_token, new_password } = c.req.valid('json');

      // Reset password
      await AuthService.resetPassword(reset_token, new_password);

      authLogger.info('Password reset completed successfully');

      return c.json({
        success: true,
        message: 'Password reset successful',
      } as ApiResponse);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'PASSWORD_RESET_FAILED',
          message: error instanceof Error ? error.message : 'Password reset failed',
        },
      } as ApiResponse, 400);
    }
  }
);

// Email verification
authRoutes.post(
  '/verify-email',
  zValidator('json', z.object({
    verification_token: z.string().min(1),
  })),
  async (c) => {
    try {
      const { verification_token } = c.req.valid('json');

      // Verify email
      await AuthService.verifyEmail(verification_token);

      authLogger.info('Email verification completed successfully');

      return c.json({
        success: true,
        message: 'Email verified successfully',
      } as ApiResponse);
    } catch (error) {
      return c.json({
        success: false,
        error: {
          code: 'EMAIL_VERIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Email verification failed',
        },
      } as ApiResponse, 400);
    }
  }
);

// Resend email verification
authRoutes.post('/verify-email/resend', authenticateJWT, async (c) => {
  try {
    const user = c.get('user') as User;

    if (user.email_verified) {
      return c.json({
        success: false,
        error: {
          code: 'EMAIL_ALREADY_VERIFIED',
          message: 'Email is already verified',
        },
      } as ApiResponse, 400);
    }

    // Generate new verification token
    const verificationToken = AuthService.generateEmailVerificationToken(user.id, user.email);

    authLogger.info('Email verification resent', { userId: user.id, email: user.email });

    return c.json({
      success: true,
      data: {
        verification_token: verificationToken, // Remove this in production
      },
      message: 'Verification email sent',
    } as ApiResponse);
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'VERIFICATION_RESEND_FAILED',
        message: 'Failed to resend verification email',
      },
    } as ApiResponse, 500);
  }
});

// Get current user profile
authRoutes.get('/profile', authenticateJWT, async (c) => {
  try {
    const user = c.get('user') as User;

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          subscription_tier: user.subscription_tier,
          email_verified: user.email_verified,
          phone_verified: user.phone_verified,
          preferred_language: user.preferred_language,
          emergency_contacts: user.emergency_contacts,
          default_location: user.default_location,
          created_at: user.created_at,
          last_login: user.last_login,
        },
      },
    } as ApiResponse);
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: 'Failed to fetch user profile',
      },
    } as ApiResponse, 500);
  }
});

// Update user profile
authRoutes.put(
  '/profile',
  authenticateJWT,
  zValidator('json', z.object({
    full_name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    preferred_language: z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']).optional(),
    marketing_consent: z.boolean().optional(),
    emergency_contacts: z.array(z.object({
      name: z.string(),
      phone: z.string(),
      relationship: z.string(),
    })).optional(),
    default_location: z.object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string(),
    }).optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const updates = c.req.valid('json');

      // Update user profile
      const updatedUser = await db.updateUser(user.id, {
        ...updates,
        updated_at: new Date().toISOString(),
      });

      // Log profile update
      await db.createAuditLog({
        user_id: user.id,
        action: 'USER_PROFILE_UPDATE',
        resource_type: 'users',
        resource_id: user.id,
        old_values: { /* previous values */ },
        new_values: updates,
        success: true,
        ndpr_relevant: true,
        retention_date: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      });

      authLogger.info('User profile updated', {
        userId: user.id,
        updatedFields: Object.keys(updates),
      });

      return c.json({
        success: true,
        data: { user: updatedUser },
        message: 'Profile updated successfully',
      } as ApiResponse);
    } catch (error) {
      authLogger.error('Profile update failed', { 
        userId: c.get('user')?.id, 
        error 
      });

      return c.json({
        success: false,
        error: {
          code: 'PROFILE_UPDATE_FAILED',
          message: 'Failed to update profile',
        },
      } as ApiResponse, 500);
    }
  }
);

export default authRoutes;
