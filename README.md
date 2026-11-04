# Classroom Survey

A classroom survey application for CSE 4095 — Agentic Programming.

## Current scope

Phases 1–14 provide the complete local application, versioned Supabase schema/RPCs, instructor authentication and survey workflow, anonymous student submission, results/CSV, responsive accessibility polish and layered automated tests. Cloudflare deployment and hosted-project verification remain Phase 15 work; local and intercepted test success does not prove the remote project is configured.

## Local setup

Use Node **24.14.1** (also recorded in `.node-version`) and npm. `package.json` enforces the supported Node 24 range. The lockfile pins the resolved dependency tree.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. No external service is required for builds, static checks or mocked browser tests. Real application workflows require the configured Supabase project and applied migrations.

For future live Supabase integration, copy the example locally:

```sh
cp .env.example .env.local
```

Replace both placeholders with your own project's URL and **publishable** key:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
VITE_PUBLIC_APP_URL=https://your-deployed-application.example
```

Restart Vite after configuration changes. `.env.local`, `.env`, and environment variants are ignored; `.env.example` is tracked. Never supply a secret/service-role key, database password or Auth password as Vite configuration. `VITE_*` values enter the browser bundle; only public browser configuration belongs here.

`src/utilities/env.ts` reports missing variable names and rejects malformed origins, non-local HTTP, example placeholders, private `sb_secret_` keys and legacy JWT keys without reflecting their values in errors. Configuration validity does not establish database connectivity, migrations or Auth readiness. `VITE_PUBLIC_APP_URL` is the public application origin encoded into student links and QR codes; when omitted, it falls back to the current browser origin, which means localhost remains local-only.

## Commands

| Command                | Purpose                                                                 |
| ---------------------- | ----------------------------------------------------------------------- |
| `npm run dev`          | Vite development server                                                 |
| `npm run typecheck`    | Strict TypeScript checks for application, tools and tests               |
| `npm run build`        | Typecheck, then build production assets into `dist/`                    |
| `npm run preview`      | Serve a completed production build locally                              |
| `npm run lint`         | ESLint with TypeScript, hooks and refresh checks; zero warnings allowed |
| `npm run format`       | Format maintained source/config/docs with Prettier                      |
| `npm run format:check` | Check formatting without changing files                                 |
| `npm test`             | Vitest utility and service tests with isolated client mocks             |
| `npm run test:unit`    | Explicit alias for the one-run Vitest suite                             |
| `npm run test:watch`   | Watch Vitest tests                                                      |
| `npm run test:browser` | Chromium and Firefox workflows against the production preview           |
| `npm run test:db`      | Versioned migrations and RLS/RPC checks in disposable local PostgreSQL  |

The browser tests require Playwright Chromium and Firefox. If needed, run `npx playwright install chromium firefox`. Browser tests manage their own preview server on port 4173. Database tests require PostgreSQL 16 tools and create/remove only their own temporary cluster. See [docs/TESTING.md](docs/TESTING.md) for the full matrix, exact results and limitations.

## Routes

| Route                  | Current behavior                                              |
| ---------------------- | ------------------------------------------------------------- |
| `/`                    | Landing page                                                  |
| `/login`               | Supabase email/password instructor login                      |
| `/dashboard`           | Protected, database-backed instructor dashboard               |
| `/surveys/new`         | Create and atomically save a draft survey                     |
| `/surveys/:id/edit`    | Load and atomically edit an eligible draft/closed survey      |
| `/surveys/:id/present` | Protected QR presentation, live count and lifecycle actions   |
| `/surveys/:id/results` | Protected aggregate charts, historical results and CSV export |
| `/s/:slug`             | Anonymous active-survey form and atomic submission            |
| Any unmatched path     | Application not-found page                                    |

The dashboard lists real surveys newest-first, counts responses, filters by title/status/date and uses state-aware actions. Activation, closure, duplication and editor persistence use authorized atomic RPCs. Delete confirmations warn about cascading response loss. Student submissions use only the public atomic RPC; results and exports remain instructor-only.

## Source layout

```text
src/
  components/       Shared UI and layouts
  contexts/         Configuration and instructor Auth state
  database/         Reserved for generated types after real database setup
  hooks/            Configuration access and page titles
  lib/              Lazy Supabase clients
  pages/            Modular route pages
  services/         Reusable Auth and survey data/RPC operations
  types/            Shared application types
  utilities/        Environment validation and styling helpers
supabase/
  migrations/       Versioned schema and RPC migrations
  tests/            Disposable RLS/RPC/integrity/concurrency tests
tests/e2e/           Controlled browser integration and workflow checks
docs/                Plan, decisions, progress, history and evidence
```

`getSupabaseClient()` provides persistent instructor Auth sessions. The auth provider restores sessions, subscribes to Auth changes, requires the trusted `app_metadata.role = instructor` claim, protects every instructor route, and supports logout and password recovery. `/auth/callback` handles Supabase recovery/invitation redirects and `/reset-password` updates an authorized instructor password. `getPublicSupabaseClient()` remains isolated and disables session persistence, refresh and URL-session detection, so student participation never restores an instructor session. Both clients accept only the project URL and public `sb_publishable_…` key and never require a secret/service-role key.

For local Auth redirects, add these URLs in **Supabase Dashboard → Authentication → URL Configuration**:

- `http://localhost:5173/auth/callback`
- `http://localhost:5173/auth/callback?next=/reset-password`

Use the second URL when sending an instructor invitation so the invited user can choose a password. Production deployments need equivalent HTTPS callback URLs.

## Deployment and remaining setup

The deployment target remains **Cloudflare Pages**, serving `dist/` with build command `npm run build`. Configure the public Supabase variables at build time and use Pages' SPA fallback; there is no root `404.html`. Hard-refresh routing must be tested against the eventual deployment. No GitHub or Cloudflare deployment has been verified. The initial migration was reported as manually applied; later migrations and the hosted role-specific workflow still require explicit verification.

Before live integration, the owner must create/select a Supabase project, provision instructor Auth access, configure trusted instructor authorization and execute the reviewed migrations when written. Later, authenticate GitHub and Cloudflare, authorize repository integration, configure build variables/Auth URLs, and provide private grader access. Detailed responsibilities are in [the implementation plan](docs/IMPLEMENTATION_PLAN.md#7-manual-setup-and-deployment-responsibilities).

See [the Phase 1 report](docs/PHASE_1_REPORT.md) for the exact file inventory, installed versions, commands and verification outcomes, [TODO status](docs/TODO_STATUS.md) for evidence-backed progress, and [AI development history](docs/AI_DEVELOPMENT_HISTORY.md) for the development record. The received TODO is preserved in [TODO_ORIGINAL.md](docs/TODO_ORIGINAL.md).

The database migration and local verification suite are documented in [the Phase 2 report](docs/PHASE_2_REPORT.md). To apply them to a real hosted project, follow [the manual Supabase setup guide](docs/SUPABASE_SETUP.md); local verification does not mean the remote project is configured.
