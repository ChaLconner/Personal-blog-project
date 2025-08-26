-- Complete Supabase Setup for Blog Application
-- Execute these scripts in order for full system deployment

-- 1. ENABLE REQUIRED EXTENSIONS
-- Run this first to ensure all required Postgres extensions are available
DO $$
BEGIN
    -- Enable UUID extension for generating UUIDs
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    
    -- Enable pgcrypto for password hashing and other crypto functions
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    
    -- Enable RLS (Row Level Security) - should be enabled by default in Supabase
    -- This is just to ensure it's enabled
END
$$;

-- 2. SETUP USER TABLES AND AUTHENTICATION
-- Ensure the users table is properly configured for profiles
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'editor')),
    profile_pic TEXT,
    display_name VARCHAR(255),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 3. SETUP ARTICLES SYSTEM
-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories policies (public read, admin write)
CREATE POLICY "Anyone can read categories" ON categories
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert categories" ON categories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Only admins can update categories" ON categories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor')
        )
    );

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    image_url TEXT,
    featured_image TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0
);

-- Enable RLS on articles
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

-- Articles policies
CREATE POLICY "Anyone can read published articles" ON articles
    FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can read their own articles" ON articles
    FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Admins can read all articles" ON articles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor')
        )
    );

CREATE POLICY "Authors can insert their own articles" ON articles
    FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their own articles" ON articles
    FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "Admins can update any article" ON articles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'editor')
        )
    );

-- 4. SETUP NOTIFICATIONS SYSTEM
-- Create notifications table with all required columns and constraints
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('new_article', 'comment', 'comment_reply', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    comment_id UUID, -- Reference to comments if you add comments table later
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- 5. SETUP STORAGE BUCKETS
-- Note: Storage buckets need to be created via Supabase Dashboard or API
-- These are the SQL policies for the buckets after creation

-- Profile Pictures Storage Policies
CREATE POLICY "Users can upload own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
);

CREATE POLICY "Anyone can view profile pictures" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-pictures');

CREATE POLICY "Users can update own profile pictures" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
);

CREATE POLICY "Users can delete own profile pictures" ON storage.objects
FOR DELETE USING (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1]::uuid = auth.uid()
);

-- Article Images Storage Policies
CREATE POLICY "Authenticated users can upload article images" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'article-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Anyone can view article images" ON storage.objects
FOR SELECT USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can update article images" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'article-images' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete article images" ON storage.objects
FOR DELETE USING (
    bucket_id = 'article-images' 
    AND auth.role() = 'authenticated'
);

-- 6. CREATE INDEXES FOR PERFORMANCE
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Articles table indexes
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_author_id ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_image_url ON articles(image_url) WHERE image_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_articles_featured_image ON articles(featured_image) WHERE featured_image IS NOT NULL;

-- Categories table indexes
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

-- 7. CREATE HELPER FUNCTIONS
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get profile picture URL with fallback
CREATE OR REPLACE FUNCTION get_profile_pic_url(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    pic_path TEXT;
    public_url TEXT;
BEGIN
    SELECT profile_pic INTO pic_path FROM users WHERE id = user_uuid;
    
    IF pic_path IS NULL OR pic_path = '' THEN
        RETURN NULL;
    END IF;
    
    -- Generate full URL for Supabase storage
    public_url := 'https://' || (SELECT value FROM pg_settings WHERE name = 'custom.supabase_url') || '/storage/v1/object/public/profile-pictures/' || pic_path;
    
    RETURN public_url;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup orphaned profile pictures
CREATE OR REPLACE FUNCTION cleanup_orphaned_profile_pics()
RETURNS void AS $$
DECLARE
    pic_record RECORD;
    user_exists BOOLEAN;
BEGIN
    FOR pic_record IN 
        SELECT name FROM storage.objects WHERE bucket_id = 'profile-pictures'
    LOOP
        -- Extract user ID from path (format: user_uuid/timestamp-profile.ext)
        SELECT EXISTS(
            SELECT 1 FROM users 
            WHERE id::text = split_part(pic_record.name, '/', 1)
        ) INTO user_exists;
        
        -- If user doesn't exist or profile_pic doesn't match, delete the file
        IF NOT user_exists OR NOT EXISTS(
            SELECT 1 FROM users 
            WHERE profile_pic = pic_record.name 
            OR profile_pic LIKE '%' || pic_record.name || '%'
        ) THEN
            DELETE FROM storage.objects 
            WHERE bucket_id = 'profile-pictures' 
            AND name = pic_record.name;
            
            RAISE NOTICE 'Deleted orphaned profile picture: %', pic_record.name;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. CREATE VIEWS FOR COMMON QUERIES
-- View for articles with author and category information
CREATE OR REPLACE VIEW articles_with_details AS
SELECT 
    a.*,
    u.display_name as author_name,
    u.profile_pic as author_profile_pic,
    c.name as category_name,
    c.slug as category_slug
FROM articles a
LEFT JOIN users u ON a.author_id = u.id
LEFT JOIN categories c ON a.category_id = c.id;

-- View for user notifications with creator details
CREATE OR REPLACE VIEW notifications_with_details AS
SELECT 
    n.*,
    u.display_name as creator_name,
    u.profile_pic as creator_profile_pic,
    a.title as article_title,
    a.slug as article_slug
FROM notifications n
LEFT JOIN users u ON n.created_by = u.id
LEFT JOIN articles a ON n.article_id = a.id;

-- 9. INSERT SAMPLE DATA (Optional - for development)
-- Create default admin user (you can modify this)
-- INSERT INTO users (id, email, role, display_name) 
-- VALUES (auth.uid(), 'admin@example.com', 'admin', 'Admin User')
-- ON CONFLICT (email) DO NOTHING;

-- Create default category
INSERT INTO categories (name, description, slug) 
VALUES ('General', 'General articles and posts', 'general')
ON CONFLICT (slug) DO NOTHING;

-- 10. FINAL SETUP NOTES
-- After running this script:
-- 1. Create storage buckets in Supabase Dashboard:
--    - profile-pictures (public, 5MB limit)
--    - article-images (public, 5MB limit)
-- 2. Set up authentication providers in Supabase Dashboard
-- 3. Configure your environment variables in your application
-- 4. Test all functionality before going to production

-- Add helpful comments
COMMENT ON TABLE users IS 'User profiles and authentication data';
COMMENT ON TABLE articles IS 'Blog articles and posts';
COMMENT ON TABLE categories IS 'Article categories for organization';
COMMENT ON TABLE notifications IS 'User notifications for various events';
COMMENT ON VIEW articles_with_details IS 'Articles with joined author and category information';
COMMENT ON VIEW notifications_with_details IS 'Notifications with joined creator and article information';

-- Success message
SELECT 'Supabase setup completed successfully! Remember to create storage buckets and configure authentication.' as setup_status;
