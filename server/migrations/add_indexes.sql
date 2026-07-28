-- Migration to add performance indexes on frequently queried tables
-- Run this in your Supabase SQL Editor

-- 1. Index on comments post_id and created_at
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON comments(post_id, created_at DESC);

-- 2. Index on post_likes post_id and user_id for fast lookup
CREATE INDEX IF NOT EXISTS idx_post_likes_post_user ON post_likes(post_id, user_id);

-- 3. Index on notifications user_id and read status
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read, created_at DESC);

-- 4. Index on users email and username
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(lower(email));
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
