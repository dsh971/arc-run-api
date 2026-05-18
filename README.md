# Arc Run API

The Arc Run API is a REST backend that powers the Arc Run iOS application. It handles user authentication profiles, game mode delivery, run result persistence, and account lifecycle management. The service acts as the authoritative source for all server-side state while deliberately keeping GPS and raw location data off-server — those remain on-device in SwiftData only.

## Stack

- Node.js 22 + TypeScript (strict)
- Express 4
- Supabase (Postgres + Auth)
- Google Cloud Run (production)

## Architecture

The codebase follows a strict three-tier Controller → Service → Data Access pattern enforced by unidirectional import rules.

- **Controllers** parse the HTTP request and shape the HTTP response. They contain no business logic.
- **Services** own all business logic and are the only layer that calls Supabase. They never import from controllers or routes.
- **Routes** mount controllers behind Zod validation middleware and authentication guards.

## API Endpoints

All routes are prefixed with `/v1`.

| Method | Path | Auth required | Description |
|--------|------|---------------|-------------|
| GET | `/health` | No | Health check — returns `{ status: "ok", env }` |
| GET | `/v1/auth/profile` | Yes | Fetch the authenticated user's profile |
| POST | `/v1/auth/username/set` | Yes | Set or update the user's display name (call sign) |
| POST | `/v1/auth/age-declaration` | Yes | Record GDPR Article 8 age confirmation |
| POST | `/v1/auth/health-briefing` | Yes | Record Health & Safety Briefing and ToS acceptance |
| GET | `/v1/modes` | No | List all available game modes |
| GET | `/v1/modes/version` | No | Return the current modes version hash |
| POST | `/v1/runs` | Yes | Save a completed run (idempotent upsert by run ID) |
| DELETE | `/v1/account` | Yes | Permanently delete the authenticated user's account and all associated data |

## Environment Variables

All variables are validated with Zod at server boot. A missing or malformed value causes an immediate process exit with a descriptive error.

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | No (default: `development`) | Runtime environment: `development`, `staging`, or `production` |
| `PORT` | No (default: `8080`) | Port the Express server listens on |
| `SUPABASE_URL` | Yes | Full URL of the Supabase project (e.g., `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Yes | Public anonymous key for client-facing Supabase calls |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key for privileged server-side operations (keep secret) |
| `DATABASE_URL` | Yes | Direct Postgres connection URL for migrations and admin queries |

## Quick Start

1. Clone the repository and navigate to the `api/` directory.
2. Copy `.env.example` to `.env` and fill in the values from your Supabase project dashboard.
3. Install dependencies: `npm install`
4. Apply database migrations: `supabase db push` (or run SQL files in `supabase/migrations/` against your project in order).
5. Start the development server: `npm run dev`
6. The server listens on `http://localhost:8080` by default.

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `npm run dev` | Start server with ts-node-dev (hot-reload, no build step) |
| `build` | `npm run build` | Compile TypeScript to `dist/` |
| `start` | `npm start` | Run the compiled output from `dist/` (production) |
| `lint` | `npm run lint` | Run ESLint across `src/` |
| `lint:fix` | `npm run lint:fix` | Run ESLint and auto-fix fixable issues |
| `test` | `npm test` | Run Jest test suite |
