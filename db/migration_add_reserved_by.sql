-- Adds reserved_by column to track which user reserved a donation
ALTER TABLE donations
ADD COLUMN IF NOT EXISTS reserved_by INTEGER REFERENCES users(id);

