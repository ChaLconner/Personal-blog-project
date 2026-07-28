-- SQL script to enable Row Level Security (RLS) and add policies on public tables
-- Fixes Security Advisor errors in Supabase

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow access policies for tables
DROP POLICY IF EXISTS "Allow all access on categories" ON public.categories;
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories" ON public.categories FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow all access on statuses" ON public.statuses;
DROP POLICY IF EXISTS "Public can read statuses" ON public.statuses;
CREATE POLICY "Public can read statuses" ON public.statuses FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow backend all access on posts" ON public.posts;
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
CREATE POLICY "Public can read published posts" ON public.posts FOR SELECT TO anon, authenticated USING (status_id = 2);

DROP POLICY IF EXISTS "Allow backend all access on comments" ON public.comments;
DROP POLICY IF EXISTS "Public can read comments" ON public.comments;
CREATE POLICY "Public can read comments" ON public.comments FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow backend all access on users" ON public.users;
DROP POLICY IF EXISTS "Users can read their profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their profile" ON public.users;
CREATE POLICY "Users can read their profile" ON public.users FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "Users can update their profile" ON public.users FOR UPDATE TO authenticated USING ((select auth.uid()) = id) WITH CHECK ((select auth.uid()) = id);
