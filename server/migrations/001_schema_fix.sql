-- ========================================================
-- Schema Fix & Optimization Script for Supabase PostgreSQL
-- Project Ref: jybkvgvpgtzbulqgpwvh
-- ========================================================

-- 1. Ensure Extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Add author_id to posts table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- 3. Add Foreign Key & Unique Constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_categories') THEN
        ALTER TABLE public.posts ADD CONSTRAINT fk_posts_categories FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_comments_posts') THEN
        ALTER TABLE public.comments ADD CONSTRAINT fk_comments_posts FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_post_likes_posts') THEN
        ALTER TABLE public.post_likes ADD CONSTRAINT fk_post_likes_posts FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_comments_users') THEN
        ALTER TABLE public.comments ADD CONSTRAINT fk_comments_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_post_likes_users') THEN
        ALTER TABLE public.post_likes ADD CONSTRAINT fk_post_likes_users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_posts_statuses') THEN
        ALTER TABLE public.posts ADD CONSTRAINT fk_posts_statuses FOREIGN KEY (status_id) REFERENCES public.statuses(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_post_user_like') THEN
        ALTER TABLE public.post_likes ADD CONSTRAINT unique_post_user_like UNIQUE (post_id, user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_trigger_user_id_fkey') THEN
        ALTER TABLE public.notifications ADD CONSTRAINT notifications_trigger_user_id_fkey FOREIGN KEY (trigger_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_notifications_posts') THEN
        ALTER TABLE public.notifications ADD CONSTRAINT fk_notifications_posts FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create Indexes for High Performance
CREATE INDEX IF NOT EXISTS idx_posts_category_id ON public.posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status_id ON public.posts(status_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_date ON public.posts(date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_category_date ON public.posts(category_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status_date ON public.posts(status_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_post_id ON public.notifications(post_id);

-- 5. Automatic Likes Count Trigger for Posts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.posts
        SET likes_count = COALESCE(likes_count, 0) + 1
        WHERE id = NEW.post_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.posts
        SET likes_count = GREATEST(0, COALESCE(likes_count, 1) - 1)
        WHERE id = OLD.post_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.post_likes;

CREATE TRIGGER trigger_update_post_likes_count
AFTER INSERT OR DELETE ON public.post_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_likes_count();

-- 6. RLS Policies for Secure Operations
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "Allow public delete on post_likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.post_likes;
DROP POLICY IF EXISTS "Public can read likes" ON public.post_likes;

CREATE POLICY "Public can read likes" ON public.post_likes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Users can create their own likes" ON public.post_likes FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own likes" ON public.post_likes FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
