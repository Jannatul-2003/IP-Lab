-- CSEDU Students' Club Portal - Supabase Schema
-- This SQL creates all tables for the portal

-- ============================================================================
-- Users and Members
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role TEXT NOT NULL DEFAULT 'GUEST' CHECK (role IN (
    'GUEST','MEMBER','VOLUNTEER',
    'EC_OFFICER','PRESIDENT','SECRETARY',
    'FACULTY_ADVISOR','SYSTEM_ADMIN')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  student_id VARCHAR(30) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  batch_year INT NOT NULL CHECK (batch_year > 2000),
  phone VARCHAR(20),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (
    status IN ('PENDING','ACTIVE','SUSPENDED','CANCELLED')),
  joined_date DATE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_members_student_id ON members(student_id);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_user_id ON members(user_id);

-- ============================================================================
-- Committee & Roles
-- ============================================================================
CREATE TABLE IF NOT EXISTS committee_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_number INT UNIQUE NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ec_role_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES committee_terms(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  role_title VARCHAR(80) NOT NULL,
  assigned_by UUID REFERENCES users(id),
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (term_id, role_title)
);

CREATE INDEX idx_ec_role_holders_term ON ec_role_holders(term_id);
CREATE INDEX idx_ec_role_holders_member ON ec_role_holders(member_id);

-- ============================================================================
-- Elections
-- ============================================================================
CREATE TABLE IF NOT EXISTS elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES committee_terms(id) ON DELETE CASCADE,
  phase1_start TIMESTAMPTZ NOT NULL,
  phase1_end TIMESTAMPTZ NOT NULL,
  phase2_start TIMESTAMPTZ,
  phase2_end TIMESTAMPTZ,
  shortlist_n INT NOT NULL DEFAULT 3 CHECK (shortlist_n >= 2),
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT','PHASE1_OPEN','PHASE1_CLOSED',
    'SHORTLISTING','PHASE2_OPEN','COMPLETED')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_elections_term ON elections(term_id);
CREATE INDEX idx_elections_status ON elections(status);

CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  position VARCHAR(80) NOT NULL,
  phase1_votes INT NOT NULL DEFAULT 0,
  phase2_votes INT NOT NULL DEFAULT 0,
  shortlisted BOOLEAN NOT NULL DEFAULT FALSE,
  winner BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (election_id, member_id, position)
);

CREATE INDEX idx_candidates_election ON candidates(election_id);
CREATE INDEX idx_candidates_member ON candidates(member_id);

CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  election_id UUID NOT NULL REFERENCES elections(id) ON DELETE CASCADE,
  phase TEXT NOT NULL CHECK (phase IN ('phase1','phase2')),
  voter_id UUID REFERENCES members(id), -- nulled after submission for anonymity
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  position VARCHAR(80) NOT NULL,
  cast_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (election_id, phase, voter_id, position)
);

CREATE INDEX idx_votes_election ON votes(election_id);
CREATE INDEX idx_votes_candidate ON votes(candidate_id);

-- ============================================================================
-- Events
-- ============================================================================
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'workshop','seminar','carnival','sports','general')),
  event_date TIMESTAMPTZ NOT NULL,
  venue VARCHAR(200),
  capacity INT NOT NULL CHECK (capacity > 0),
  rsvp_deadline TIMESTAMPTZ,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT','PUBLISHED','RSVP_CLOSED','COMPLETED','CANCELLED')),
  organizer_id UUID REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_date ON events(event_date);

CREATE TABLE IF NOT EXISTS rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, member_id)
);

CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_member ON rsvps(member_id);

CREATE TABLE IF NOT EXISTS volunteer_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role_name VARCHAR(120) NOT NULL,
  description TEXT,
  assigned_member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','filled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_volunteer_roles_event ON volunteer_roles(event_id);

-- ============================================================================
-- Notices
-- ============================================================================
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  notice_type TEXT NOT NULL CHECK (notice_type IN (
    'General','Policy','Membership','Election','Event')),
  author_id UUID REFERENCES users(id),
  author_role TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notices_published_at ON notices(published_at DESC);

-- ============================================================================
-- Finance
-- ============================================================================
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term_id UUID NOT NULL REFERENCES committee_terms(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  total_amount_bdt NUMERIC(14,2) NOT NULL CHECK (total_amount_bdt > 0),
  approved_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_budgets_term ON budgets(term_id);
CREATE INDEX idx_budgets_event ON budgets(event_id);

CREATE TABLE IF NOT EXISTS expenditures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  amount_bdt NUMERIC(14,2) NOT NULL CHECK (amount_bdt > 0),
  category VARCHAR(80),
  description TEXT,
  expense_date DATE NOT NULL,
  added_by UUID REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_expenditures_budget ON expenditures(budget_id);

-- ============================================================================
-- Media (Gallery & Newsletter)
-- ============================================================================
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url VARCHAR(500) NOT NULL,
  media_type VARCHAR(50) NOT NULL CHECK (media_type IN (
    'image','pdf','video')),
  tags TEXT[], -- Array of tags
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_media_event ON media(event_id);

-- ============================================================================
-- Audit Log (Immutable)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(120) NOT NULL,
  entity_type VARCHAR(80) NOT NULL,
  entity_id UUID,
  payload JSONB,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_logged_at ON audit_log(logged_at DESC);

-- Make audit log immutable
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT WITH CHECK (true);

CREATE POLICY audit_log_read ON audit_log
  FOR SELECT USING (true);

CREATE POLICY audit_log_no_update ON audit_log
  FOR UPDATE USING (false);

CREATE POLICY audit_log_no_delete ON audit_log
  FOR DELETE USING (false);

-- ============================================================================
-- Payments (SSLCommerz Integration)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id VARCHAR(100) UNIQUE NOT NULL,
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN (
    'initiated','pending','completed','failed','refunded')),
  payment_method VARCHAR(50),
  gateway_response JSONB,
  description VARCHAR(255),
  metadata JSONB, -- Additional data like event_id, membership_fee, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_payments_member ON payments(member_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX idx_payments_created_at ON payments(created_at DESC);

CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  response_code VARCHAR(10),
  response_message TEXT,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_logs_payment ON payment_logs(payment_id);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY users_read_self ON users
  FOR SELECT USING (auth.uid() = id);

-- Members can read their own profile
CREATE POLICY members_read_self ON members
  FOR SELECT USING (auth.uid() = user_id);

-- EC officers and admins can read all members
CREATE POLICY members_read_officers ON members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('EC_OFFICER', 'PRESIDENT', 'SECRETARY', 'SYSTEM_ADMIN')
    )
  );

-- Faculty advisors have read-only access to audit logs
CREATE POLICY audit_log_read_advisor ON audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'FACULTY_ADVISOR'
    )
  );

-- ============================================================================
-- Views (Helpful queries)
-- ============================================================================

CREATE OR REPLACE VIEW active_members AS
SELECT
  m.id,
  m.user_id,
  m.student_id,
  m.full_name,
  m.batch_year,
  u.email,
  m.joined_date
FROM members m
JOIN users u ON m.user_id = u.id
WHERE m.status = 'ACTIVE' AND m.deleted_at IS NULL;

CREATE OR REPLACE VIEW election_results AS
SELECT
  e.id as election_id,
  c.position,
  c.id as candidate_id,
  m.full_name as candidate_name,
  c.phase1_votes,
  c.phase2_votes,
  c.winner,
  e.status as election_status
FROM elections e
JOIN candidates c ON e.id = c.election_id
JOIN members m ON c.member_id = m.id
WHERE e.status = 'COMPLETED'
ORDER BY c.position, c.phase2_votes DESC;

CREATE OR REPLACE VIEW budget_summary AS
SELECT
  b.id,
  b.term_id,
  b.total_amount_bdt,
  COALESCE(SUM(e.amount_bdt), 0) as spent_amount,
  (b.total_amount_bdt - COALESCE(SUM(e.amount_bdt), 0)) as remaining_amount,
  b.status
FROM budgets b
LEFT JOIN expenditures e ON b.id = e.budget_id AND e.status = 'approved'
GROUP BY b.id, b.total_amount_bdt, b.status, b.term_id;

-- ============================================================================
-- Triggers (Auto-updates)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_elections_updated_at BEFORE UPDATE ON elections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Prevent updates to approved expenditures
CREATE OR REPLACE FUNCTION prevent_approved_expenditure_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'Cannot modify approved expenditure records';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_expenditure_modification BEFORE UPDATE OR DELETE ON expenditures
  FOR EACH ROW EXECUTE FUNCTION prevent_approved_expenditure_update();
