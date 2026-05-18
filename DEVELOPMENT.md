# Development Guide — Arc Run API

## Prerequisites

- Node.js 22+
- npm 10+
- A Supabase project — get credentials from the team (URL, anon key, service role key, database URL)
- Supabase CLI — for running migrations: `npm install -g supabase`
- localtunnel — for exposing the local server to the iOS app: `npm install -g localtunnel`

## Local Setup

1. Clone the repo and change into the API directory:
   ```bash
   cd api/
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your local environment file:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and fill in all required values. Every key in `src/config/env.ts` must be present or the server will refuse to start.

4. Apply database migrations. Migrations live in `supabase/migrations/` and must be run in filename order. Against a remote Supabase project:
   ```bash
   supabase db push
   ```
   Against a local Supabase stack (`supabase start` must be running first):
   ```bash
   supabase db reset
   ```

5. Start the development server (hot-reload via ts-node-dev):
   ```bash
   npm run dev
   ```
   The server listens on port `8080` by default. Confirm it is healthy:
   ```bash
   curl http://localhost:8080/health
   ```

6. Expose the local server to the iOS app via localtunnel:
   ```bash
   lt --port 8080 --subdomain your-name
   ```
   This produces a public URL like `https://your-name.loca.lt`.

7. Update `Secrets.plist` in the iOS project — set `API_BASE_URL` to the tunnel URL **without** a port suffix. localtunnel handles the port mapping externally:
   ```
   API_BASE_URL = https://your-name.loca.lt
   ```

## Project Structure

```
api/
├── src/
│   ├── app.ts              — Express app setup (trust proxy, middleware, rate limit, routes)
│   ├── index.ts            — Server entry point (binds to PORT, starts listening)
│   ├── config/
│   │   └── env.ts          — Zod-validated env var schema; process exits on boot if any value is missing
│   ├── controllers/
│   │   ├── auth.controller.ts      — Profile, username, age declaration, health briefing
│   │   ├── runs.controller.ts      — Save completed run
│   │   └── account.controller.ts  — Account deletion
│   ├── middleware/
│   │   ├── auth.ts         — JWT authentication via Supabase JWKS; attaches user to req
│   │   ├── validate.ts     — Generic Zod request body validation middleware
│   │   └── errorHandler.ts — Centralised error response shaping (400/401/404/500)
│   ├── routes/
│   │   ├── index.ts        — Mounts all sub-routers under /v1
│   │   ├── auth.routes.ts  — /v1/auth/*
│   │   ├── modes.routes.ts — /v1/modes/*
│   │   ├── runs.routes.ts  — /v1/runs/*
│   │   └── account.routes.ts — /v1/account/*
│   └── services/
│       ├── auth.service.ts   — Profile reads/writes, age and health declaration logic
│       ├── modes.service.ts  — Mode list fetching and version computation
│       ├── runs.service.ts   — Run upsert logic
│       └── account.service.ts — Account teardown (cascading deletes)
├── supabase/
│   ├── migrations/         — SQL migration files (apply in filename order, never edit existing files)
│   └── seed.sql            — Initial data (game modes, test rows)
├── .env.example            — Template for required environment variables
├── README.md               — Project overview and endpoint reference
└── DEVELOPMENT.md          — This file
```

## Adding a New Endpoint

Follow these steps in order. Do not skip the type-check step.

1. Define a Zod schema in the relevant route file (or create a new route file if this is a new resource). The schema must cover all request body fields before any handler logic runs.

2. Create a controller function in `src/controllers/`. Keep it under 20 lines. Parse the request, call the service, return the response. No business logic here.

3. Create a service method in `src/services/`. This is the only place Supabase is called. Business logic lives here.

4. Register the route in the relevant route file and ensure it is mounted in `src/routes/index.ts`.

5. Verify types compile cleanly:
   ```bash
   npx tsc --noEmit
   ```

6. Verify the linter passes:
   ```bash
   npm run lint
   ```

## Architecture Rules

These rules are enforced by CI and must not be broken locally.

- Controllers must not contain business logic — delegate everything to a service method.
- Services must not import from controllers or routes. The dependency flow is strictly: routes → controllers → services.
- `any` is forbidden — ESLint will fail the PR.
- Circular imports are forbidden — `madge --circular` runs in CI.
- File line limit: 150 lines (warning). Function line limit: 30 lines (warning).

## Database

- ORM: none — typed Supabase client queries only.
- Migrations: always create a new `.sql` file in `supabase/migrations/` using the timestamp prefix convention (`YYYYMMDDHHMMSS_description.sql`). Never edit an existing migration file.
- To apply migrations to staging: `supabase db push`
- Row-Level Security: the `modes` table is publicly readable without authentication. All other tables require a valid Supabase JWT.

Current migrations (apply in this order):

| File | Description |
|------|-------------|
| `20260507000001_create_profiles.sql` | Creates the user profiles table |
| `20260507000002_create_modes.sql` | Creates the game modes table |
| `20260507000003_create_runs.sql` | Creates the runs table |
| `20260507000004_drop_username_unique.sql` | Removes unique constraint from username (display name only) |
| `20260510000001_update_mode_sort_order.sql` | Adds/updates sort order on modes |

## Running Quality Checks Locally

Run these before pushing. CI runs the same checks.

```bash
npm run lint                                         # ESLint — no-any, import rules, line limits
npx tsc --noEmit                                     # TypeScript strict type check
npx madge --circular --extensions ts src/            # Circular dependency check
npm test                                             # Jest test suite
```

## Debugging Common Issues

**`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` on startup or requests**
Trust proxy is not configured correctly. Check that `app.set('trust proxy', 1)` is present in `src/app.ts`. The value `1` trusts exactly one proxy hop (Cloud Run's load balancer). Using `true` would trust all hops and allow spoofed `X-Forwarded-For` headers.

**`ValidationError` or process exits immediately on startup**
A required environment variable is missing or malformed. Check `src/config/env.ts` for the full list of required keys and compare against your `.env` file. The error output will name the specific failing field.

**iOS app is not reaching the local server**
Check `Secrets.plist` — `API_BASE_URL` must be set to the localtunnel URL without a port suffix (e.g., `https://your-name.loca.lt`, not `https://your-name.loca.lt:8080`). localtunnel handles port forwarding transparently.

**`avg_pace_secs` constraint error on POST `/v1/runs`**
The iOS client sent a value of `0` for `avg_pace_secs`. The minimum is `1` — enforced both in the Zod schema (`.min(1)`) and at the database level. Investigate why the iOS calculation is producing zero (typically a run with zero duration).

**Supabase client returns `401` on authenticated routes**
The JWT is either expired or the `SUPABASE_URL` / `SUPABASE_ANON_KEY` in `.env` do not match the project the iOS app is authenticating against. Both client and server must point to the same Supabase project.
