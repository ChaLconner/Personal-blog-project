-- Keep the canonical unique_post_user_like constraint and remove the
-- equivalent legacy constraint reported as a duplicate index.

BEGIN;

ALTER TABLE public.post_likes
  DROP CONSTRAINT IF EXISTS post_likes_post_id_user_id_key;

COMMIT;
