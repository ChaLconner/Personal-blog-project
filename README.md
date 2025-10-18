# 📝 Personal Blog Project

> A modern, full-stack blog application with advanced features and professional deployment-ready architecture.

[![React](https://img.shields.io/badge/React-19.0.0-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)](https://nodejs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-green?logo=supabase)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2.1-orange?logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 🌟 Features

### 🔐 **Authentication & Authorization**
- **Secure Authentication** - Supabase Auth with email/password
- **Role-based Access Control** - User, Admin, and Editor roles
- **Protected Routes** - Client-side and server-side route protection
- **Profile Management** - User profiles with customizable avatars

### 📚 **Content Management**
- **Rich Article Editor** - Create and edit articles with markdown support
- **Category System** - Organize content with hierarchical categories  
- **Draft & Publish** - Save drafts and publish when ready
- **Image Upload** - Profile pictures and article images via Supabase Storage

### 👨‍💼 **Admin Dashboard**
- **Complete Admin Panel** - Manage users, articles, categories
- **Analytics Dashboard** - View statistics and insights
- **Content Moderation** - Approve, edit, or delete user content
- **Notification System** - Real-time notifications for important events

### 🎨 **Modern UI/UX**
- **Responsive Design** - Mobile-first approach with Tailwind CSS 4.0
- **shadcn/ui Components** - Professional UI built on Radix UI primitives
- **Dark/Light Theme** - Theme switching with persistent preferences
- **Lazy Loading** - Optimized performance with code splitting
- **Loading States** - Smooth user experience with proper loading indicators

### 🚀 **Performance & SEO**
- **Code Splitting** - Lazy loading for optimal bundle size
- **Caching** - 5-minute API response caching
- **Image Optimization** - Responsive images with proper compression
- **Clean URLs** - SEO-friendly routing structure

## 🏗️ Project Architecture

### **Monorepo Structure**
```
my-side-project/
├── 📁 client/                  # React Frontend (Port 5173)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/            # shadcn/ui components
│   │   │   ├── NavBar.jsx     # Navigation component
│   │   │   ├── ArticleSection.jsx
│   │   │   └── ViewPost.jsx
│   │   ├── contexts/          # Authentication context
│   │   ├── pages/             # Page components
│   │   │   ├── admin/         # Admin panel pages
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── services/          # API integration layer
│   │   └── utils/             # Helper functions
│   ├── vite.config.js         # Vite configuration
│   └── package.json           # Frontend dependencies
├── 📁 server/                  # Node.js Backend (Port 3001)
│   ├── config/
│   │   └── database.js        # Supabase configuration
│   ├── middlewares/
│   │   ├── protectUser.mjs    # User authentication
│   │   └── protectAdmin.mjs   # Admin authorization
│   ├── routes/
│   │   ├── auth.mjs           # Authentication routes
│   │   ├── admin.mjs          # Admin API routes
│   │   ├── posts.js           # Blog post routes
│   │   ├── notifications.mjs  # Notification system
│   │   └── uploadSupabase.mjs # File upload handling
│   ├── migrations/            # Database setup scripts
│   ├── utils/                 # Server utilities
│   ├── server.js              # Express server entry
│   └── package.json           # Backend dependencies
├── 📄 package.json            # Root monorepo scripts
└── 📄 README.md               # This file
```

### **Technology Stack**

#### **Frontend Stack**
- **React 19** - Latest React with concurrent features
- **Vite 6.2** - Ultra-fast build tool and dev server
- **Tailwind CSS 4.0** - Utility-first CSS with `@tailwindcss/vite`
- **shadcn/ui** - High-quality components built on Radix UI
- **React Router DOM v7** - Client-side routing
- **Axios** - HTTP client with interceptors and caching
- **React Markdown** - Markdown rendering for articles
- **Framer Motion** - Smooth animations and transitions

#### **Backend Stack**  
- **Node.js 18+** with ES Modules (`"type": "module"`)
- **Express.js** - Web framework with middleware support
- **Supabase** - Database, authentication, and file storage
- **CORS** - Cross-origin resource sharing
- **Multer** - File upload handling
- **Environment Variables** - Native Node.js `--env-file` support

#### **Database & Services**
- **Supabase PostgreSQL** - Relational database with Row Level Security
- **Supabase Auth** - User authentication and session management  
- **Supabase Storage** - File storage for images and assets
- **Real-time Subscriptions** - Live updates for notifications

## 🚀 Quick Start

### **Prerequisites**
- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher  
- **Supabase Account** for database and authentication

### **1. Clone & Install**
```bash
# Clone the repository
git clone https://github.com/ChaLconner/Personal-blog-project.git
cd my-side-project

# Install all dependencies (both client and server)
npm run install:all
```

### **2. Environment Setup**

#### **Client Environment** (`.env` in `/client`)
```env
# Vite Environment Variables
VITE_API_URL=http://localhost:3001
```

#### **Server Environment** (`.env` in `/server`)
```env
# Server Configuration
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

### **3. Database Setup**
1. Create a new Supabase project
2. Run the migration script in Supabase SQL Editor:
   ```sql
   -- Copy and execute: /server/migrations/complete_supabase_setup.sql
   ```
3. Create Storage buckets in Supabase Dashboard:
   - `profile-pictures` (Public, 5MB limit)
   - `article-images` (Public, 5MB limit)

### **4. Start Development**
```bash
# Start both frontend (5173) and backend (3001)
npm run dev

# Or start individually:
npm run dev:client    # Frontend only
npm run dev:server    # Backend only
```

### **5. Access the Application**
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Health Check**: http://localhost:3001/health

## 📜 Available Scripts

### **Root Scripts** (Monorepo Management)
```bash
npm run dev              # Start both client and server concurrently
npm run build           # Build both client and server for production
npm run start           # Start both client and server in production mode
npm run install:all     # Install dependencies for both client and server
npm run clean           # Clean node_modules and build artifacts
```

### **Client Scripts** (Frontend)
```bash
cd client
npm run dev             # Start Vite dev server (port 5173)
npm run build          # Build for production
npm run preview        # Preview production build (port 4173)
npm run lint           # Run ESLint code quality checks
```

### **Server Scripts** (Backend)
```bash
cd server  
npm run dev            # Start with nodemon (auto-restart)
npm start              # Start production server
npm run prod           # Start with NODE_ENV=production
```

## 🌐 API Documentation

### **Authentication Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/auth/register` | User registration | ❌ |
| `POST` | `/auth/login` | User login | ❌ |
| `GET` | `/auth/get-user` | Get current user | ✅ |
| `POST` | `/auth/reset-password` | Password reset | ❌ |

### **Blog Post Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/blog/posts` | Get all published posts | ❌ |
| `GET` | `/blog/posts/:id` | Get single post by ID | ❌ |
| `GET` | `/blog/categories` | Get all categories | ❌ |

### **Admin Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/admin/posts` | Get all posts (including drafts) | 👑 Admin |
| `POST` | `/admin/posts` | Create new post | 👑 Admin |
| `PUT` | `/admin/posts/:id` | Update post | 👑 Admin |
| `DELETE` | `/admin/posts/:id` | Delete post | 👑 Admin |
| `GET` | `/admin/categories` | Manage categories | 👑 Admin |

### **Upload Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/upload/profile-image` | Upload profile picture | ✅ User |
| `POST` | `/upload/article-image` | Upload article image | ✅ User |

### **Notification Endpoints**
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `GET` | `/notifications/:userId` | Get user notifications | ✅ User |
| `PUT` | `/notifications/:id/read` | Mark as read | ✅ User |
| `POST` | `/notifications` | Create notification | 👑 Admin |

## 🚀 Deployment

### **Frontend Deployment (Vercel/Netlify)**

#### **Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from /client directory
cd client
vercel

# Environment Variables in Vercel Dashboard:
VITE_API_URL=https://your-backend-url.com
```

#### **Build Configuration**
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Root Directory**: `client`

### **Backend Deployment (Railway/Render)**

#### **Railway (Recommended)**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy from /server directory  
cd server
railway login
railway deploy

# Environment Variables in Railway Dashboard:
NODE_ENV=production
PORT=$PORT
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key
CLIENT_URL=https://your-frontend-url.vercel.app
```

#### **Alternative: Render/Heroku**
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`
- **Environment**: Node.js 18+

### **Database Deployment (Supabase)**
1. **Create Production Project** in Supabase Dashboard
2. **Run Migrations**: Execute `/server/migrations/complete_supabase_setup.sql`
3. **Setup Storage**: Create `profile-pictures` and `article-images` buckets
4. **Configure RLS**: Row Level Security policies are included in migrations
5. **Authentication**: Enable Email provider in Auth settings

### **Post-Deployment Checklist**
- [ ] Update `VITE_API_URL` in frontend to production backend URL
- [ ] Update `CLIENT_URL` in backend to production frontend URL  
- [ ] Test authentication flow end-to-end
- [ ] Verify file upload functionality
- [ ] Check admin panel access and functionality
- [ ] Test API endpoints with production data

## 🛠️ Development

### **Project Standards**
- **ES Modules**: Both client and server use `"type": "module"`
- **Code Quality**: ESLint configuration for consistent code style
- **Environment Separation**: Clear separation between dev/prod configs
- **Security**: Row Level Security (RLS) enabled on all database tables
- **Performance**: API caching, lazy loading, and optimized builds

### **Key Features Implementation**

#### **Authentication Flow**
1. **Dual Context Pattern**: Separate auth context for Fast Refresh compatibility
2. **Token Management**: Dual token storage (`token` + `authToken`) for compatibility
3. **Protected Routes**: Component-level and route-level protection
4. **Role-based Access**: User, Admin, Editor roles with proper middleware

#### **File Upload System**
1. **Two-step Process**: Upload to Supabase Storage, then update database
2. **Size Limits**: 5MB max for images
3. **Security**: User-specific folders and RLS policies
4. **Formats**: JPEG, PNG, GIF, WebP supported

#### **API Architecture**  
1. **Centralized Service**: Single API service with caching and interceptors
2. **Error Handling**: Consistent error responses and user-friendly messages
3. **Caching Strategy**: 5-minute cache for GET requests
4. **Environment Aware**: Different behaviors for dev/prod

### **Local Development Tips**
```bash
# Monitor both client and server logs
npm run dev

# Build and test production locally
npm run build && npm run prod

# Clean install (if having issues)  
npm run clean && npm run install:all

# Lint and fix code issues
cd client && npm run lint
```

## 🤝 Contributing

### **Getting Started**
1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create** a feature branch: `git checkout -b feature/amazing-feature`
4. **Install** dependencies: `npm run install:all`
5. **Setup** your local environment (see Environment Setup above)

### **Development Workflow**
1. **Make** your changes in appropriate files
2. **Test** both frontend and backend functionality
3. **Run** linting: `cd client && npm run lint`
4. **Build** to ensure no errors: `npm run build`
5. **Commit** with descriptive messages
6. **Push** to your fork and create a Pull Request

### **Coding Standards**
- **ES Modules** syntax (`import/export`)
- **Consistent** naming conventions (camelCase for variables, PascalCase for components)
- **Error Handling** with try/catch blocks and user-friendly messages
- **Comments** for complex logic and API endpoints
- **Environment Checks** for development vs production code

### **Commit Message Format**
```
type(scope): description

feat(auth): add password reset functionality  
fix(api): resolve user profile update issue
docs(readme): update deployment instructions
style(ui): improve mobile responsive design
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**ChaLconner**
- GitHub: [@ChaLconner](https://github.com/ChaLconner)
- Repository: [Personal-blog-project](https://github.com/ChaLconner/Personal-blog-project)

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Vite** for lightning-fast build tools  
- **Supabase** for backend-as-a-service platform
- **Tailwind CSS** for utility-first CSS framework
- **shadcn/ui** for beautiful, accessible components
- **Radix UI** for unstyled, accessible UI primitives

---

## 📊 Project Status

**Current Version**: 1.0.0
**Status**: ✅ Production Ready
**Last Updated**: October 2025

### **Features Status**
- ✅ User Authentication & Authorization
- ✅ Article Management (CRUD)
- ✅ Admin Dashboard
- ✅ File Upload System
- ✅ Notification System
- ✅ Responsive Design
- ✅ Production Deployment Ready

### **Upcoming Features**
- 🔄 Comment System Enhancement
- 🔄 Social Media Integration
- 🔄 Email Notifications
- 🔄 Advanced Analytics Dashboard
- 🔄 Content Scheduling
- 🔄 SEO Optimizations

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

[🐛 Report Bug](https://github.com/ChaLconner/Personal-blog-project/issues) · 
[✨ Request Feature](https://github.com/ChaLconner/Personal-blog-project/issues) · 
[📖 Documentation](https://github.com/ChaLconner/Personal-blog-project/wiki)

</div>
