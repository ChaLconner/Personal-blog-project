# Blog API Server

Backend server for the blog application built with Node.js, Express, and Supabase.

## Features

- RESTful API for blog posts
- Comments system with create functionality
- Categories management
- Search functionality
- Supabase integration for data persistence
- CORS enabled for frontend integration

## Technology Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Supabase** - Database and backend services
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Supabase
Follow the detailed setup guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 3. Configure Environment
```bash
cp .env.example .env
# Update .env with your Supabase credentials
```

### 4. Set Up Database
**Recommended**: Run SQL directly in Supabase dashboard using `database/schema.sql`

**Alternative**: Check database connection:
```bash
npm run check-db
```

Note: The `npm run seed` command now only checks database connectivity. All sample data is included in the `schema.sql` file.

### 5. Start Development Server
```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Blog Posts
- `GET /api/posts` - Get all blog posts (with optional filters)
- `GET /api/posts/:id` - Get single blog post by ID

### Comments
- `GET /api/comments` - Get all comments (with optional post filter)

### Categories
- `GET /api/categories` - Get all categories

### Stats
- `GET /api/stats` - Get blog statistics

## Query Parameters

### Posts Endpoint
- `category` - Filter by category
- `limit` - Limit number of results
- `search` - Search in title, description, and content

### Comments Endpoint
- `postId` - Filter comments by post ID

## Setup and Installation

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Update `.env` file with your configuration

5. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5000`

## Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm run check-db` - Check database connection and status
- `npm run seed` - Alias for check-db (deprecated - use schema.sql instead)
- `npm test` - Run tests (not implemented yet)

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Your Supabase service role key

## Data Structure

### Blog Post
```javascript
{
  id: number,
  image: string,
  category: string,
  title: string,
  description: string,
  author: string,
  date: string,
  likes: number,
  content: string
}
```

### Comment
```javascript
{
  id: number,
  postId: number,
  name: string,
  date: string,
  comment: string,
  image: string
}
```

## Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- User authentication and authorization
- Post creation/editing endpoints
- Comment posting functionality
- File upload for images
- Rate limiting
- Input validation and sanitization
