-- Fix RLS policy on public.users table for Supabase
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on users" ON public.users;
DROP POLICY IF EXISTS "Allow backend all access on users" ON public.users;
DROP POLICY IF EXISTS "Users can read their profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their profile" ON public.users;
CREATE POLICY "Users can read their profile" ON public.users FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "Users can update their profile" ON public.users FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);

-- Prevent profile owners from elevating their role or changing protected fields.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (username, name, profile_pic, bio) ON public.users TO authenticated;

NOTIFY pgrst, 'reload schema';
