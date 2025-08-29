-- Create post_likes table
CREATE TABLE IF NOT EXISTS post_likes (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure one like per user per post
  UNIQUE(post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes(user_id);

-- Create comments table (if not exists, update existing)
CREATE TABLE IF NOT EXISTS comments (
  id BIGSERIAL PRIMARY KEY,
  post_id BIGINT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  image TEXT,
  email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for comments
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for post_likes
DROP POLICY IF EXISTS "Users can view all likes" ON post_likes;
CREATE POLICY "Users can view all likes" ON post_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own likes" ON post_likes;
CREATE POLICY "Users can insert their own likes" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own likes" ON post_likes;
CREATE POLICY "Users can delete their own likes" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comments
DROP POLICY IF EXISTS "Users can view all comments" ON comments;
CREATE POLICY "Users can view all comments" ON comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own comments" ON comments;
CREATE POLICY "Users can insert their own comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Add likes_count to posts table if it doesn't exist
ALTER TABLE posts ADD COLUMN IF NOT EXISTS likes_count INTEGER DEFAULT 0;

-- Create function to update likes_count automatically
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update likes_count
DROP TRIGGER IF EXISTS update_post_likes_count_trigger ON post_likes;
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Update existing posts with current like counts
UPDATE posts SET likes_count = (
  SELECT COUNT(*) 
  FROM post_likes 
  WHERE post_likes.post_id = posts.id
) WHERE likes_count IS NULL OR likes_count = 0;
