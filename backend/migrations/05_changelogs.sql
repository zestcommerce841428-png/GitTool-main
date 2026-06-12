-- Migration 05_changelogs.sql

CREATE TABLE "public"."changelogs" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "version" text,
    "type" text DEFAULT 'feature'::text,
    "title" text NOT NULL,
    "description" text,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_by" text,
    CONSTRAINT "changelogs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."changelogs" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on changelogs"
    ON "public"."changelogs" FOR SELECT
    USING (true);

-- The backend uses the service_role key to bypass RLS for inserts/updates/deletes.
