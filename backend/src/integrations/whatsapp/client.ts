// WhatsApp Business API Integration for MISS Legal AI Emergency Notifications
import axios, { AxiosInstance } from 'axios';
import { logger, emergencyLogger } from '@/utils/logger';
import { WhatsAppMessage, Emergency, User } from '@/types';

interface WhatsAppTextMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'text';
  text: {
    body: string;
  };
}

interface WhatsAppTemplateMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'template';
  template: {
    name: string;
    language: {
      code: string;
    };
    components: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };
}

interface WhatsAppLocationMessage {
  messaging_product: 'whatsapp';
  to: string;
  type: 'location';
  location: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

// Emergency message templates in different Nigerian languages
const emergencyTemplates = {
  english: {
    medical: {
      title: '🚨 MEDICAL EMERGENCY ALERT',
      body: 'Your contact {name} has a medical emergency and needs immediate assistance. They are located at {location}. Please call them immediately at {phone} or contact emergency services.',
      urgent: 'URGENT: Medical emergency involving {name}. Location: {location}. Call them now: {phone}',
    },
    security: {
      title: '⚠️ SECURITY EMERGENCY ALERT',
      body: 'Your contact {name} is experiencing a security emergency. They are at {location}. Please contact them immediately at {phone} or call the police.',
      urgent: 'URGENT: Security emergency involving {name}. Location: {location}. Call them now: {phone}',
    },
    fire: {
      title: '🔥 FIRE EMERGENCY ALERT',
      body: 'Your contact {name} has reported a fire emergency. They are at {location}. Please contact them immediately at {phone} or call the fire service.',
      urgent: 'URGENT: Fire emergency involving {name}. Location: {location}. Call them now: {phone}',
    },
    domestic_violence: {
      title: '🆘 EMERGENCY ASSISTANCE NEEDED',
      body: 'Your contact {name} needs immediate assistance. They are at {location}. Please contact them safely at {phone} or call emergency services.',
      urgent: 'URGENT: Your contact needs help. Location: {location}. Contact safely: {phone}',
    },
  },
  pidgin: {
    medical: {
      title: '🚨 MEDICAL EMERGENCY ALERT',
      body: 'Your person {name} get medical emergency and need help sharp sharp. Dem dey {location}. Call am now for {phone} or call emergency people.',
      urgent: 'URGENT: Medical emergency for {name}. Location: {location}. Call am now: {phone}',
    },
    security: {
      title: '⚠️ SECURITY EMERGENCY ALERT',
      body: 'Your person {name} get security problem. Dem dey {location}. Call am sharp for {phone} or call police.',
      urgent: 'URGENT: Security problem for {name}. Location: {location}. Call am now: {phone}',
    },
  },
  yoruba: {
    medical: {
      title: '🚨 IPAYÀ ÀÌSÀN',
      body: 'Ọ̀rẹ́ yín {name} ní àìsàn tí ó nílò ìrànlọ́wọ́ kíákíá. Ó wà ní {location}. Ẹ pé e ní {phone} tàbí pe àwọn onímọ̀ ìgbàlà.',
      urgent: 'KÍÁKÍÁ: Àìsàn {name}. Ibí: {location}. Pe é báyìí: {phone}',
    },
  },
  hausa: {
    medical: {
      title: '🚨 GAGGAWAN LAFIYA',
      body: 'Abokinku {name} yana da matsalar lafiya kuma yana bukatar taimako nan take. Yana a {location}. Ku kira shi a {phone} ko ku kira ma\'aikatan agaji.',
      urgent: 'GAGGAWA: Matsalar lafiya ga {name}. Wuri: {location}. Kira shi yanzu: {phone}',
    },
  },
  igbo: {
    medical: {
      title: '🚨 IHERE AHỤIKE',
      body: 'Enyi gị {name} nwere nsogbu ahụike ma chọọ enyemaka ozugbo. Ọ nọ na {location}. Kpọọ ya na {phone} ma ọ bụ kpọọ ndị ọrụ mberede.',
      urgent: 'NGWA NGWA: Nsogbu ahụike {name}. Ebe: {location}. Kpọọ ya ugbu a: {phone}',
    },
  },
};

export class WhatsAppService {
  private static readonly ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!;
  private static readonly PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  private static readonly VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
  private static readonly BASE_URL = `https://graph.facebook.com/v18.0/${this.PHONE_NUMBER_ID}`;

  private static client: AxiosInstance;

  static {
    if (!this.ACCESS_TOKEN || !this.PHONE_NUMBER_ID) {
      logger.warn('WhatsApp credentials not configured. Emergency notifications will be disabled.');
    }

    this.client = axios.create({
      baseURL: this.BASE_URL,
      headers: {
        'Authorization': `Bearer ${this.ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for logging
    this.client.interceptors.request.use((config) => {
      logger.debug('WhatsApp API request', {
        method: config.method,
        url: config.url,
      });
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        logger.debug('WhatsApp API response', {
          status: response.status,
          messageId: response.data?.messages?.[0]?.id,
        });
        return response;
      },
      (error) => {
        logger.error('WhatsApp API error', {
          status: error.response?.status,
          error: error.response?.data || error.message,
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Send emergency notification to emergency contacts
   */
  static async sendEmergencyNotification(
    emergency: Emergency,
    user: User,
    emergencyContacts: Array<{
      name: string;
      phone: string;
      relationship: string;
    }>
  ): Promise<Array<{
    contact: any;
    success: boolean;
    messageId?: string;
    error?: string;
  }>> {
    if (!this.ACCESS_TOKEN || !this.PHONE_NUMBER_ID) {
      logger.warn('WhatsApp not configured, skipping emergency notifications');
      return [];
    }

    const results = [];
    const language = user.preferred_language || 'english';
    const templates = emergencyTemplates[language] || emergencyTemplates.english;
    const emergencyTemplate = templates[emergency.emergency_type] || templates.medical;

    for (const contact of emergencyContacts) {
      try {
        // Clean and format phone number
        const phoneNumber = this.formatPhoneNumber(contact.phone);
        
        // Create emergency message
        const messageBody = emergencyTemplate.body
          .replace('{name}', user.full_name)
          .replace('{location}', emergency.location?.address || 'Location unknown')
          .replace('{phone}', user.phone || 'Phone not available');

        const message: WhatsAppTextMessage = {
          messaging_product: 'whatsapp',
          to: phoneNumber,
          type: 'text',
          text: {
            body: `${emergencyTemplate.title}\n\n${messageBody}`,
          },
        };

        const response = await this.client.post<WhatsAppResponse>('/messages', message);
        
        if (response.data.messages?.[0]?.id) {
          emergencyLogger.info('Emergency notification sent via WhatsApp', {
            emergencyId: emergency.id,
            contactName: contact.name,
            contactPhone: contact.phone,
            messageId: response.data.messages[0].id,
          });

          results.push({
            contact,
            success: true,
            messageId: response.data.messages[0].id,
          });

          // Send location if available
          if (emergency.location?.latitude && emergency.location?.longitude) {
            await this.sendLocation(
              phoneNumber,
              emergency.location.latitude,
              emergency.location.longitude,
              emergency.location.address
            );
          }
        } else {
          throw new Error('No message ID returned from WhatsApp API');
        }
      } catch (error) {
        emergencyLogger.error('Failed to send emergency notification via WhatsApp', {
          emergencyId: emergency.id,
          contactName: contact.name,
          contactPhone: contact.phone,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        results.push({
          contact,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Add delay between messages to avoid rate limiting
      await this.delay(1000);
    }

    return results;
  }

  /**
   * Send location message
   */
  static async sendLocation(
    phoneNumber: string,
    latitude: number,
    longitude: number,
    address?: string
  ): Promise<string | null> {
    try {
      const message: WhatsAppLocationMessage = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'location',
        location: {
          latitude,
          longitude,
          name: 'Emergency Location',
          address: address || `${latitude}, ${longitude}`,
        },
      };

      const response = await this.client.post<WhatsAppResponse>('/messages', message);
      
      if (response.data.messages?.[0]?.id) {
        logger.info('Location sent via WhatsApp', {
          phoneNumber,
          latitude,
          longitude,
          messageId: response.data.messages[0].id,
        });
        return response.data.messages[0].id;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to send location via WhatsApp', {
        phoneNumber,
        latitude,
        longitude,
        error,
      });
      return null;
    }
  }

  /**
   * Send text message
   */
  static async sendTextMessage(
    phoneNumber: string,
    message: string
  ): Promise<string | null> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const whatsappMessage: WhatsAppTextMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'text',
        text: {
          body: message,
        },
      };

      const response = await this.client.post<WhatsAppResponse>('/messages', whatsappMessage);
      
      if (response.data.messages?.[0]?.id) {
        logger.info('Text message sent via WhatsApp', {
          phoneNumber: formattedPhone,
          messageId: response.data.messages[0].id,
        });
        return response.data.messages[0].id;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to send text message via WhatsApp', {
        phoneNumber,
        error,
      });
      return null;
    }
  }

  /**
   * Send template message (for pre-approved templates)
   */
  static async sendTemplateMessage(
    phoneNumber: string,
    templateName: string,
    languageCode: string = 'en',
    parameters: string[] = []
  ): Promise<string | null> {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      const message: WhatsAppTemplateMessage = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode,
          },
          components: parameters.length > 0 ? [
            {
              type: 'body',
              parameters: parameters.map(param => ({
                type: 'text',
                text: param,
              })),
            },
          ] : [],
        },
      };

      const response = await this.client.post<WhatsAppResponse>('/messages', message);
      
      if (response.data.messages?.[0]?.id) {
        logger.info('Template message sent via WhatsApp', {
          phoneNumber: formattedPhone,
          templateName,
          messageId: response.data.messages[0].id,
        });
        return response.data.messages[0].id;
      }
      
      return null;
    } catch (error) {
      logger.error('Failed to send template message via WhatsApp', {
        phoneNumber,
        templateName,
        error,
      });
      return null;
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.VERIFY_TOKEN) {
      logger.info('WhatsApp webhook verified successfully');
      return challenge;
    }
    
    logger.warn('WhatsApp webhook verification failed', { mode, token });
    return null;
  }

  /**
   * Process incoming webhook message
   */
  static async processWebhookMessage(body: any): Promise<void> {
    try {
      if (!body.entry?.[0]?.changes?.[0]?.value?.messages) {
        return; // Not a message event
      }

      const messages = body.entry[0].changes[0].value.messages;
      const contacts = body.entry[0].changes[0].value.contacts || [];

      for (const message of messages) {
        const contact = contacts.find((c: any) => c.wa_id === message.from);
        
        logger.info('Received WhatsApp message', {
          messageId: message.id,
          from: message.from,
          type: message.type,
          timestamp: message.timestamp,
        });

        // Process different message types
        switch (message.type) {
          case 'text':
            await this.handleTextMessage(message, contact);
            break;
          case 'location':
            await this.handleLocationMessage(message, contact);
            break;
          case 'button':
            await this.handleButtonMessage(message, contact);
            break;
          default:
            logger.debug('Unhandled message type', { type: message.type });
        }
      }
    } catch (error) {
      logger.error('Failed to process WhatsApp webhook message', { error, body });
    }
  }

  /**
   * Get message delivery status
   */
  static async getMessageStatus(messageId: string): Promise<{
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
  } | null> {
    try {
      // Note: WhatsApp doesn't provide a direct API to get message status
      // Status updates come through webhooks
      logger.info('Message status requested', { messageId });
      return null;
    } catch (error) {
      logger.error('Failed to get message status', { messageId, error });
      return null;
    }
  }

  // Private helper methods
  private static formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle Nigerian phone numbers
    if (cleaned.startsWith('234')) {
      return cleaned; // Already in international format
    } else if (cleaned.startsWith('0')) {
      return '234' + cleaned.substring(1); // Remove leading 0 and add country code
    } else if (cleaned.length === 10) {
      return '234' + cleaned; // Add country code
    }
    
    return cleaned;
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async handleTextMessage(message: any, contact: any): Promise<void> {
    // This could be used for emergency response automation
    // For now, just log the message
    logger.info('Text message received', {
      messageId: message.id,
      text: message.text.body,
      from: contact?.profile?.name || message.from,
    });

    // Auto-respond to certain keywords
    const text = message.text.body.toLowerCase();
    const emergencyKeywords = ['help', 'emergency', 'urgent', 'sos'];
    
    if (emergencyKeywords.some(keyword => text.includes(keyword))) {
      await this.sendTextMessage(
        message.from,
        'We received your message. If this is an emergency, please call emergency services immediately: 199 (Nigeria Emergency) or 123 (Lagos Emergency).'
      );
    }
  }

  private static async handleLocationMessage(message: any, contact: any): Promise<void> {
    logger.info('Location message received', {
      messageId: message.id,
      latitude: message.location.latitude,
      longitude: message.location.longitude,
      from: contact?.profile?.name || message.from,
    });
  }

  private static async handleButtonMessage(message: any, contact: any): Promise<void> {
    logger.info('Button message received', {
      messageId: message.id,
      buttonText: message.button.text,
      from: contact?.profile?.name || message.from,
    });
  }

  /**
   * Send emergency follow-up message
   */
  static async sendEmergencyFollowUp(
    phoneNumber: string,
    emergencyId: string,
    status: 'resolved' | 'responding' | 'false_alarm',
    language: string = 'english'
  ): Promise<string | null> {
    const messages = {
      english: {
        resolved: 'Emergency update: The emergency situation has been resolved. Thank you for your concern.',
        responding: 'Emergency update: Emergency services are now responding to the situation.',
        false_alarm: 'Emergency update: This was a false alarm. The person is safe.',
      },
      pidgin: {
        resolved: 'Emergency update: The emergency don finish. Thank you for your concern.',
        responding: 'Emergency update: Emergency people don come help.',
        false_alarm: 'Emergency update: Na false alarm. The person dey safe.',
      },
    };

    const langMessages = messages[language as keyof typeof messages] || messages.english;
    const message = langMessages[status] || langMessages.resolved;

    return await this.sendTextMessage(phoneNumber, message);
  }
}

export default WhatsAppService;
