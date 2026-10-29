-- Run after `python -m powwow.manage init-db` on the Supabase PostgreSQL database.
-- The application API owns all access; do not expose application tables through
-- Supabase's browser Data API. Auth tokens are verified by the application API.
-- The API database role must retain its normal PostgreSQL access.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['accounts','projects','project_workspaces','chats','messages','artifacts','context_grants','runs','run_events','stage_attempts','usage_entries']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', table_name);
  END LOOP;
END $$;

-- Create the artifacts bucket as private using the Supabase Storage dashboard.
-- Do not add anonymous SELECT/INSERT policies for storage.objects.
