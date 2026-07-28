# Personal Blog Project

Full-stack personal blog with a React frontend, Express API, and Supabase for
PostgreSQL, authentication, realtime notifications, and image storage.

## Features

- Public article feed, categories, article details, comments, and likes
- Email/password authentication through Supabase Auth
- User profiles with avatars and bios
- Admin dashboard for articles, categories, comments, and notifications
- Markdown article content
- Draft and published article states
- Realtime user notifications
- Responsive UI, lazy-loaded pages, and route protection
- Image uploads to Supabase Storage with type, magic-byte, and 5 MB size checks
- API response caching, retry handling, rate limiting, compression, Helmet, and CORS

## Tech stack

### Client

- React 19
- Vite 8
- React Router 8
- Tailwind CSS 4
- Radix UI components
- Axios
- Supabase JavaScript client
- React Markdown, Framer Motion, Lucide, and Sonner

### Server

- Node.js 24 with ES modules
- Express 4
- Supabase JavaScript client
- Multer
- Helmet, CORS, compression, and express-rate-limit

## Repository structure

```text
Personal-blog-project/
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── auth/
│       │   ├── blog/
│       │   ├── common/
│       │   ├── layout/
│       │   └── ui/
│       ├── contexts/
│       ├── lib/
│       ├── pages/
│       │   └── admin/
│       ├── services/
│       └── utils/
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── migrations/
│   ├── routes/
│   ├── utils/
│   ├── app.js
│   └── server.js
├── DEPLOYMENT.md
├── render.yaml
├── vercel.json
└── package.json
```

## Prerequisites

- Node.js 24
- npm 10 or 11
- A Supabase project. The Free plan is supported for the initial deployment;
  Pro-only security features can be enabled after upgrading.

## Local setup

### 1. Clone and install

```bash
git clone https://github.com/ChaLconner/Personal-blog-project.git
cd Personal-blog-project
npm ci
```

The root package uses npm workspaces for `client` and `server`.

### 2. Configure the client

Copy the client template:

```bash
cp client/.env.example client/.env
```

Then replace placeholder values in `client/.env`. `VITE_API_URL` defaults to
`http://localhost:5000` during Vite development. The Supabase variables enable
the client-side realtime notification service.

### 3. Configure the server

Copy the server template:

```bash
cp server/.env.example server/.env
```

Then replace placeholder values in `server/.env`. `CLIENT_URL` controls the
allowed CORS origin. `FRONTEND_URL` is used for authentication callback links.

> Never expose `SUPABASE_SERVICE_KEY` in the client, commit it, or prefix it
> with `VITE_`. It bypasses normal client-side access restrictions.

### 4. Prepare Supabase

Run the SQL files from `server/migrations` in this order using the Supabase SQL
Editor:

1. `000_full_schema.sql`
2. `001_schema_fix.sql`
3. `002_enable_rls.sql`
4. `003_fix_categories_rls.sql`
5. `004_add_bio_to_users.sql`
6. `005_fix_users_rls.sql`
7. `006_harden_rls.sql`
8. `007_remove_legacy_permissive_rls_policies.sql`
9. `008_backfill_post_authors_and_notification_index.sql`
10. `009_reconcile_timestamp_columns.sql`
11. `010_remove_duplicate_post_likes_unique_constraint.sql`
12. `011_split_legacy_articles_rls_policies.sql`
13. `012_set_storage_bucket_upload_limits.sql`
14. `add_indexes.sql`

Create these public Storage buckets if they do not already exist:

- `profile-pictures`
- `article-images`

The server also attempts to create a missing bucket on first upload when the
configured service role has permission.

### 5. Start development

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:5000>
- Health check: <http://localhost:5000/health>

Run either service separately:

```bash
npm run dev:client
npm run dev:server
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start client and server concurrently |
| `npm run dev:client` | Start Vite development server |
| `npm run dev:server` | Start Express with nodemon |
| `npm run build` | Build client; run server's no-op build script |
| `npm run start` | Start both workspace start scripts |
| `npm run install:all` | Install client and server dependencies separately |
| `npm run clean` | Remove generated client build and dependency directories |
| `npm run clean:logs` | Remove `.log` files outside `node_modules` |
| `npm run test` | Run client and server regression tests |

Client-only quality checks:

```bash
npm --prefix client run lint
npm --prefix client run build
```

## API overview

API routes are mounted directly; there is no `/api` prefix.

| Base path | Main operations | Access |
| --- | --- | --- |
| `/health` | Service and database health | Public |
| `/auth` | Register, login, session lookup, profile and password updates | Mixed |
| `/blog` | Published posts and categories | Public |
| `/comments` | List, create, and delete comments | Mixed |
| `/likes` | Toggle and inspect article likes | Authenticated |
| `/upload` | Profile and article images | User/Admin |
| `/notifications` | User notifications and admin statistics | User/Admin |
| `/admin` | Posts, categories, comments, and dashboard statistics | Admin |

Representative endpoints:

```text
GET    /health
POST   /auth/register
POST   /auth/login
GET    /auth/get-user
PUT    /auth/update-profile
GET    /blog/posts
GET    /blog/posts/:id
GET    /blog/categories
GET    /comments
POST   /comments
PUT    /likes/:postId/toggle
POST   /upload/profile
POST   /upload/image
GET    /notifications/:userId
GET    /admin/posts
POST   /admin/posts
PUT    /admin/posts/:id
DELETE /admin/posts/:id
```

Protected endpoints expect a Supabase access token:

```http
Authorization: Bearer <access-token>
```

## Production build

Production builds require all three client variables. `VITE_API_URL` and
`VITE_SUPABASE_URL` must use non-local HTTPS URLs. Set production-safe values
in the environment or an uncommitted `client/.env.production` before building.

```bash
npm run build
npm --prefix client run preview
npm --prefix server start
```

The Vite production output is written to `client/dist`. The Express server runs
directly from ES modules and does not need a compile step.

## Deployment

Repository deployment files target:

- Vercel for `client` through `vercel.json`
- Render for `server` through `render.yaml`
- Supabase for database, authentication, realtime, and Storage

Production client variables:

```env
VITE_API_URL=https://your-api.example.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Production server variables:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend.example.com
FRONTEND_URL=https://your-frontend.example.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

Render supplies `PORT`; do not hard-code it in hosted environments. See
[`DEPLOYMENT.md`](DEPLOYMENT.md) for the deployment checklist.

## Current limitations

- The regression suite covers critical request, authentication, visibility,
  notification, upload, and error-classification contracts.
- The API reference above is an overview, not an OpenAPI specification.
- Supabase schema changes are SQL files run manually; no migration runner is configured.

## Contributing

1. Create a branch from the current default branch.
2. Install dependencies with `npm ci`.
3. Make a focused change.
4. Run client lint and build checks.
5. Use a Conventional Commit message, for example:

```text
docs(readme): refresh project setup
```

## Repository

- GitHub: <https://github.com/ChaLconner/Personal-blog-project>
- Issues: <https://github.com/ChaLconner/Personal-blog-project/issues>
