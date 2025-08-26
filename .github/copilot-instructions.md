# Copilot Instructions for Blog Application

## Project Overview

This is a full-stack blog application built with React + Vite frontend and Node.js + Express backend, using Supabase for authentication and data storage. The project follows a true monorepo structure with both client and server in same repository.

## Architecture

### Frontend Stack
- **React 19** with Vite (port 5173)
- **Tailwind CSS 4.0** with `@tailwindcss/vite` plugin
- **shadcn/ui** components built on Radix UI primitives  
- **React Router DOM v7** for routing
- **Axios** with interceptors and 5-minute caching
- **Supabase** client-side integration

### Backend Stack
- **Node.js** with ES modules (`"type": "module"`)
- **Express.js** (port 3001/5000)
- **Supabase Auth** for authentication
- **CORS** enabled for frontend integration
- **Multer** for file uploads to `/server/uploads/`
- **Environment**: Uses `--env-file=.env` with native Node.js support

## Development Workflow

### Critical Commands
```bash
# Install all dependencies (both client + server)
npm run install:all

# Start both frontend and backend concurrently  
npm run dev

# Individual services
cd client && npm run dev          # Frontend only
cd server && npm run dev          # Backend only (with nodemon)
```

### Project Structure Reality
```
my-side-project/
├── client/                      # React frontend (port 5173)
│   ├── src/
│   │   ├── components/ui/       # shadcn/ui components
│   │   ├── contexts/           # auth.jsx + authContext.js (DUAL pattern)
│   │   ├── pages/              # Page components
│   │   ├── services/api.js     # Centralized API with caching
│   │   └── utils/              # Helper functions
│   ├── vite.config.js         # "@" alias to ./src
│   └── package.json
└── server/                     # Express backend (port 3001)
    ├── routes/                 # *.mjs files use ES modules
    ├── middlewares/           # protectUser.mjs, protectAdmin.mjs  
    ├── config/database.js     # Supabase client config
    ├── uploads/               # Static file storage
    └── server.js              # Main entry point
```

## Critical Authentication Patterns

### Dual Context Architecture (IMPORTANT)
The project uses a **dual auth context pattern**:
- `contexts/auth.jsx` - AuthProvider implementation with state management
- `contexts/authContext.js` - Context creation and useAuth hook (Fast Refresh compatibility)

```jsx
// In auth.jsx
import { AuthContext } from './authContext.js';
export function AuthProvider({ children }) { /* implementation */ }

// In authContext.js  
export const AuthContext = createContext();
export const useAuth = () => { /* hook implementation */ }
```

### Token Management
Dual token storage for compatibility:
```javascript
// Both keys stored for legacy and new code
localStorage.setItem("token", token);
localStorage.setItem("authToken", token);
```

### Protected Route Pattern
```jsx
import ProtectedRoute from '@/components/ProtectedRoute';

// Usage with flexible role checking
<ProtectedRoute 
  isLoading={loading}
  isAuthenticated={isAuthenticated} 
  userRole={user?.role}
  requireAdmin={true}  // Backward compatibility
  requiredRole="admin" // Flexible role checking
>
  <Component />
</ProtectedRoute>
```

## API Service Architecture

### Centralized Service (`src/services/api.js`)
- **Built-in caching**: 5-minute cache for GET requests
- **Automatic token injection**: Reads from both `token` and `authToken` keys
- **Error handling**: Browser extension interference filtering
- **Timeout**: 30-second default
- **Environment aware**: Different behaviors for dev/prod

### Critical API Patterns
```javascript
// Multi-part file upload
await blogApi.uploadProfileImage(file);

// Admin operations with cache clearing
await blogApi.admin.createPost(data); // Automatically clears cache

// Error handling with user-friendly messages
try {
  const posts = await blogApi.getPosts({ category: 'tech' });
} catch (error) {
  // Returns structured fallback instead of throwing
}
```

## Server-Side Patterns

### File Extensions Matter
- `.mjs` files: ES modules for routes (auth.mjs, admin.mjs, upload.mjs)
- `.js` files: Regular modules (blogRouter.js, posts.js)
- All use `import/export` syntax due to `"type": "module"`

### Supabase Auth Integration
```javascript
// Server auth check pattern
const { data, error } = await supabase.auth.getUser(token);
// Then fetch additional user data from users table
const { data: userData } = await supabase.from('users').select('*').eq('id', data.user.id);
```

### Middleware Pattern
```javascript
import protectUser from '../middlewares/protectUser.mjs';

// Attaches req.user and req.userId
router.use('/protected-route', protectUser, handlerFunction);
```

## Environment Configuration

### Client (.env)
```
VITE_API_URL=http://localhost:3001
```

### Server (.env) 
```
PORT=3001
CLIENT_URL=http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

## File Upload System

### Upload Structure
- **Storage**: `/server/uploads/images/` for profile pictures
- **Size limit**: 5MB max
- **Formats**: JPEG, PNG, GIF, WebP
- **API**: Separate upload then update profile flow

```javascript
// Two-step process
const uploadResult = await blogApi.uploadProfileImage(file);
const updateResult = await blogApi.auth.updateProfile({ imageUrl: uploadResult.imageUrl });
```

## Development Quirks

### Import Paths
- **Client**: Uses `@/` alias for `./src`
- **Server**: Relative imports only, `.mjs` extensions required
- **Components**: Always export from `ui/` directory

### Port Management  
- **Frontend**: Always 5173 (Vite default)
- **Backend**: 3001 (development), 5000 (production fallback)
- **Concurrency**: Root package.json manages both with `concurrently`

### CSS Framework
- **Tailwind 4.0**: Uses `@tailwindcss/vite` plugin (not postcss)
- **Utilities**: `cn()` function from `lib/utils.js` for conditional classes
- **Components**: All shadcn/ui components pre-configured

## Common Tasks

### Adding New Route
1. **Server**: Add to appropriate `.mjs` file in `/routes`
2. **Client**: Add to `blogApi` object in `services/api.js`
3. **Auth required**: Use `protectUser` or `protectAdmin` middleware

### Creating Protected Page
```jsx
function MyPage() {
  const { user, loading, isAuthenticated } = useAuth();
  
  return (
    <ProtectedRoute
      isLoading={loading}
      isAuthenticated={isAuthenticated}
      userRole={user?.role}
      requireAdmin={true}
    >
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

### File Upload Implementation
Always use two-step process: upload file first, then update record with URL.

---

**Key Development Notes**: 
- Always run `npm run dev` from root (starts both client and server)
- File uploads require authentication and use separate endpoints
- Dual token storage ensures compatibility between old and new code
- Cache is automatically managed but can be manually cleared with `blogApi.clearCache()`

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
