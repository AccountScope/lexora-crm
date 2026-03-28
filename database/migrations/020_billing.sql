-- =====================================================
-- LEXORA Phase 4A: Stripe Billing Integration
-- Migration 020: Billing Tables
-- =====================================================

-- Drop existing tables if they exist (for clean re-runs)
DROP TABLE IF EXISTS usage_records CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;

-- =====================================================
-- Subscriptions Table
-- =====================================================
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    plan TEXT NOT NULL CHECK (plan IN ('free', 'essential', 'professional', 'enterprise')),
    status TEXT NOT NULL CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan ON subscriptions(plan);

-- Only one active subscription per user
CREATE UNIQUE INDEX idx_subscriptions_user_active ON subscriptions(user_id) 
WHERE status IN ('trialing', 'active', 'past_due');

-- =====================================================
-- Payment Methods Table
-- =====================================================
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_payment_method_id TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('card', 'bank_account', 'sepa_debit', 'bacs_debit')),
    last4 TEXT,
    brand TEXT, -- visa, mastercard, amex, etc.
    exp_month INTEGER,
    exp_year INTEGER,
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for payment methods
CREATE INDEX idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe_id ON payment_methods(stripe_payment_method_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(user_id, is_default);

-- Only one default payment method per user
CREATE UNIQUE INDEX idx_payment_methods_user_default ON payment_methods(user_id) 
WHERE is_default = TRUE;

-- =====================================================
-- Usage Records Table (for metered billing)
-- =====================================================
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    users_count INTEGER DEFAULT 0,
    storage_gb DECIMAL(10,2) DEFAULT 0.00,
    api_calls INTEGER DEFAULT 0,
    email_sends INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for usage records
CREATE INDEX idx_usage_records_subscription_id ON usage_records(subscription_id);
CREATE INDEX idx_usage_records_period ON usage_records(period_start, period_end);

-- One usage record per subscription per period
CREATE UNIQUE INDEX idx_usage_records_subscription_period ON usage_records(subscription_id, period_start, period_end);

-- =====================================================
-- Webhook Events Table (for idempotency)
-- =====================================================
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    payload JSONB NOT NULL,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_events_stripe_id ON stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_webhook_events_type ON stripe_webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON stripe_webhook_events(processed);

-- =====================================================
-- Add billing columns to users table
-- =====================================================
-- Check if columns exist before adding
DO $$ 
BEGIN
    -- Add stripe_customer_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='stripe_customer_id') THEN
        ALTER TABLE users ADD COLUMN stripe_customer_id TEXT UNIQUE;
    END IF;
    
    -- Add current_plan if it doesn't exist (for quick access)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='current_plan') THEN
        ALTER TABLE users ADD COLUMN current_plan TEXT DEFAULT 'free' 
            CHECK (current_plan IN ('free', 'essential', 'professional', 'enterprise'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_users_current_plan ON users(current_plan);

-- =====================================================
-- Update Trigger for subscriptions
-- =====================================================
CREATE OR REPLACE FUNCTION update_subscription_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_timestamp
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_timestamp();

CREATE TRIGGER trigger_update_usage_records_timestamp
    BEFORE UPDATE ON usage_records
    FOR EACH ROW
    EXECUTE FUNCTION update_subscription_timestamp();

-- =====================================================
-- Sync user current_plan from subscriptions
-- =====================================================
CREATE OR REPLACE FUNCTION sync_user_plan()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user's current_plan when subscription changes
    IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
        IF NEW.status IN ('trialing', 'active') THEN
            UPDATE users 
            SET current_plan = NEW.plan 
            WHERE id = NEW.user_id;
        END IF;
    END IF;
    
    -- Downgrade to free when subscription ends
    IF (TG_OP = 'UPDATE' AND OLD.status IN ('trialing', 'active') 
        AND NEW.status IN ('canceled', 'unpaid', 'incomplete_expired')) THEN
        UPDATE users 
        SET current_plan = 'free' 
        WHERE id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_user_plan
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION sync_user_plan();

-- =====================================================
-- Seed free plan for existing users
-- =====================================================
INSERT INTO subscriptions (user_id, plan, status)
SELECT id, 'free', 'active'
FROM users
WHERE NOT EXISTS (
    SELECT 1 FROM subscriptions WHERE subscriptions.user_id = users.id
);

-- =====================================================
-- Grant permissions (adjust for your RLS policies)
-- =====================================================
-- Allow authenticated users to read their own subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Policies for subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions"
    ON subscriptions FOR ALL
    USING (auth.role() = 'service_role');

-- Policies for payment methods
CREATE POLICY "Users can view their own payment methods"
    ON payment_methods FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment methods"
    ON payment_methods FOR ALL
    USING (auth.role() = 'service_role');

-- Policies for usage records
CREATE POLICY "Users can view their own usage records"
    ON usage_records FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM subscriptions 
            WHERE subscriptions.id = usage_records.subscription_id 
            AND subscriptions.user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage usage records"
    ON usage_records FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE subscriptions IS 'Stripe subscription records for users';
COMMENT ON TABLE payment_methods IS 'Saved payment methods for users';
COMMENT ON TABLE usage_records IS 'Usage tracking for metered billing';
COMMENT ON TABLE stripe_webhook_events IS 'Webhook event log for idempotency';

COMMENT ON COLUMN subscriptions.plan IS 'free, essential, professional, enterprise';
COMMENT ON COLUMN subscriptions.status IS 'Stripe subscription status';
COMMENT ON COLUMN subscriptions.cancel_at_period_end IS 'User has requested cancellation';
COMMENT ON COLUMN payment_methods.is_default IS 'Default payment method for the user';
COMMENT ON COLUMN usage_records.period_start IS 'Start date of billing period';
COMMENT ON COLUMN usage_records.period_end IS 'End date of billing period';
