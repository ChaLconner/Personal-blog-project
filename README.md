# Personal Blog Project

A full-stack blog application built with React, Node.js, Express, and Supabase.

## 🚀 Features

- **User Authentication** - Secure login/signup with Supabase Auth
- **Profile Management** - Upload profile pictures to Supabase Storage
- **Article Management** - Create, edit, delete articles with rich content
- **Admin Dashboard** - Complete admin panel for content management
- **Real-time Notifications** - Get notified about new articles and comments
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Modern UI** - Built with Radix UI components

## Project Structure

```
my-side-project/
├── src/                    # React frontend source
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API service functions
│   ├── data/              # Static data (moved to server)
│   └── ...
├── server/                # Backend server
│   ├── data/              # Data files
│   ├── server.js          # Express server
│   └── package.json       # Server dependencies
├── public/                # Static assets
└── package.json           # Frontend dependencies
```

## Features

### Frontend (React + Vite)
- Modern React with Vite for fast development
- Responsive design with Tailwind CSS
- Component-based architecture
- React Router for navigation
- API integration with axios

### Backend (Node.js + Express)
- RESTful API design
- CORS enabled for frontend integration
- Environment configuration
- Modular data structure

## Quick Start

### Option 1: Run Both Client and Server Together

1. Install all dependencies:
   ```bash
   npm run install:all
   ```

2. Start both frontend and backend:
   ```bash
   npm run dev:full
   ```

This will start:
- Frontend on `http://localhost:5173`
- Backend on `http://localhost:5000`

### Option 2: Run Separately

#### Frontend Only
```bash
npm install
npm run dev
```

#### Backend Only
```bash
cd server
npm install
npm run dev
```

## Available Scripts

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Combined Scripts
- `npm run dev:full` - Start both frontend and backend
- `npm run server` - Start backend only
- `npm run install:all` - Install dependencies for both

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

### Backend (server/.env)
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

- `GET /api/posts` - Get all blog posts
- `GET /api/posts/:id` - Get single post
- `GET /api/comments` - Get comments
- `GET /api/categories` - Get categories
- `GET /api/stats` - Get blog statistics

## Technologies Used

### Frontend
- React 19
- Vite
- Tailwind CSS
- React Router DOM
- Axios
- Framer Motion
- Various UI libraries (@radix-ui, lucide-react)

### Backend
- Node.js
- Express.js
- CORS
- dotenv

## Development

1. Make sure both `.env` files are configured
2. Start the development servers
3. Frontend will proxy API requests to the backend
4. Hot reload is enabled for both frontend and backend

## Deployment

### Frontend
Can be deployed to Vercel, Netlify, or any static hosting service.

### Backend
Can be deployed to Heroku, Railway, or any Node.js hosting service.

Make sure to update the `VITE_API_URL` in frontend to point to your deployed backend URL.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request
