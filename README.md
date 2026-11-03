# Classroom Survey

A classroom survey application for CSE 4095 — Agentic Programming.

## Current scope

Phase 1 provides a runnable frontend foundation, a landing page, all specified route shells, shared layouts, and environment-validated lazy Supabase clients. Login, protected session routing, survey management, submissions, QR generation, charts, export, database migrations and deployment are later phases. Placeholder pages do not fetch records or simulate successful actions. The presence of a route or an installed library does not mean its feature is implemented.

## Local setup

Use Node **24.14.1** (also recorded in `.node-version`) and npm. `package.json` enforces the supported Node 24 range. The lockfile pins the resolved dependency tree.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. The landing page and route shells work without credentials. No external service is required for the build or static checks.

For future live Supabase integration, copy the example locally:

```sh
cp .env.example .env.local
```

Replace both placeholders with your own project's URL and **publishable** key:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
```

Restart Vite after configuration changes. `.env.local`, `.env`, and environment variants are ignored; `.env.example` is tracked. Never supply a secret/service-role key, database password or Auth password as Vite configuration. `VITE_*` values enter the browser bundle; only public browser configuration belongs here.

`src/utilities/env.ts` reports missing variable names and rejects malformed origins, non-local HTTP, example placeholders, private `sb_secret_` keys and legacy JWT keys without reflecting their values in errors. Configuration validity does not establish database connectivity, migrations or Auth readiness. Login remains disabled throughout Phase 1 even if configuration is present.

## Commands

| Command                | Purpose                                                                    |
| ---------------------- | -------------------------------------------------------------------------- |
| `npm run dev`          | Vite development server                                                    |
| `npm run typecheck`    | Strict TypeScript checks for application, tools and tests                  |
| `npm run build`        | Typecheck, then build production assets into `dist/`                       |
| `npm run preview`      | Serve a completed production build locally                                 |
| `npm run lint`         | ESLint with TypeScript, hooks and refresh checks; zero warnings allowed    |
| `npm run format`       | Format maintained source/config/docs with Prettier                         |
| `npm run format:check` | Check formatting without changing files                                    |
| `npm test`             | Focused configuration validation tests; no live database                   |
| `npm run test:watch`   | Watch configuration tests                                                  |
| `npm run test:e2e`     | Desktop/mobile Chromium checks against the production preview; build first |

The browser tests require Playwright Chromium. If it is not installed, run `npx playwright install chromium`. An existing compatible browser can be selected through `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`. Browser tests manage their own preview server on port 4173. Supplied specifications and the original TODO snapshot are excluded from automatic formatting.

## Routes

| Route                  | Phase 1 page                                                            |
| ---------------------- | ----------------------------------------------------------------------- |
| `/`                    | Landing page                                                            |
| `/login`               | Disabled instructor login shell and configuration availability feedback |
| `/dashboard`           | Dashboard placeholder                                                   |
| `/surveys/new`         | New-survey placeholder                                                  |
| `/surveys/:id/edit`    | Survey-editor placeholder                                               |
| `/surveys/:id/present` | Presentation placeholder                                                |
| `/surveys/:id/results` | Results placeholder                                                     |
| `/s/:slug`             | Minimal public student placeholder, with no instructor navigation       |
| Any unmatched path     | Application not-found page                                              |

Instructor route shells currently contain no private data or active survey operations. They are not a completed authentication boundary; real Supabase Auth session protection and database RLS must be implemented and tested before connecting protected data. Do not deploy these shells as a working survey app.

## Source layout

```text
src/
  components/       Shared UI and layouts
  contexts/         Configuration state (Auth context comes later)
  database/         Reserved for generated types after real database setup
  hooks/            Configuration access and page titles
  lib/              Lazy Supabase clients
  pages/            Modular route pages
  services/         Reserved for typed API/RPC operations
  types/            Shared application types
  utilities/        Environment validation and styling helpers
supabase/
  migrations/       Reserved for versioned database SQL
  tests/            Reserved for RLS/RPC/integrity tests
tests/e2e/           Browser foundation checks
docs/                Plan, decisions, progress, history and evidence
```

`getSupabaseClient()` provides persistent instructor Auth sessions. The auth provider restores sessions, subscribes to Auth changes, requires the trusted `app_metadata.role = instructor` claim, protects every instructor route, and supports logout and password recovery. `/auth/callback` handles Supabase recovery/invitation redirects and `/reset-password` updates an authorized instructor password. `getPublicSupabaseClient()` remains isolated and disables session persistence, refresh and URL-session detection, so student participation never restores an instructor session. Both clients accept only the project URL and public `sb_publishable_…` key and never require a secret/service-role key.

For local Auth redirects, add these URLs in **Supabase Dashboard → Authentication → URL Configuration**:

- `http://localhost:5173/auth/callback`
- `http://localhost:5173/auth/callback?next=/reset-password`

Use the second URL when sending an instructor invitation so the invited user can choose a password. Production deployments need equivalent HTTPS callback URLs.

## Deployment and remaining setup

The deployment target remains **Cloudflare Pages**, serving `dist/` with build command `npm run build`. Configure the public Supabase variables at build time and use Pages' SPA fallback; there is no root `404.html`. Hard-refresh routing must be tested against the eventual deployment. No Pages project, GitHub repository, migrations or Auth account was configured in Phase 1.

Before live integration, the owner must create/select a Supabase project, provision instructor Auth access, configure trusted instructor authorization and execute the reviewed migrations when written. Later, authenticate GitHub and Cloudflare, authorize repository integration, configure build variables/Auth URLs, and provide private grader access. Detailed responsibilities are in [the implementation plan](docs/IMPLEMENTATION_PLAN.md#7-manual-setup-and-deployment-responsibilities).

See [the Phase 1 report](docs/PHASE_1_REPORT.md) for the exact file inventory, installed versions, commands and verification outcomes, [TODO status](docs/TODO_STATUS.md) for evidence-backed progress, and [AI development history](docs/AI_DEVELOPMENT_HISTORY.md) for the development record. The received TODO is preserved in [TODO_ORIGINAL.md](docs/TODO_ORIGINAL.md).

The database migration and local verification suite are documented in [the Phase 2 report](docs/PHASE_2_REPORT.md). To apply them to a real hosted project, follow [the manual Supabase setup guide](docs/SUPABASE_SETUP.md); local verification does not mean the remote project is configured.
