# GitHub and Assignment Readiness Review

Review date: 2026-11-03 (America/New_York).

## Repository checks passed

- All required frontend source, test, configuration and five versioned database
  migration files are tracked.
- `ASSIGNMENT.md`, `SPEC.md`, `DATABASE.md`, `API.md`, `UI.md`, and the preserved
  original TODO match their recorded SHA-256 hashes.
- `README.md` documents installation, environment variables, local development,
  ordered database migration, tests, instructor provisioning and Cloudflare
  Pages deployment.
- `TODO.md` leaves hosted verification, deployment and future enhancements
  unchecked. `docs/DECISIONS.md`, `docs/AI_DEVELOPMENT_HISTORY.md`, the
  development summary and testing evidence exist.
- `.env`, `.env.local`, dependency directories, build output, browser reports,
  coverage, local Supabase state and browser storage-state files are ignored and
  are not tracked. `.env.example` contains placeholders only.
- The current tracked tree contains no actual secret/service-role key, password,
  private key, cloud token, real student identity, screenshot, database file or
  large binary. Local configured environment values do not occur in Git history.
- No tracked file exceeds 157 KB; the largest is the npm lockfile. The only
  tracked visual asset is the small source SVG favicon.
- Production `npm audit` reports zero vulnerabilities. The full audit reports 13
  moderate `minimatch` findings confined to ESLint/TypeScript-ESLint development
  tooling. npm offers only a breaking forced downgrade, which was not applied.
- ESLint, strict TypeScript, 67 unit/service tests, 88 Chromium/Firefox browser
  tests, formatting, the production build, and all five disposable PostgreSQL
  verification stages pass. The build has a non-failing bundle-size warning.

## Required work before assignment submission

The repository is ready to push, but the assignment is not complete until the
owner performs and records these external steps:

1. Apply and verify hosted migrations `004` and `005`; safe probes currently
   report that their RPCs are missing from the configured Supabase schema cache.
2. Create/confirm the public Cloudflare Pages deployment, set all three public
   Vite variables, configure Auth callback URLs, and verify direct SPA routes.
3. Test production login, survey creation/activation, an anonymous submission
   from another device, results, CSV, closure and the production QR link.
4. Add the four sanitized real screenshots listed in
   `docs/evidence/README.md`. No database evidence images are currently present.
5. Provide the GitHub URL and deployed application URL through the required
   course submission channel. Instructor test access must be shared privately,
   never committed.

Do not mark these items complete merely because local or intercepted tests pass.
