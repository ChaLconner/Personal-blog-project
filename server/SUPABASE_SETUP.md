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

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the contents of `server/database/schema.sql`
3. Paste it into the SQL Editor and run it
4. This will create the necessary tables and insert sample data

## Step 5: Alternative - Use Seeder Script

If you prefer to use the seeder script instead of running SQL directly:

1. Make sure your environment variables are set up
2. Run the seeder script:
   ```bash
   cd server
   npm run seed
   ```

## Step 6: Configure Row Level Security (Optional)

The schema already includes basic RLS policies for public read access. For production, you may want to add more restrictive policies:

### For Admin Operations
```sql
-- Allow authenticated users to insert/update/delete posts
CREATE POLICY "Allow authenticated users to modify posts" ON blog_posts
    FOR ALL USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert comments
CREATE POLICY "Allow authenticated users to create comments" ON comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## Step 7: Test the Connection

1. Start your server:
   ```bash
   cd server
   npm run dev
   ```

2. Test the API endpoints:
   ```bash
   # Get all posts
   curl http://localhost:5000/api/posts

   # Get single post
   curl http://localhost:5000/api/posts/1

   # Get comments for a post
   curl http://localhost:5000/api/comments?postId=1
   ```

## Database Schema Overview

### Tables Created

1. **blog_posts**
   - `id` (Primary Key)
   - `title`, `description`, `content`
   - `image`, `category`, `author`
   - `likes` (Integer)
   - `created_at`, `updated_at`
   - `date` (String - for display compatibility)

2. **comments**
   - `id` (Primary Key)
   - `post_id` (Foreign Key to blog_posts)
   - `name`, `comment`, `image`
   - `created_at`
   - `date` (String - for display compatibility)

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
