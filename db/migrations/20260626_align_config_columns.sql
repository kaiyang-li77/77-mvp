-- Align existing PostgreSQL schema with cloud function query expectations.
-- Safe to run more than once.

ALTER TABLE fabrics
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

ALTER TABLE details
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

ALTER TABLE colors
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

ALTER TABLE styles
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

ALTER TABLE scenes
  ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 0;

ALTER TABLE recommendations
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
