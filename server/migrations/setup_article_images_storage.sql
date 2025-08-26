-- Setup Article Images Storage Bucket for Supabase
-- Run this after profile pictures storage is set up

-- Create the article-images bucket (run this in Supabase Dashboard -> Storage)
-- You can run this via SQL or create through the Dashboard:
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES ('article-images', 'article-images', true, 5242880, '{"image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"}');

-- Or create via Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "Create a bucket"
-- 3. Name: article-images
-- 4. Public: Yes
-- 5. File size limit: 5 MB
-- 6. Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp

-- Article Images Storage Policies
-- Policy 1: Allow authenticated users to upload article images (for admin/editors)
CREATE POLICY "Allow authenticated upload article images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'article-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = 'articles'
);

-- Policy 2: Allow public read access to article images
CREATE POLICY "Allow public read article images" ON storage.objects
FOR SELECT USING (bucket_id = 'article-images');

-- Policy 3: Allow admin users to update their article images
CREATE POLICY "Allow admin update article images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'article-images' 
    AND auth.role() = 'authenticated'
);

-- Policy 4: Allow admin users to delete article images
CREATE POLICY "Allow admin delete article images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'article-images' 
    AND auth.role() = 'authenticated'
);

-- Update articles table to include image_url column if not exists
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update articles table to include featured_image column if not exists
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS featured_image TEXT;

-- Create function to clean up unused article images
CREATE OR REPLACE FUNCTION cleanup_unused_article_images()
RETURNS void AS $$
DECLARE
    image_record RECORD;
    is_used BOOLEAN;
BEGIN
    -- Loop through all article images in storage
    FOR image_record IN 
        SELECT name FROM storage.objects WHERE bucket_id = 'article-images'
    LOOP
        -- Check if image is referenced in any article
        SELECT EXISTS(
            SELECT 1 FROM articles 
            WHERE image_url LIKE '%' || image_record.name || '%'
            OR featured_image LIKE '%' || image_record.name || '%'
            OR content LIKE '%' || image_record.name || '%'
        ) INTO is_used;
        
        -- If not used, delete it
        IF NOT is_used THEN
            DELETE FROM storage.objects 
            WHERE bucket_id = 'article-images' 
            AND name = image_record.name;
            
            RAISE NOTICE 'Deleted unused article image: %', image_record.name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled cleanup job (optional - can be called manually)
-- This would typically be run via pg_cron extension if available
-- SELECT cron.schedule('cleanup-article-images', '0 2 * * 0', 'SELECT cleanup_unused_article_images();');

-- Add indexes for better performance on image URL lookups
CREATE INDEX IF NOT EXISTS idx_articles_image_url ON articles(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_featured_image ON articles(featured_image) WHERE featured_image IS NOT NULL;

-- Add comments for documentation
COMMENT ON FUNCTION cleanup_unused_article_images() IS 'Removes article images from storage that are not referenced in any article content';
COMMENT ON COLUMN articles.image_url IS 'URL of the article thumbnail/preview image stored in Supabase storage';
COMMENT ON COLUMN articles.featured_image IS 'URL of the article featured image stored in Supabase storage';
