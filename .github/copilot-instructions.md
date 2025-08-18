# Copilot Instructions for Blog Application

## Project Overview

This is a full-stack blog application built with React + Vite frontend and Node.js + Express backend, using Supabase for authentication and data storage. The project follows a monorepo structure with clear separation between client and server components.

## Architecture

### Frontend Stack
- **React 19** with Vite as build tool
- **Tailwind CSS** for styling
- **shadcn/ui** components built on Radix UI primitives
- **React Router DOM** for routing
- **Axios** for API calls with interceptors
- **Supabase** for authentication (client-side)

### Backend Stack
- **Node.js** with ES modules (`"type": "module"`)
- **Express.js** framework
- **Supabase** for database and auth (server-side)
- **CORS** enabled for frontend integration
- **Multer** for file uploads

## Directory Structure

```
project-root/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/        # shadcn/ui component wrappers
│   │   ├── contexts/      # React context providers
│   │   ├── pages/         # Route components
│   │   ├── services/      # API service layer
│   │   └── utils/         # Helper functions
│   └── package.json
└── server/                # Express backend
    ├── routes/            # API route handlers
    ├── middlewares/       # Authentication middleware
    ├── config/            # Database configuration
    └── package.json
```

## Development Workflow

### Starting Development Servers
```bash
# Install all dependencies (client + server)
npm run install:all

# Start both client and server concurrently
npm run dev:full

# Or start individually:
npm run dev        # Client only (port 5173)
npm run server     # Server only (port 3001)
```

### Environment Setup
- **Client**: Uses `VITE_` prefixed environment variables
- **Server**: Uses `--env-file=.env` with Node.js native support
- **Ports**: Client (5173), Server (3001/5000)

## Key Patterns & Conventions

### Authentication Flow
1. **Context Provider**: `AuthProvider` in `src/contexts/auth.jsx`
   - Manages global auth state
   - Provides login, logout, register methods
   - Auto-fetches user data on app initialization
   - Stores JWT tokens in localStorage with dual keys (`token` + `authToken`)

2. **Protected Routes**: Use `ProtectedRoute` component
   ```jsx
   <ProtectedRoute>
     <ProtectedComponent />
   </ProtectedRoute>
   ```

3. **API Integration**: Token automatically added via axios interceptors
   ```javascript
   // Automatic header injection
   Authorization: `Bearer ${token}`
   ```

### shadcn/ui Component Structure
- Components located in `src/components/ui/`
- Built on Radix UI primitives
- Use `cn()` utility for conditional styling
- Standard export pattern:
  ```jsx
  export { ComponentName, ComponentVariant, ComponentFallback }
  ```

### API Service Layer
- Centralized in `src/services/api.js`
- Built on axios with interceptors
- Includes caching for performance
- Error handling with user-friendly messages
- Authentication token management

### Server-Side Patterns
1. **ES Modules**: All `.js` files use import/export syntax
2. **Route Structure**: 
   - `routes/auth.mjs` - Authentication endpoints
   - `routes/posts.js` - Blog post CRUD
   - `routes/admin.mjs` - Admin functionality
3. **Middleware**: Authentication middleware for protected routes
4. **Supabase Integration**: Server-side client for database operations

## Common Tasks & Examples

### Adding New UI Components
1. Create component in `src/components/ui/`
2. Follow shadcn/ui patterns with Radix UI
3. Export all variants and sub-components
4. Use `cn()` utility for styling

### Creating Protected Pages
```jsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

function MyProtectedPage() {
  return (
    <ProtectedRoute>
      <div>Protected content here</div>
    </ProtectedRoute>
  );
}
```

### Adding API Endpoints
1. **Server**: Add route handler in appropriate file
2. **Client**: Add method to `blogApi` object in `services/api.js`
3. **Authentication**: Use middleware for protected routes

### Form Handling with Authentication
```jsx
import { useAuth } from '@/contexts/authContext.js';

function MyForm() {
  const { login, register, state } = useAuth();
  
  const handleSubmit = async (formData) => {
    const result = await login(formData);
    if (result.success) {
      // Handle success
    } else {
      // Handle error: result.error
    }
  };
}
```

### Error Handling Pattern
- **API Layer**: Consistent error throwing with user-friendly messages
- **Components**: Use try/catch with loading states
- **Toast Notifications**: For user feedback (using Sonner)

## Important Implementation Details

### Authentication Context
- **Dual State Management**: Separate loading states for auth actions and user fetching
- **Token Storage**: Both `token` and `authToken` keys for compatibility
- **Auto-refresh**: User data fetched on app initialization
- **Error Handling**: Invalid tokens automatically removed

### API Service Features
- **Request Interceptors**: Auto-inject auth tokens
- **Response Interceptors**: Centralized error handling
- **Caching**: 5-minute cache for GET requests
- **Timeout**: 30-second default timeout
- **Environment Aware**: Different behaviors for dev/prod

### Navigation & Routing
- **Consistent NavBar**: Always use main `NavBar` component, avoid `WebSection` NavBar
- **Protected Routes**: Wrap sensitive pages with `ProtectedRoute`
- **Admin Routes**: Separate admin section with role-based access

### Database Integration
- **Supabase**: Primary database and auth provider
- **Row Level Security**: Configured on Supabase side
- **Real-time**: Available for future features

## Testing & Deployment

### Scripts Available
```bash
# Client
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint checking

# Server  
npm start            # Production server
npm run dev          # Development with nodemon
```

### Build Process
- **Client**: Vite builds to `dist/` directory
- **Server**: No build step (ES modules run directly)
- **Environment**: Use appropriate `.env` files per environment

## Best Practices

### Code Organization
- Keep components focused and single-purpose
- Use custom hooks for complex logic
- Separate business logic from UI components
- Follow established file naming conventions

### State Management
- Use React Context for global state (auth, theme)
- Local state for component-specific data
- Avoid prop drilling with context providers

### Performance
- Leverage API caching in service layer
- Use React.memo for expensive components
- Optimize bundle size with code splitting

### Security
- Never expose sensitive data in frontend
- Always validate data on server-side
- Use protected routes for sensitive areas
- Sanitize user inputs

## Troubleshooting Common Issues

### Import/Export Errors
- Ensure proper file extensions (.js, .jsx, .mjs)
- Check if components export all required parts
- Verify import paths use correct aliases (`@/`)

### Authentication Issues
- Check token storage (both `token` and `authToken`)
- Verify API endpoints match server routes
- Ensure Supabase configuration is correct

### Build Issues
- Ensure all dependencies are installed
- Check for TypeScript errors if using TS
- Verify environment variables are set

## Development Environment

### VS Code Extensions (Recommended)
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense  
- ESLint
- Prettier
- Auto Rename Tag

### Browser Development Tools
- React Developer Tools
- Network tab for API debugging
- Application tab for localStorage inspection

---

When working on this project, always consider the full-stack nature and ensure changes work cohesively between client and server components. Prioritize user experience, security, and maintainability in all implementations.
