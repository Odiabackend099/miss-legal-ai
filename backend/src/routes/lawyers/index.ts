// Lawyer Routes for MISS Legal AI
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authenticateJWT, requireSubscription } from '@/middleware/auth';
import { db } from '@/integrations/supabase/client';
import { ApiResponse, User } from '@/types';
import { logger, lawyerLogger } from '@/utils/logger';
import { v4 as uuidv4 } from 'uuid';

const lawyersRoutes = new Hono();

// Get available lawyers
lawyersRoutes.get(
  '/available',
  authenticateJWT,
  zValidator('query', z.object({
    specialization: z.string().optional(),
    language: z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo']).optional(),
    location: z.string().optional(),
    page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(20)).default('10'),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { specialization, language, location, page, limit } = c.req.valid('query');

      // Get available lawyers
      const lawyers = await db.getAvailableLawyers(specialization, language);

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedLawyers = lawyers.slice(offset, offset + limit);

      lawyerLogger.info('Available lawyers retrieved', {
        userId: user.id,
        total: lawyers.length,
        filtered: paginatedLawyers.length,
        filters: { specialization, language, location },
      });

      return c.json({
        success: true,
        data: {
          lawyers: paginatedLawyers.map(lawyer => ({
            id: lawyer.id,
            name: lawyer.users?.full_name,
            email: lawyer.users?.email,
            bar_number: lawyer.bar_number,
            specializations: lawyer.specializations,
            years_experience: lawyer.years_experience,
            hourly_rate: lawyer.hourly_rate,
            available_languages: lawyer.available_languages,
            status: lawyer.status,
            rating: lawyer.rating,
            total_reviews: lawyer.total_reviews,
            verification_status: lawyer.verification_status,
          })),
          pagination: {
            page,
            limit,
            total: lawyers.length,
            pages: Math.ceil(lawyers.length / limit),
          },
        },
      } as ApiResponse);
    } catch (error) {
      lawyerLogger.error('Failed to retrieve available lawyers', {
        userId: c.get('user')?.id,
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'LAWYERS_FETCH_FAILED',
          message: 'Failed to retrieve available lawyers',
        },
      } as ApiResponse, 500);
    }
  }
);

// Schedule consultation
lawyersRoutes.post(
  '/schedule',
  authenticateJWT,
  requireSubscription(['basic', 'professional', 'enterprise']),
  zValidator('json', z.object({
    lawyer_id: z.string().uuid(),
    consultation_type: z.enum(['voice', 'video', 'chat', 'document_review']),
    scheduled_at: z.string().datetime(),
    duration_minutes: z.number().positive().max(180).default(30),
    description: z.string().max(500).optional(),
    documents_to_share: z.array(z.string().uuid()).default([]),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const consultationData = c.req.valid('json');

      // Get lawyer details
      const { data: lawyer } = await db.client
        .from('lawyers')
        .select('*, users:user_id(full_name, email)')
        .eq('id', consultationData.lawyer_id)
        .eq('verification_status', true)
        .single();

      if (!lawyer) {
        return c.json({
          success: false,
          error: {
            code: 'LAWYER_NOT_FOUND',
            message: 'Lawyer not found or not verified',
          },
        } as ApiResponse, 404);
      }

      // Check if lawyer is available at the requested time
      const scheduledTime = new Date(consultationData.scheduled_at);
      if (scheduledTime < new Date()) {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_SCHEDULE_TIME',
            message: 'Cannot schedule consultation in the past',
          },
        } as ApiResponse, 400);
      }

      // Calculate total cost
      const totalCost = lawyer.hourly_rate * (consultationData.duration_minutes / 60);

      // Create consultation record
      const consultation = await db.createConsultation({
        id: uuidv4(),
        user_id: user.id,
        lawyer_id: consultationData.lawyer_id,
        consultation_type: consultationData.consultation_type,
        scheduled_at: consultationData.scheduled_at,
        duration_minutes: consultationData.duration_minutes,
        status: 'scheduled',
        rate: lawyer.hourly_rate,
        total_cost: totalCost,
        consultation_notes: consultationData.description,
        documents_shared: consultationData.documents_to_share,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // Log consultation scheduling
      await db.createAuditLog({
        user_id: user.id,
        action: 'CONSULTATION_SCHEDULED',
        resource_type: 'consultations',
        resource_id: consultation.id,
        new_values: {
          lawyer_id: consultationData.lawyer_id,
          consultation_type: consultationData.consultation_type,
          scheduled_at: consultationData.scheduled_at,
          total_cost: totalCost,
        },
        success: true,
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      });

      lawyerLogger.info('Consultation scheduled successfully', {
        userId: user.id,
        consultationId: consultation.id,
        lawyerId: consultationData.lawyer_id,
        scheduledAt: consultationData.scheduled_at,
        totalCost,
      });

      return c.json({
        success: true,
        data: {
          consultation: {
            id: consultation.id,
            lawyer: {
              id: lawyer.id,
              name: lawyer.users?.full_name,
              specializations: lawyer.specializations,
              rating: lawyer.rating,
            },
            consultation_type: consultation.consultation_type,
            scheduled_at: consultation.scheduled_at,
            duration_minutes: consultation.duration_minutes,
            status: consultation.status,
            total_cost: consultation.total_cost,
            payment_required: true,
          },
        },
        message: 'Consultation scheduled successfully. Payment is required to confirm.',
      } as ApiResponse, 201);
    } catch (error) {
      lawyerLogger.error('Consultation scheduling failed', {
        userId: c.get('user')?.id,
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'CONSULTATION_SCHEDULING_FAILED',
          message: 'Failed to schedule consultation',
        },
      } as ApiResponse, 500);
    }
  }
);

// Get user consultations
lawyersRoutes.get(
  '/consultations',
  authenticateJWT,
  zValidator('query', z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
    limit: z.string().transform(Number).pipe(z.number().int().positive().max(50)).default('10'),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { page, limit, status } = c.req.valid('query');

      const offset = (page - 1) * limit;

      // Build query
      let query = db.client
        .from('consultations')
        .select(`
          *,
          lawyers:lawyer_id (
            id,
            bar_number,
            specializations,
            rating,
            users:user_id (full_name, email)
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .order('scheduled_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      const { data: consultations, count } = await query;

      return c.json({
        success: true,
        data: {
          consultations: consultations?.map(consultation => ({
            id: consultation.id,
            lawyer: {
              id: consultation.lawyers?.id,
              name: consultation.lawyers?.users?.full_name,
              bar_number: consultation.lawyers?.bar_number,
              specializations: consultation.lawyers?.specializations,
              rating: consultation.lawyers?.rating,
            },
            consultation_type: consultation.consultation_type,
            scheduled_at: consultation.scheduled_at,
            duration_minutes: consultation.duration_minutes,
            status: consultation.status,
            total_cost: consultation.total_cost,
            rating: consultation.rating,
            started_at: consultation.started_at,
            ended_at: consultation.ended_at,
            created_at: consultation.created_at,
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
      lawyerLogger.error('Failed to retrieve consultations', {
        userId: c.get('user')?.id,
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'CONSULTATIONS_FETCH_FAILED',
          message: 'Failed to retrieve consultations',
        },
      } as ApiResponse, 500);
    }
  }
);

// Get consultation details
lawyersRoutes.get(
  '/consultation/:id',
  authenticateJWT,
  zValidator('param', z.object({
    id: z.string().uuid(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { id } = c.req.valid('param');

      const { data: consultation } = await db.client
        .from('consultations')
        .select(`
          *,
          lawyers:lawyer_id (
            id,
            bar_number,
            specializations,
            years_experience,
            hourly_rate,
            rating,
            total_reviews,
            users:user_id (full_name, email, phone)
          )
        `)
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!consultation) {
        return c.json({
          success: false,
          error: {
            code: 'CONSULTATION_NOT_FOUND',
            message: 'Consultation not found',
          },
        } as ApiResponse, 404);
      }

      return c.json({
        success: true,
        data: { consultation },
      } as ApiResponse);
    } catch (error) {
      lawyerLogger.error('Failed to retrieve consultation details', {
        userId: c.get('user')?.id,
        consultationId: c.req.param('id'),
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'CONSULTATION_DETAILS_FETCH_FAILED',
          message: 'Failed to retrieve consultation details',
        },
      } as ApiResponse, 500);
    }
  }
);

// Update consultation (cancel, rate, etc.)
lawyersRoutes.put(
  '/consultation/:id',
  authenticateJWT,
  zValidator('param', z.object({
    id: z.string().uuid(),
  })),
  zValidator('json', z.object({
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    review_text: z.string().max(1000).optional(),
    cancellation_reason: z.string().max(500).optional(),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { id } = c.req.valid('param');
      const updates = c.req.valid('json');

      // Check if consultation exists and belongs to user
      const { data: existingConsultation } = await db.client
        .from('consultations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!existingConsultation) {
        return c.json({
          success: false,
          error: {
            code: 'CONSULTATION_NOT_FOUND',
            message: 'Consultation not found',
          },
        } as ApiResponse, 404);
      }

      // Validate status transitions
      if (updates.status === 'cancelled' && existingConsultation.status !== 'scheduled') {
        return c.json({
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'Can only cancel scheduled consultations',
          },
        } as ApiResponse, 400);
      }

      // Update consultation
      const updatedConsultation = await db.client
        .from('consultations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      // Log consultation update
      await db.createAuditLog({
        user_id: user.id,
        action: 'CONSULTATION_UPDATED',
        resource_type: 'consultations',
        resource_id: id,
        old_values: { status: existingConsultation.status },
        new_values: updates,
        success: true,
        ndpr_relevant: false,
        retention_date: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000), // 7 years
      });

      lawyerLogger.info('Consultation updated successfully', {
        userId: user.id,
        consultationId: id,
        updates: Object.keys(updates),
      });

      return c.json({
        success: true,
        data: { consultation: updatedConsultation.data },
        message: 'Consultation updated successfully',
      } as ApiResponse);
    } catch (error) {
      lawyerLogger.error('Consultation update failed', {
        userId: c.get('user')?.id,
        consultationId: c.req.param('id'),
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'CONSULTATION_UPDATE_FAILED',
          message: 'Failed to update consultation',
        },
      } as ApiResponse, 500);
    }
  }
);

// Search lawyers by criteria
lawyersRoutes.post(
  '/search',
  authenticateJWT,
  zValidator('json', z.object({
    query: z.string().min(1).max(100),
    filters: z.object({
      specializations: z.array(z.string()).optional(),
      languages: z.array(z.enum(['english', 'pidgin', 'yoruba', 'hausa', 'igbo'])).optional(),
      min_rating: z.number().min(0).max(5).optional(),
      max_rate: z.number().positive().optional(),
      years_experience_min: z.number().min(0).optional(),
    }).optional(),
    page: z.number().int().positive().default(1),
    limit: z.number().int().positive().max(20).default(10),
  })),
  async (c) => {
    try {
      const user = c.get('user') as User;
      const { query, filters, page, limit } = c.req.valid('json');

      // For now, return a simple search result
      // In production, implement full-text search with PostgreSQL or Elasticsearch
      const searchResults = await db.getAvailableLawyers();

      // Apply basic filtering
      let filteredResults = searchResults;

      if (filters?.specializations) {
        filteredResults = filteredResults.filter(lawyer => 
          filters.specializations!.some(spec => 
            (lawyer.specializations as string[]).includes(spec)
          )
        );
      }

      if (filters?.min_rating) {
        filteredResults = filteredResults.filter(lawyer => 
          (lawyer.rating || 0) >= filters.min_rating!
        );
      }

      if (filters?.max_rate) {
        filteredResults = filteredResults.filter(lawyer => 
          lawyer.hourly_rate <= filters.max_rate!
        );
      }

      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedResults = filteredResults.slice(offset, offset + limit);

      lawyerLogger.info('Lawyer search performed', {
        userId: user.id,
        query,
        totalResults: filteredResults.length,
        returnedResults: paginatedResults.length,
      });

      return c.json({
        success: true,
        data: {
          lawyers: paginatedResults.map(lawyer => ({
            id: lawyer.id,
            name: lawyer.users?.full_name,
            bar_number: lawyer.bar_number,
            specializations: lawyer.specializations,
            years_experience: lawyer.years_experience,
            hourly_rate: lawyer.hourly_rate,
            available_languages: lawyer.available_languages,
            rating: lawyer.rating,
            total_reviews: lawyer.total_reviews,
          })),
          pagination: {
            page,
            limit,
            total: filteredResults.length,
            pages: Math.ceil(filteredResults.length / limit),
          },
          search_query: query,
          filters_applied: filters,
        },
      } as ApiResponse);
    } catch (error) {
      lawyerLogger.error('Lawyer search failed', {
        userId: c.get('user')?.id,
        query: c.req.json.query,
        error,
      });

      return c.json({
        success: false,
        error: {
          code: 'LAWYER_SEARCH_FAILED',
          message: 'Failed to search lawyers',
        },
      } as ApiResponse, 500);
    }
  }
);

export default lawyersRoutes;
