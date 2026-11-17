# Deploying LENDLY

The app is three deployable pieces: a React static site, an Express API, and MongoDB.

```
apps/web     -> static build (Vite)          -> Render Static Site / Vercel / Netlify
apps/api     -> Node server (Express 5)       -> Render Web Service / Railway / Fly.io
MongoDB      -> Atlas free cluster (M0)       -> mongodb.com/atlas
```

`apps/web` talks to the API through `VITE_API_URL`, so the only wiring between the
two services is that one variable plus the API's `WEB_ORIGIN` (used for CORS).

---

## Option A - Render + MongoDB Atlas (recommended, both free)

Verified free tiers as of November 2026: Render free web service (512 MB), Render
free static sites, MongoDB Atlas M0 (512 MB, free forever).

### 1. Create the database
1. Sign up at https://www.mongodb.com/atlas and create a free **M0** cluster
   (choose a region near your users, e.g. Mumbai for Pune).
2. Database Access -> add a user with **Read and write to any database**.
3. Network Access -> allow access from `0.0.0.0/0` (Render uses dynamic IPs).
4. Copy the **SRV connection string**, e.g.
   `mongodb+srv://lendly:<password>@cluster0.xxxxx.mongodb.net/lendly?retryWrites=true&w=majority`

### 2. Deploy the API
1. Render dashboard -> **New -> Blueprint**, select this repository.
2. Render reads `render.yaml` and creates both services.
3. Fill in the three `sync: false` values on the `lendly-api` service:
   - `MONGODB_URI` = the Atlas SRV string
   - `WEB_ORIGIN` = `https://lendly-web.onrender.com`
   - `CLIENT_URL` = `https://lendly-web.onrender.com`
4. Wait for the build, then open `https://lendly-api.onrender.com/health` ->
   it must return `{"status":"ok","service":"lendly-api",...}`.

### 3. Deploy the website
1. Open the `lendly-web` service and set `VITE_API_URL` =
   `https://lendly-api.onrender.com` (this triggers a rebuild).
2. Open `https://lendly-web.onrender.com`.

### 4. Seed demo data (optional, once)
Run this from your laptop with the Atlas URI in `.env`:

```bash
MONGODB_URI="mongodb+srv://..." npm run seed
```

Demo logins: `admin@lendly.app`, `ananya@lendly.app`, `rohan@lendly.app`,
`isha@lendly.app` - password `Passw0rd`.

---

## Option B - Vercel (website) + Render (API) + Atlas (database)

Use this if you want the fastest CDN for the frontend. The API stays on Render
because it needs a long-running Node process.

1. Deploy the API on Render as in step 2 above (skip the static site).
2. Import the repo into Vercel. `vercel.json` in the repository root already
   contains the build command, output directory, and the SPA rewrite.
3. Add the environment variable `VITE_API_URL=https://lendly-api.onrender.com`.
4. Back on the Render API service, set `WEB_ORIGIN` and `CLIENT_URL` to the
   `https://<your-app>.vercel.app` URL, then redeploy.

---

## Option C - Railway (everything in one place)

Railway's free plan gives $1 of usage per month, the Hobby plan costs $5/month
with $5 of included usage. It can host the API *and* MongoDB, but MongoDB
through the Railway plugin is a paid add-on, so use Atlas for the database.

1. **New Project -> Deploy from GitHub**.
2. Add a **Node** service for the API:
   - Build: `npm ci && npm run build -w @lendly/shared && npm run build -w @lendly/api`
   - Start: `npm run start -w @lendly/api`
   - Variables: `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`,
     `WEB_ORIGIN`, `CLIENT_URL`, `EXPOSE_RESET_TOKEN=false`
3. Add a second service for the website:
   - Build: `npm ci && npm run build -w @lendly/shared && npm run build -w @lendly/web`
   - Publish: `apps/web/dist` (or use a static server such as `npx serve`)
   - Variable: `VITE_API_URL=<api domain>`
4. Add a rewrite so deep links work: Railway's static server needs
   `/*  /index.html  200` in `apps/web/public/_redirects` (already present for
   Netlify) or a `vercel.json`-style rewrite if you use a custom server.

---

## Option D - Netlify (website) + Render (API)

1. Netlify -> Add new site -> Import repository.
2. Build command: `npm run build -w @lendly/shared && npm run build -w @lendly/web`
3. Publish directory: `apps/web/dist`
4. Environment: `VITE_API_URL=https://lendly-api.onrender.com`
5. `apps/web/public/_redirects` already contains the SPA fallback.

---

## Environment variables reference

### API (`apps/api`)

| Variable | Required | Value |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `PORT` | no | Render/Railway set it automatically; default `4000` |
| `MONGODB_URI` | yes | Atlas SRV string |
| `JWT_SECRET` | yes | Long random string (Render can generate one) |
| `JWT_EXPIRES_IN` | no | `7d` |
| `WEB_ORIGIN` | yes | Exact frontend origin, e.g. `https://lendly-web.onrender.com` (used for CORS in production) |
| `CLIENT_URL` | no | Same as `WEB_ORIGIN` |
| `EXPOSE_RESET_TOKEN` | no | `false` in production - there is no mail server, so reset tokens are never returned |

### Website (`apps/web`)

| Variable | Required | Value |
|---|---|---|
| `VITE_API_URL` | yes | API base URL, e.g. `https://lendly-api.onrender.com`. Empty means "same origin", which only works when a host proxies `/api` to the API. |

---

## Things to know before you demo it publicly

- **Free-tier cold start.** A Render free service sleeps after ~15 minutes of
  inactivity, so the first request after a break takes 30-60 seconds. Keep the
  tab open before a presentation.
- **Uploaded images are temporary.** Uploads are written to `apps/api/uploads`
  on the server's local disk, which is wiped on redeploy and is not available on
  Render's free plan (no persistent disk). The seeded demo listings use hosted
  image URLs, so they always display. For durable uploads, attach a Render disk
  ($0.25/GB/month) or switch the upload route to MongoDB GridFS.
- **Password reset stops at step one in production.** `EXPOSE_RESET_TOKEN` is
  forced off outside development because no email service is wired up. The
  forgot-password screen still confirms the request, but no reset link is sent.
- **Registration is open and unverified.** New accounts are created as
  `unverified`; an admin can approve them from the Admin dashboard. Add an
  email-verification step before sharing the URL widely.
- **The rate limiter** allows 100 authentication requests per 15 minutes per IP.
- **Never commit `.env`.** It is already in `.gitignore`; keep the real
  `JWT_SECRET` and Atlas password only in the hosting dashboard.

---

## Local check before deploying

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run dev        # API on :4000, web on :5175
```
