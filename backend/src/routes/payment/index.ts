// Payment Routes for MISS Legal AI
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticateJWT } from '@/middleware/auth';
import { FlutterwaveService } from '@/integrations/flutterwave/client';
import { db } from '@/integrations/supabase/client';
import { ApiResponse, User, SubscriptionTier, FlutterwaveWebhookEvent } from '@/types';
import { logger, paymentLogger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const paymentRoutes = new Hono();

// Get subscription plans
paymentRoutes.get('/plans', async (c) => {
  try {
    const plans = FlutterwaveService.getAllSubscriptionPlans();

    return c.json({
      success: true,
      data: { plans },
      message: 'Subscription plans retrieved successfully',
    } as ApiResponse);
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'PLANS_FETCH_FAILED',
        message: 'Failed to retrieve subscription plans',
      },
    } as ApiResponse, 500);
  }
});

// Initialize payment
paymentRoutes.post(
  '/initialize',
  authenticateJWT,
  zValidator('json', z.object({
    amount: z.number().positive(),
    currency: z.string().default('NGN'),
    description: z.string().min(1),
    subscription_tier: z.enum(['basic', 'professional', 'enterprise']).optional(),
    subscription_duration: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
    callback_url: z.string().url().optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const paymentData = c.req.valid('json');

      paymentLogger.info('Payment initialization requested', {
        userId: user.id,
        amount: paymentData.amount,
        subscriptionTier: paymentData.subscription_tier,
        subscriptionDuration: paymentData.subscription_duration,
      });

      // Initialize payment with Flutterwave
      const flutterwaveResponse = await FlutterwaveService.initializePayment({
        amount: paymentData.amount,
        currency: paymentData.currency,
        customer: {
          email: user.email,
          name: user.full_name,
          phone: user.phone,
        },
        description: paymentData.description,
        subscriptionTier: paymentData.subscription_tier,
        subscriptionDuration: paymentData.subscription_duration,
        metadata: {
          user_id: user.id,
          subscription_tier: paymentData.subscription_tier,
          subscription_duration: paymentData.subscription_duration,
        },
      });

      // Create payment record in database
      const payment = await db.createPayment({
        id: uuidv4(),
        user_id: user.id,
        transaction_id: flutterwaveResponse.transactionRef,
        provider: 'flutterwave',
        provider_transaction_id: flutterwaveResponse.flutterwaveRef,
        amount: paymentData.amount,
        currency: paymentData.currency,
        description: paymentData.description,
        status: 'pending',
        payment_method: 'card', // Will be updated after payment
        subscription_tier: paymentData.subscription_tier,
        subscription_duration_days: paymentData.subscription_duration ? 
          FlutterwaveService.getSubscriptionPlan(paymentData.subscription_tier!, paymentData.subscription_duration).duration : 
          null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Log payment initialization
      await db.createAuditLog({
        user_id: user.id,
        action: 'PAYMENT_INITIALIZED',
        resource_type: 'payments',
        resource_id: payment.id,
        new_values: {
          amount: paymentData.amount,
          subscription_tier: paymentData.subscription_tier,
          transaction_id: flutterwaveResponse.transactionRef,
        },
        success: true,
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      });

      paymentLogger.info('Payment initialized successfully', {
        userId: user.id,
        paymentId: payment.id,
        transactionRef: flutterwaveResponse.transactionRef,
        amount: paymentData.amount,
      });

      return c.json({
        success: true,
        data: {
          payment_id: payment.id,
          payment_link: flutterwaveResponse.paymentLink,
          transaction_ref: flutterwaveResponse.transactionRef,
          amount: paymentData.amount,
          currency: paymentData.currency,
          expires_in: 3600, // 1 hour
        },
        message: 'Payment initialized successfully',
      } as ApiResponse, 201);
    } catch (error) {
      paymentLogger.error('Payment initialization failed', {
        userId: c.get('user')?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return c.json({
        success: false,
        error: {
          code: 'PAYMENT_INITIALIZATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to initialize payment',
        },
      } as ApiResponse, 500);
    }
  }
);

// Verify payment
paymentRoutes.post(
  '/verify',
  authenticateJWT,
  zValidator('json', z.object({
    transaction_id: z.string().min(1),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { transaction_id } = c.req.valid('json');

      paymentLogger.info('Payment verification requested', {
        userId: user.id,
        transactionId: transaction_id,
      });

      // Get payment record from database
      const payment = await db.getPaymentByTransactionId(transaction_id);
      if (!payment || payment.user_id !== user.id) {
        return c.json({
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment transaction not found',
          },
        } as ApiResponse, 404);
      }

      // Verify payment with Flutterwave
      const verificationResult = await FlutterwaveService.verifyPayment(payment.provider_transaction_id);

      // Update payment record
      const updatedPayment = await db.updatePayment(payment.id, {
        status: verificationResult.status,
        payment_method: verificationResult.flutterwaveData.payment_type,
        provider_response: verificationResult.flutterwaveData,
        processed_at: verificationResult.status === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      });

      // If payment is successful and it's a subscription, update user's subscription
      if (verificationResult.status === 'completed' && payment.subscription_tier && payment.subscription_duration_days) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + payment.subscription_duration_days);

        // Update user subscription
        await db.updateUser(user.id, {
          subscription_tier: payment.subscription_tier,
          updated_at: new Date().toISOString(),
        });

        // Create subscription history record
        await db.client.from('subscription_history').insert({
          id: uuidv4(),
          user_id: user.id,
          payment_id: payment.id,
          tier: payment.subscription_tier,
          starts_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          is_active: true,
          auto_renew: false,
          created_at: new Date().toISOString(),
        });
      }

      // Log payment verification
      await db.createAuditLog({
        user_id: user.id,
        action: 'PAYMENT_VERIFIED',
        resource_type: 'payments',
        resource_id: payment.id,
        new_values: {
          status: verificationResult.status,
          amount: verificationResult.amount,
          subscription_activated: payment.subscription_tier && verificationResult.status === 'completed',
        },
        success: true,
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      });

      paymentLogger.info('Payment verification completed', {
        userId: user.id,
        paymentId: payment.id,
        status: verificationResult.status,
        amount: verificationResult.amount,
      });

      return c.json({
        success: true,
        data: {
          payment: {
            id: payment.id,
            transaction_id: payment.transaction_id,
            status: verificationResult.status,
            amount: verificationResult.amount,
            currency: verificationResult.currency,
            payment_method: verificationResult.flutterwaveData.payment_type,
            subscription_tier: payment.subscription_tier,
            subscription_activated: payment.subscription_tier && verificationResult.status === 'completed',
            processed_at: updatedPayment.processed_at,
          },
        },
        message: verificationResult.status === 'completed' ? 'Payment verified successfully' : 'Payment verification completed',
      } as ApiResponse);
    } catch (error) {
      paymentLogger.error('Payment verification failed', {
        userId: c.get('user')?.id,
        transactionId: c.req.json.transaction_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return c.json({
        success: false,
        error: {
          code: 'PAYMENT_VERIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Failed to verify payment',
        },
      } as ApiResponse, 500);
    }
  }
);

// Flutterwave webhook callback
paymentRoutes.post('/callback', async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('verif-hash');

    if (!signature) {
      paymentLogger.warn('Webhook received without signature');
      return c.json({ success: false, message: 'Missing signature' }, 400);
    }

    // Verify webhook signature
    const isValidSignature = FlutterwaveService.verifyWebhookSignature(body, signature);
    if (!isValidSignature) {
      paymentLogger.warn('Invalid webhook signature', { signature });
      return c.json({ success: false, message: 'Invalid signature' }, 400);
    }

    const webhookData = JSON.parse(body) as FlutterwaveWebhookEvent;

    paymentLogger.info('Valid webhook received', {
      event: webhookData.event,
      txRef: webhookData.data.tx_ref,
      status: webhookData.data.status,
    });

    // Process webhook event
    const result = await FlutterwaveService.processWebhookEvent(webhookData);

    if (result.success) {
      // Update payment record in database based on webhook data
      try {
        const payment = await db.getPaymentByTransactionId(webhookData.data.tx_ref);
        if (payment) {
          await db.updatePayment(payment.id, {
            status: webhookData.data.status === 'successful' ? 'completed' : 
                   webhookData.data.status === 'failed' ? 'failed' : 'pending',
            webhook_data: webhookData.data,
            processed_at: webhookData.data.status === 'successful' ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          });

          // If payment is successful and it's a subscription, activate it
          if (webhookData.data.status === 'successful' && payment.subscription_tier && payment.subscription_duration_days) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + payment.subscription_duration_days);

            await db.updateUser(payment.user_id, {
              subscription_tier: payment.subscription_tier,
              updated_at: new Date().toISOString(),
            });

            await db.client.from('subscription_history').insert({
              id: uuidv4(),
              user_id: payment.user_id,
              payment_id: payment.id,
              tier: payment.subscription_tier,
              starts_at: new Date().toISOString(),
              expires_at: expiresAt.toISOString(),
              is_active: true,
              auto_renew: false,
              created_at: new Date().toISOString(),
            });
          }
        }
      } catch (dbError) {
        paymentLogger.error('Failed to update payment from webhook', {
          txRef: webhookData.data.tx_ref,
          error: dbError,
        });
      }
    }

    return c.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    paymentLogger.error('Webhook processing failed', { error });
    return c.json({ success: false, message: 'Webhook processing failed' }, 500);
  }
});

// Get payment history
paymentRoutes.get(
  '/history',
  authenticateJWT,
  zValidator('query', z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(50)).default('10'),
    status: z.enum(['pending', 'completed', 'failed', 'cancelled', 'refunded']).optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { page, limit, status } = c.req.valid('query');

      const offset = (page - 1) * limit;

      // Build query
      let query = db.client
        .from('payments')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: payments, count } = await query;

      return c.json({
        success: true,
        data: {
          payments: payments?.map(payment => ({
            id: payment.id,
            transaction_id: payment.transaction_id,
            amount: payment.amount,
            currency: payment.currency,
            description: payment.description,
            status: payment.status,
            payment_method: payment.payment_method,
            subscription_tier: payment.subscription_tier,
            subscription_duration_days: payment.subscription_duration_days,
            processed_at: payment.processed_at,
            created_at: payment.created_at,
          })) || [],
          pagination: {
            page,
            limit,
            total: count || 0,
            pages: Math.ceil((count || 0) / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      paymentLogger.error('Failed to retrieve payment history', {
        userId: c.get('user')?.id,
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'PAYMENT_HISTORY_FETCH_FAILED',
          message: 'Failed to retrieve payment history',
        },
      } as ApiResponse, 500);
    }
  }
);

// Get subscription status
paymentRoutes.get('/subscription/status', authenticateJWT, async (c) => {
  try {
    const user = c.get('user') as User;

    // Get current subscription
    const { data: currentSubscription } = await db.client
      .from('subscription_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get subscription stats
    const { data: subscriptionStats } = await db.client
      .from('subscription_history')
      .select('tier', { count: 'exact' })
      .eq('user_id', user.id);

    return c.json({
      success: true,
      data: {
        current_tier: user.subscription_tier,
        subscription: currentSubscription ? {
          tier: currentSubscription.tier,
          starts_at: currentSubscription.starts_at,
          expires_at: currentSubscription.expires_at,
          auto_renew: currentSubscription.auto_renew,
          days_remaining: currentSubscription.expires_at ? 
            Math.max(0, Math.ceil((new Date(currentSubscription.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 
            null,
        } : null,
        usage_stats: {
          total_subscriptions: subscriptionStats?.length || 0,
        },
      },
    } as ApiResponse);
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_STATUS_FETCH_FAILED',
        message: 'Failed to retrieve subscription status',
      },
    } as ApiResponse, 500);
  }
});

// Cancel subscription
paymentRoutes.post('/subscription/cancel', authenticateJWT, async (c) => {
  try {
    const user = c.get('user') as User;

    // Get current active subscription
    const { data: currentSubscription } = await db.client
      .from('subscription_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!currentSubscription) {
      return c.json({
        success: false,
        error: {
          code: 'NO_ACTIVE_SUBSCRIPTION',
          message: 'No active subscription found',
        },
      } as ApiResponse, 404);
    }

    // Update subscription to cancelled
    await db.client
      .from('subscription_history')
      .update({
        auto_renew: false,
        cancelled_at: new Date().toISOString(),
        cancellation_reason: 'User requested cancellation',
      })
      .eq('id', currentSubscription.id);

    // Log subscription cancellation
    await db.createAuditLog({
      user_id: user.id,
      action: 'SUBSCRIPTION_CANCELLED',
      resource_type: 'subscription_history',
      resource_id: currentSubscription.id,
      old_values: { auto_renew: currentSubscription.auto_renew },
      new_values: { auto_renew: false, cancelled_at: new Date().toISOString() },
      success: true,
      ndpr_relevant: false,
      retention_date: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
    });

    paymentLogger.info('Subscription cancelled', {
      userId: user.id,
      subscriptionId: currentSubscription.id,
      tier: currentSubscription.tier,
    });

    return c.json({
      success: true,
      data: {
        subscription_id: currentSubscription.id,
        tier: currentSubscription.tier,
        expires_at: currentSubscription.expires_at,
        cancelled_at: new Date().toISOString(),
      },
      message: 'Subscription cancelled successfully. Access will continue until expiry date.',
    } as ApiResponse);
  } catch (error) {
    paymentLogger.error('Subscription cancellation failed', {
      userId: c.get('user')?.id,
      error,
    });

    return c.json({
      success: false,
      error: {
        code: 'SUBSCRIPTION_CANCELLATION_FAILED',
        message: 'Failed to cancel subscription',
      },
    } as ApiResponse, 500);
  }
});

export default paymentRoutes;
