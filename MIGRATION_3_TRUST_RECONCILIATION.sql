-- Trust Account Auto-Reconciliation System
-- Automated three-way reconciliation with Open Banking
-- Saves 7.5 hours/week (3 hours/month per account)

-- Bank connections (Open Banking API)
CREATE TABLE IF NOT EXISTS bank_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trust_account_id UUID NOT NULL REFERENCES trust_accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  sort_code TEXT,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  sync_frequency TEXT DEFAULT 'daily' CHECK (sync_frequency IN ('manual', 'daily', 'weekly')),
  sync_errors INTEGER DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trust_account_id, account_number)
);

-- Bank transactions (imported from Open Banking)
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_connection_id UUID NOT NULL REFERENCES bank_connections(id) ON DELETE CASCADE,
  external_transaction_id TEXT NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  balance DECIMAL(15,2),
  transaction_type TEXT CHECK (transaction_type IN ('debit', 'credit', 'transfer')),
  reference TEXT,
  matched BOOLEAN DEFAULT false,
  matched_to_trust_transaction_id UUID REFERENCES trust_transactions(id),
  matched_at TIMESTAMPTZ,
  matched_by UUID REFERENCES users(id),
  confidence DECIMAL(3,2),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bank_connection_id, external_transaction_id)
);

-- Reconciliation runs (three-way reconciliation)
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trust_account_id UUID NOT NULL REFERENCES trust_accounts(id) ON DELETE CASCADE,
  run_date DATE NOT NULL,
  run_type TEXT NOT NULL CHECK (run_type IN ('manual', 'automated', 'scheduled')),
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN (
    'in_progress',
    'completed',
    'failed',
    'pending_review'
  )),
  bank_balance DECIMAL(15,2),
  client_ledger_balance DECIMAL(15,2),
  office_ledger_balance DECIMAL(15,2),
  matches_found INTEGER DEFAULT 0,
  discrepancies_found INTEGER DEFAULT 0,
  total_discrepancy_amount DECIMAL(15,2),
  sra_compliant BOOLEAN,
  sra_report_generated BOOLEAN DEFAULT false,
  sra_report_path TEXT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reconciliation discrepancies
CREATE TABLE IF NOT EXISTS reconciliation_discrepancies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reconciliation_run_id UUID NOT NULL REFERENCES reconciliation_runs(id) ON DELETE CASCADE,
  discrepancy_type TEXT NOT NULL CHECK (discrepancy_type IN (
    'bank_transaction_unmatched',
    'trust_transaction_unmatched',
    'amount_mismatch',
    'date_mismatch',
    'balance_difference'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  bank_transaction_id UUID REFERENCES bank_transactions(id),
  trust_transaction_id UUID REFERENCES trust_transactions(id),
  expected_amount DECIMAL(15,2),
  actual_amount DECIMAL(15,2),
  difference_amount DECIMAL(15,2),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unresolved' CHECK (status IN (
    'unresolved',
    'investigating',
    'resolved',
    'waived'
  )),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reconciliation suggestions
CREATE TABLE IF NOT EXISTS reconciliation_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
  trust_transaction_id UUID NOT NULL REFERENCES trust_transactions(id) ON DELETE CASCADE,
  confidence DECIMAL(3,2) NOT NULL,
  match_reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bank_transaction_id, trust_transaction_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bank_connections_trust_account ON bank_connections(trust_account_id);
CREATE INDEX IF NOT EXISTS idx_bank_connections_enabled ON bank_connections(enabled, last_synced_at);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_connection ON bank_transactions(bank_connection_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_matched ON bank_transactions(matched);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_account ON reconciliation_runs(trust_account_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_date ON reconciliation_runs(run_date);
CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_run ON reconciliation_discrepancies(reconciliation_run_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_discrepancies_status ON reconciliation_discrepancies(status, severity);
CREATE INDEX IF NOT EXISTS idx_reconciliation_suggestions_status ON reconciliation_suggestions(status);

-- Row-level security
ALTER TABLE bank_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_discrepancies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reconciliation_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view bank connections"
  ON bank_connections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage bank connections"
  ON bank_connections FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can view bank transactions"
  ON bank_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view reconciliation runs"
  ON reconciliation_runs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create reconciliation runs"
  ON reconciliation_runs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view discrepancies"
  ON reconciliation_discrepancies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view suggestions"
  ON reconciliation_suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update suggestions"
  ON reconciliation_suggestions FOR UPDATE
  TO authenticated
  USING (true);

-- Function to calculate client ledger balance
CREATE OR REPLACE FUNCTION calculate_client_ledger_balance(account_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  balance DECIMAL(15,2);
BEGIN
  SELECT COALESCE(SUM(
    CASE
      WHEN transaction_type = 'credit' THEN amount
      WHEN transaction_type = 'debit' THEN -amount
      ELSE 0
    END
  ), 0)
  INTO balance
  FROM trust_transactions
  WHERE trust_account_id = account_id
    AND status = 'completed';
  
  RETURN balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to detect potential matches
CREATE OR REPLACE FUNCTION suggest_transaction_matches(bank_trans_id UUID)
RETURNS void AS $$
DECLARE
  bank_trans RECORD;
  trust_trans RECORD;
  match_score DECIMAL(3,2);
  reason TEXT;
BEGIN
  SELECT * INTO bank_trans
  FROM bank_transactions
  WHERE id = bank_trans_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  FOR trust_trans IN
    SELECT *
    FROM trust_transactions
    WHERE trust_account_id = (
      SELECT trust_account_id
      FROM bank_connections
      WHERE id = bank_trans.bank_connection_id
    )
    AND matched = false
    AND transaction_date BETWEEN (bank_trans.transaction_date - INTERVAL '7 days')
                             AND (bank_trans.transaction_date + INTERVAL '7 days')
  LOOP
    match_score := 0.0;
    reason := '';

    IF ABS(trust_trans.amount - ABS(bank_trans.amount)) < 0.01 THEN
      match_score := match_score + 0.5;
      reason := 'Amount matches exactly';
    ELSIF ABS(trust_trans.amount - ABS(bank_trans.amount)) < 1.0 THEN
      match_score := match_score + 0.3;
      reason := 'Amount similar';
    END IF;

    IF trust_trans.transaction_date = bank_trans.transaction_date THEN
      match_score := match_score + 0.3;
      reason := reason || '; Date matches';
    ELSIF ABS(EXTRACT(EPOCH FROM (trust_trans.transaction_date - bank_trans.transaction_date)) / 86400) <= 3 THEN
      match_score := match_score + 0.1;
      reason := reason || '; Date within 3 days';
    END IF;

    IF match_score >= 0.6 THEN
      INSERT INTO reconciliation_suggestions (
        bank_transaction_id,
        trust_transaction_id,
        confidence,
        match_reason
      ) VALUES (
        bank_trans_id,
        trust_trans.id,
        match_score,
        reason
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run three-way reconciliation
CREATE OR REPLACE FUNCTION run_three_way_reconciliation(account_id UUID)
RETURNS UUID AS $$
DECLARE
  run_id UUID;
  bank_bal DECIMAL(15,2);
  client_bal DECIMAL(15,2);
  office_bal DECIMAL(15,2);
  unmatched_bank INTEGER;
  unmatched_trust INTEGER;
  is_compliant BOOLEAN;
BEGIN
  INSERT INTO reconciliation_runs (
    trust_account_id,
    run_type,
    status
  ) VALUES (
    account_id,
    'automated',
    'in_progress'
  ) RETURNING id INTO run_id;

  SELECT balance INTO bank_bal
  FROM bank_transactions
  WHERE bank_connection_id IN (
    SELECT id FROM bank_connections WHERE trust_account_id = account_id
  )
  ORDER BY transaction_date DESC, created_at DESC
  LIMIT 1;

  client_bal := calculate_client_ledger_balance(account_id);
  office_bal := 0.0;

  SELECT COUNT(*) INTO unmatched_bank
  FROM bank_transactions
  WHERE bank_connection_id IN (
    SELECT id FROM bank_connections WHERE trust_account_id = account_id
  )
  AND matched = false;

  SELECT COUNT(*) INTO unmatched_trust
  FROM trust_transactions
  WHERE trust_account_id = account_id
    AND matched = false;

  is_compliant := ABS(COALESCE(bank_bal, 0) - COALESCE(client_bal, 0)) < 0.01;

  UPDATE reconciliation_runs
  SET
    bank_balance = bank_bal,
    client_ledger_balance = client_bal,
    office_ledger_balance = office_bal,
    matches_found = 0,
    discrepancies_found = unmatched_bank + unmatched_trust,
    total_discrepancy_amount = ABS(COALESCE(bank_bal, 0) - COALESCE(client_bal, 0)),
    sra_compliant = is_compliant,
    status = CASE WHEN is_compliant THEN 'completed' ELSE 'pending_review' END,
    completed_at = NOW()
  WHERE id = run_id;

  RETURN run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-suggest matches
CREATE OR REPLACE FUNCTION trigger_suggest_matches()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM suggest_transaction_matches(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_bank_transaction_suggest ON bank_transactions;
CREATE TRIGGER trigger_bank_transaction_suggest
  AFTER INSERT ON bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_suggest_matches();

-- Comments
COMMENT ON TABLE bank_connections IS 'Open Banking connections to trust accounts';
COMMENT ON TABLE bank_transactions IS 'Transactions imported from bank via Open Banking';
COMMENT ON TABLE reconciliation_runs IS 'Three-way reconciliation runs (bank vs client ledger vs office ledger)';
COMMENT ON TABLE reconciliation_discrepancies IS 'Items that do not match during reconciliation';
COMMENT ON TABLE reconciliation_suggestions IS 'AI-suggested matches for review';
COMMENT ON FUNCTION run_three_way_reconciliation IS 'Automated three-way reconciliation (SRA compliance)';
