-- =============================================
-- Migration 021: AI Features
-- =============================================
-- Description: Enable AI features with local and cloud model support
-- Requires: pgvector extension for semantic search
-- Created: 2026-03-28

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- Table: document_analyses
-- =============================================
-- Purpose: Store AI-generated document analysis results
CREATE TABLE IF NOT EXISTS document_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('summary', 'facts', 'entities', 'sentiment', 'action_items')),
    prompt TEXT,
    result JSONB NOT NULL,
    model TEXT NOT NULL, -- e.g., 'gpt-4', 'claude-3.5-sonnet', 'llama-3.1-70b'
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'local')),
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER, -- Time taken to process
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    error TEXT, -- Store error message if analysis failed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    -- Performance indexes
    CONSTRAINT valid_confidence_score CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

CREATE INDEX idx_document_analyses_document_id ON document_analyses(document_id);
CREATE INDEX idx_document_analyses_type ON document_analyses(analysis_type);
CREATE INDEX idx_document_analyses_created_at ON document_analyses(created_at DESC);
CREATE INDEX idx_document_analyses_provider ON document_analyses(provider);

COMMENT ON TABLE document_analyses IS 'AI-generated document analysis results';
COMMENT ON COLUMN document_analyses.result IS 'Structured JSON result based on analysis_type';

-- =============================================
-- Table: case_insights
-- =============================================
-- Purpose: Store AI-generated case/matter insights
CREATE TABLE IF NOT EXISTS case_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
    summary TEXT,
    risk_level TEXT CHECK (risk_level IN ('high', 'medium', 'low', 'unknown')),
    risk_factors JSONB, -- Array of identified risks
    similar_cases JSONB, -- Array of similar case references
    recommendations TEXT[],
    key_events JSONB, -- Timeline of key events
    outcome_probability JSONB, -- Estimated outcomes with probabilities
    model TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'local')),
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_case_insights_case_id ON case_insights(case_id);
CREATE INDEX idx_case_insights_risk_level ON case_insights(risk_level);
CREATE INDEX idx_case_insights_updated_at ON case_insights(updated_at DESC);

COMMENT ON TABLE case_insights IS 'AI-generated case/matter insights and risk assessments';

-- =============================================
-- Table: ai_usage
-- =============================================
-- Purpose: Track AI API usage for cost monitoring and analytics
CREATE TABLE IF NOT EXISTS ai_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    organization_id UUID,
    provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'local')),
    model TEXT NOT NULL,
    feature TEXT NOT NULL, -- 'document_analysis', 'case_insights', 'semantic_search', 'chat'
    tokens_used INTEGER DEFAULT 0,
    cost_usd DECIMAL(10,4) DEFAULT 0.0000,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);

CREATE INDEX idx_ai_usage_provider ON ai_usage(provider);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at DESC);
CREATE INDEX idx_ai_usage_feature ON ai_usage(feature);

COMMENT ON TABLE ai_usage IS 'Track AI API usage for billing and analytics';

-- =============================================
-- Table: ai_settings
-- =============================================
-- Purpose: Store AI configuration per organization/user
CREATE TABLE IF NOT EXISTS ai_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id), -- NULL = org-wide settings
    default_provider TEXT NOT NULL DEFAULT 'openai' CHECK (default_provider IN ('openai', 'anthropic', 'local')),
    openai_api_key TEXT, -- Encrypted in application
    anthropic_api_key TEXT, -- Encrypted in application
    local_endpoint TEXT DEFAULT 'http://localhost:11434', -- Ollama default
    default_model TEXT,
    embedding_provider TEXT NOT NULL DEFAULT 'openai' CHECK (embedding_provider IN ('openai', 'local', 'ollama')),
    embedding_model TEXT DEFAULT 'text-embedding-3-small',
    max_tokens INTEGER DEFAULT 4096,
    temperature DECIMAL(2,1) DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
    enable_semantic_search BOOLEAN DEFAULT false,
    enable_document_analysis BOOLEAN DEFAULT true,
    enable_case_insights BOOLEAN DEFAULT true,
    enable_chat_assistant BOOLEAN DEFAULT false,
    settings JSONB, -- Additional provider-specific settings
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(organization_id, user_id)
);


CREATE INDEX idx_ai_settings_user_id ON ai_settings(user_id);

COMMENT ON TABLE ai_settings IS 'AI provider configuration per organization/user';

-- =============================================
-- Add vector embeddings to existing tables
-- =============================================
-- Purpose: Enable semantic search across documents and cases

-- Add embedding column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS embedding vector(384), -- 384 dimensions for all-MiniLM-L6-v2
ADD COLUMN IF NOT EXISTS embedding_model TEXT,
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

-- Create index for cosine similarity search
CREATE INDEX IF NOT EXISTS idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);

COMMENT ON COLUMN documents.embedding IS 'Vector embedding for semantic search (384 dimensions)';

-- Add embedding column to matters table
ALTER TABLE matters 
ADD COLUMN IF NOT EXISTS embedding vector(384),
ADD COLUMN IF NOT EXISTS embedding_model TEXT,
ADD COLUMN IF NOT EXISTS embedding_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_matters_embedding ON matters USING ivfflat (embedding vector_cosine_ops);

COMMENT ON COLUMN matters.embedding IS 'Vector embedding for semantic search (384 dimensions)';

-- =============================================
-- Table: search_history
-- =============================================
-- Purpose: Track user search queries for suggestions and analytics
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    search_type TEXT NOT NULL CHECK (search_type IN ('keyword', 'semantic')),
    filters JSONB, -- Store applied filters
    results_count INTEGER DEFAULT 0,
    clicked_result_id UUID, -- Track which result was clicked
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_history_user_id ON search_history(user_id);
CREATE INDEX idx_search_history_organization_id ON search_history(organization_id);
CREATE INDEX idx_search_history_created_at ON search_history(created_at DESC);

COMMENT ON TABLE search_history IS 'User search history for analytics and suggestions';

-- =============================================
-- Table: chat_conversations
-- =============================================
-- Purpose: Store AI chat assistant conversations
CREATE TABLE IF NOT EXISTS chat_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title TEXT,
    context JSONB, -- Current page context (case_id, document_id, etc.)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_conversations_user_id ON chat_conversations(user_id);
CREATE INDEX idx_chat_conversations_organization_id ON chat_conversations(organization_id);
CREATE INDEX idx_chat_conversations_updated_at ON chat_conversations(updated_at DESC);

COMMENT ON TABLE chat_conversations IS 'AI chat assistant conversation threads';

-- =============================================
-- Table: chat_messages
-- =============================================
-- Purpose: Store individual chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    model TEXT,
    provider TEXT CHECK (provider IN ('openai', 'anthropic', 'local')),
    tokens_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at);

COMMENT ON TABLE chat_messages IS 'Individual messages in chat conversations';

-- =============================================
-- Functions: Vector search helpers
-- =============================================

-- Function to find similar documents
CREATE OR REPLACE FUNCTION find_similar_documents(
    query_embedding vector(384),
    limit_count INTEGER DEFAULT 10,
    similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    file_path TEXT,
    similarity DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.title,
        d.file_path,
        ROUND((1 - (d.embedding <=> query_embedding))::DECIMAL, 4) as similarity
    FROM documents d
    WHERE 
        d.embedding IS NOT NULL
        AND (1 - (d.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY d.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_similar_documents IS 'Find documents similar to a query embedding using cosine similarity';

-- Function to find similar cases
CREATE OR REPLACE FUNCTION find_similar_cases(
    query_embedding vector(384),
    limit_count INTEGER DEFAULT 10,
    similarity_threshold DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    matter_number TEXT,
    status TEXT,
    similarity DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.title,
        m.matter_number,
        m.status,
        ROUND((1 - (m.embedding <=> query_embedding))::DECIMAL, 4) as similarity
    FROM matters m
    WHERE 
        m.embedding IS NOT NULL
        AND (1 - (m.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY m.embedding <=> query_embedding
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_similar_cases IS 'Find cases similar to a query embedding using cosine similarity';

-- =============================================
-- Triggers
-- =============================================

-- Update updated_at timestamp for case_insights
CREATE OR REPLACE FUNCTION update_case_insights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_case_insights_updated_at
    BEFORE UPDATE ON case_insights
    FOR EACH ROW
    EXECUTE FUNCTION update_case_insights_updated_at();

-- Update updated_at timestamp for ai_settings
CREATE OR REPLACE FUNCTION update_ai_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_ai_settings_updated_at
    BEFORE UPDATE ON ai_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_ai_settings_updated_at();

-- Update updated_at timestamp for chat_conversations
CREATE OR REPLACE FUNCTION update_chat_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_chat_conversations_updated_at
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_conversations_updated_at();

-- =============================================
-- Grants
-- =============================================

-- Grant permissions (adjust based on your RBAC setup)
-- These are examples - modify based on existing role structure

GRANT SELECT, INSERT, UPDATE, DELETE ON document_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON case_insights TO authenticated;
GRANT SELECT, INSERT ON ai_usage TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ai_settings TO authenticated;
GRANT SELECT ON search_history TO authenticated;
GRANT INSERT ON search_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON chat_conversations TO authenticated;
GRANT SELECT, INSERT ON chat_messages TO authenticated;

-- =============================================
-- Sample data for testing (optional)
-- =============================================

-- You can add sample AI settings for testing here
-- INSERT INTO ai_settings (organization_id, default_provider, enable_document_analysis)
-- VALUES (...) ON CONFLICT DO NOTHING;
