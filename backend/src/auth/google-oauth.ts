// Google OAuth Integration for MISS Legal AI
import axios from 'axios';
import { User, ValidationError, AuthenticationError } from '@/types';
import { db } from '@/integrations/supabase/client';
import { JWTService } from './jwt';
import { logger } from '@/utils/logger';

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale: string;
}

interface GoogleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  id_token: string;
}

export class GoogleOAuthService {
  private static readonly CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
  private static readonly CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
  private static readonly REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!;
  
  private static readonly GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private static readonly GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

  /**
   * Generate Google OAuth authorization URL
   */
  static generateAuthUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.CLIENT_ID,
      redirect_uri: this.REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });

    if (state) {
      params.append('state', state);
    }

    return `${this.GOOGLE_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  static async exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
    try {
      const response = await axios.post(this.GOOGLE_TOKEN_URL, {
        client_id: this.CLIENT_ID,
        client_secret: this.CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.REDIRECT_URI,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data as GoogleTokenResponse;
    } catch (error) {
      logger.error('Failed to exchange code for tokens', { error });
      throw new AuthenticationError('Failed to authenticate with Google');
    }
  }

  /**
   * Get user information from Google
   */
  static async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get(this.GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userInfo = response.data as GoogleUserInfo;

      if (!userInfo.verified_email) {
        throw new ValidationError('Google email is not verified');
      }

      return userInfo;
    } catch (error) {
      logger.error('Failed to get user info from Google', { error });
      throw new AuthenticationError('Failed to get user information from Google');
    }
  }

  /**
   * Handle Google OAuth login/registration
   */
  static async handleOAuthCallback(
    code: string,
    ipAddress?: string
  ): Promise<{ user: User; tokens: { access_token: string; refresh_token: string; expires_in: number }; isNewUser: boolean }> {
    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code);
      
      // Get user info from Google
      const googleUser = await this.getUserInfo(tokenResponse.access_token);

      // Check if user exists
      let user: User;
      let isNewUser = false;

      try {
        user = await db.getUserByEmail(googleUser.email);
        
        // Update existing user's Google info if needed
        await this.updateExistingUserGoogleInfo(user.id, googleUser);
        
        // Update last login
        await db.updateUser(user.id, { last_login: new Date().toISOString() });
        
      } catch (error) {
        // User doesn't exist, create new one
        if (error instanceof Error && error.message.includes('not found')) {
          user = await this.createUserFromGoogle(googleUser);
          isNewUser = true;
        } else {
          throw error;
        }
      }

      if (!user.is_active) {
        throw new AuthenticationError('Account is inactive');
      }

      // Generate JWT tokens
      const tokens = JWTService.generateTokens(user);

      // Log OAuth login
      await db.createAuditLog({
        user_id: user.id,
        action: isNewUser ? 'USER_OAUTH_REGISTER' : 'USER_OAUTH_LOGIN',
        resource_type: 'users',
        resource_id: user.id,
        new_values: { provider: 'google', email: user.email },
        ip_address: ipAddress,
        success: true,
        ndpr_relevant: isNewUser,
        retention_date: new Date(Date.now() + (isNewUser ? 7 : 2) * 365 * 24 * 60 * 60 * 1000),
      });

      logger.info('Google OAuth authentication successful', { 
        userId: user.id, 
        email: user.email, 
        isNewUser 
      });

      return { user, tokens, isNewUser };
    } catch (error) {
      logger.error('Google OAuth authentication failed', { error });
      throw error;
    }
  }

  /**
   * Create new user from Google OAuth data
   */
  private static async createUserFromGoogle(googleUser: GoogleUserInfo): Promise<User> {
    try {
      // Set NDPR consent expiry (1 year from now)
      const ndprConsentExpiry = new Date();
      ndprConsentExpiry.setFullYear(ndprConsentExpiry.getFullYear() + 1);

      // Create user with Google data
      const user = await db.createUser({
        email: googleUser.email,
        full_name: googleUser.name,
        preferred_language: this.mapGoogleLocaleToLanguage(googleUser.locale),
        ndpr_consent: true, // Default to true for OAuth users
        ndpr_consent_date: new Date().toISOString(),
        ndpr_consent_expiry: ndprConsentExpiry.toISOString(),
        marketing_consent: false,
        emergency_contacts: [],
        subscription_tier: 'free',
        is_active: true,
        email_verified: googleUser.verified_email,
        phone_verified: false,
      });

      // Create auth metadata for Google OAuth
      await db.client
        .from('user_auth_metadata')
        .insert({
          user_id: user.id,
          auth_provider: 'google',
          auth_provider_id: googleUser.id,
        });

      logger.info('New user created from Google OAuth', { 
        userId: user.id, 
        email: user.email 
      });

      return user;
    } catch (error) {
      logger.error('Failed to create user from Google OAuth', { 
        email: googleUser.email, 
        error 
      });
      throw error;
    }
  }

  /**
   * Update existing user's Google OAuth information
   */
  private static async updateExistingUserGoogleInfo(userId: string, googleUser: GoogleUserInfo): Promise<void> {
    try {
      // Check if Google auth metadata exists
      const { data: existingAuth } = await db.client
        .from('user_auth_metadata')
        .select('*')
        .eq('user_id', userId)
        .eq('auth_provider', 'google')
        .single();

      if (!existingAuth) {
        // Add Google auth metadata to existing user
        await db.client
          .from('user_auth_metadata')
          .insert({
            user_id: userId,
            auth_provider: 'google',
            auth_provider_id: googleUser.id,
          });
      } else if (existingAuth.auth_provider_id !== googleUser.id) {
        // Update Google ID if it changed
        await db.client
          .from('user_auth_metadata')
          .update({
            auth_provider_id: googleUser.id,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .eq('auth_provider', 'google');
      }

      // Update user's email verification status if not already verified
      const user = await db.getUserById(userId);
      if (!user.email_verified && googleUser.verified_email) {
        await db.updateUser(userId, {
          email_verified: true,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (error) {
      logger.error('Failed to update user Google info', { userId, error });
      // Don't throw here as this is not critical for login
    }
  }

  /**
   * Map Google locale to supported language
   */
  private static mapGoogleLocaleToLanguage(locale: string): string {
    const languageMap: Record<string, string> = {
      'en': 'english',
      'en-US': 'english',
      'en-GB': 'english',
      'yo': 'yoruba',
      'yo-NG': 'yoruba',
      'ha': 'hausa',
      'ha-NG': 'hausa',
      'ig': 'igbo',
      'ig-NG': 'igbo',
    };

    const baseLocale = locale.split('-')[0];
    return languageMap[locale] || languageMap[baseLocale] || 'english';
  }

  /**
   * Revoke Google OAuth tokens (for logout)
   */
  static async revokeGoogleTokens(accessToken: string): Promise<void> {
    try {
      await axios.post('https://oauth2.googleapis.com/revoke', null, {
        params: {
          token: accessToken,
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
    } catch (error) {
      logger.warn('Failed to revoke Google tokens', { error });
      // Don't throw as this is not critical
    }
  }

  /**
   * Link Google account to existing user
   */
  static async linkGoogleAccount(
    userId: string,
    code: string
  ): Promise<void> {
    try {
      // Exchange code for tokens
      const tokenResponse = await this.exchangeCodeForTokens(code);
      
      // Get user info from Google
      const googleUser = await this.getUserInfo(tokenResponse.access_token);

      // Verify the email matches the user's email
      const user = await db.getUserById(userId);
      if (user.email !== googleUser.email) {
        throw new ValidationError('Google account email does not match user email');
      }

      // Check if Google account is already linked to another user
      const { data: existingLink } = await db.client
        .from('user_auth_metadata')
        .select('user_id')
        .eq('auth_provider', 'google')
        .eq('auth_provider_id', googleUser.id)
        .single();

      if (existingLink && existingLink.user_id !== userId) {
        throw new ValidationError('Google account is already linked to another user');
      }

      // Add or update Google auth metadata
      await db.client
        .from('user_auth_metadata')
        .upsert({
          user_id: userId,
          auth_provider: 'google',
          auth_provider_id: googleUser.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,auth_provider',
        });

      // Update email verification if needed
      if (!user.email_verified && googleUser.verified_email) {
        await db.updateUser(userId, {
          email_verified: true,
          updated_at: new Date().toISOString(),
        });
      }

      // Log account linking
      await db.createAuditLog({
        user_id: userId,
        action: 'GOOGLE_ACCOUNT_LINKED',
        resource_type: 'users',
        resource_id: userId,
        new_values: { google_id: googleUser.id },
        success: true,
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
      });

      logger.info('Google account linked successfully', { userId, googleId: googleUser.id });
    } catch (error) {
      logger.error('Failed to link Google account', { userId, error });
      throw error;
    }
  }

  /**
   * Unlink Google account from user
   */
  static async unlinkGoogleAccount(userId: string): Promise<void> {
    try {
      // Remove Google auth metadata
      const { error } = await db.client
        .from('user_auth_metadata')
        .delete()
        .eq('user_id', userId)
        .eq('auth_provider', 'google');

      if (error) {
        throw error;
      }

      // Log account unlinking
      await db.createAuditLog({
        user_id: userId,
        action: 'GOOGLE_ACCOUNT_UNLINKED',
        resource_type: 'users',
        resource_id: userId,
        success: true,
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
      });

      logger.info('Google account unlinked successfully', { userId });
    } catch (error) {
      logger.error('Failed to unlink Google account', { userId, error });
      throw error;
    }
  }
}
