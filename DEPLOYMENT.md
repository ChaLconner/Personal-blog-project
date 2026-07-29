# Deployment guide

Production architecture:

- `client`: Vercel
- `server`: Render
- Database, Auth, Realtime, and Storage: Supabase Free initially

Deployments use Node.js 24 as pinned by `.node-version`.

Do not commit production credentials. Configure them in each provider's
environment-variable settings.

## Before deployment

1. Run every SQL file in `server/migrations` in the order documented in
   [`README.md`](README.md).
2. Confirm the intended Supabase plan. The initial deployment supports Free.
   Leaked-password protection is unavailable until Pro, so keep that upgrade
   recorded as deferred. Review recommended Postgres upgrades separately and
   schedule them during a maintenance window.
3. Create the public Supabase Storage buckets `profile-pictures` and
   `article-images`.
4. Confirm local checks. The production build requires non-local HTTPS values
   for `VITE_API_URL` and `VITE_SUPABASE_URL`:

   ```bash
   npm --prefix client run lint
   npm run build
   ```

5. Commit and push the intended revision.

## Deploy the API to Render

The root [`render.yaml`](render.yaml) defines the Node web service with
`server` as its root directory.

Create or update a Render Blueprint from this repository. Supply all variables
marked `sync: false` when Render prompts:

```env
CLIENT_URL=https://your-frontend.example.com
FRONTEND_URL=https://your-frontend.example.com
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
```

Render supplies `PORT`; the application reads it at runtime. Do not expose
`SUPABASE_SERVICE_KEY` outside the server service.

For an existing Blueprint, verify `sync: false` values in the Render dashboard;
Blueprint updates do not overwrite them.

After deployment, verify:

```text
https://your-api.example.com/health
https://your-api.example.com/ready
```

`/health` is a lightweight process liveness check. `/ready` verifies Supabase
with a bounded timeout. Expected result for both is HTTP `200` with `status`
equal to `OK`; `/ready` returns HTTP `503` with `DEGRADED` when the process is
running but its database check failed.

### Render Free cold starts

Render Free web services spin down after an idle period. The scheduled
`.github/workflows/keep-render-awake.yml` workflow calls `/ready` every ten
minutes to keep the API and database path warm. GitHub schedule execution can
be delayed, and Render can restart Free instances, so the client also uses a
90-second readiness loop and displays persisted public article data during
wake-up.

The scheduled workflow consumes Free instance hours. One continuously warm
service uses nearly the full monthly allowance; review workspace usage before
adding another Free service.

## Deploy the client to Vercel

The root [`vercel.json`](vercel.json) installs and builds the `client`
workspace, publishes `client/dist`, and rewrites SPA routes to `index.html`.

Configure these Vercel variables for Production and Preview as appropriate:

```env
VITE_API_URL=https://your-api.example.com
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Vite embeds `VITE_*` values at build time. Redeploy after changing them.

After the first frontend deployment:

1. Set `CLIENT_URL` and `FRONTEND_URL` on Render to the final Vercel/custom
   domain.
2. Redeploy the API if Render requires it.
3. Add the frontend callback URL ending in `/auth/callback` to Supabase Auth
   redirect URLs.

## Verification checklist

- Frontend root and a deep route load without `404`
- `/health` responds
- `/ready` responds with `database` equal to `HEALTHY`
- Public posts and categories load
- Sign-up, email callback, login, and logout work
- Profile image upload works
- Admin authentication and protected routes work
- Article image upload and article CRUD work
- Comments, likes, and realtime notifications work
- Browser console has no CORS or mixed-content errors

## Troubleshooting

### CORS rejection

Ensure Render's `CLIENT_URL` exactly matches the frontend origin, including
scheme and without an unexpected trailing path.

### Authentication callback uses localhost

Set `FRONTEND_URL` on Render, add the production callback URL in Supabase, then
redeploy the API.

### Client still calls an old API

Update `VITE_API_URL` on Vercel and redeploy. Runtime changes alone cannot alter
values already embedded in a Vite build.

### Health check reports `DEGRADED`

Verify `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, database
schema, and network access from Render.
