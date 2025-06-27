-- MISS Legal AI Database Schema Migration
-- Initial schema setup for Supabase PostgreSQL
-- NDPR Compliant with automated retention and audit logging

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================
-- CORE USER MANAGEMENT
-- ==============================================

-- Users table with NDPR compliance fields
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'english' CHECK (preferred_language IN ('english', 'pidgin', 'yoruba', 'hausa', 'igbo')),
    subscription_tier VARCHAR(20) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'professional', 'enterprise')),
    
    -- NDPR Compliance fields
    ndpr_consent BOOLEAN DEFAULT false NOT NULL,
    ndpr_consent_date TIMESTAMP,
    ndpr_consent_expiry TIMESTAMP,
    data_retention_preference INTEGER DEFAULT 180, -- days
    marketing_consent BOOLEAN DEFAULT false,
    
    -- Account status
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    
    -- Emergency contacts
    emergency_contacts JSONB DEFAULT '[]'::jsonb,
    
    -- Location for emergency services
    default_location JSONB, -- {latitude, longitude, address}
    
    CONSTRAINT valid_ndpr_consent CHECK (
        (ndpr_consent = true AND ndpr_consent_date IS NOT NULL) OR 
        (ndpr_consent = false)
    )
);

-- User authentication table (for Supabase Auth integration)
CREATE TABLE user_auth_metadata (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    auth_provider VARCHAR(50) DEFAULT 'email', -- 'email', 'phone', 'google', etc.
    auth_provider_id VARCHAR(255),
    password_hash VARCHAR(255), -- For email auth
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- LEGAL DOCUMENTS MANAGEMENT
-- ==============================================

-- Legal document templates
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_name VARCHAR(100) NOT NULL,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('tenancy_agreement', 'affidavit', 'power_of_attorney')),
    template_version VARCHAR(10) NOT NULL,
    language VARCHAR(10) NOT NULL CHECK (language IN ('english', 'pidgin', 'yoruba', 'hausa', 'igbo')),
    
    -- Template structure
    template_schema JSONB NOT NULL, -- JSON schema for validation
    template_content TEXT NOT NULL, -- Template with placeholders
    required_fields JSONB NOT NULL, -- List of required fields
    
    -- Legal compliance
    compliance_requirements JSONB, -- Nigerian legal requirements
    stamp_duty_required BOOLEAN DEFAULT false,
    notarization_required BOOLEAN DEFAULT false,
    
    -- Status and versioning
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Generated legal documents
CREATE TABLE legal_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES document_templates(id),
    
    -- Document metadata
    document_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    language VARCHAR(10) NOT NULL,
    
    -- Document content
    document_data JSONB NOT NULL, -- Structured document data
    generated_content TEXT, -- Final formatted document
    
    -- Legal compliance
    compliance_checks JSONB, -- Validation results
    legal_warnings JSONB DEFAULT '[]'::jsonb,
    requires_review BOOLEAN DEFAULT false,
    
    -- Document status
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'signed', 'archived')),
    
    -- Digital signature
    signature_hash VARCHAR(255), -- Document integrity hash
    signed_by VARCHAR(255),
    signed_at TIMESTAMP,
    witness_signature VARCHAR(255),
    notary_signature VARCHAR(255),
    
    -- NDPR compliance
    ndpr_compliant BOOLEAN DEFAULT true,
    auto_delete_at TIMESTAMP, -- Automatic deletion based on retention policy
    
    -- Timestamps
    generated_at TIMESTAMP DEFAULT NOW(),
    last_modified TIMESTAMP DEFAULT NOW(),
    
    -- File attachments
    attachments JSONB DEFAULT '[]'::jsonb -- Array of file references
);

-- ==============================================
-- VOICE PROCESSING SYSTEM
-- ==============================================

-- Voice processing sessions
CREATE TABLE voice_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Session metadata
    session_type VARCHAR(30) DEFAULT 'general' CHECK (session_type IN ('general', 'document_creation', 'emergency', 'consultation')),
    session_start TIMESTAMP DEFAULT NOW(),
    session_end TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Language processing
    language_detected VARCHAR(10),
    language_confidence DECIMAL(3,2),
    language_switches JSONB DEFAULT '[]'::jsonb, -- Track language changes
    
    -- Intent and processing
    intent_classification VARCHAR(50),
    intent_confidence DECIMAL(3,2),
    conversation_summary TEXT,
    
    -- Quality metrics
    audio_quality_score DECIMAL(3,2),
    transcription_accuracy DECIMAL(3,2),
    user_satisfaction INTEGER CHECK (user_satisfaction BETWEEN 1 AND 5),
    
    -- Emergency detection
    emergency_detected BOOLEAN DEFAULT false,
    emergency_confidence DECIMAL(3,2),
    emergency_type VARCHAR(30),
    
    -- NDPR compliance
    audio_retention_days INTEGER DEFAULT 7,
    auto_delete_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Voice conversation logs (detailed conversation tracking)
CREATE TABLE voice_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES voice_sessions(id) ON DELETE CASCADE,
    
    -- Conversation turn
    turn_number INTEGER NOT NULL,
    speaker VARCHAR(10) NOT NULL CHECK (speaker IN ('user', 'assistant')),
    
    -- Audio data
    audio_url VARCHAR(500), -- Encrypted audio file URL
    audio_duration_ms INTEGER,
    audio_format VARCHAR(10),
    
    -- Transcription
    transcript TEXT,
    transcript_confidence DECIMAL(3,2),
    language_used VARCHAR(10),
    
    -- Processing
    intent VARCHAR(50),
    entities JSONB, -- Extracted entities
    sentiment VARCHAR(20),
    
    -- Response
    response_generated TEXT,
    processing_time_ms INTEGER,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- EMERGENCY RESPONSE SYSTEM
-- ==============================================

-- Emergency incidents
CREATE TABLE emergencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES voice_sessions(id),
    
    -- Emergency classification
    emergency_type VARCHAR(30) NOT NULL CHECK (emergency_type IN ('medical', 'security', 'legal', 'fire', 'accident', 'domestic_violence')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved', 'false_alarm')),
    confidence_score DECIMAL(3,2) NOT NULL,
    
    -- Location data
    location JSONB, -- {latitude, longitude, address, accuracy}
    
    -- Evidence
    audio_evidence_url VARCHAR(500),
    transcript TEXT,
    detected_keywords JSONB DEFAULT '[]'::jsonb,
    
    -- Context
    context_data JSONB, -- Additional context from conversation
    
    -- Response actions
    response_actions JSONB DEFAULT '[]'::jsonb, -- Array of actions taken
    notified_contacts JSONB DEFAULT '[]'::jsonb, -- Contacts notified
    
    -- Emergency services
    emergency_services_notified BOOLEAN DEFAULT false,
    emergency_services_response TEXT,
    
    -- Resolution
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- PAYMENT AND SUBSCRIPTION SYSTEM
-- ==============================================

-- Payment transactions
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_id VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('flutterwave', 'paystack', 'bank_transfer')),
    provider_transaction_id VARCHAR(100) NOT NULL,
    
    -- Payment details
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method VARCHAR(50),
    
    -- Subscription details
    subscription_tier VARCHAR(20) CHECK (subscription_tier IN ('free', 'basic', 'professional', 'enterprise')),
    subscription_duration_days INTEGER,
    
    -- Provider data
    provider_response JSONB,
    webhook_data JSONB,
    
    -- Timestamps
    processed_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription history
CREATE TABLE subscription_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    payment_id UUID REFERENCES payments(id),
    
    -- Subscription details
    tier VARCHAR(20) NOT NULL,
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT true,
    
    -- Auto-renewal
    auto_renew BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- LAWYER NETWORK SYSTEM
-- ==============================================

-- Verified lawyers
CREATE TABLE lawyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Professional details
    bar_number VARCHAR(50) UNIQUE NOT NULL,
    specializations JSONB NOT NULL, -- Array of specialization areas
    years_experience INTEGER NOT NULL,
    hourly_rate DECIMAL(8,2) NOT NULL,
    
    -- Availability
    available_languages JSONB NOT NULL, -- Array of languages spoken
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'offline')),
    
    -- Rating and reviews
    rating DECIMAL(2,1) CHECK (rating BETWEEN 0 AND 5),
    total_reviews INTEGER DEFAULT 0,
    
    -- Verification
    verification_status BOOLEAN DEFAULT false,
    verification_documents JSONB DEFAULT '[]'::jsonb,
    
    -- Schedule
    available_hours JSONB, -- Weekly schedule
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Legal consultations
CREATE TABLE consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    lawyer_id UUID REFERENCES lawyers(id) ON DELETE CASCADE,
    session_id UUID REFERENCES voice_sessions(id),
    
    -- Consultation details
    consultation_type VARCHAR(20) NOT NULL CHECK (consultation_type IN ('voice', 'video', 'chat', 'document_review')),
    scheduled_at TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
    
    -- Pricing
    rate DECIMAL(8,2) NOT NULL,
    total_cost DECIMAL(8,2) NOT NULL,
    payment_id UUID REFERENCES payments(id),
    
    -- Session data
    consultation_notes TEXT,
    documents_shared JSONB DEFAULT '[]'::jsonb,
    recording_url VARCHAR(500),
    
    -- Feedback
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT,
    
    -- Timestamps
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- AUDIT AND COMPLIANCE SYSTEM
-- ==============================================

-- Comprehensive audit logging for NDPR compliance
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id), -- Can be null for system actions
    
    -- Action details
    action VARCHAR(50) NOT NULL, -- CREATE, UPDATE, DELETE, ACCESS, etc.
    resource_type VARCHAR(50) NOT NULL, -- users, documents, payments, etc.
    resource_id VARCHAR(100),
    
    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(100),
    
    -- Result
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    -- NDPR compliance
    ndpr_relevant BOOLEAN DEFAULT false,
    retention_date TIMESTAMP NOT NULL, -- When this log should be deleted
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_ndpr_consent ON users(ndpr_consent);

-- Legal documents indexes
CREATE INDEX idx_legal_documents_user_id ON legal_documents(user_id);
CREATE INDEX idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX idx_legal_documents_status ON legal_documents(status);
CREATE INDEX idx_legal_documents_auto_delete ON legal_documents(auto_delete_at);

-- Voice sessions indexes
CREATE INDEX idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_type ON voice_sessions(session_type);
CREATE INDEX idx_voice_sessions_emergency ON voice_sessions(emergency_detected);
CREATE INDEX idx_voice_sessions_auto_delete ON voice_sessions(auto_delete_at);

-- Emergency indexes
CREATE INDEX idx_emergencies_user_id ON emergencies(user_id);
CREATE INDEX idx_emergencies_status ON emergencies(status);
CREATE INDEX idx_emergencies_type ON emergencies(emergency_type);
CREATE INDEX idx_emergencies_created_at ON emergencies(created_at);

-- Payment indexes
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_provider ON payments(provider);

-- Lawyer indexes
CREATE INDEX idx_lawyers_user_id ON lawyers(user_id);
CREATE INDEX idx_lawyers_status ON lawyers(status);
CREATE INDEX idx_lawyers_verification ON lawyers(verification_status);
CREATE INDEX idx_lawyers_specializations ON lawyers USING GIN(specializations);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_retention_date ON audit_logs(retention_date);
CREATE INDEX idx_audit_logs_ndpr_relevant ON audit_logs(ndpr_relevant);

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Legal documents policies
CREATE POLICY "Users can view own documents" ON legal_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents" ON legal_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents" ON legal_documents
    FOR UPDATE USING (auth.uid() = user_id);

-- Voice sessions policies
CREATE POLICY "Users can view own voice sessions" ON voice_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own voice sessions" ON voice_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Emergency policies
CREATE POLICY "Users can view own emergencies" ON emergencies
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own emergencies" ON emergencies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Payment policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Lawyer policies (public read for discovery)
CREATE POLICY "Public can view verified lawyers" ON lawyers
    FOR SELECT USING (verification_status = true);

CREATE POLICY "Lawyers can update own profile" ON lawyers
    FOR UPDATE USING (auth.uid() = user_id);

-- Consultation policies
CREATE POLICY "Users can view own consultations" ON consultations
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = (SELECT user_id FROM lawyers WHERE id = lawyer_id));

CREATE POLICY "Users can create consultations" ON consultations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_auth_metadata_updated_at BEFORE UPDATE ON user_auth_metadata
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_legal_documents_last_modified BEFORE UPDATE ON legal_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_emergencies_updated_at BEFORE UPDATE ON emergencies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lawyers_updated_at BEFORE UPDATE ON lawyers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- ==============================================

-- Function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limits(user_id UUID, feature_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_tier TEXT;
    document_count INTEGER;
    session_count INTEGER;
BEGIN
    -- Get user's subscription tier
    SELECT subscription_tier INTO user_tier FROM users WHERE id = user_id;
    
    CASE feature_type
        WHEN 'document_creation' THEN
            SELECT COUNT(*) INTO document_count 
            FROM legal_documents 
            WHERE user_id = check_subscription_limits.user_id 
            AND created_at >= DATE_TRUNC('month', NOW());
            
            RETURN CASE user_tier
                WHEN 'free' THEN document_count < 2
                WHEN 'basic' THEN document_count < 10
                WHEN 'professional' THEN document_count < 50
                WHEN 'enterprise' THEN TRUE
                ELSE FALSE
            END;
            
        WHEN 'voice_sessions' THEN
            SELECT COUNT(*) INTO session_count 
            FROM voice_sessions 
            WHERE user_id = check_subscription_limits.user_id 
            AND created_at >= DATE_TRUNC('month', NOW());
            
            RETURN CASE user_tier
                WHEN 'free' THEN session_count < 10
                WHEN 'basic' THEN session_count < 100
                WHEN 'professional' THEN session_count < 500
                WHEN 'enterprise' THEN TRUE
                ELSE FALSE
            END;
            
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to schedule NDPR data deletion
CREATE OR REPLACE FUNCTION schedule_ndpr_deletion()
RETURNS void AS $$
DECLARE
    user_record RECORD;
    retention_date TIMESTAMP;
BEGIN
    FOR user_record IN SELECT id, data_retention_preference FROM users WHERE ndpr_consent = true
    LOOP
        retention_date := NOW() + INTERVAL '1 day' * user_record.data_retention_preference;
        
        -- Update documents
        UPDATE legal_documents 
        SET auto_delete_at = retention_date
        WHERE user_id = user_record.id AND auto_delete_at IS NULL;
        
        -- Update voice sessions
        UPDATE voice_sessions 
        SET auto_delete_at = retention_date
        WHERE user_id = user_record.id AND auto_delete_at IS NULL;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- STORAGE BUCKETS
-- ==============================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('documents', 'documents', false),
    ('voice-recordings', 'voice-recordings', false),
    ('evidence', 'evidence', false),
    ('lawyer-documents', 'lawyer-documents', false);

-- Storage policies
CREATE POLICY "Users can upload own documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload voice recordings" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own voice recordings" ON storage.objects
    FOR SELECT USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==============================================
-- INITIAL DATA SEEDING
-- ==============================================

-- Insert default document templates
INSERT INTO document_templates (
    template_name, 
    document_type, 
    template_version, 
    language, 
    template_schema, 
    template_content, 
    required_fields,
    compliance_requirements,
    stamp_duty_required,
    notarization_required
) VALUES 
(
    'Standard Tenancy Agreement',
    'tenancy_agreement',
    '1.0',
    'english',
    '{"type": "object", "properties": {"landlord": {"type": "object"}, "tenant": {"type": "object"}, "property": {"type": "object"}, "terms": {"type": "object"}}}',
    'TENANCY AGREEMENT\n\nThis agreement is made between {{landlord.name}} (Landlord) and {{tenant.name}} (Tenant) for the property located at {{property.address}}...',
    '["landlord", "tenant", "property", "rent_amount", "duration"]',
    '{"stamp_duty": "required_if_rent_above_1000", "registration": "lagos_state_required"}',
    true,
    false
),
(
    'General Affidavit',
    'affidavit',
    '1.0',
    'english',
    '{"type": "object", "properties": {"deponent": {"type": "object"}, "facts": {"type": "array"}, "purpose": {"type": "string"}}}',
    'AFFIDAVIT\n\nI, {{deponent.name}}, of {{deponent.address}}, do hereby make oath and state as follows:\n\n{{facts}}',
    '["deponent", "facts", "purpose"]',
    '{"notarization": "required", "commissioner_for_oaths": "required"}',
    false,
    true
);

-- Create initial subscription plans configuration
INSERT INTO audit_logs (action, resource_type, success, ndpr_relevant, retention_date)
VALUES ('SYSTEM_INIT', 'database', true, false, NOW() + INTERVAL '7 years');

COMMIT;
