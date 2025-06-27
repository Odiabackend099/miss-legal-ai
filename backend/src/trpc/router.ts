// Main tRPC Router for MISS Legal AI
import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { TRPCContext, createAuthenticatedContext } from './context';
import { logger } from '@/utils/logger';

// Initialize tRPC
const t = initTRPC.context<TRPCContext>().create({
  errorFormatter: ({ shape, error }) => {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.code === 'BAD_REQUEST' && error.cause instanceof z.ZodError 
          ? error.cause.flatten() 
          : null,
      },
    };
  },
});

// Base router and procedures
export const router = t.router;
export const publicProcedure = t.procedure;

// Authenticated procedure middleware
const isAuthenticated = t.middleware(({ ctx, next }) => {
  if (!ctx.isAuthenticated || !ctx.user) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Authentication required',
    });
  }

  return next({
    ctx: createAuthenticatedContext(ctx),
  });
});

export const protectedProcedure = t.procedure.use(isAuthenticated);

// Subscription tier middleware
const requireSubscription = (requiredTiers: string[]) => {
  return t.middleware(({ ctx, next }) => {
    const authenticatedCtx = createAuthenticatedContext(ctx);
    
    if (!requiredTiers.includes(authenticatedCtx.user.subscription_tier)) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `This feature requires a subscription tier: ${requiredTiers.join(' or ')}`,
        cause: {
          currentTier: authenticatedCtx.user.subscription_tier,
          requiredTiers,
        },
      });
    }

    return next({ ctx: authenticatedCtx });
  });
};

export const basicProcedure = protectedProcedure.use(requireSubscription(['basic', 'professional', 'enterprise']));
export const professionalProcedure = protectedProcedure.use(requireSubscription(['professional', 'enterprise']));
export const enterpriseProcedure = protectedProcedure.use(requireSubscription(['enterprise']));

// Auth router
const authRouter = router({
  // Get current user
  me: protectedProcedure
    .query(({ ctx }) => {
      return {
        success: true,
        data: ctx.user,
      };
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(z.object({
      full_name: z.string().min(2).max(100).optional(),
      phone: z.string().optional(),
      preferred_language: z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']).optional(),
      marketing_consent: z.boolean().optional(),
      emergency_contacts: z.array(z.object({
        name: z.string(),
        phone: z.string(),
        relationship: z.string(),
      })).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // This would typically update the user in the database
        logger.info('User profile update requested', {
          userId: ctx.user.id,
          updates: Object.keys(input),
        });

        return {
          success: true,
          message: 'Profile updated successfully',
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update profile',
          cause: error,
        });
      }
    }),
});

// Documents router
const documentsRouter = router({
  // List user documents
  list: protectedProcedure
    .input(z.object({
      page: z.number().int().positive().default(1),
      limit: z.number().int().positive().max(50).default(10),
      type: z.enum(['tenancy_agreement', 'affidavit', 'power_of_attorney']).optional(),
      status: z.enum(['draft', 'completed', 'signed', 'archived']).optional(),
    }))
    .query(({ ctx, input }) => {
      logger.info('Documents list requested', {
        userId: ctx.user.id,
        filters: input,
      });

      // This would typically query the database
      return {
        success: true,
        data: {
          documents: [],
          pagination: {
            page: input.page,
            limit: input.limit,
            total: 0,
            pages: 0,
          },
        },
      };
    }),

  // Generate document
  generate: basicProcedure
    .input(z.object({
      type: z.enum(['tenancy_agreement', 'affidavit', 'power_of_attorney']),
      title: z.string().min(1).max(255),
      language: z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']).default('english'),
      data: z.record(z.any()),
    }))
    .mutation(({ ctx, input }) => {
      logger.info('Document generation requested', {
        userId: ctx.user.id,
        type: input.type,
        language: input.language,
      });

      return {
        success: true,
        data: {
          id: 'doc-123',
          status: 'draft',
          message: 'Document generation started',
        },
      };
    }),
});

// Voice router
const voiceRouter = router({
  // Process voice input
  process: protectedProcedure
    .input(z.object({
      audio_data: z.string().min(1),
      audio_format: z.enum(['wav', 'mp3', 'm4a', 'webm']).default('wav'),
      session_id: z.string().uuid().optional(),
      session_type: z.enum(['general', 'document_creation', 'emergency', 'consultation']).default('general'),
      language_hint: z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']).optional(),
    }))
    .mutation(({ ctx, input }) => {
      logger.info('Voice processing requested', {
        userId: ctx.user.id,
        sessionType: input.session_type,
        audioFormat: input.audio_format,
      });

      return {
        success: true,
        data: {
          session_id: input.session_id || 'session-123',
          transcript: 'Sample transcript',
          language: 'english',
          intent: 'general_inquiry',
          response: 'Hello! How can I help you today?',
          emergency_detected: false,
        },
      };
    }),

  // Get voice session
  getSession: protectedProcedure
    .input(z.object({
      session_id: z.string().uuid(),
    }))
    .query(({ ctx, input }) => {
      return {
        success: true,
        data: {
          id: input.session_id,
          user_id: ctx.user.id,
          session_type: 'general',
          created_at: new Date().toISOString(),
          conversations: [],
        },
      };
    }),
});

// Emergency router
const emergencyRouter = router({
  // Dispatch emergency
  dispatch: protectedProcedure
    .input(z.object({
      emergency_type: z.enum(['medical', 'security', 'legal', 'fire', 'accident', 'domestic_violence']),
      confidence_score: z.number().min(0).max(1),
      location: z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string(),
      }).optional(),
      transcript: z.string().optional(),
      detected_keywords: z.array(z.string()).default([]),
      context_data: z.record(z.any()).optional(),
    }))
    .mutation(({ ctx, input }) => {
      logger.error('Emergency dispatch requested', {
        userId: ctx.user.id,
        emergencyType: input.emergency_type,
        confidence: input.confidence_score,
        location: input.location,
      });

      return {
        success: true,
        data: {
          emergency_id: 'emergency-123',
          status: 'active',
          response_actions: ['contacts_notified', 'emergency_services_alerted'],
          message: 'Emergency response initiated',
        },
      };
    }),

  // Get emergency status
  getStatus: protectedProcedure
    .input(z.object({
      emergency_id: z.string().uuid(),
    }))
    .query(({ ctx, input }) => {
      return {
        success: true,
        data: {
          id: input.emergency_id,
          status: 'active',
          emergency_type: 'medical',
          created_at: new Date().toISOString(),
          notified_contacts: [],
          response_actions: [],
        },
      };
    }),
});

// Payment router
const paymentRouter = router({
  // Get subscription plans
  getPlans: publicProcedure
    .query(() => {
      return {
        success: true,
        data: {
          plans: {
            basic: {
              monthly: { amount: 2500, duration: 30 },
              quarterly: { amount: 7000, duration: 90 },
              yearly: { amount: 25000, duration: 365 },
            },
            professional: {
              monthly: { amount: 5000, duration: 30 },
              quarterly: { amount: 14000, duration: 90 },
              yearly: { amount: 50000, duration: 365 },
            },
            enterprise: {
              monthly: { amount: 15000, duration: 30 },
              quarterly: { amount: 42000, duration: 90 },
              yearly: { amount: 150000, duration: 365 },
            },
          },
        },
      };
    }),

  // Initialize payment
  initializePayment: protectedProcedure
    .input(z.object({
      amount: z.number().positive(),
      currency: z.string().default('NGN'),
      description: z.string(),
      subscription_tier: z.enum(['basic', 'professional', 'enterprise']).optional(),
      subscription_duration: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
    }))
    .mutation(({ ctx, input }) => {
      logger.info('Payment initialization requested', {
        userId: ctx.user.id,
        amount: input.amount,
        subscriptionTier: input.subscription_tier,
      });

      return {
        success: true,
        data: {
          payment_link: 'https://checkout.flutterwave.com/v3/hosted/pay/example',
          transaction_ref: 'tx-123',
          expires_in: 3600,
        },
      };
    }),
});

// Lawyers router
const lawyersRouter = router({
  // Get available lawyers
  getAvailable: protectedProcedure
    .input(z.object({
      specialization: z.string().optional(),
      language: z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']).optional(),
      location: z.string().optional(),
    }))
    .query(({ ctx, input }) => {
      return {
        success: true,
        data: {
          lawyers: [],
          total: 0,
        },
      };
    }),

  // Schedule consultation
  schedule: basicProcedure
    .input(z.object({
      lawyer_id: z.string().uuid(),
      consultation_type: z.enum(['voice', 'video', 'chat', 'document_review']),
      scheduled_at: z.string().datetime(),
      duration_minutes: z.number().positive().default(30),
      description: z.string().optional(),
    }))
    .mutation(({ ctx, input }) => {
      logger.info('Consultation scheduling requested', {
        userId: ctx.user.id,
        lawyerId: input.lawyer_id,
        type: input.consultation_type,
        scheduledAt: input.scheduled_at,
      });

      return {
        success: true,
        data: {
          consultation_id: 'consultation-123',
          status: 'scheduled',
          payment_required: true,
          total_cost: 5000,
        },
      };
    }),
});

// Main app router
export const appRouter = router({
  auth: authRouter,
  documents: documentsRouter,
  voice: voiceRouter,
  emergency: emergencyRouter,
  payment: paymentRouter,
  lawyers: lawyersRouter,
  
  // Health check
  health: publicProcedure.query(() => ({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    },
  })),
});

export type AppRouter = typeof appRouter;
