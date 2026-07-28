-- Replace permissive legacy policies with least-privilege policies.
-- The service_role used by the Express backend bypasses RLS.

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access on categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin manage categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public select on categories" ON public.categories;
DROP POLICY IF EXISTS "Public can read categories" ON public.categories;
CREATE POLICY "Public can read categories" ON public.categories
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow all access on statuses" ON public.statuses;
DROP POLICY IF EXISTS "Allow public select on statuses" ON public.statuses;
DROP POLICY IF EXISTS "Public can read statuses" ON public.statuses;
CREATE POLICY "Public can read statuses" ON public.statuses
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow backend all access on posts" ON public.posts;
DROP POLICY IF EXISTS "Allow admin manage posts" ON public.posts;
DROP POLICY IF EXISTS "Allow public select on posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Public can read published posts" ON public.posts;
CREATE POLICY "Public can read published posts" ON public.posts
  FOR SELECT TO anon, authenticated USING (status_id = 2);

DROP POLICY IF EXISTS "Allow backend all access on comments" ON public.comments;
DROP POLICY IF EXISTS "Allow manage comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Public can read comments" ON public.comments;
CREATE POLICY "Public can read comments" ON public.comments
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow backend all access on post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "Allow public insert on post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "Allow public delete on post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "Public can read likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can view all likes" ON public.post_likes;
CREATE POLICY "Public can read likes" ON public.post_likes
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create their own likes" ON public.post_likes
  FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own likes" ON public.post_likes
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow backend all access on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow public select on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can read their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their notifications" ON public.notifications;
CREATE POLICY "Users can read their notifications" ON public.notifications
  FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their notifications" ON public.notifications
  FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Allow all access on users" ON public.users;
DROP POLICY IF EXISTS "Allow backend all access on users" ON public.users;
DROP POLICY IF EXISTS "Allow public select on users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can read their profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their profile" ON public.users;
CREATE POLICY "Users can read their profile" ON public.users
  FOR SELECT TO authenticated USING ((select auth.uid()) = id);
CREATE POLICY "Users can update their profile" ON public.users
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (username, name, profile_pic, bio) ON public.users TO authenticated;

NOTIFY pgrst, 'reload schema';
