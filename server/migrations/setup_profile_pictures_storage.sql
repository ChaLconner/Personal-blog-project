-- Migration for Profile Picture Upload System in Supabase
-- This script sets up the storage bucket and policies for profile pictures

-- 1. Create storage bucket for profile pictures (if not exists)
-- Note: This needs to be done via Supabase Dashboard or API, but included for reference
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('profile-pictures', 'profile-pictures', true)
-- ON CONFLICT (id) DO NOTHING;

-- 2. Update users table to include profile_pic column (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS profile_pic TEXT;

-- 3. Create index for profile_pic column for better performance
CREATE INDEX IF NOT EXISTS idx_users_profile_pic ON users(profile_pic);

-- 4. Add comment to the column
COMMENT ON COLUMN users.profile_pic IS 'URL or path to user profile picture stored in Supabase storage';

-- 5. Storage policies for profile pictures bucket
-- Note: These policies need to be created via Supabase Dashboard or API
-- Policy 1: Allow authenticated users to upload their own profile pictures
-- CREATE POLICY "Users can upload own profile picture" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 2: Allow authenticated users to update their own profile pictures  
-- CREATE POLICY "Users can update own profile picture" ON storage.objects
--   FOR UPDATE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 3: Allow authenticated users to delete their own profile pictures
-- CREATE POLICY "Users can delete own profile picture" ON storage.objects
--   FOR DELETE USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Policy 4: Allow public read access to profile pictures
-- CREATE POLICY "Public can view profile pictures" ON storage.objects
--   FOR SELECT USING (bucket_id = 'profile-pictures');

-- 6. Create function to generate profile picture URL
CREATE OR REPLACE FUNCTION get_profile_picture_url(file_path TEXT)
RETURNS TEXT AS $$
BEGIN
    IF file_path IS NULL OR file_path = '' THEN
        RETURN NULL;
    END IF;
    
    -- Return full URL for Supabase storage
    RETURN CONCAT(
        current_setting('app.supabase_url', true),
        '/storage/v1/object/public/profile-pictures/',
        file_path
    );
END;
$$ LANGUAGE plpgsql;

-- 7. Create function to clean up old profile pictures when updated
CREATE OR REPLACE FUNCTION cleanup_old_profile_picture()
RETURNS TRIGGER AS $$
BEGIN
    -- If profile_pic is being updated and old value exists
    IF TG_OP = 'UPDATE' AND OLD.profile_pic IS NOT NULL AND OLD.profile_pic != NEW.profile_pic THEN
        -- Extract filename from old URL/path
        -- Note: This would need additional logic to actually delete from storage
        -- For now, just log the change
        RAISE LOG 'Profile picture updated for user %: old=%, new=%', NEW.id, OLD.profile_pic, NEW.profile_pic;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for profile picture cleanup
DROP TRIGGER IF EXISTS trigger_cleanup_profile_picture ON users;
CREATE TRIGGER trigger_cleanup_profile_picture
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION cleanup_old_profile_picture();

-- 9. Create view for user profiles with full profile picture URLs
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    id,
    name,
    username,
    email,
    role,
    CASE 
        WHEN profile_pic IS NOT NULL AND profile_pic != '' THEN
            get_profile_picture_url(profile_pic)
        ELSE NULL
    END as profile_picture_url,
    profile_pic as profile_pic_path,
    created_at,
    updated_at
FROM users;

-- 10. Grant necessary permissions
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO anon;

-- 11. Create RLS policy for user_profiles view
ALTER VIEW user_profiles OWNER TO postgres;

-- 12. Add helpful comments
COMMENT ON VIEW user_profiles IS 'View that provides user profiles with resolved profile picture URLs';
COMMENT ON FUNCTION get_profile_picture_url(TEXT) IS 'Converts profile picture path to full Supabase storage URL';
COMMENT ON FUNCTION cleanup_old_profile_picture() IS 'Trigger function to handle cleanup when profile pictures are updated';

-- 13. Sample data structure for reference
-- Example of how profile_pic should be stored:
-- profile_pic = 'user-id/profile-picture-name.jpg'
-- This translates to: https://your-project.supabase.co/storage/v1/object/public/profile-pictures/user-id/profile-picture-name.jpg
