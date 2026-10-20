-- KaamGar: initial schema
-- Run with:  npm run migrate

CREATE TYPE user_role AS ENUM ('customer', 'worker', 'coop_admin', 'platform_admin');
CREATE TYPE user_status AS ENUM ('active', 'pending', 'suspended');

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Cooperatives ────────────────────────────────────────────
CREATE TABLE cooperatives (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 120),
  area        text CHECK (area IS NULL OR char_length(area) <= 120),
  active      boolean NOT NULL DEFAULT true,
  created_by  uuid,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX cooperatives_name_unique ON cooperatives (lower(name));

-- ── Users (all four roles live here) ────────────────────────
CREATE TABLE users (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  email                 text NOT NULL CHECK (char_length(email) <= 254),
  phone                 text,
  password_hash         text NOT NULL,
  role                  user_role NOT NULL,
  status                user_status NOT NULL DEFAULT 'active',
  cooperative_id        uuid REFERENCES cooperatives(id) ON DELETE RESTRICT,

  -- brute-force protection
  failed_login_attempts integer NOT NULL DEFAULT 0,
  lock_until            timestamptz,

  -- bumping this number instantly invalidates every access token issued before
  token_version         integer NOT NULL DEFAULT 0,
  must_change_password  boolean NOT NULL DEFAULT false,
  last_login_at         timestamptz,
  password_changed_at   timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),

  -- the database itself refuses impossible combinations:
  -- workers and cooperative admins belong to a cooperative; customers and platform admins never do
  CONSTRAINT users_cooperative_matches_role CHECK (
    (role IN ('worker', 'coop_admin') AND cooperative_id IS NOT NULL)
    OR (role IN ('customer', 'platform_admin') AND cooperative_id IS NULL)
  )
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email));
CREATE INDEX users_role_status_idx ON users (role, status);
CREATE INDEX users_cooperative_idx ON users (cooperative_id);

ALTER TABLE cooperatives
  ADD CONSTRAINT cooperatives_created_by_fk FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER cooperatives_updated_at BEFORE UPDATE ON cooperatives FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Refresh tokens (only a SHA-256 hash is stored) ──────────
CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  text NOT NULL UNIQUE,
  family_id   uuid NOT NULL,            -- one login session = one family
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  user_agent  text,
  ip          text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX refresh_tokens_user_idx ON refresh_tokens (user_id);
CREATE INDEX refresh_tokens_family_idx ON refresh_tokens (family_id);
CREATE INDEX refresh_tokens_expires_idx ON refresh_tokens (expires_at);

-- ── Audit log: who did what, to whom, from where ────────────
CREATE TABLE audit_logs (
  id           bigserial PRIMARY KEY,
  actor_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  actor_role   user_role,
  action       text NOT NULL,
  target_type  text,
  target_id    text,
  ip           text,
  user_agent   text,
  meta         jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON audit_logs (created_at DESC);
CREATE INDEX audit_logs_action_idx ON audit_logs (action);
CREATE INDEX audit_logs_actor_idx ON audit_logs (actor_id);
