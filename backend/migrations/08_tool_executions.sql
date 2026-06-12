-- Migration: Create tool_executions audit table
-- Run this in the Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tool_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    repository_id TEXT,
    tool_type VARCHAR NOT NULL, -- README_SYNC, BRANCH_PRUNE, GITIGNORE_DEPLOY, COMMIT_STANDARDIZE, REPO_ANALYZE
    status VARCHAR NOT NULL DEFAULT 'PENDING', -- PENDING, SUCCESS, FAILED
    details JSONB, -- Stores execution metadata (branches deleted, PR URL, etc.)
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE tool_executions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own executions
CREATE POLICY "Users can view their own tool executions"
ON tool_executions FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own executions
CREATE POLICY "Users can insert tool executions"
ON tool_executions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_tool_executions_user_id ON tool_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_executions_tool_type ON tool_executions(tool_type);
CREATE INDEX IF NOT EXISTS idx_tool_executions_repository ON tool_executions(repository_id);
