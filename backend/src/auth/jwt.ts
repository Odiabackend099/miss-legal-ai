// JWT Authentication Service for MISS Legal AI
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, AuthenticationError, ValidationError } from '@/types';
import { db } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';

interface JWTPayload {
  userId: string;
  email: string;
  subscription_tier: string;
  iat?: number;
  exp?: number;
}

interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export class JWTService {
  private static readonly ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!;
  private static readonly REFRESH_TOKEN_SECRET = process.env.JWT_SECRET! + '_refresh';
  private static readonly ACCESS_TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
  private static readonly REFRESH_TOKEN_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  /**
   * Generate access and refresh tokens for a user
   */
  static generateTokens(user: User): TokenPair {
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      subscription_tier: user.subscription_tier,
    };

    const access_token = jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'miss-legal-ai',
      audience: 'miss-legal-ai-app',
    });

    const refresh_token = jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
      issuer: 'miss-legal-ai',
      audience: 'miss-legal-ai-app',
    });

    // Calculate expires_in in seconds
    const expires_in = this.parseExpiresIn(this.ACCESS_TOKEN_EXPIRES_IN);

    return {
      access_token,
      refresh_token,
      expires_in,
    };
  }

  /**
   * Verify and decode access token
   */
  static verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'miss-legal-ai',
        audience: 'miss-legal-ai-app',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      throw new AuthenticationError('Token verification failed');
    }
  }

  /**
   * Verify and decode refresh token
   */
  static verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: 'miss-legal-ai',
        audience: 'miss-legal-ai-app',
      }) as JWTPayload;

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthenticationError('Refresh token has expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid refresh token');
      }
      throw new AuthenticationError('Refresh token verification failed');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<TokenPair> {
    const decoded = this.verifyRefreshToken(refreshToken);
    
    // Get updated user data
    const user = await db.getUserById(decoded.userId);
    if (!user || !user.is_active) {
      throw new AuthenticationError('User not found or inactive');
    }

    return this.generateTokens(user);
  }

  /**
   * Parse expires_in string to seconds
   */
  private static parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) return 86400; // Default to 24 hours

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 'd': return value * 24 * 60 * 60;
      case 'h': return value * 60 * 60;
      case 'm': return value * 60;
      case 's': return value;
      default: return 86400;
    }
  }
}

export class AuthService {
  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Register a new user
   */
  static async register(userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    preferred_language?: string;
    ndpr_consent: boolean;
    marketing_consent?: boolean;
    emergency_contacts?: any[];
  }): Promise<{ user: User; tokens: TokenPair }> {
    try {
      // Validate required fields
      if (!userData.email || !userData.password || !userData.full_name) {
        throw new ValidationError('Email, password, and full name are required');
      }

      if (!userData.ndpr_consent) {
        throw new ValidationError('NDPR consent is required');
      }

      // Check if user already exists
      try {
        await db.getUserByEmail(userData.email);
        throw new ValidationError('User with this email already exists');
      } catch (error) {
        // User doesn't exist, which is what we want
        if (!(error instanceof Error) || !error.message.includes('not found')) {
          throw error;
        }
      }

      // Hash password
      const passwordHash = await this.hashPassword(userData.password);

      // Set NDPR consent expiry (1 year from now)
      const ndprConsentExpiry = new Date();
      ndprConsentExpiry.setFullYear(ndprConsentExpiry.getFullYear() + 1);

      // Create user
      const user = await db.createUser({
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone,
        preferred_language: userData.preferred_language || 'english',
        ndpr_consent: userData.ndpr_consent,
        ndpr_consent_date: new Date().toISOString(),
        ndpr_consent_expiry: ndprConsentExpiry.toISOString(),
        marketing_consent: userData.marketing_consent || false,
        emergency_contacts: userData.emergency_contacts || [],
        subscription_tier: 'free',
        is_active: true,
        email_verified: false,
        phone_verified: false,
      });

      // Create auth metadata
      await db.client
        .from('user_auth_metadata')
        .insert({
          user_id: user.id,
          auth_provider: 'email',
          password_hash: passwordHash,
        });

      // Generate tokens
      const tokens = JWTService.generateTokens(user);

      // Log registration
      await db.createAuditLog({
        user_id: user.id,
        action: 'USER_REGISTER',
        resource_type: 'users',
        resource_id: user.id,
        new_values: { email: user.email, full_name: user.full_name },
        success: true,
        ndpr_relevant: true,
        retention_date: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      });

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return { user, tokens };
    } catch (error) {
      logger.error('User registration failed', { email: userData.email, error });
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  static async login(email: string, password: string, ipAddress?: string): Promise<{ user: User; tokens: TokenPair }> {
    try {
      // Get user by email
      const user = await db.getUserByEmail(email);
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      if (!user.is_active) {
        throw new AuthenticationError('Account is inactive');
      }

      // Get auth metadata
      const { data: authData } = await db.client
        .from('user_auth_metadata')
        .select('password_hash')
        .eq('user_id', user.id)
        .eq('auth_provider', 'email')
        .single();

      if (!authData?.password_hash) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await this.verifyPassword(password, authData.password_hash);
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Update last login
      await db.updateUser(user.id, { last_login: new Date().toISOString() });

      // Generate tokens
      const tokens = JWTService.generateTokens(user);

      // Log login
      await db.createAuditLog({
        user_id: user.id,
        action: 'USER_LOGIN',
        resource_type: 'users',
        resource_id: user.id,
        ip_address: ipAddress,
        success: true,
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
      });

      logger.info('User logged in successfully', { userId: user.id, email: user.email });

      return { user, tokens };
    } catch (error) {
      // Log failed login attempt
      await db.createAuditLog({
        action: 'USER_LOGIN_FAILED',
        resource_type: 'users',
        new_values: { email },
        ip_address: ipAddress,
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      });

      logger.warn('Login attempt failed', { email, error });
      throw error;
    }
  }

  /**
   * Get user from JWT token
   */
  static async getUserFromToken(token: string): Promise<User> {
    const decoded = JWTService.verifyAccessToken(token);
    const user = await db.getUserById(decoded.userId);
    
    if (!user || !user.is_active) {
      throw new AuthenticationError('User not found or inactive');
    }

    return user;
  }

  /**
   * Generate password reset token
   */
  static async generatePasswordResetToken(email: string): Promise<string> {
    const user = await db.getUserByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return 'reset-token-sent';
    }

    const resetToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'password_reset' },
      JWTService.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await db.client
      .from('user_auth_metadata')
      .update({
        password_reset_token: resetToken,
        password_reset_expires: expiresAt.toISOString(),
      })
      .eq('user_id', user.id);

    // Log password reset request
    await db.createAuditLog({
      user_id: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      resource_type: 'users',
      resource_id: user.id,
      success: true,
      ndpr_relevant: false,
      retention_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    return resetToken;
  }

  /**
   * Reset password using reset token
   */
  static async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    try {
      const decoded = jwt.verify(resetToken, JWTService.ACCESS_TOKEN_SECRET) as any;
      
      if (decoded.type !== 'password_reset') {
        throw new ValidationError('Invalid reset token');
      }

      // Get user and verify token
      const { data: authData } = await db.client
        .from('user_auth_metadata')
        .select('user_id, password_reset_token, password_reset_expires')
        .eq('user_id', decoded.userId)
        .single();

      if (!authData || authData.password_reset_token !== resetToken) {
        throw new ValidationError('Invalid or expired reset token');
      }

      if (new Date() > new Date(authData.password_reset_expires)) {
        throw new ValidationError('Reset token has expired');
      }

      // Hash new password
      const passwordHash = await this.hashPassword(newPassword);

      // Update password and clear reset token
      await db.client
        .from('user_auth_metadata')
        .update({
          password_hash: passwordHash,
          password_reset_token: null,
          password_reset_expires: null,
        })
        .eq('user_id', decoded.userId);

      // Log password reset
      await db.createAuditLog({
        user_id: decoded.userId,
        action: 'PASSWORD_RESET_COMPLETED',
        resource_type: 'users',
        resource_id: decoded.userId,
        success: true,
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
      });

      logger.info('Password reset completed', { userId: decoded.userId });
    } catch (error) {
      logger.error('Password reset failed', { error });
      throw error;
    }
  }

  /**
   * Verify email with verification token
   */
  static async verifyEmail(token: string): Promise<void> {
    try {
      const decoded = jwt.verify(token, JWTService.ACCESS_TOKEN_SECRET) as any;
      
      if (decoded.type !== 'email_verification') {
        throw new ValidationError('Invalid verification token');
      }

      // Update user email verification status
      await db.updateUser(decoded.userId, { 
        email_verified: true,
        updated_at: new Date().toISOString()
      });

      // Log email verification
      await db.createAuditLog({
        user_id: decoded.userId,
        action: 'EMAIL_VERIFIED',
        resource_type: 'users',
        resource_id: decoded.userId,
        success: true,
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
      });

      logger.info('Email verified successfully', { userId: decoded.userId });
    } catch (error) {
      logger.error('Email verification failed', { error });
      throw error;
    }
  }

  /**
   * Generate email verification token
   */
  static generateEmailVerificationToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email, type: 'email_verification' },
      JWTService.ACCESS_TOKEN_SECRET,
      { expiresIn: '24h' }
    );
  }
}
