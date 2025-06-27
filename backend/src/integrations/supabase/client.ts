// Supabase Client Configuration for MISS Legal AI
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

// Environment variables
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables');
}

// Anonymous client (for public operations)
export const supabase: SupabaseClient<Database> = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Service role client (for server-side operations with elevated privileges)
export const supabaseAdmin: SupabaseClient<Database> = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database connection for direct SQL operations
export class DatabaseService {
  private static instance: DatabaseService;
  private client: SupabaseClient<Database>;

  private constructor() {
    this.client = supabaseAdmin;
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // User operations
  async createUser(userData: any) {
    const { data, error } = await this.client
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserById(id: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserByEmail(email: string) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUser(id: string, updates: any) {
    const { data, error } = await this.client
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Legal document operations
  async createLegalDocument(documentData: any) {
    const { data, error } = await this.client
      .from('legal_documents')
      .insert(documentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUserDocuments(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await this.client
      .from('legal_documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return { documents: data, total: count };
  }

  async getDocumentById(id: string, userId: string) {
    const { data, error } = await this.client
      .from('legal_documents')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateDocument(id: string, userId: string, updates: any) {
    const { data, error } = await this.client
      .from('legal_documents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Voice session operations
  async createVoiceSession(sessionData: any) {
    const { data, error } = await this.client
      .from('voice_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getVoiceSession(id: string, userId: string) {
    const { data, error } = await this.client
      .from('voice_sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateVoiceSession(id: string, updates: any) {
    const { data, error } = await this.client
      .from('voice_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async createVoiceConversation(conversationData: any) {
    const { data, error } = await this.client
      .from('voice_conversations')
      .insert(conversationData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Emergency operations
  async createEmergency(emergencyData: any) {
    const { data, error } = await this.client
      .from('emergencies')
      .insert(emergencyData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getActiveEmergencies(userId: string) {
    const { data, error } = await this.client
      .from('emergencies')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async updateEmergency(id: string, updates: any) {
    const { data, error } = await this.client
      .from('emergencies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Payment operations
  async createPayment(paymentData: any) {
    const { data, error } = await this.client
      .from('payments')
      .insert(paymentData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getPaymentByTransactionId(transactionId: string) {
    const { data, error } = await this.client
      .from('payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .single();
    
    if (error) throw error;
    return data;
  }

  async updatePayment(id: string, updates: any) {
    const { data, error } = await this.client
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Lawyer operations
  async getAvailableLawyers(specialization?: string, language?: string) {
    let query = this.client
      .from('lawyers')
      .select(`
        *,
        users:user_id (full_name, email, phone)
      `)
      .eq('status', 'available')
      .eq('verification_status', true);
    
    if (specialization) {
      query = query.contains('specializations', [specialization]);
    }
    
    if (language) {
      query = query.contains('available_languages', [language]);
    }
    
    const { data, error } = await query.order('rating', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  async createConsultation(consultationData: any) {
    const { data, error } = await this.client
      .from('consultations')
      .insert(consultationData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Audit logging
  async createAuditLog(logData: any) {
    const { data, error } = await this.client
      .from('audit_logs')
      .insert(logData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // NDPR compliance operations
  async scheduleDataDeletion(userId: string, retentionDays: number) {
    const deleteDate = new Date();
    deleteDate.setDate(deleteDate.getDate() + retentionDays);
    
    // Schedule deletion for various data types
    const promises = [
      // Update documents with auto-delete date
      this.client
        .from('legal_documents')
        .update({ auto_delete_at: deleteDate.toISOString() })
        .eq('user_id', userId),
      
      // Update voice sessions with auto-delete date
      this.client
        .from('voice_sessions')
        .update({ auto_delete_at: deleteDate.toISOString() })
        .eq('user_id', userId),
    ];
    
    await Promise.all(promises);
  }

  async getExpiredData() {
    const now = new Date().toISOString();
    
    const [documents, sessions] = await Promise.all([
      this.client
        .from('legal_documents')
        .select('id, user_id')
        .lte('auto_delete_at', now),
      
      this.client
        .from('voice_sessions')
        .select('id, user_id')
        .lte('auto_delete_at', now),
    ]);
    
    return {
      documents: documents.data || [],
      sessions: sessions.data || [],
    };
  }

  // File storage operations
  async uploadFile(bucket: string, path: string, file: Buffer | File, options?: any) {
    const { data, error } = await this.client.storage
      .from(bucket)
      .upload(path, file, options);
    
    if (error) throw error;
    return data;
  }

  async getFileUrl(bucket: string, path: string) {
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  async deleteFile(bucket: string, path: string) {
    const { error } = await this.client.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  }

  // Real-time subscriptions
  subscribeToUserChanges(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`user-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }

  subscribeToEmergencies(userId: string, callback: (payload: any) => void) {
    return this.client
      .channel(`emergencies-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergencies',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  }
}

export const db = DatabaseService.getInstance();
