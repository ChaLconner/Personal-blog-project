# Deployment Guide

## 🎯 **Architecture**
- **Frontend (Client)**: Deployed on Vercel
- **Backend (Server)**: Deployed on Render
- **Database**: Supabase (already configured)

## 🚀 **Vercel Deployment (Frontend)**

### **Automatic Deployment:**
1. Vercel is already connected to your GitHub repository
2. Every push to `main` branch triggers automatic deployment
3. Frontend will be available at: `https://personal-blog-project-six.vercel.app`

### **Environment Variables (Vercel):**
- `VITE_API_URL`: `https://personal-blog-project.onrender.com`

## 🖥️ **Render Deployment (Backend)**

### **Manual Setup:**
1. Go to [Render.com](https://render.com) and sign in with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your `Personal-blog-project` repository
4. Configure:
   - **Name**: `personal-blog-project`
   - **Runtime**: `Node`
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && npm start`
   - **Plan**: `Free`

### **Environment Variables (Render):**
```
NODE_ENV=production
PORT=10000
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
CLIENT_URL=https://personal-blog-project-six.vercel.app
```

### **Advanced Settings:**
- **Health Check Path**: `/health`
- **Auto-Deploy**: `Yes` (from main branch)

## 🔄 **Deployment Flow**

1. **Push to GitHub** → Triggers both deployments
2. **Vercel** builds and deploys frontend automatically
3. **Render** builds and deploys backend automatically
4. **Frontend** connects to backend via `VITE_API_URL`

## 🎯 **URLs After Deployment**
- **Frontend**: `https://personal-blog-project-six.vercel.app`
- **Backend API**: `https://personal-blog-project.onrender.com`
- **Health Check**: `https://personal-blog-project.onrender.com/health`

## ✅ **Verification Steps**

1. **Frontend**: Visit your Vercel URL and check if it loads
2. **Backend**: Visit `https://personal-blog-project.onrender.com/health`
3. **Integration**: Test login/signup from frontend to ensure API connection
4. **Blog Posts**: Check if articles load properly

## 🔧 **Troubleshooting**

### **CORS Issues:**
Server is configured to accept requests from your Vercel domains.

### **Environment Variables:**
Make sure all required environment variables are set in both Vercel and Render dashboards.

### **Build Errors:**
- Vercel: Check build logs in Vercel dashboard
- Render: Check deploy logs in Render dashboard

## 📊 **Monitoring**

- **Vercel**: Built-in analytics and logs
- **Render**: Service metrics and logs in dashboard
- **Supabase**: Database monitoring in Supabase dashboard
