-- Create post_likes table to track user likes
CREATE TABLE IF NOT EXISTS post_likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id) -- Prevent duplicate likes from same user
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON post_likes(created_at);

-- Add likes_count column to posts table if it doesn't exist
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Enable Row Level Security
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all likes
CREATE POLICY "Users can view all post likes" ON post_likes
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Users can only create their own likes
CREATE POLICY "Users can create their own likes" ON post_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own likes
CREATE POLICY "Users can delete their own likes" ON post_likes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Function to update likes count when post_likes change
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE posts 
        SET likes_count = (
            SELECT COUNT(*) 
            FROM post_likes 
            WHERE post_id = OLD.post_id
        )
        WHERE id = OLD.post_id;
        RETURN OLD;
    ELSE
        UPDATE posts 
        SET likes_count = (
            SELECT COUNT(*) 
            FROM post_likes 
            WHERE post_id = NEW.post_id
        )
        WHERE id = NEW.post_id;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update likes_count
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON post_likes;
CREATE TRIGGER trigger_update_post_likes_count
    AFTER INSERT OR DELETE ON post_likes
    FOR EACH ROW
    EXECUTE FUNCTION update_post_likes_count();
