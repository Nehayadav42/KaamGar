-- Services, worker profiles, bookings and their timeline

CREATE TYPE booking_status AS ENUM
  ('PENDING', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'EVIDENCE_SUBMITTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE verification_status AS ENUM ('AWAITING_EVIDENCE', 'AWAITING_REVIEW', 'REVIEWED');
CREATE TYPE confirmation_status AS ENUM ('PENDING', 'CONFIRMED');

-- ── Services the cooperative offers ─────────────────────────
CREATE TABLE services (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_id  uuid NOT NULL REFERENCES cooperatives(id) ON DELETE RESTRICT,
  name            text NOT NULL CHECK (char_length(name) BETWEEN 3 AND 80),
  category        text NOT NULL CHECK (char_length(category) BETWEEN 2 AND 60),
  description     text NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
  areas           text[] NOT NULL DEFAULT '{}',
  active          boolean NOT NULL DEFAULT false,      -- new services start hidden from customers
  requires        jsonb NOT NULL DEFAULT '{"details":true,"address":true,"schedule":true}',
  evidence        jsonb NOT NULL DEFAULT '{"before":true,"after":true,"notes":true}',
  created_by      uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX services_name_unique ON services (cooperative_id, lower(name));
CREATE INDEX services_active_idx ON services (cooperative_id, active);
CREATE TRIGGER services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE service_activity (
  id          bigserial PRIMARY KEY,
  service_id  uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  text        text NOT NULL,
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX service_activity_service_idx ON service_activity (service_id, created_at DESC);

-- ── What each worker can do, where, and when ────────────────
CREATE TABLE worker_profiles (
  user_id       uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  service_ids   uuid[] NOT NULL DEFAULT '{}',
  areas         text[] NOT NULL DEFAULT '{}',
  availability  text NOT NULL DEFAULT 'Available' CHECK (char_length(availability) <= 60),
  note          text CHECK (note IS NULL OR char_length(note) <= 120),
  verified      boolean NOT NULL DEFAULT false,         -- true = "Cooperative-reviewed", false = "Self-declared"
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER worker_profiles_updated_at BEFORE UPDATE ON worker_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Bookings ────────────────────────────────────────────────
CREATE SEQUENCE booking_ref_seq START 24021;

CREATE TABLE bookings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref              text NOT NULL UNIQUE DEFAULT ('KG-' || nextval('booking_ref_seq')::text),
  customer_id      uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  cooperative_id   uuid NOT NULL REFERENCES cooperatives(id) ON DELETE RESTRICT,
  service_id       uuid NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  service_name     text NOT NULL,                       -- kept even if the service is renamed later
  details          text CHECK (details IS NULL OR char_length(details) <= 1000),
  address          text CHECK (address IS NULL OR char_length(address) <= 300),
  preferred_date   date,
  preferred_time   time,
  contact          text NOT NULL,
  status           booking_status NOT NULL DEFAULT 'PENDING',
  verification     verification_status NOT NULL DEFAULT 'AWAITING_EVIDENCE',
  confirmation     confirmation_status NOT NULL DEFAULT 'PENDING',
  worker_id        uuid REFERENCES users(id) ON DELETE SET NULL,
  completed_at     timestamptz,
  review_rating    smallint CHECK (review_rating BETWEEN 1 AND 5),
  review_comment   text CHECK (review_comment IS NULL OR char_length(review_comment) <= 500),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bookings_customer_idx ON bookings (customer_id, created_at DESC);
CREATE INDEX bookings_coop_status_idx ON bookings (cooperative_id, status, created_at DESC);
CREATE INDEX bookings_worker_idx ON bookings (worker_id);
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE booking_events (
  id          bigserial PRIMARY KEY,
  booking_id  uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  label       text NOT NULL,
  status      booking_status NOT NULL,
  actor_id    uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX booking_events_booking_idx ON booking_events (booking_id, id);
