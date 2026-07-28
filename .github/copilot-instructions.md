# Copilot instructions

## Project facts

- npm workspace monorepo: `client` and `server`
- Client: React 19, Vite 8, Tailwind CSS 4, React Router 8
- Server: Node.js 24, Express 4, ES modules
- Supabase: PostgreSQL, Auth, Realtime, Storage
- Development URLs: client `http://localhost:5173`, server
  `http://localhost:5000`
- API routes have no `/api` prefix
- JavaScript code uses `.js`/`.jsx`; legacy `.mjs` paths no longer exist

Read the root `README.md`, relevant source files, and package scripts before
changing behavior. Preserve existing patterns and avoid unrelated refactors.

## Commands

Run from repository root:

```bash
npm ci
npm run dev
npm run build
npm --prefix client run lint
```

No automated test suite is configured. Never report tests as passing when only
the placeholder `npm test` scripts ran.

Production builds require `VITE_API_URL`, `VITE_SUPABASE_URL`, and
`VITE_SUPABASE_ANON_KEY`. Both URL values must use non-local HTTPS URLs.

## Architecture

```text
client/src/
├── components/
│   ├── auth/
│   ├── blog/
│   ├── common/
│   ├── layout/
│   └── ui/
├── contexts/
│   ├── AuthProvider.jsx
│   └── authContext.js
├── lib/supabaseClient.js
├── pages/
│   └── admin/
├── services/
└── utils/

server/
├── config/database.js
├── controllers/
├── middlewares/
├── migrations/
├── routes/
├── utils/
├── app.js
└── server.js
```

Client imports may use the `@` alias for `client/src`. Server imports are
relative and include the `.js` extension.

## Client conventions

- Define page routes in `client/src/App.jsx`.
- Lazy-load pages with `React.lazy`.
- Import `AuthProvider` from `client/src/contexts/AuthProvider.jsx`.
- Import `useAuth` and `AuthContext` from
  `client/src/contexts/authContext.js`.
- Wrap authenticated or admin pages with
  `client/src/components/auth/ProtectedRoute.jsx`.
- Use `client/src/services/api.js` for HTTP calls.
- Use `client/src/lib/supabaseClient.js` for realtime subscriptions.
- Preserve both `token` and `authToken` local-storage compatibility unless a
  deliberate migration removes it everywhere.
- Invalidate API cache after successful mutations.
- Use existing loading, error-boundary, and Sonner patterns.

The Axios instance has a 10-second default timeout. Individual operations may
override it. GET responses may use a five-minute in-memory cache. Network-level
errors and timeouts may be retried by `requestWithRetries`.

## Server conventions

- Configure middleware and mount routers in `server/app.js`.
- Keep `server/server.js` limited to environment loading, production validation,
  listener startup, and process shutdown.
- Put route declarations in `server/routes`, business handlers in
  `server/controllers`, and authentication checks in `server/middlewares`.
- Use `protectUser`, `optionalProtectUser`, or `protectAdmin` according to
  endpoint access.
- Use `getSupabase()` for service-role database work and
  `getSupabaseAuth()` for authentication operations.
- Validate input and return consistent JSON errors.
- Do not expose development-only diagnostic routes in production.

Route mounts:

```text
/auth
/admin
/blog
/upload
/notifications
/comments
/likes
```

## Environment

Canonical templates:

- `client/.env.example`
- `server/.env.example`

Client:

```env
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Server:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
FRONTEND_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

Never commit credentials. Never expose `SUPABASE_SERVICE_KEY` through a
`VITE_` variable or client code.

## Database and uploads

- Run SQL migrations in `server/migrations` in filename order.
- Storage buckets: `profile-pictures`, `article-images`.
- Upload field: `imageFile`.
- Upload limit: 3 MB.
- Accepted formats: JPEG, PNG, GIF, WebP.
- Profile uploads require a user; article image uploads require an admin.

## Validation

For client or full-stack changes:

```bash
npm --prefix client run lint
npm run build
```

Supply non-secret production-safe client variables when running the production
build gate. Do not weaken validation in `client/vite.config.js`.

For documentation-only changes, also run:

```bash
git diff --check
```

Report warnings, skipped checks, and missing test coverage explicitly.
