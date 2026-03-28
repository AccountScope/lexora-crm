-- Trust Accounting System Migration
-- IOLTA Compliance for Legal Trust Accounts

-- Trust Accounts Table
CREATE TABLE IF NOT EXISTS trust_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number_last4 TEXT NOT NULL, -- Last 4 digits for security
  routing_number TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings')),
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  opening_date DATE NOT NULL,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_reconciled_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Client Ledgers Table
CREATE TABLE IF NOT EXISTS client_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  trust_account_id UUID NOT NULL REFERENCES trust_accounts(id) ON DELETE RESTRICT,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(client_id, trust_account_id)
);

-- Trust Transactions Table
CREATE TABLE IF NOT EXISTS trust_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_account_id UUID NOT NULL REFERENCES trust_accounts(id) ON DELETE RESTRICT,
  client_ledger_id UUID NOT NULL REFERENCES client_ledgers(id) ON DELETE RESTRICT,
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'transfer', 'fee')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference_number TEXT,
  case_id UUID REFERENCES matters(id),
  invoice_id UUID REFERENCES invoices(id),
  destination_ledger_id UUID REFERENCES client_ledgers(id), -- For transfers
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  reconciled BOOLEAN NOT NULL DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trust Account Reconciliations Table
CREATE TABLE IF NOT EXISTS trust_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_account_id UUID NOT NULL REFERENCES trust_accounts(id) ON DELETE RESTRICT,
  reconciliation_date DATE NOT NULL,
  bank_statement_balance DECIMAL(15,2) NOT NULL,
  book_balance DECIMAL(15,2) NOT NULL,
  ledger_balance DECIMAL(15,2) NOT NULL,
  difference DECIMAL(15,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'reconciled', 'discrepancy')),
  notes TEXT,
  reconciled_by UUID REFERENCES users(id),
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(trust_account_id, reconciliation_date)
);

-- Compliance Alerts Table
CREATE TABLE IF NOT EXISTS trust_compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_account_id UUID REFERENCES trust_accounts(id) ON DELETE CASCADE,
  client_ledger_id UUID REFERENCES client_ledgers(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES trust_transactions(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'negative_balance', 
    'low_balance', 
    'unreconciled_account', 
    'large_transaction', 
    'failed_reconciliation',
    'overdraft_attempt'
  )),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trust_accounts_status ON trust_accounts(status);
CREATE INDEX IF NOT EXISTS idx_client_ledgers_client ON client_ledgers(client_id);
CREATE INDEX IF NOT EXISTS idx_client_ledgers_trust_account ON client_ledgers(trust_account_id);
CREATE INDEX IF NOT EXISTS idx_trust_transactions_account ON trust_transactions(trust_account_id);
CREATE INDEX IF NOT EXISTS idx_trust_transactions_ledger ON trust_transactions(client_ledger_id);
CREATE INDEX IF NOT EXISTS idx_trust_transactions_date ON trust_transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_trust_transactions_type ON trust_transactions(type);
CREATE INDEX IF NOT EXISTS idx_trust_reconciliations_account ON trust_reconciliations(trust_account_id);
CREATE INDEX IF NOT EXISTS idx_trust_compliance_alerts_resolved ON trust_compliance_alerts(resolved, created_at DESC);

-- Trigger to update trust account balance
CREATE OR REPLACE FUNCTION update_trust_account_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'deposit' THEN
      UPDATE trust_accounts 
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.trust_account_id;
    ELSIF NEW.type IN ('withdrawal', 'fee') THEN
      UPDATE trust_accounts 
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.trust_account_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trust_account_balance_trigger
AFTER INSERT ON trust_transactions
FOR EACH ROW
EXECUTE FUNCTION update_trust_account_balance();

-- Trigger to update client ledger balance
CREATE OR REPLACE FUNCTION update_client_ledger_balance()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'deposit' THEN
      UPDATE client_ledgers 
      SET current_balance = current_balance + NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.client_ledger_id;
    ELSIF NEW.type IN ('withdrawal', 'fee') THEN
      UPDATE client_ledgers 
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.client_ledger_id;
    ELSIF NEW.type = 'transfer' THEN
      -- Deduct from source ledger
      UPDATE client_ledgers 
      SET current_balance = current_balance - NEW.amount,
          updated_at = NOW()
      WHERE id = NEW.client_ledger_id;
      
      -- Add to destination ledger
      IF NEW.destination_ledger_id IS NOT NULL THEN
        UPDATE client_ledgers 
        SET current_balance = current_balance + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.destination_ledger_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER client_ledger_balance_trigger
AFTER INSERT ON trust_transactions
FOR EACH ROW
EXECUTE FUNCTION update_client_ledger_balance();

-- Function to check for negative balances (compliance)
CREATE OR REPLACE FUNCTION check_negative_balance()
RETURNS TRIGGER AS $$
DECLARE
  current_bal DECIMAL(15,2);
BEGIN
  -- Check client ledger balance
  SELECT current_balance INTO current_bal
  FROM client_ledgers
  WHERE id = NEW.client_ledger_id;
  
  IF NEW.type IN ('withdrawal', 'fee', 'transfer') THEN
    IF (current_bal - NEW.amount) < 0 THEN
      RAISE EXCEPTION 'Transaction would create negative balance for client ledger %', NEW.client_ledger_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_negative_balance_trigger
BEFORE INSERT ON trust_transactions
FOR EACH ROW
EXECUTE FUNCTION check_negative_balance();

-- Audit log for trust transactions
CREATE TABLE IF NOT EXISTS trust_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trust_account_id UUID REFERENCES trust_accounts(id),
  transaction_id UUID REFERENCES trust_transactions(id),
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  performed_by UUID REFERENCES users(id),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT
);

CREATE INDEX IF NOT EXISTS idx_trust_audit_log_account ON trust_audit_log(trust_account_id, performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_audit_log_transaction ON trust_audit_log(transaction_id);
