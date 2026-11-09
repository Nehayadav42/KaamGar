-- Invitations and password links, worker verification details, in-app notifications

-- A cooperative admin who was invited but has not set a password yet
ALTER TABLE users ADD COLUMN invite_pending boolean NOT NULL DEFAULT false;

-- Worker verification details
ALTER TABLE worker_profiles
  ADD COLUMN shramik_card_number text CHECK (shramik_card_number IS NULL OR char_length(shramik_card_number) <= 30),
  ADD COLUMN review_note text CHECK (review_note IS NULL OR char_length(review_note) <= 200),
  ADD COLUMN reviewed_by uuid REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at timestamptz;

-- One Shramik card can belong to one worker only (spaces and dashes are ignored, case is ignored)
CREATE UNIQUE INDEX worker_profiles_card_unique
  ON worker_profiles (lower(regexp_replace(shramik_card_number, '[^A-Za-z0-9]', '', 'g')))
  WHERE shramik_card_number IS NOT NULL;

-- ── Single-use links: "set your password" (invite) and "reset your password" ──
CREATE TABLE auth_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     text NOT NULL CHECK (purpose IN ('invite', 'reset')),
  token_hash  text NOT NULL UNIQUE,                 -- only a SHA-256 hash is stored
  expires_at  timestamptz NOT NULL,
  used_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX auth_tokens_user_idx ON auth_tokens (user_id, purpose);

-- ── Notifications (the bell) ────────────────────────────────
CREATE TABLE notifications (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL CHECK (char_length(title) <= 120),
  body        text CHECK (body IS NULL OR char_length(body) <= 300),
  link        text,                                  -- where the app should take the person when they click it
  read_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);
CREATE INDEX notifications_unread_idx ON notifications (user_id) WHERE read_at IS NULL;
