# Blog API server

Express API for Personal Blog Project. Supabase provides PostgreSQL,
authentication, and image storage.

For full-project setup and architecture, see the root
[`README.md`](../README.md).

## Requirements

- Node.js 24
- npm 10 or 11
- A configured Supabase project

## Setup

From the repository root:

```bash
npm ci
cp server/.env.example server/.env
```

Replace all placeholders in `server/.env`, then run the SQL files in
`server/migrations` in filename order.

Start only the API:

```bash
npm run dev:server
```

Default URL: <http://localhost:5000>

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORT` | No | Listening port; defaults to `5000` |
| `NODE_ENV` | No | Enables development-only logging and test routes |
| `CLIENT_URL` | Production | Allowed browser origin for CORS |
| `FRONTEND_URL` | Production | Base URL for authentication callback links |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_ANON_KEY` | Yes | Auth and user-scoped Supabase client |
| `SUPABASE_SERVICE_KEY` | Yes | Server-only service-role client |

Never expose `SUPABASE_SERVICE_KEY` to browser code or commit its value.

## Route groups

Routes are mounted directly; there is no `/api` prefix.

| Base path | Purpose | Access |
| --- | --- | --- |
| `/health` | Process and database health | Public |
| `/auth` | Registration, login, user lookup, profile, password | Mixed |
| `/blog` | Published posts and categories | Public |
| `/comments` | Comment listing, creation, deletion | Mixed |
| `/likes` | Like state and toggling | Authenticated |
| `/upload` | Profile and article image storage | User/Admin |
| `/notifications` | User and admin notifications | User/Admin |
| `/admin` | Content management and statistics | Admin |

Protected routes expect:

```http
Authorization: Bearer <supabase-access-token>
```

## Storage uploads

- Buckets: `profile-pictures`, `article-images`
- Form field: `imageFile`
- Maximum file size: 5 MB
- Accepted formats: JPEG, PNG, GIF, WebP
- JPEG, PNG, and WebP uploads are auto-oriented, stripped of metadata, resized
  without enlargement, and stored as WebP (`512x512` profile, `1920x1920`
  article bounds)
- GIF uploads remain GIF to preserve animation
- Files remain in memory only until uploaded to Supabase Storage

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start with nodemon |
| `npm start` | Start with Node |
| `npm run build` | Confirm no server compilation is required |
| `npm test` | Run server regression tests |

## Source layout

```text
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

`server.js` loads `server/.env` and starts the listener. `app.js` configures
middleware, health checks, route mounts, and error handling.
