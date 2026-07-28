-- Preserve the legacy articles permissions while avoiding overlapping
-- permissive SELECT policies for authenticated users.

BEGIN;

DROP POLICY IF EXISTS "Authors can manage their own articles"
  ON public.articles;
DROP POLICY IF EXISTS "Users can view published articles"
  ON public.articles;

CREATE POLICY "Anonymous users can view published articles"
  ON public.articles
  FOR SELECT
  TO anon
  USING (status = 'published');

CREATE POLICY "Authenticated users can view published or own articles"
  ON public.articles
  FOR SELECT
  TO authenticated
  USING (
    status = 'published'
    OR author_id = (SELECT auth.uid())
  );

CREATE POLICY "Authors can insert their own articles"
  ON public.articles
  FOR INSERT
  TO authenticated
  WITH CHECK (author_id = (SELECT auth.uid()));

CREATE POLICY "Authors can update their own articles"
  ON public.articles
  FOR UPDATE
  TO authenticated
  USING (author_id = (SELECT auth.uid()))
  WITH CHECK (author_id = (SELECT auth.uid()));

CREATE POLICY "Authors can delete their own articles"
  ON public.articles
  FOR DELETE
  TO authenticated
  USING (author_id = (SELECT auth.uid()));

COMMIT;
