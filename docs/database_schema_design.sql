-- MISS Legal AI Database Schema Design
-- Optimized for Supabase PostgreSQL with real-time capabilities
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
    
    -- Response generation
    response_text TEXT,
    response_audio_url VARCHAR(500),
    processing_time_ms INTEGER,
    
    -- Emergency indicators
    distress_keywords JSONB,
    emergency_score DECIMAL(3,2),
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- NDPR compliance
    auto_delete_at TIMESTAMP
);

-- ==============================================
-- EMERGENCY DETECTION SYSTEM
-- ==============================================

-- Emergency events
CREATE TABLE emergency_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES voice_sessions(id),
    
    -- Emergency classification
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('distress_call', 'help_request', 'medical_emergency', 'security_threat', 'false_alarm')),
    severity_level VARCHAR(20) DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    confidence_score DECIMAL(3,2) NOT NULL,
    
    -- Audio analysis
    audio_features JSONB, -- Mel spectrogram, MFCCs analysis results
    audio_file_url VARCHAR(500), -- Emergency audio clip
    keywords_detected JSONB,
    
    -- Location data
    location_data JSONB, -- GPS coordinates, address
    location_accuracy INTEGER, -- meters
    
    -- Response tracking
    response_triggered BOOLEAN DEFAULT false,
    response_time_ms INTEGER,
    first_responder_notified BOOLEAN DEFAULT false,
    emergency_contacts_notified JSONB DEFAULT '[]'::jsonb,
    
    -- Communication
    whatsapp_message_sent BOOLEAN DEFAULT false,
    whatsapp_message_id VARCHAR(255),
    sms_sent BOOLEAN DEFAULT false,
    sms_message_id VARCHAR(255),
    voice_call_made BOOLEAN DEFAULT false,
    voice_call_id VARCHAR(255),
    
    -- Resolution
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'false_alarm', 'escalated')),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT true,
    follow_up_completed BOOLEAN DEFAULT false,
    follow_up_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Emergency contacts
CREATE TABLE emergency_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    
    -- Contact information
    contact_name VARCHAR(255) NOT NULL,
    relationship VARCHAR(50), -- 'family', 'friend', 'colleague', 'professional'
    phone_number VARCHAR(20) NOT NULL,
    whatsapp_number VARCHAR(20),
    email VARCHAR(255),
    
    -- Contact preferences
    contact_priority INTEGER DEFAULT 1, -- Order of contact
    preferred_method VARCHAR(20) DEFAULT 'whatsapp' CHECK (preferred_method IN ('whatsapp', 'sms', 'voice_call', 'email')),
    emergency_types JSONB, -- Which emergency types to contact for
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- PAYMENT AND SUBSCRIPTION SYSTEM
-- ==============================================

-- Subscription plans
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    
    -- Pricing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('monthly', 'yearly', 'quarterly')),
    
    -- Plan features
    features JSONB NOT NULL, -- List of included features
    limits_config JSONB NOT NULL, -- Usage limits configuration
    
    -- Limits
    document_limit INTEGER DEFAULT -1, -- -1 for unlimited
    voice_minutes_limit INTEGER DEFAULT -1,
    emergency_alerts_enabled BOOLEAN DEFAULT false,
    priority_support BOOLEAN DEFAULT false,
    custom_templates BOOLEAN DEFAULT false,
    
    -- Flutterwave integration
    flutterwave_plan_id INTEGER,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id),
    
    -- Flutterwave data
    flutterwave_subscription_id VARCHAR(255),
    flutterwave_customer_id VARCHAR(255),
    
    -- Subscription details
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due', 'trialing')),
    
    -- Billing cycle
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    trial_start TIMESTAMP,
    trial_end TIMESTAMP,
    
    -- Usage tracking
    usage_stats JSONB DEFAULT '{}'::jsonb, -- Current period usage
    
    -- Payment
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id),
    
    -- Transaction details
    transaction_type VARCHAR(30) DEFAULT 'subscription' CHECK (transaction_type IN ('subscription', 'one_time', 'refund')),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN',
    
    -- Flutterwave data
    flutterwave_transaction_id VARCHAR(255) UNIQUE,
    flutterwave_reference VARCHAR(255),
    payment_method VARCHAR(20), -- 'card', 'bank_transfer', 'ussd'
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cancelled', 'refunded')),
    failure_reason TEXT,
    
    -- Timestamps
    initiated_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==============================================
-- COMPLIANCE AND AUDIT
-- ==============================================

-- NDPR audit logs for compliance tracking
CREATE TABLE ndpr_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    -- Action details
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('data_access', 'data_modification', 'data_deletion', 'consent_given', 'consent_withdrawn', 'data_export', 'data_rectification')),
    data_type VARCHAR(50) NOT NULL CHECK (data_type IN ('voice_data', 'document_data', 'personal_info', 'emergency_data', 'payment_data')),
    
    -- Legal basis
    legal_basis VARCHAR(50) NOT NULL CHECK (legal_basis IN ('consent', 'legitimate_interest', 'contract', 'legal_obligation', 'vital_interests')),
    purpose VARCHAR(255) NOT NULL,
    
    -- Data retention
    retention_period_days INTEGER,
    auto_delete_at TIMESTAMP,
    
    -- Details
    affected_records JSONB, -- IDs of affected records
    data_categories JSONB, -- Categories of data accessed/modified
    
    -- Audit trail
    performed_by VARCHAR(255), -- User or system component
    performed_by_role VARCHAR(50),
    ip_address INET,
    user_agent TEXT,
    
    -- Compliance
    dpo_notified BOOLEAN DEFAULT false,
    breach_risk_assessed BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Data retention policies
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Policy definition
    policy_name VARCHAR(100) UNIQUE NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    retention_period_days INTEGER NOT NULL,
    
    -- Conditions
    conditions JSONB, -- Conditions for applying this policy
    
    -- Actions
    deletion_method VARCHAR(20) DEFAULT 'hard_delete' CHECK (deletion_method IN ('hard_delete', 'anonymization', 'archival')),
    notification_before_days INTEGER DEFAULT 30,
    
    -- Legal basis
    legal_requirement TEXT,
    business_justification TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    approved_by VARCHAR(255), -- DPO approval
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- INTEGRATION AND EXTERNAL SERVICES
-- ==============================================

-- Integration events for external service interactions
CREATE TABLE integration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event details
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('whatsapp_sent', 'sms_sent', 'voice_call_made', 'payment_processed', 'document_generated', 'email_sent')),
    external_service VARCHAR(30) NOT NULL CHECK (external_service IN ('whatsapp', 'twilio', 'flutterwave', 'lexi_api', 'elevenlabs', 'openai')),
    
    -- Request/response data
    request_payload JSONB,
    response_payload JSONB,
    external_id VARCHAR(255), -- ID from external service
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'retrying')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Related entities
    user_id UUID REFERENCES users(id),
    session_id UUID REFERENCES voice_sessions(id),
    emergency_event_id UUID REFERENCES emergency_events(id),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    next_retry_at TIMESTAMP
);

-- API rate limiting and usage tracking
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    
    -- API details
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    
    -- Usage metrics
    tokens_used INTEGER,
    processing_time_ms INTEGER,
    response_size_bytes INTEGER,
    
    -- Status
    status_code INTEGER,
    error_type VARCHAR(50),
    
    -- Rate limiting
    rate_limit_remaining INTEGER,
    rate_limit_reset TIMESTAMP,
    
    -- Billing
    billable_units DECIMAL(10,4), -- For usage-based billing
    cost_usd DECIMAL(10,4),
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==============================================
-- PERFORMANCE INDEXES
-- ==============================================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Voice session indexes
CREATE INDEX idx_voice_sessions_user_id ON voice_sessions(user_id);
CREATE INDEX idx_voice_sessions_created_at ON voice_sessions(created_at);
CREATE INDEX idx_voice_sessions_emergency ON voice_sessions(emergency_detected);
CREATE INDEX idx_voice_sessions_language ON voice_sessions(language_detected);

-- Legal documents indexes
CREATE INDEX idx_legal_documents_user_id ON legal_documents(user_id);
CREATE INDEX idx_legal_documents_type ON legal_documents(document_type);
CREATE INDEX idx_legal_documents_status ON legal_documents(status);
CREATE INDEX idx_legal_documents_generated_at ON legal_documents(generated_at);

-- Emergency events indexes
CREATE INDEX idx_emergency_events_user_id ON emergency_events(user_id);
CREATE INDEX idx_emergency_events_created_at ON emergency_events(created_at);
CREATE INDEX idx_emergency_events_status ON emergency_events(status);
CREATE INDEX idx_emergency_events_severity ON emergency_events(severity_level);

-- Subscription indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);

-- Payment indexes
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_payment_transactions_flutterwave_id ON payment_transactions(flutterwave_transaction_id);

-- NDPR compliance indexes
CREATE INDEX idx_ndpr_audit_user_id ON ndpr_audit_logs(user_id);
CREATE INDEX idx_ndpr_audit_created_at ON ndpr_audit_logs(created_at);
CREATE INDEX idx_ndpr_audit_auto_delete ON ndpr_audit_logs(auto_delete_at);
CREATE INDEX idx_ndpr_audit_action_type ON ndpr_audit_logs(action_type);

-- Integration indexes
CREATE INDEX idx_integration_events_status ON integration_events(status);
CREATE INDEX idx_integration_events_created_at ON integration_events(created_at);
CREATE INDEX idx_integration_events_user_id ON integration_events(user_id);

-- ==============================================
-- TRIGGERS AND FUNCTIONS
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_emergency_events_updated_at BEFORE UPDATE ON emergency_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function for automatic NDPR audit logging
CREATE OR REPLACE FUNCTION log_ndpr_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ndpr_audit_logs (
        user_id,
        action_type,
        data_type,
        legal_basis,
        purpose,
        affected_records,
        performed_by
    ) VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'data_creation'
            WHEN TG_OP = 'UPDATE' THEN 'data_modification'
            WHEN TG_OP = 'DELETE' THEN 'data_deletion'
        END,
        TG_TABLE_NAME,
        'legitimate_interest',
        'System operation',
        jsonb_build_object('id', COALESCE(NEW.id, OLD.id)),
        'system'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- NDPR audit triggers for sensitive tables
CREATE TRIGGER ndpr_audit_voice_sessions AFTER INSERT OR UPDATE OR DELETE ON voice_sessions FOR EACH ROW EXECUTE FUNCTION log_ndpr_action();
CREATE TRIGGER ndpr_audit_legal_documents AFTER INSERT OR UPDATE OR DELETE ON legal_documents FOR EACH ROW EXECUTE FUNCTION log_ndpr_action();
CREATE TRIGGER ndpr_audit_emergency_events AFTER INSERT OR UPDATE OR DELETE ON emergency_events FOR EACH ROW EXECUTE FUNCTION log_ndpr_action();

-- Function for automatic data retention enforcement
CREATE OR REPLACE FUNCTION enforce_data_retention()
RETURNS void AS $$
BEGIN
    -- Delete expired voice sessions
    DELETE FROM voice_sessions 
    WHERE auto_delete_at IS NOT NULL AND auto_delete_at < NOW();
    
    -- Delete expired audit logs
    DELETE FROM ndpr_audit_logs 
    WHERE auto_delete_at IS NOT NULL AND auto_delete_at < NOW();
    
    -- Delete expired legal documents (if marked for deletion)
    DELETE FROM legal_documents 
    WHERE auto_delete_at IS NOT NULL AND auto_delete_at < NOW();
    
    -- Anonymize old emergency events (keep for statistical purposes)
    UPDATE emergency_events 
    SET 
        user_id = NULL,
        audio_features = NULL,
        location_data = NULL
    WHERE created_at < NOW() - INTERVAL '2 years' 
    AND user_id IS NOT NULL;
    
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users to only access their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view own voice sessions" ON voice_sessions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can create own voice sessions" ON voice_sessions FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own documents" ON legal_documents FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can manage own documents" ON legal_documents FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view own emergencies" ON emergency_events FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "System can create emergencies" ON emergency_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can view own payments" ON payment_transactions FOR SELECT USING (auth.uid()::text = user_id::text);

-- ==============================================
-- INITIAL DATA
-- ==============================================

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, display_name, amount, billing_interval, features, limits_config, document_limit, voice_minutes_limit, emergency_alerts_enabled) VALUES
('free', 'Free Tier', 0.00, 'monthly', 
 '["Basic voice assistance", "2 documents/month", "30 voice minutes"]',
 '{"documents": 2, "voice_minutes": 30, "emergency_alerts": false}',
 2, 30, false),

('basic', 'Basic Plan', 2500.00, 'monthly',
 '["Full voice assistance", "10 documents/month", "120 voice minutes", "Emergency alerts"]',
 '{"documents": 10, "voice_minutes": 120, "emergency_alerts": true}',
 10, 120, true),

('professional', 'Professional Plan', 7500.00, 'monthly',
 '["Advanced voice assistance", "50 documents/month", "300 voice minutes", "Emergency alerts", "Priority support"]',
 '{"documents": 50, "voice_minutes": 300, "emergency_alerts": true, "priority_support": true}',
 50, 300, true),

('enterprise', 'Enterprise Plan', 25000.00, 'monthly',
 '["Unlimited documents", "Unlimited voice minutes", "Emergency alerts", "Priority support", "Custom templates", "Dedicated support"]',
 '{"documents": -1, "voice_minutes": -1, "emergency_alerts": true, "priority_support": true, "custom_templates": true}',
 -1, -1, true);

-- Insert default document templates
INSERT INTO document_templates (template_name, document_type, template_version, language, template_schema, template_content, required_fields) VALUES
('Standard Tenancy Agreement', 'tenancy_agreement', '1.0', 'english',
 '{"properties": {"landlord": {"type": "object"}, "tenant": {"type": "object"}, "property": {"type": "object"}, "terms": {"type": "object"}}}',
 'TENANCY AGREEMENT\n\nThis agreement is made between {{landlord.name}} (Landlord) and {{tenant.name}} (Tenant) for the property located at {{property.address}}...',
 '["landlord.name", "landlord.address", "tenant.name", "tenant.address", "property.address", "terms.rent_amount", "terms.lease_start", "terms.lease_end"]');

-- Insert default data retention policies
INSERT INTO data_retention_policies (policy_name, data_type, retention_period_days, deletion_method, legal_requirement) VALUES
('Voice Session Retention', 'voice_data', 7, 'hard_delete', 'NDPR requirement for voice data minimization'),
('Document Retention', 'document_data', 2555, 'archival', 'Legal documents must be retained for 7 years'),
('Audit Log Retention', 'audit_data', 2555, 'hard_delete', 'NDPR audit requirements'),
('Emergency Data Retention', 'emergency_data', 730, 'anonymization', 'Emergency response legal requirements');

-- ==============================================
-- SCHEDULED TASKS
-- ==============================================

-- Note: These would be implemented as cron jobs or scheduled functions
-- in the Supabase environment

-- Daily cleanup task
-- SELECT cron.schedule('data-retention-cleanup', '0 2 * * *', 'SELECT enforce_data_retention();');

-- Weekly usage statistics update
-- SELECT cron.schedule('usage-stats-update', '0 1 * * 0', 'SELECT update_usage_statistics();');

COMMENT ON DATABASE postgres IS 'MISS Legal AI Database - NDPR Compliant Legal Assistant System';
