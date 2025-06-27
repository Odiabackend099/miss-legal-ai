// Validation Utilities for MISS Legal AI
import { z } from 'zod';
import { ValidationError } from '@/types';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format').toLowerCase();

export const phoneSchema = z.string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
});

// Nigerian-specific validation schemas
export const nigerianPhoneSchema = z.string()
  .regex(/^(\+234|234|0)?[789][01]\d{8}$/, 'Invalid Nigerian phone number format')
  .transform((phone) => {
    // Normalize Nigerian phone numbers to +234 format
    if (phone.startsWith('0')) {
      return `+234${phone.slice(1)}`;
    } else if (phone.startsWith('234')) {
      return `+${phone}`;
    } else if (!phone.startsWith('+234')) {
      return `+234${phone}`;
    }
    return phone;
  });

export const nairaAmountSchema = z.number()
  .positive('Amount must be positive')
  .multipleOf(0.01, 'Amount cannot have more than 2 decimal places')
  .max(10000000, 'Amount cannot exceed ₦10,000,000');

// NDPR compliance validation
export const ndprConsentSchema = z.object({
  ndpr_consent: z.boolean().refine(val => val === true, {
    message: 'NDPR consent is required'
  }),
  marketing_consent: z.boolean().optional().default(false),
  data_retention_preference: z.number().int().min(30).max(2555).default(180), // 30 days to 7 years
});

// Emergency contact validation
export const emergencyContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: nigerianPhoneSchema,
  relationship: z.string().min(2).max(50),
});

// Location validation for emergency services
export const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500),
  accuracy: z.number().positive().optional(),
});

// Document validation schemas
export const documentDataSchema = z.object({
  landlord: z.object({
    name: z.string().min(2).max(100),
    address: z.string().min(10).max(500),
    phone: nigerianPhoneSchema.optional(),
    email: emailSchema.optional(),
  }).optional(),
  tenant: z.object({
    name: z.string().min(2).max(100),
    address: z.string().min(10).max(500),
    phone: nigerianPhoneSchema.optional(),
    email: emailSchema.optional(),
  }).optional(),
  property: z.object({
    address: z.string().min(10).max(500),
    type: z.string().min(2).max(50),
    size: z.string().optional(),
    amenities: z.array(z.string()).optional(),
  }).optional(),
  terms: z.object({
    rent_amount: nairaAmountSchema.optional(),
    duration_months: z.number().int().positive().max(60).optional(),
    payment_frequency: z.enum(['monthly', 'quarterly', 'biannually', 'annually']).optional(),
    security_deposit: nairaAmountSchema.optional(),
    utilities_included: z.boolean().optional(),
  }).optional(),
  deponent: z.object({
    name: z.string().min(2).max(100),
    address: z.string().min(10).max(500),
    occupation: z.string().min(2).max(100).optional(),
    id_type: z.enum(['nin', 'bvn', 'passport', 'drivers_license']).optional(),
    id_number: z.string().optional(),
  }).optional(),
  facts: z.array(z.string().min(10)).optional(),
  purpose: z.string().min(10).max(500).optional(),
}).refine((data) => {
  // At least one section must be provided
  return Object.values(data).some(value => value !== undefined);
}, {
  message: 'At least one document section must be provided'
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string().regex(/^(image|audio|application)\//),
  size: z.number().positive().max(10 * 1024 * 1024), // 10MB max
});

// Audio validation for voice processing
export const audioDataSchema = z.object({
  audio_data: z.string().min(1, 'Audio data is required'),
  audio_format: z.enum(['wav', 'mp3', 'm4a', 'webm']).default('wav'),
  duration_ms: z.number().positive().max(300000).optional(), // Max 5 minutes
  sample_rate: z.number().positive().optional(),
});

// Lawyer profile validation
export const lawyerProfileSchema = z.object({
  bar_number: z.string().regex(/^[A-Z]{2,3}\/\d{4,6}\/\d{4}$/, 'Invalid Nigerian Bar Association number format'),
  specializations: z.array(z.enum([
    'criminal_law',
    'civil_law',
    'corporate_law',
    'family_law',
    'property_law',
    'employment_law',
    'immigration_law',
    'tax_law',
    'intellectual_property',
    'human_rights'
  ])).min(1, 'At least one specialization is required'),
  years_experience: z.number().int().min(0).max(50),
  hourly_rate: nairaAmountSchema,
  available_languages: z.array(z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']))
    .min(1, 'At least one language is required'),
});

// Validation utility functions
export class ValidationUtils {
  /**
   * Validate data against a Zod schema
   */
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        throw new ValidationError('Validation failed', formattedErrors);
      }
      throw error;
    }
  }

  /**
   * Safely validate data and return result with errors
   */
  static safeValidate<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: boolean;
    data?: T;
    errors?: Array<{ field: string; message: string; code: string }>;
  } {
    try {
      const result = schema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));
        
        return { success: false, errors: formattedErrors };
      }
      return { 
        success: false, 
        errors: [{ field: 'general', message: 'Validation failed', code: 'unknown' }] 
      };
    }
  }

  /**
   * Validate Nigerian BVN (Bank Verification Number)
   */
  static validateBVN(bvn: string): boolean {
    const bvnPattern = /^\d{11}$/;
    return bvnPattern.test(bvn);
  }

  /**
   * Validate Nigerian NIN (National Identification Number)
   */
  static validateNIN(nin: string): boolean {
    const ninPattern = /^\d{11}$/;
    return ninPattern.test(nin);
  }

  /**
   * Validate file type against allowed types
   */
  static validateFileType(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? allowedTypes.includes(extension) : false;
  }

  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Validate and sanitize HTML content
   */
  static sanitizeHTML(html: string): string {
    // In a real implementation, use a proper HTML sanitizer like DOMPurify
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '');
  }

  /**
   * Validate Nigerian state and LGA
   */
  static validateNigerianLocation(state: string, lga?: string): boolean {
    const nigerianStates = [
      'abia', 'adamawa', 'akwa ibom', 'anambra', 'bauchi', 'bayelsa', 'benue',
      'borno', 'cross river', 'delta', 'ebonyi', 'edo', 'ekiti', 'enugu',
      'gombe', 'imo', 'jigawa', 'kaduna', 'kano', 'katsina', 'kebbi', 'kogi',
      'kwara', 'lagos', 'nasarawa', 'niger', 'ogun', 'ondo', 'osun', 'oyo',
      'plateau', 'rivers', 'sokoto', 'taraba', 'yobe', 'zamfara', 'fct'
    ];

    return nigerianStates.includes(state.toLowerCase());
  }

  /**
   * Validate audio file format and duration
   */
  static validateAudioFile(file: { mimetype: string; size: number }): boolean {
    const allowedTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/m4a', 'audio/webm'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    return allowedTypes.includes(file.mimetype) && file.size <= maxSize;
  }

  /**
   * Validate subscription tier permissions
   */
  static validateSubscriptionAccess(
    userTier: string,
    requiredTier: string,
    feature: string
  ): { allowed: boolean; message?: string } {
    const tierHierarchy = ['free', 'basic', 'professional', 'enterprise'];
    const userLevel = tierHierarchy.indexOf(userTier);
    const requiredLevel = tierHierarchy.indexOf(requiredTier);

    if (userLevel < requiredLevel) {
      return {
        allowed: false,
        message: `${feature} requires ${requiredTier} subscription or higher. Current tier: ${userTier}`
      };
    }

    return { allowed: true };
  }

  /**
   * Validate rate limit parameters
   */
  static validateRateLimit(tier: string): { requests: number; windowMs: number } {
    const rateLimits = {
      free: { requests: 10, windowMs: 60000 }, // 10 requests per minute
      basic: { requests: 50, windowMs: 60000 }, // 50 requests per minute
      professional: { requests: 200, windowMs: 60000 }, // 200 requests per minute
      enterprise: { requests: 1000, windowMs: 60000 }, // 1000 requests per minute
    };

    return rateLimits[tier as keyof typeof rateLimits] || rateLimits.free;
  }
}

// Export common validation patterns
export const validationPatterns = {
  nigerianPhone: /^(\+234|234|0)?[789][01]\d{8}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  bvn: /^\d{11}$/,
  nin: /^\d{11}$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  nairaAmount: /^\d+(\.\d{1,2})?$/,
};

export default ValidationUtils;
