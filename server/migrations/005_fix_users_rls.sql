-- Fix RLS policy on public.users table for Supabase
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on users" ON public.users;
CREATE POLICY "Allow all access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
