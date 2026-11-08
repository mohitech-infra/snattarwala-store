-- ====================================================================
-- ATTARWALA CATALOGUE BULK IMPORT SYSTEM - ADDITIVE MIGRATION
-- Run this script in the Supabase SQL Editor to enable persistent
-- Import History tracking in the database.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.catalog_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  admin_email TEXT DEFAULT 'admin@attarwala.com',
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  total_products INTEGER DEFAULT 0,
  total_variants INTEGER DEFAULT 0,
  total_images INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Completed', -- 'Completed', 'Completed with Warnings', 'Failed'
  error_report JSONB DEFAULT '[]'::jsonb,
  summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for speedy ordering by import date
CREATE INDEX IF NOT EXISTS idx_catalog_imports_created_at ON public.catalog_imports (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.catalog_imports ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins and service role to select, insert, and update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'catalog_imports' AND policyname = 'Admins can view catalog imports'
  ) THEN
    CREATE POLICY "Admins can view catalog imports"
      ON public.catalog_imports
      FOR SELECT
      TO authenticated, anon
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'catalog_imports' AND policyname = 'Admins can insert catalog imports'
  ) THEN
    CREATE POLICY "Admins can insert catalog imports"
      ON public.catalog_imports
      FOR INSERT
      TO authenticated, anon
      WITH CHECK (true);
  END IF;
END $$;
