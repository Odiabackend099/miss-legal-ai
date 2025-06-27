// Emergency Routes for MISS Legal AI
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticateJWT } from '@/middleware/auth';
import { emergencyRateLimit } from '@/middleware/rateLimit';
import { WhatsAppService } from '@/integrations/whatsapp/client';
import { db } from '@/integrations/supabase/client';
import { ApiResponse, User, EmergencyType } from '@/types';
import { logger, emergencyLogger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const emergencyRoutes = new Hono();

// Dispatch emergency
emergencyRoutes.post(
  '/dispatch',
  authenticateJWT,
  emergencyRateLimit,
  zValidator('json', z.object({
    emergency_type: z.enum(['medical', 'security', 'legal', 'fire', 'accident', 'domestic_violence']),
    confidence_score: z.number().min(0).max(1),
    location: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
      address: z.string().min(1),
      accuracy: z.number().positive().optional(),
    }).optional(),
    transcript: z.string().optional(),
    detected_keywords: z.array(z.string()).default([]),
    context_data: z.record(z.any()).optional(),
    session_id: z.string().uuid().optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const emergencyData = c.req.valid('json');

      emergencyLogger.error('Emergency dispatch initiated', {
        userId: user.id,
        emergencyType: emergencyData.emergency_type,
        confidence: emergencyData.confidence_score,
        location: emergencyData.location?.address,
      });

      // Create emergency record
      const emergency = await db.createEmergency({
        id: uuidv4(),
        user_id: user.id,
        session_id: emergencyData.session_id,
        emergency_type: emergencyData.emergency_type,
        confidence_score: emergencyData.confidence_score,
        status: 'active',
        location: emergencyData.location,
        transcript: emergencyData.transcript,
        detected_keywords: emergencyData.detected_keywords,
        context_data: emergencyData.context_data,
        response_actions: [],
        notified_contacts: [],
        emergency_services_notified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Notify emergency contacts if available
      const emergencyContacts = user.emergency_contacts || [];
      let notificationResults = [];

      if (emergencyContacts.length > 0) {
        notificationResults = await WhatsAppService.sendEmergencyNotification(
          emergency,
          user,
          emergencyContacts
        );

        // Update emergency with notification results
        await db.updateEmergency(emergency.id, {
          notified_contacts: notificationResults.map(result => ({
            contact_id: uuidv4(),
            name: result.contact.name,
            phone: result.contact.phone,
            notification_method: 'whatsapp',
            notified_at: new Date().toISOString(),
            delivery_status: result.success ? 'sent' : 'failed',
          })),
          response_actions: [
            {
              action_type: 'emergency_contacts_notified',
              target: 'whatsapp',
              executed_at: new Date().toISOString(),
              success: notificationResults.some(r => r.success),
              response_data: { results: notificationResults },
            },
          ],
        });
      }

      // Log emergency dispatch
      await db.createAuditLog({
        user_id: user.id,
        action: 'EMERGENCY_DISPATCHED',
        resource_type: 'emergencies',
        resource_id: emergency.id,
        new_values: {
          emergency_type: emergencyData.emergency_type,
          confidence_score: emergencyData.confidence_score,
          contacts_notified: emergencyContacts.length,
        },
        success: true,
        ndpr_relevant: true,
        retention_date: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      });

      emergencyLogger.error('Emergency dispatch completed', {
        emergencyId: emergency.id,
        userId: user.id,
        contactsNotified: emergencyContacts.length,
        successfulNotifications: notificationResults.filter(r => r.success).length,
      });

      return c.json({
        success: true,
        data: {
          emergency_id: emergency.id,
          status: 'active',
          emergency_type: emergency.emergency_type,
          confidence_score: emergency.confidence_score,
          contacts_notified: emergencyContacts.length,
          successful_notifications: notificationResults.filter(r => r.success).length,
          emergency_numbers: ['199', '123'], // Nigerian emergency numbers
          response_actions: [
            emergencyContacts.length > 0 ? 'contacts_notified' : 'no_contacts_available',
            'emergency_logged',
          ],
        },
        message: 'Emergency response initiated successfully',
      } as ApiResponse, 201);
    } catch (error) {
      emergencyLogger.error('Emergency dispatch failed', {
        userId: c.get('user')?.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return c.json({
        success: false,
        error: {
          code: 'EMERGENCY_DISPATCH_FAILED',
          message: 'Failed to dispatch emergency response',
          emergency_numbers: ['199', '123'],
        },
      } as ApiResponse, 500);
    }
  }
);

// Get emergency status
emergencyRoutes.get(
  '/status/:id',
  authenticateJWT,
  zValidator('param', z.object({
    id: z.string().uuid(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { id } = c.req.valid('param');

      // Get emergency record
      const { data: emergency } = await db.client
        .from('emergencies')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!emergency) {
        return c.json({
          success: false,
          error: {
            code: 'EMERGENCY_NOT_FOUND',
            message: 'Emergency record not found',
          },
        } as ApiResponse, 404);
      }

      return c.json({
        success: true,
        data: {
          emergency: {
            id: emergency.id,
            emergency_type: emergency.emergency_type,
            status: emergency.status,
            confidence_score: emergency.confidence_score,
            location: emergency.location,
            transcript: emergency.transcript,
            detected_keywords: emergency.detected_keywords,
            response_actions: emergency.response_actions,
            notified_contacts: emergency.notified_contacts,
            emergency_services_notified: emergency.emergency_services_notified,
            created_at: emergency.created_at,
            updated_at: emergency.updated_at,
            resolved_at: emergency.resolved_at,
          },
        },
      } as ApiResponse);
    } catch (error) {
      emergencyLogger.error('Failed to get emergency status', {
        userId: c.get('user')?.id,
        emergencyId: c.req.param('id'),
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'EMERGENCY_STATUS_FETCH_FAILED',
          message: 'Failed to retrieve emergency status',
        },
      } as ApiResponse, 500);
    }
  }
);

// Update emergency status
emergencyRoutes.put(
  '/status/:id',
  authenticateJWT,
  zValidator('param', z.object({
    id: z.string().uuid(),
  })),
  zValidator('json', z.object({
    status: z.enum(['active', 'responding', 'resolved', 'false_alarm']),
    resolution_notes: z.string().optional(),
    emergency_services_response: z.string().optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { id } = c.req.valid('param');
      const { status, resolution_notes, emergency_services_response } = c.req.valid('json');

      // Check if emergency exists and belongs to user
      const { data: existingEmergency } = await db.client
        .from('emergencies')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!existingEmergency) {
        return c.json({
          success: false,
          error: {
            code: 'EMERGENCY_NOT_FOUND',
            message: 'Emergency record not found',
          },
        } as ApiResponse, 404);
      }

      // Update emergency status
      const updates: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'resolved' || status === 'false_alarm') {
        updates.resolved_at = new Date().toISOString();
      }

      if (resolution_notes) {
        updates.resolution_notes = resolution_notes;
      }

      if (emergency_services_response) {
        updates.emergency_services_response = emergency_services_response;
        updates.emergency_services_notified = true;
      }

      await db.updateEmergency(id, updates);

      // Send follow-up notifications to contacts if emergency is resolved
      if ((status === 'resolved' || status === 'false_alarm') && existingEmergency.notified_contacts) {
        const contacts = existingEmergency.notified_contacts;
        for (const contact of contacts) {
          await WhatsAppService.sendEmergencyFollowUp(
            contact.phone,
            id,
            status,
            user.preferred_language
          );
        }
      }

      emergencyLogger.info('Emergency status updated', {
        emergencyId: id,
        userId: user.id,
        oldStatus: existingEmergency.status,
        newStatus: status,
      });

      return c.json({
        success: true,
        data: {
          emergency_id: id,
          status,
          resolved_at: updates.resolved_at,
        },
        message: 'Emergency status updated successfully',
      } as ApiResponse);
    } catch (error) {
      emergencyLogger.error('Failed to update emergency status', {
        userId: c.get('user')?.id,
        emergencyId: c.req.param('id'),
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'EMERGENCY_UPDATE_FAILED',
          message: 'Failed to update emergency status',
        },
      } as ApiResponse, 500);
    }
  }
);

// Get user's emergency contacts
emergencyRoutes.get('/contacts', authenticateJWT, async (c) => {
  try {
    const user = c.get('user') as User;

    return c.json({
      success: true,
      data: {
        emergency_contacts: user.emergency_contacts || [],
      },
    } as ApiResponse);
  } catch (error) {
    return c.json({
      success: false,
      error: {
        code: 'CONTACTS_FETCH_FAILED',
        message: 'Failed to retrieve emergency contacts',
      },
    } as ApiResponse, 500);
  }
});

// Update emergency contacts
emergencyRoutes.put(
  '/contacts',
  authenticateJWT,
  zValidator('json', z.object({
    emergency_contacts: z.array(z.object({
      name: z.string().min(1).max(100),
      phone: z.string().regex(/^(\+234|234|0)?[789][01]\d{8}$/),
      relationship: z.string().min(1).max(50),
    })).max(5), // Maximum 5 emergency contacts
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { emergency_contacts } = c.req.valid('json');

      // Normalize phone numbers
      const normalizedContacts = emergency_contacts.map(contact => ({
        ...contact,
        phone: contact.phone.startsWith('+234') ? contact.phone :
               contact.phone.startsWith('234') ? `+${contact.phone}` :
               contact.phone.startsWith('0') ? `+234${contact.phone.substring(1)}` :
               `+234${contact.phone}`,
      }));

      // Update user's emergency contacts
      await db.updateUser(user.id, {
        emergency_contacts: normalizedContacts,
        updated_at: new Date().toISOString(),
      });

      // Log contact update
      await db.createAuditLog({
        user_id: user.id,
        action: 'EMERGENCY_CONTACTS_UPDATED',
        resource_type: 'users',
        resource_id: user.id,
        old_values: { emergency_contacts: user.emergency_contacts },
        new_values: { emergency_contacts: normalizedContacts },
        success: true,
        ndpr_relevant: true,
        retention_date: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      });

      emergencyLogger.info('Emergency contacts updated', {
        userId: user.id,
        contactCount: normalizedContacts.length,
      });

      return c.json({
        success: true,
        data: {
          emergency_contacts: normalizedContacts,
        },
        message: 'Emergency contacts updated successfully',
      } as ApiResponse);
    } catch (error) {
      emergencyLogger.error('Failed to update emergency contacts', {
        userId: c.get('user')?.id,
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'CONTACTS_UPDATE_FAILED',
          message: 'Failed to update emergency contacts',
        },
      } as ApiResponse, 500);
    }
  }
);

// Get user's emergency history
emergencyRoutes.get(
  '/history',
  authenticateJWT,
  zValidator('query', z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(50)).default('10'),
    status: z.enum(['active', 'responding', 'resolved', 'false_alarm']).optional(),
    type: z.enum(['medical', 'security', 'legal', 'fire', 'accident', 'domestic_violence']).optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { page, limit, status, type } = c.req.valid('query');

      const offset = (page - 1) * limit;

      // Build query
      let query = db.client
        .from('emergencies')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      if (type) {
        query = query.eq('emergency_type', type);
      }

      const { data: emergencies, count } = await query;

      return c.json({
        success: true,
        data: {
          emergencies: emergencies?.map(emergency => ({
            id: emergency.id,
            emergency_type: emergency.emergency_type,
            status: emergency.status,
            confidence_score: emergency.confidence_score,
            location: emergency.location,
            created_at: emergency.created_at,
            resolved_at: emergency.resolved_at,
            notified_contacts_count: emergency.notified_contacts?.length || 0,
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
      emergencyLogger.error('Failed to retrieve emergency history', {
        userId: c.get('user')?.id,
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'HISTORY_FETCH_FAILED',
          message: 'Failed to retrieve emergency history',
        },
      } as ApiResponse, 500);
    }
  }
);

export default emergencyRoutes;
