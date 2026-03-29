-- Client Portal 2.0 - Real-time updates and enhanced features
-- Saves 8 hours/week by reducing "what's my status?" emails

-- Client portal access (separate from main users)
CREATE TABLE IF NOT EXISTS client_portal_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  enabled BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email)
);

-- Matter timeline events
CREATE TABLE IF NOT EXISTS matter_timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'case_opened',
    'document_uploaded',
    'document_signed',
    'payment_received',
    'court_date_set',
    'status_update',
    'milestone_reached',
    'message_sent',
    'invoice_sent',
    'task_completed',
    'deadline_approaching'
  )),
  title TEXT NOT NULL,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'client' CHECK (visibility IN ('internal', 'client', 'all')),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

-- Client notifications
CREATE TABLE IF NOT EXISTS client_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_portal_user_id UUID NOT NULL REFERENCES client_portal_users(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES matters(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'document_ready',
    'payment_due',
    'status_update',
    'court_date',
    'message_received',
    'milestone_reached'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  sent_via_email BOOLEAN DEFAULT false,
  sent_via_sms BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client satisfaction surveys
CREATE TABLE IF NOT EXISTS client_satisfaction_surveys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  client_portal_user_id UUID NOT NULL REFERENCES client_portal_users(id) ON DELETE CASCADE,
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  would_recommend BOOLEAN,
  comments TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client portal messages
CREATE TABLE IF NOT EXISTS client_portal_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'solicitor')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  attachments JSONB,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matter milestones
CREATE TABLE IF NOT EXISTS matter_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  milestone_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  estimated_completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(matter_id, milestone_order)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_client_portal_users_client_id ON client_portal_users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_users_email ON client_portal_users(email);
CREATE INDEX IF NOT EXISTS idx_matter_timeline_matter_id ON matter_timeline_events(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_timeline_visibility ON matter_timeline_events(matter_id, visibility);
CREATE INDEX IF NOT EXISTS idx_client_notifications_user_id ON client_notifications(client_portal_user_id, read);
CREATE INDEX IF NOT EXISTS idx_client_notifications_matter_id ON client_notifications(matter_id);
CREATE INDEX IF NOT EXISTS idx_client_satisfaction_matter_id ON client_satisfaction_surveys(matter_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_messages_matter_id ON client_portal_messages(matter_id);
CREATE INDEX IF NOT EXISTS idx_client_portal_messages_created ON client_portal_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_matter_milestones_matter_id ON matter_milestones(matter_id, milestone_order);

-- Row-level security
ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_satisfaction_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_portal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_milestones ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Solicitors can view all client portal users"
  ON client_portal_users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solicitors can manage client portal users"
  ON client_portal_users FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Solicitors can view all timeline events"
  ON matter_timeline_events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solicitors can create timeline events"
  ON matter_timeline_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Solicitors can view all notifications"
  ON client_notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solicitors can create notifications"
  ON client_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Solicitors can view all surveys"
  ON client_satisfaction_surveys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can view messages for their matters"
  ON client_portal_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can send messages"
  ON client_portal_messages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Solicitors can view all milestones"
  ON matter_milestones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Solicitors can manage milestones"
  ON matter_milestones FOR ALL
  TO authenticated
  USING (true);

-- Function to auto-create timeline event when status changes
CREATE OR REPLACE FUNCTION create_timeline_event_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO matter_timeline_events (
      matter_id,
      event_type,
      title,
      description,
      visibility,
      created_by
    ) VALUES (
      NEW.id,
      'status_update',
      'Matter status updated',
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      'client',
      NEW.updated_by
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-timeline events
DROP TRIGGER IF EXISTS trigger_status_change_timeline ON matters;
CREATE TRIGGER trigger_status_change_timeline
  AFTER UPDATE ON matters
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION create_timeline_event_on_status_change();

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE client_notifications
  SET read = true
  WHERE id = notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(portal_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM client_notifications
    WHERE client_portal_user_id = portal_user_id
      AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE client_portal_users IS 'Separate authentication for clients to access portal';
COMMENT ON TABLE matter_timeline_events IS 'Real-time activity feed for client portal';
COMMENT ON TABLE client_notifications IS 'Push notifications for clients (in-app + email + SMS)';
COMMENT ON TABLE client_satisfaction_surveys IS 'Post-matter satisfaction surveys';
COMMENT ON TABLE client_portal_messages IS 'Secure two-way messaging between clients and solicitors';
COMMENT ON TABLE matter_milestones IS 'Progress tracking with visual milestones';
