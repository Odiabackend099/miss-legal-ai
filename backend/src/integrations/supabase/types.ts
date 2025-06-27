// Supabase Database Types for MISS Legal AI
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          phone: string | null
          full_name: string
          preferred_language: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'
          subscription_tier: 'free' | 'basic' | 'professional' | 'enterprise'
          ndpr_consent: boolean
          ndpr_consent_date: string | null
          ndpr_consent_expiry: string | null
          data_retention_preference: number
          marketing_consent: boolean
          is_active: boolean
          email_verified: boolean
          phone_verified: boolean
          created_at: string
          updated_at: string
          last_login: string | null
          emergency_contacts: Json
          default_location: Json | null
        }
        Insert: {
          id?: string
          email: string
          phone?: string | null
          full_name: string
          preferred_language?: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'
          subscription_tier?: 'free' | 'basic' | 'professional' | 'enterprise'
          ndpr_consent?: boolean
          ndpr_consent_date?: string | null
          ndpr_consent_expiry?: string | null
          data_retention_preference?: number
          marketing_consent?: boolean
          is_active?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
          emergency_contacts?: Json
          default_location?: Json | null
        }
        Update: {
          id?: string
          email?: string
          phone?: string | null
          full_name?: string
          preferred_language?: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'
          subscription_tier?: 'free' | 'basic' | 'professional' | 'enterprise'
          ndpr_consent?: boolean
          ndpr_consent_date?: string | null
          ndpr_consent_expiry?: string | null
          data_retention_preference?: number
          marketing_consent?: boolean
          is_active?: boolean
          email_verified?: boolean
          phone_verified?: boolean
          created_at?: string
          updated_at?: string
          last_login?: string | null
          emergency_contacts?: Json
          default_location?: Json | null
        }
        Relationships: []
      }
      user_auth_metadata: {
        Row: {
          user_id: string
          auth_provider: string
          auth_provider_id: string | null
          password_hash: string | null
          two_factor_enabled: boolean
          two_factor_secret: string | null
          password_reset_token: string | null
          password_reset_expires: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          auth_provider?: string
          auth_provider_id?: string | null
          password_hash?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          auth_provider?: string
          auth_provider_id?: string | null
          password_hash?: string | null
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          password_reset_token?: string | null
          password_reset_expires?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_auth_metadata_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      document_templates: {
        Row: {
          id: string
          template_name: string
          document_type: 'tenancy_agreement' | 'affidavit' | 'power_of_attorney'
          template_version: string
          language: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'
          template_schema: Json
          template_content: string
          required_fields: Json
          compliance_requirements: Json | null
          stamp_duty_required: boolean
          notarization_required: boolean
          is_active: boolean
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_name: string
          document_type: 'tenancy_agreement' | 'affidavit' | 'power_of_attorney'
          template_version: string
          language: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'
          template_schema: Json
          template_content: string
          required_fields: Json
          compliance_requirements?: Json | null
          stamp_duty_required?: boolean
          notarization_required?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_name?: string
          document_type?: 'tenancy_agreement' | 'affidavit' | 'power_of_attorney'
          template_version?: string
          language?: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'
          template_schema?: Json
          template_content?: string
          required_fields?: Json
          compliance_requirements?: Json | null
          stamp_duty_required?: boolean
          notarization_required?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_templates_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      legal_documents: {
        Row: {
          id: string
          user_id: string
          template_id: string | null
          document_type: 'tenancy_agreement' | 'affidavit' | 'power_of_attorney'
          title: string
          language: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'
          document_data: Json
          generated_content: string | null
          compliance_checks: Json | null
          legal_warnings: Json
          requires_review: boolean
          status: 'draft' | 'completed' | 'signed' | 'archived'
          signature_hash: string | null
          signed_by: string | null
          signed_at: string | null
          witness_signature: string | null
          notary_signature: string | null
          ndpr_compliant: boolean
          auto_delete_at: string | null
          generated_at: string
          last_modified: string
          attachments: Json
        }
        Insert: {
          id?: string
          user_id: string
          template_id?: string | null
          document_type: 'tenancy_agreement' | 'affidavit' | 'power_of_attorney'
          title: string
          language: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'
          document_data: Json
          generated_content?: string | null
          compliance_checks?: Json | null
          legal_warnings?: Json
          requires_review?: boolean
          status?: 'draft' | 'completed' | 'signed' | 'archived'
          signature_hash?: string | null
          signed_by?: string | null
          signed_at?: string | null
          witness_signature?: string | null
          notary_signature?: string | null
          ndpr_compliant?: boolean
          auto_delete_at?: string | null
          generated_at?: string
          last_modified?: string
          attachments?: Json
        }
        Update: {
          id?: string
          user_id?: string
          template_id?: string | null
          document_type?: 'tenancy_agreement' | 'affidavit' | 'power_of_attorney'
          title?: string
          language?: 'english' | 'pidgin' | 'yoruba' | 'hausa' | 'igbo'
          document_data?: Json
          generated_content?: string | null
          compliance_checks?: Json | null
          legal_warnings?: Json
          requires_review?: boolean
          status?: 'draft' | 'completed' | 'signed' | 'archived'
          signature_hash?: string | null
          signed_by?: string | null
          signed_at?: string | null
          witness_signature?: string | null
          notary_signature?: string | null
          ndpr_compliant?: boolean
          auto_delete_at?: string | null
          generated_at?: string
          last_modified?: string
          attachments?: Json
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legal_documents_template_id_fkey"
            columns: ["template_id"]
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          }
        ]
      }
      voice_sessions: {
        Row: {
          id: string
          user_id: string
          session_type: 'general' | 'document_creation' | 'emergency' | 'consultation'
          session_start: string
          session_end: string | null
          duration_seconds: number | null
          language_detected: string | null
          language_confidence: number | null
          language_switches: Json
          intent_classification: string | null
          intent_confidence: number | null
          conversation_summary: string | null
          audio_quality_score: number | null
          transcription_accuracy: number | null
          user_satisfaction: number | null
          emergency_detected: boolean
          emergency_confidence: number | null
          emergency_type: string | null
          audio_retention_days: number
          auto_delete_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_type?: 'general' | 'document_creation' | 'emergency' | 'consultation'
          session_start?: string
          session_end?: string | null
          duration_seconds?: number | null
          language_detected?: string | null
          language_confidence?: number | null
          language_switches?: Json
          intent_classification?: string | null
          intent_confidence?: number | null
          conversation_summary?: string | null
          audio_quality_score?: number | null
          transcription_accuracy?: number | null
          user_satisfaction?: number | null
          emergency_detected?: boolean
          emergency_confidence?: number | null
          emergency_type?: string | null
          audio_retention_days?: number
          auto_delete_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_type?: 'general' | 'document_creation' | 'emergency' | 'consultation'
          session_start?: string
          session_end?: string | null
          duration_seconds?: number | null
          language_detected?: string | null
          language_confidence?: number | null
          language_switches?: Json
          intent_classification?: string | null
          intent_confidence?: number | null
          conversation_summary?: string | null
          audio_quality_score?: number | null
          transcription_accuracy?: number | null
          user_satisfaction?: number | null
          emergency_detected?: boolean
          emergency_confidence?: number | null
          emergency_type?: string | null
          audio_retention_days?: number
          auto_delete_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_sessions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      voice_conversations: {
        Row: {
          id: string
          session_id: string
          turn_number: number
          speaker: 'user' | 'assistant'
          audio_url: string | null
          audio_duration_ms: number | null
          audio_format: string | null
          transcript: string | null
          transcript_confidence: number | null
          language_used: string | null
          intent: string | null
          entities: Json | null
          sentiment: string | null
          response_generated: string | null
          processing_time_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          turn_number: number
          speaker: 'user' | 'assistant'
          audio_url?: string | null
          audio_duration_ms?: number | null
          audio_format?: string | null
          transcript?: string | null
          transcript_confidence?: number | null
          language_used?: string | null
          intent?: string | null
          entities?: Json | null
          sentiment?: string | null
          response_generated?: string | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          turn_number?: number
          speaker?: 'user' | 'assistant'
          audio_url?: string | null
          audio_duration_ms?: number | null
          audio_format?: string | null
          transcript?: string | null
          transcript_confidence?: number | null
          language_used?: string | null
          intent?: string | null
          entities?: Json | null
          sentiment?: string | null
          response_generated?: string | null
          processing_time_ms?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_conversations_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "voice_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      emergencies: {
        Row: {
          id: string
          user_id: string
          session_id: string | null
          emergency_type: 'medical' | 'security' | 'legal' | 'fire' | 'accident' | 'domestic_violence'
          status: 'active' | 'responding' | 'resolved' | 'false_alarm'
          confidence_score: number
          location: Json | null
          audio_evidence_url: string | null
          transcript: string | null
          detected_keywords: Json
          context_data: Json | null
          response_actions: Json
          notified_contacts: Json
          emergency_services_notified: boolean
          emergency_services_response: string | null
          resolved_at: string | null
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id?: string | null
          emergency_type: 'medical' | 'security' | 'legal' | 'fire' | 'accident' | 'domestic_violence'
          status?: 'active' | 'responding' | 'resolved' | 'false_alarm'
          confidence_score: number
          location?: Json | null
          audio_evidence_url?: string | null
          transcript?: string | null
          detected_keywords?: Json
          context_data?: Json | null
          response_actions?: Json
          notified_contacts?: Json
          emergency_services_notified?: boolean
          emergency_services_response?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string | null
          emergency_type?: 'medical' | 'security' | 'legal' | 'fire' | 'accident' | 'domestic_violence'
          status?: 'active' | 'responding' | 'resolved' | 'false_alarm'
          confidence_score?: number
          location?: Json | null
          audio_evidence_url?: string | null
          transcript?: string | null
          detected_keywords?: Json
          context_data?: Json | null
          response_actions?: Json
          notified_contacts?: Json
          emergency_services_notified?: boolean
          emergency_services_response?: string | null
          resolved_at?: string | null
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emergencies_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergencies_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "voice_sessions"
            referencedColumns: ["id"]
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          transaction_id: string
          provider: 'flutterwave' | 'paystack' | 'bank_transfer'
          provider_transaction_id: string
          amount: number
          currency: string
          description: string
          status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
          payment_method: string
          subscription_tier: string | null
          subscription_duration_days: number | null
          provider_response: Json | null
          webhook_data: Json | null
          processed_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transaction_id: string
          provider: 'flutterwave' | 'paystack' | 'bank_transfer'
          provider_transaction_id: string
          amount: number
          currency?: string
          description: string
          status: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
          payment_method: string
          subscription_tier?: string | null
          subscription_duration_days?: number | null
          provider_response?: Json | null
          webhook_data?: Json | null
          processed_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transaction_id?: string
          provider?: 'flutterwave' | 'paystack' | 'bank_transfer'
          provider_transaction_id?: string
          amount?: number
          currency?: string
          description?: string
          status?: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
          payment_method?: string
          subscription_tier?: string | null
          subscription_duration_days?: number | null
          provider_response?: Json | null
          webhook_data?: Json | null
          processed_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      lawyers: {
        Row: {
          id: string
          user_id: string
          bar_number: string
          specializations: Json
          years_experience: number
          hourly_rate: number
          available_languages: Json
          status: 'available' | 'busy' | 'offline'
          rating: number | null
          total_reviews: number
          verification_status: boolean
          verification_documents: Json
          available_hours: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bar_number: string
          specializations: Json
          years_experience: number
          hourly_rate: number
          available_languages: Json
          status?: 'available' | 'busy' | 'offline'
          rating?: number | null
          total_reviews?: number
          verification_status?: boolean
          verification_documents?: Json
          available_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bar_number?: string
          specializations?: Json
          years_experience?: number
          hourly_rate?: number
          available_languages?: Json
          status?: 'available' | 'busy' | 'offline'
          rating?: number | null
          total_reviews?: number
          verification_status?: boolean
          verification_documents?: Json
          available_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyers_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      consultations: {
        Row: {
          id: string
          user_id: string
          lawyer_id: string
          session_id: string | null
          consultation_type: 'voice' | 'video' | 'chat' | 'document_review'
          scheduled_at: string
          duration_minutes: number
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          rate: number
          total_cost: number
          payment_id: string | null
          consultation_notes: string | null
          documents_shared: Json
          recording_url: string | null
          rating: number | null
          review_text: string | null
          started_at: string | null
          ended_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lawyer_id: string
          session_id?: string | null
          consultation_type: 'voice' | 'video' | 'chat' | 'document_review'
          scheduled_at: string
          duration_minutes?: number
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          rate: number
          total_cost: number
          payment_id?: string | null
          consultation_notes?: string | null
          documents_shared?: Json
          recording_url?: string | null
          rating?: number | null
          review_text?: string | null
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lawyer_id?: string
          session_id?: string | null
          consultation_type?: 'voice' | 'video' | 'chat' | 'document_review'
          scheduled_at?: string
          duration_minutes?: number
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          rate?: number
          total_cost?: number
          payment_id?: string | null
          consultation_notes?: string | null
          documents_shared?: Json
          recording_url?: string | null
          rating?: number | null
          review_text?: string | null
          started_at?: string | null
          ended_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_lawyer_id_fkey"
            columns: ["lawyer_id"]
            referencedRelation: "lawyers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_payment_id_fkey"
            columns: ["payment_id"]
            referencedRelation: "payments"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          resource_type: string
          resource_id: string | null
          old_values: Json | null
          new_values: Json | null
          ip_address: string | null
          user_agent: string | null
          session_id: string | null
          success: boolean
          error_message: string | null
          ndpr_relevant: boolean
          retention_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          resource_type: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          success?: boolean
          error_message?: string | null
          ndpr_relevant?: boolean
          retention_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          resource_type?: string
          resource_id?: string | null
          old_values?: Json | null
          new_values?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          session_id?: string | null
          success?: boolean
          error_message?: string | null
          ndpr_relevant?: boolean
          retention_date?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
