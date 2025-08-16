# Supabase Setup Guide

This guide will help you set up Supabase for the blog application.

## Prerequisites

- Supabase account (free tier available)
- Node.js and npm installed

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - Name: `my-blog-project` (or any name you prefer)
   - Database Password: Create a strong password
   - Region: Choose the closest region to your location
6. Click "Create new project"

## Step 2: Get Project Credentials

1. Go to your project dashboard
2. Navigate to Settings → API
3. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Service Role Key** (anon public key won't work for server-side operations)

## Step 3: Configure Environment Variables

1. In the `server` directory, copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   ```

## Step 4: Set Up Database Schema

Based on your database structure, create the following tables in your Supabase dashboard:

1. In your Supabase dashboard, go to the SQL Editor
2. Run the following SQL to create the required tables:

```sql
-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    profile_pic VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Create statuses table
CREATE TABLE statuses (
    id SERIAL PRIMARY KEY,
    status VARCHAR(50) NOT NULL UNIQUE
);

-- Create posts table
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    image VARCHAR(500),
    category_id INTEGER REFERENCES categories(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    content TEXT,
    status_id INTEGER REFERENCES statuses(id) DEFAULT 1,
    likes_count INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id)
);

-- Create comments table
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Insert default categories
INSERT INTO categories (name) VALUES 
('General'), ('Technology'), ('Lifestyle'), ('Travel'), ('Food'), ('Cat'), ('Inspiration');

-- Insert default statuses
INSERT INTO statuses (status) VALUES 
('active'), ('draft'), ('archived');

-- Create indexes for better performance
CREATE INDEX idx_posts_category_id ON posts(category_id);
CREATE INDEX idx_posts_date ON posts(date);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
```

3. Add some sample data (optional):

```sql
-- Insert a sample user
INSERT INTO users (email, password, username, name, profile_pic, role) VALUES
('admin@example.com', 'hashed_password', 'admin', 'Admin User', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face&auto=format&q=60', 'admin');

-- Insert sample posts (replace user_id with the actual user ID)
INSERT INTO posts (image, category_id, title, description, content, user_id) VALUES
('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop&auto=format&q=60', 
 1, 'Welcome to Our Blog', 'This is our first blog post!', 'Hello and welcome to our amazing blog...', 1);
```

## Step 5: Test the Connection

1. Start your server:
   ```bash
   cd server
   npm run dev
   ```

2. Test the API endpoints:
   ```bash
   # Get all posts
   curl http://localhost:3001/api/blog/posts

   # Get single post
   curl http://localhost:3001/api/blog/posts/1

   # Get comments for a post
   curl http://localhost:3001/api/comments?postId=1
   ```

## Database Schema Overview

### Tables Created

1. **users**
   - `id` (Primary Key)
   - `email`, `password`, `username`, `name`
   - `profile_pic`, `role`
   - `created_at`

2. **categories**
   - `id` (Primary Key)
   - `name` (Unique)

3. **statuses**
   - `id` (Primary Key)
   - `status` (Unique)

4. **posts**
   - `id` (Primary Key)
   - `image`, `title`, `description`, `content`
   - `date` (timestamp), `likes_count`
   - `category_id` (Foreign Key), `user_id` (Foreign Key)
   - `status_id` (Foreign Key)

5. **comments**
   - `id` (Primary Key)
   - `post_id` (Foreign Key), `user_id` (Foreign Key)
   - `comment_text`, `created_at`

6. **likes**
   - `id` (Primary Key)
   - `post_id` (Foreign Key), `user_id` (Foreign Key)
   - `liked_at`

### Indexes Created
- Category index for faster filtering
- Post ID index for comments
- Created date indexes for sorting

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure your `.env` file exists and contains the correct values
   - Check that you're using the Service Role key, not the anon public key

2. **"Authentication required"**
   - Ensure RLS policies are properly configured
   - For development, the provided schema allows public read access

3. **"Table does not exist"**
   - Run the schema.sql file in your Supabase SQL Editor
   - Or use the seeder script: `npm run seed`

4. **CORS Issues**
   - The server is configured with CORS for localhost:5173
   - Update FRONTEND_URL in .env if using different port

### Support

If you encounter issues:
1. Check the Supabase dashboard logs
2. Review server console for error messages
3. Ensure all environment variables are correctly set

## Next Steps

- Set up authentication (optional)
- Add image upload functionality
- Implement user roles and permissions
- Add more advanced filtering and pagination
