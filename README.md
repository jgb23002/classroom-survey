# Classroom Survey

A full-stack classroom survey application for CSE 4095 — Agentic Programming.
Instructors can build, publish, present, and analyze surveys while students
respond anonymously from a public mobile-friendly link.

- **GitHub:** https://github.com/jgb23002/classroom-survey
- **Deployed application:**
  https://e22ba2d3-classroom-survey.jiya-bhadreshbhai-gorasiya.workers.dev

## Technology stack

- React, TypeScript, Vite, Tailwind CSS, and React Router
- Supabase Auth, JavaScript client, and PostgreSQL
- Recharts and `qrcode`
- Vitest, Playwright, ESLint, and Prettier
- GitHub and Cloudflare static hosting

## Features

- Trusted instructor authentication with protected routes
- Survey dashboard with search, filters, lifecycle actions, and duplication
- Atomic survey creation and editing for Multiple Choice and True/False questions
- Single-active-survey enforcement, presentation mode, QR download, and live count
- Anonymous mobile student form with database-validated submissions
- Per-survey browser-token duplicate protection
- Instructor-only charts, percentages, historical results, and safe CSV export
- PostgreSQL constraints, Row Level Security, and authorized RPC functions

## Prerequisites

- Node.js 24.14.1 and npm (`.node-version` records the expected version)
- A Supabase project for real database and authentication workflows
- PostgreSQL 16 tools only when running the disposable local database suite

## Local setup

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Replace the `.env.local` placeholders with public browser configuration:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_replace_me
VITE_PUBLIC_APP_URL=https://your-deployed-application.example
```

Never place a database password, secret/service-role key, Auth password, or
other private credential in a `VITE_*` variable. Vite embeds these values in the
browser bundle. Local environment files are ignored; `.env.example` contains
placeholders only.

## Database setup

Run these files once in Supabase SQL Editor, in filename order:

1. `supabase/migrations/202611020001_initial_classroom_survey.sql`
2. `supabase/migrations/202611030002_atomic_survey_editor.sql`
3. `supabase/migrations/202611030003_strict_anonymous_tokens.sql`
4. `supabase/migrations/202611030004_instructor_results.sql`
5. `supabase/migrations/202611030005_atomic_survey_duplication.sql`

Then run `notify pgrst, 'reload schema';`, provision the instructor's trusted
`app_metadata.role = "instructor"` claim, and sign out and back in to refresh the
JWT. Follow [the Supabase setup guide](docs/SUPABASE_SETUP.md) for the exact
authorization and rollback-safe verification procedure. Never run
`supabase/tests/000_local_supabase_bootstrap.sql` against a hosted project.

## Commands

| Command                | Purpose                                                    |
| ---------------------- | ---------------------------------------------------------- |
| `npm run dev`          | Start the Vite development server                          |
| `npm run typecheck`    | Run strict TypeScript checks                               |
| `npm run lint`         | Run ESLint with zero warnings allowed                      |
| `npm run format:check` | Verify Prettier formatting                                 |
| `npm test`             | Run Vitest unit and service tests                          |
| `npm run test:browser` | Run Chromium and Firefox Playwright workflows              |
| `npm run test:db`      | Run migrations and security tests in disposable PostgreSQL |
| `npm run build`        | Type-check and create the production bundle in `dist/`     |
| `npm run preview`      | Serve the completed production bundle locally              |

Browser tests require Playwright Chromium and Firefox. Install them when needed
with `npx playwright install chromium firefox`. See
[docs/TESTING.md](docs/TESTING.md) for coverage, actual recorded results, and
limitations.

## Production configuration

The deployed application is served from Cloudflare's `workers.dev` domain as a
static Vite application. Production uses `npm run build` and the `dist` output.
Configure the three public variables listed above in Cloudflare and add the
production `/auth/callback` and `/reset-password` URLs to Supabase Auth's allowed
redirects. Direct SPA route refresh and signed-out route guards were verified;
credentialed production checks and their remaining limits are recorded in
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Repository structure

```text
src/                  React application, services, types, and tests
supabase/migrations/  Versioned schema, RLS, and RPC migrations
supabase/tests/       Disposable database security and concurrency tests
tests/e2e/            Controlled Playwright workflows
docs/Submission/      Final assignment PDF reports
docs/evidence/        Sanitized database and application screenshots
```

The instructor and public student clients are intentionally isolated. The
public client cannot restore an instructor session, and students submit only
through the atomic `submit_survey_response` RPC. RLS and server-side claim
checks—not frontend route visibility—remain the authorization boundary.

## Assignment documentation

- [Development Summary PDF](docs/Submission/Development%20Summary.pdf)
- [AI Development History PDF](docs/Submission/AI_development.pdf)
- [Detailed AI development record](docs/AI_DEVELOPMENT_HISTORY.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Architecture and security decisions](docs/DECISIONS.md)
- [Testing record](docs/TESTING.md)
- [Deployment record](docs/DEPLOYMENT.md)
- [Submission evidence index](docs/evidence/README.md)

The original assignment specifications remain at the repository root, and the
received TODO snapshot is preserved in `docs/TODO_ORIGINAL.md`.
