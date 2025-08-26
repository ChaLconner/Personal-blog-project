-- Supabase Storage Bucket and Policies Setup
-- Run these commands via Supabase Dashboard > Storage or via Supabase CLI

-- 1. CREATE STORAGE BUCKET (via Dashboard or API)
-- Go to Supabase Dashboard > Storage > Create Bucket
-- Bucket name: profile-pictures
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp

-- OR via Supabase CLI:
-- supabase storage create profile-pictures --public

-- 2. STORAGE POLICIES (via Dashboard > Storage > Policies)

-- Policy 1: Allow users to upload their own profile pictures
CREATE POLICY "Users can upload profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Allow users to update their own profile pictures
CREATE POLICY "Users can update profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
) WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Allow users to delete their own profile pictures
CREATE POLICY "Users can delete profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-pictures' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 4: Allow public read access to all profile pictures
CREATE POLICY "Public can view profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');

-- 3. BUCKET CONFIGURATION
-- File size limit: 5MB (5242880 bytes)
-- Allowed MIME types: image/jpeg, image/jpg, image/png, image/gif, image/webp
-- File naming pattern: {user-id}/{timestamp}-{filename}

-- 4. CORS SETTINGS (if needed)
-- Allow origins: your-frontend-domain.com, localhost:5173
-- Methods: GET, POST, PUT, DELETE
-- Headers: authorization, content-type, x-client-info, apikey
