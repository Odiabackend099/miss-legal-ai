// Flutterwave Payment Integration for MISS Legal AI
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { logger, paymentLogger } from '@/utils/logger';
import { Payment, PaymentStatus, SubscriptionTier, FlutterwaveWebhookEvent } from '@/types';

interface FlutterwavePaymentRequest {
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
  };
  tx_ref: string;
  redirect_url: string;
  payment_options?: string;
  customizations?: {
    title: string;
    description: string;
    logo: string;
  };
  meta?: Record<string, any>;
}

interface FlutterwavePaymentResponse {
  status: string;
  message: string;
  data: {
    link: string;
    id: string;
    tx_ref: string;
  };
}

interface FlutterwaveVerificationResponse {
  status: string;
  message: string;
  data: {
    id: string;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    charged_amount: number;
    app_fee: number;
    merchant_fee: number;
    processor_response: string;
    auth_model: string;
    ip: string;
    narration: string;
    status: string;
    payment_type: string;
    created_at: string;
    account_id: number;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
      created_at: string;
    };
    card?: any;
  };
}

// Subscription plans configuration
const subscriptionPlans = {
  basic: {
    monthly: { amount: 2500, duration: 30 }, // ₦2,500/month
    quarterly: { amount: 7000, duration: 90 }, // ₦7,000/quarter (save ₦500)
    yearly: { amount: 25000, duration: 365 }, // ₦25,000/year (save ₦5,000)
  },
  professional: {
    monthly: { amount: 5000, duration: 30 }, // ₦5,000/month
    quarterly: { amount: 14000, duration: 90 }, // ₦14,000/quarter (save ₦1,000)
    yearly: { amount: 50000, duration: 365 }, // ₦50,000/year (save ₦10,000)
  },
  enterprise: {
    monthly: { amount: 15000, duration: 30 }, // ₦15,000/month
    quarterly: { amount: 42000, duration: 90 }, // ₦42,000/quarter (save ₦3,000)
    yearly: { amount: 150000, duration: 365 }, // ₦150,000/year (save ₦30,000)
  },
};

export class FlutterwaveService {
  private static readonly PUBLIC_KEY = process.env.FLUTTERWAVE_PUBLIC_KEY!;
  private static readonly SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY!;
  private static readonly WEBHOOK_SECRET = process.env.FLUTTERWAVE_WEBHOOK_SECRET!;
  private static readonly BASE_URL = 'https://api.flutterwave.com/v3';

  private static client: AxiosInstance;

  static {
    if (!this.PUBLIC_KEY || !this.SECRET_KEY) {
      throw new Error('Flutterwave API keys are required');
    }

    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Authorization': `Bearer ${this.SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      paymentLogger.info('Flutterwave API request', {
        method: config.method,
        url: config.url,
        data: config.data ? JSON.stringify(config.data).substring(0, 200) : undefined,
      });
      return config;
    });

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        paymentLogger.info('Flutterwave API response', {
          status: response.status,
          url: response.config.url,
          data: JSON.stringify(response.data).substring(0, 200),
        });
        return response;
      },
      (error) => {
        paymentLogger.error('Flutterwave API error', {
          status: error.response?.status,
          url: error.config?.url,
          error: error.response?.data || error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Initialize payment for subscription or one-time purchase
   */
  static async initializePayment(params: {
    amount: number;
    currency?: string;
    customer: {
      email: string;
      name: string;
      phone?: string;
    };
    description: string;
    subscriptionTier?: SubscriptionTier;
    subscriptionDuration?: 'monthly' | 'quarterly' | 'yearly';
    metadata?: Record<string, any>;
  }): Promise<{
    paymentLink: string;
    transactionRef: string;
    flutterwaveRef: string;
  }> {
    try {
      const txRef = `MISS_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      const payload: FlutterwavePaymentRequest = {
        amount: params.amount,
        currency: params.currency || 'NGN',
        customer: params.customer,
        tx_ref: txRef,
        redirect_url: `${process.env.BASE_URL}/payment/callback`,
        payment_options: 'card,banktransfer,ussd,mobilemoney',
        customizations: {
          title: 'MISS Legal AI',
          description: params.description,
          logo: 'https://miss-legal.odia.ltd/logo.png',
        },
        meta: {
          ...params.metadata,
          subscription_tier: params.subscriptionTier,
          subscription_duration: params.subscriptionDuration,
          service: 'miss_legal_ai',
        },
      };

      const response = await this.client.post<FlutterwavePaymentResponse>('/payments', payload);

      if (response.data.status !== 'success') {
        throw new Error(`Payment initialization failed: ${response.data.message}`);
      }

      paymentLogger.info('Payment initialized successfully', {
        txRef,
        amount: params.amount,
        customer: params.customer.email,
        subscriptionTier: params.subscriptionTier,
      });

      return {
        paymentLink: response.data.data.link,
        transactionRef: txRef,
        flutterwaveRef: response.data.data.id,
      };
    } catch (error) {
      logger.error('Failed to initialize payment', { error, params });
      throw new Error('Payment initialization failed');
    }
  }

  /**
   * Verify payment transaction
   */
  static async verifyPayment(transactionId: string): Promise<{
    status: PaymentStatus;
    amount: number;
    currency: string;
    customer: any;
    metadata: any;
    flutterwaveData: any;
  }> {
    try {
      const response = await this.client.get<FlutterwaveVerificationResponse>(`/transactions/${transactionId}/verify`);

      if (response.data.status !== 'success') {
        throw new Error(`Payment verification failed: ${response.data.message}`);
      }

      const data = response.data.data;
      const status = this.mapFlutterwaveStatus(data.status);

      paymentLogger.info('Payment verified', {
        transactionId,
        status: data.status,
        amount: data.amount,
        customer: data.customer.email,
      });

      return {
        status,
        amount: data.amount,
        currency: data.currency,
        customer: data.customer,
        metadata: {
          flw_ref: data.flw_ref,
          tx_ref: data.tx_ref,
          payment_type: data.payment_type,
          processor_response: data.processor_response,
        },
        flutterwaveData: data,
      };
    } catch (error) {
      logger.error('Failed to verify payment', { error, transactionId });
      throw new Error('Payment verification failed');
    }
  }

  /**
   * Get subscription plan details
   */
  static getSubscriptionPlan(tier: SubscriptionTier, duration: 'monthly' | 'quarterly' | 'yearly') {
    const plan = subscriptionPlans[tier]?.[duration];
    if (!plan) {
      throw new Error(`Invalid subscription plan: ${tier} ${duration}`);
    }
    return plan;
  }

  /**
   * Get all available subscription plans
   */
  static getAllSubscriptionPlans() {
    return subscriptionPlans;
  }

  /**
   * Calculate subscription pricing with discounts
   */
  static calculateSubscriptionPrice(
    tier: SubscriptionTier,
    duration: 'monthly' | 'quarterly' | 'yearly'
  ): {
    amount: number;
    originalAmount: number;
    discount: number;
    duration: number;
    savings: number;
  } {
    const plan = this.getSubscriptionPlan(tier, duration);
    const monthlyPlan = subscriptionPlans[tier].monthly;
    
    const originalAmount = monthlyPlan.amount * (duration === 'monthly' ? 1 : duration === 'quarterly' ? 3 : 12);
    const discount = originalAmount - plan.amount;
    const discountPercentage = (discount / originalAmount) * 100;

    return {
      amount: plan.amount,
      originalAmount,
      discount: Math.round(discountPercentage),
      duration: plan.duration,
      savings: discount,
    };
  }

  /**
   * Refund a payment
   */
  static async refundPayment(
    transactionId: string,
    amount?: number,
    reason?: string
  ): Promise<{
    status: string;
    refundId: string;
    amount: number;
  }> {
    try {
      const payload = {
        amount,
        comments: reason || 'Refund requested by user',
      };

      const response = await this.client.post(`/transactions/${transactionId}/refund`, payload);

      if (response.data.status !== 'success') {
        throw new Error(`Refund failed: ${response.data.message}`);
      }

      paymentLogger.info('Payment refunded', {
        transactionId,
        refundId: response.data.data.id,
        amount: response.data.data.amount,
      });

      return {
        status: response.data.data.status,
        refundId: response.data.data.id,
        amount: response.data.data.amount,
      };
    } catch (error) {
      logger.error('Failed to refund payment', { error, transactionId });
      throw new Error('Payment refund failed');
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', this.WEBHOOK_SECRET)
        .update(payload, 'utf8')
        .digest('hex');

      return hash === signature;
    } catch (error) {
      logger.error('Failed to verify webhook signature', { error });
      return false;
    }
  }

  /**
   * Process webhook event
   */
  static async processWebhookEvent(event: FlutterwaveWebhookEvent): Promise<{
    success: boolean;
    action: string;
    details?: any;
  }> {
    try {
      const { event: eventType, data } = event;

      paymentLogger.info('Processing webhook event', {
        eventType,
        txRef: data.tx_ref,
        status: data.status,
        amount: data.amount,
      });

      switch (eventType) {
        case 'charge.completed':
          return await this.handleChargeCompleted(data);
        
        case 'charge.failed':
          return await this.handleChargeFailed(data);
        
        case 'refund.completed':
          return await this.handleRefundCompleted(data);
        
        default:
          logger.warn('Unhandled webhook event', { eventType });
          return { success: true, action: 'ignored' };
      }
    } catch (error) {
      logger.error('Failed to process webhook event', { error, event });
      return { success: false, action: 'error', details: error };
    }
  }

  /**
   * Get payment statistics
   */
  static async getPaymentStatistics(startDate: Date, endDate: Date): Promise<{
    totalAmount: number;
    totalTransactions: number;
    successfulTransactions: number;
    failedTransactions: number;
    subscriptionRevenue: number;
    oneTimeRevenue: number;
  }> {
    try {
      const response = await this.client.get('/transactions', {
        params: {
          from: startDate.toISOString().split('T')[0],
          to: endDate.toISOString().split('T')[0],
          status: 'successful',
        },
      });

      const transactions = response.data.data;
      
      const stats = transactions.reduce((acc: any, tx: any) => {
        acc.totalAmount += tx.amount;
        acc.totalTransactions += 1;
        
        if (tx.status === 'successful') {
          acc.successfulTransactions += 1;
          
          // Check if it's a subscription payment
          if (tx.meta?.subscription_tier) {
            acc.subscriptionRevenue += tx.amount;
          } else {
            acc.oneTimeRevenue += tx.amount;
          }
        } else {
          acc.failedTransactions += 1;
        }
        
        return acc;
      }, {
        totalAmount: 0,
        totalTransactions: 0,
        successfulTransactions: 0,
        failedTransactions: 0,
        subscriptionRevenue: 0,
        oneTimeRevenue: 0,
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get payment statistics', { error });
      throw new Error('Failed to retrieve payment statistics');
    }
  }

  // Private helper methods
  private static mapFlutterwaveStatus(flutterwaveStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'successful': 'completed',
      'failed': 'failed',
      'cancelled': 'cancelled',
      'pending': 'pending',
    };

    return statusMap[flutterwaveStatus] || 'failed';
  }

  private static async handleChargeCompleted(data: any): Promise<any> {
    // This would typically update the payment record in the database
    // and activate the user's subscription
    paymentLogger.info('Charge completed', {
      txRef: data.tx_ref,
      amount: data.amount,
      customer: data.customer.email,
    });

    return {
      success: true,
      action: 'charge_completed',
      details: {
        txRef: data.tx_ref,
        amount: data.amount,
        status: 'completed',
      },
    };
  }

  private static async handleChargeFailed(data: any): Promise<any> {
    paymentLogger.warn('Charge failed', {
      txRef: data.tx_ref,
      amount: data.amount,
      customer: data.customer.email,
      reason: data.processor_response,
    });

    return {
      success: true,
      action: 'charge_failed',
      details: {
        txRef: data.tx_ref,
        amount: data.amount,
        status: 'failed',
        reason: data.processor_response,
      },
    };
  }

  private static async handleRefundCompleted(data: any): Promise<any> {
    paymentLogger.info('Refund completed', {
      txRef: data.tx_ref,
      amount: data.amount,
    });

    return {
      success: true,
      action: 'refund_completed',
      details: {
        txRef: data.tx_ref,
        amount: data.amount,
        status: 'refunded',
      },
    };
  }

  /**
   * Generate payment receipt data
   */
  static generateReceiptData(payment: any, customer: any): {
    receiptNumber: string;
    paymentDate: string;
    customerInfo: any;
    itemDetails: any;
    totalAmount: number;
    currency: string;
  } {
    const receiptNumber = `MISS-${payment.id}-${Date.now()}`;
    
    return {
      receiptNumber,
      paymentDate: payment.created_at,
      customerInfo: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone_number,
      },
      itemDetails: {
        description: payment.narration,
        subscriptionTier: payment.meta?.subscription_tier,
        subscriptionDuration: payment.meta?.subscription_duration,
      },
      totalAmount: payment.amount,
      currency: payment.currency,
    };
  }
}

export default FlutterwaveService;
