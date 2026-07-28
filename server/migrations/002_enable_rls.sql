-- SQL script to enable Row Level Security (RLS) and add policies on public tables
-- Fixes Security Advisor errors in Supabase

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow access policies for tables
DROP POLICY IF EXISTS "Allow all access on categories" ON public.categories;
CREATE POLICY "Allow all access on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all access on statuses" ON public.statuses;
CREATE POLICY "Allow all access on statuses" ON public.statuses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backend all access on posts" ON public.posts;
CREATE POLICY "Allow backend all access on posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backend all access on comments" ON public.comments;
CREATE POLICY "Allow backend all access on comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow backend all access on users" ON public.users;
CREATE POLICY "Allow backend all access on users" ON public.users FOR ALL USING (true) WITH CHECK (true);

