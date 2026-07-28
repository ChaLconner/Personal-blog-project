-- Backfill legacy posts with a verified admin identity and repair the
-- notification read index. New writes set author_id in the API.

DO $$
DECLARE
  fallback_admin_id UUID;
BEGIN
  SELECT id
  INTO fallback_admin_id
  FROM public.users
  WHERE role = 'admin'
  ORDER BY created_at ASC, id ASC
  LIMIT 1;

  IF fallback_admin_id IS NOT NULL THEN
    UPDATE public.posts
    SET author_id = fallback_admin_id
    WHERE author_id IS NULL;
  ELSE
    RAISE NOTICE 'No admin user found; legacy posts with NULL author_id were not changed.';
  END IF;
END
$$;

DROP INDEX IF EXISTS public.idx_notifications_user_read;
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, read, created_at DESC);

NOTIFY pgrst, 'reload schema';
