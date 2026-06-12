-- Adds the text-based template column to projects for UI tracking
ALTER TABLE projects ADD COLUMN IF NOT EXISTS template TEXT;
