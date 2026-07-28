-- Remove legacy policies found on the existing remote project.
-- These names predate the canonical policies created by 006_harden_rls.sql.

DROP POLICY IF EXISTS "Allow admin manage categories" ON public.categories;
DROP POLICY IF EXISTS "Allow public select on categories" ON public.categories;

DROP POLICY IF EXISTS "Allow public select on statuses" ON public.statuses;

DROP POLICY IF EXISTS "Allow admin manage posts" ON public.posts;
DROP POLICY IF EXISTS "Allow public select on posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can delete own posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can insert posts" ON public.posts;
DROP POLICY IF EXISTS "Authors can update own posts" ON public.posts;

DROP POLICY IF EXISTS "Allow manage comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;

DROP POLICY IF EXISTS "Users can view all likes" ON public.post_likes;

DROP POLICY IF EXISTS "Allow manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow public select on notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

DROP POLICY IF EXISTS "Allow public select on users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

NOTIFY pgrst, 'reload schema';
