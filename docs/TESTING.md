# Testing Guide and Phase 14 Results

Last verified: 2026-11-03 (America/New_York).

## Test layers

The project deliberately separates three kinds of evidence:

1. **Vitest unit/service tests** use injected Supabase client mocks and exercise
   validation, transformations, authorization decisions and service contracts.
2. **Playwright browser tests** run the production build against controlled
   intercepted Auth/PostgREST responses. They verify UI integration and browser
   workflows without touching a real project.
3. **PostgreSQL security tests** create a new temporary local cluster, install
   the versioned migrations and a local-only Supabase role/Auth compatibility
   layer, run rollback-safe SQL plus concurrency checks, then remove that
   cluster. They never read the application's `.env` or connect remotely.

## Commands

| Command                          | Purpose                                                     |
| -------------------------------- | ----------------------------------------------------------- |
| `npm test` / `npm run test:unit` | Run all Vitest unit and service tests once.                 |
| `npm run test:watch`             | Run Vitest interactively while developing.                  |
| `npm run test:browser`           | Run all Playwright projects.                                |
| `npm run test:browser:chromium`  | Run desktop, tablet and mobile Chromium projects.           |
| `npm run test:browser:firefox`   | Run desktop Firefox.                                        |
| `npm run test:db`                | Run migrations and RLS/RPC checks in disposable PostgreSQL. |
| `npm run typecheck`              | Check application, build and test TypeScript projects.      |
| `npm run lint`                   | Run ESLint with zero warnings allowed.                      |
| `npm run format:check`           | Verify Prettier formatting.                                 |
| `npm run build`                  | Type-check and create the Vite production bundle.           |

Install the browser engines once with `npx playwright install chromium firefox`
if they are not already cached. PostgreSQL 16 command-line/server binaries must
be available on `PATH` for `npm run test:db`.

## Coverage map

| Requirement                                   | Primary evidence                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| Survey validation and question-type rules     | `surveyEditor.test.ts`; editor browser tests                                   |
| Stable question/choice ordering               | `surveyEditor.test.ts`; atomic-save browser test; editor SQL suite             |
| Search, status and date filtering             | `surveys.test.ts`; dashboard browser tests                                     |
| Create/edit service behavior                  | `surveys.test.ts`; editor SQL suite; complete browser workflow                 |
| Activation, prior closure and closing         | lifecycle service tests; schema/concurrency SQL; complete workflow             |
| Student validation and terminal/error states  | student service tests; public-page browser tests                               |
| Duplicate protection                          | token/service tests; browser double-submit/duplicate tests; concurrency SQL    |
| Counts, denominators, percentages and history | results utility tests; results browser tests; historical results SQL           |
| CSV escaping and formula protection           | results utility fixture; browser download; Excel evidence in CSV test document |
| Route guards and instructor authorization     | auth service tests; protected-route browser tests; RLS/RPC SQL                 |
| Full create-to-history workflow               | `complete-workflow.spec.ts`                                                    |
| Responsive/accessibility behavior             | desktop/tablet/mobile projects and Axe assertions in `foundation.spec.ts`      |

The complete workflow signs in an authorized instructor, creates a Multiple
Choice draft, reloads and edits it, adds a True/False question, activates it,
submits anonymously, verifies the success and server duplicate states, checks
aggregated results, downloads CSV, closes the survey, confirms public closure,
reopens preserved historical results, logs out and verifies the route guard.

## Actual results

Final clean outcomes from this phase:

- `npm run test:unit`: **10 files passed, 67 tests passed, 0 failed**.
- `npm run test:browser`: **88 tests passed, 0 failed** across desktop Chromium,
  desktop Firefox, tablet Chromium and mobile Chromium.
- `npm run test:db`: **5 verification stages passed, 0 failed**. The final
  concurrency stage proved one-active-survey serialization, same-token
  per-survey behavior, concurrent duplicate rejection and close/submission
  locking.
- `npm run typecheck`: passed.
- `npm run lint`: passed with zero warnings.
- `npm run format:check`: passed.
- `npm run build`: passed; Vite retained its non-failing chunk-size warning.

Failures found and corrected during the phase:

- The first complete-workflow run passed 1/4 projects and failed 3/4 only on an
  overly strict logout URL assertion. The assertion now accepts the guarded
  route's safe encoded `returnTo`; the rerun passed 4/4.
- The first full cross-browser run passed 87/88. Firefox does not implement
  Playwright's Chromium-only clipboard permission name. Firefox now receives a
  test-local Clipboard API shim while Chromium retains the native permission
  path. The focused rerun passed 1/1 and the final full rerun passed 88/88.
- The first database command was blocked by the filesystem sandbox's shared
  memory restriction before PostgreSQL initialized. Running the same disposable
  script with approved local process permissions passed; it did not contact a
  remote database.

## Safety and limitations

- Browser tests mock the HTTP boundary. They demonstrate frontend behavior and
  payload integration, not hosted Supabase availability.
- Database tests emulate Supabase roles/JWT claims in local PostgreSQL. They do
  not prove the migrations or account metadata are current in the hosted project.
- Firefox clipboard behavior uses a test-only shim because Playwright cannot
  grant Firefox the Chromium clipboard permission. Copy behavior still uses the
  real browser API in all Chromium projects.
- WebKit/Safari, real email recovery, screen readers, physical devices,
  production QR scanning, high-volume/load behavior and the hosted end-to-end
  workflow remain manual checks.
- Never point `supabase/tests/run_local.sh` or synthetic browser fixtures at a
  legitimate production database. The supplied database runner creates its own
  `mktemp` cluster and disables network listening.

## Production smoke audit — 2026-11-03

Target:
`https://e22ba2d3-classroom-survey.jiya-bhadreshbhai-gorasiya.workers.dev`.

### Verified without credentials or data mutation

- HTTPS root and production assets returned HTTP 200 through Cloudflare.
- Direct requests to six nested application routes returned the same SPA shell
  as `/`; client-side direct refresh routing is operational.
- Desktop Chromium/Firefox at 1280x800 and mobile Chromium at 390x844 rendered
  the tested public/login/protected-route paths without console errors, page
  errors, request failures or horizontal overflow.
- Login controls were enabled. Signed-out dashboard and survey-editor requests
  redirected to Login with safe internal return paths.
- The invalid public slug produced a successful hosted
  `get_public_survey` call and the Survey not found UI.
- The deployed Supabase configuration is usable. No JWT-shaped secret appeared
  in the public bundle. The expected publishable browser key is public by
  design; private/service-role keys remain forbidden.
- Anonymous table probes returned no active survey/question/choice rows during
  the audit. Anonymous reads of `responses` and `answers` returned HTTP 401 /
  PostgreSQL `42501`.
- Anonymous calls to `activate_survey`, `close_survey`,
  `get_survey_results`, and `duplicate_survey` returned HTTP 401 / PostgreSQL
  `42501`. This both verifies denial and proves all four RPCs are now present in
  the hosted PostgREST schema; the earlier missing-migration observation is no
  longer current.

### Not yet verified in production

No instructor credentials were supplied and no active public survey existed.
Accordingly, production login/logout, instructor claim handling, real
create/edit persistence, activation/closure, QR/phone access, anonymous
submission persistence, duplicate enforcement, private results, charts, CSV,
history, normal-user denial, and the absence of console errors throughout the
authenticated workflow remain manual. Local mocked and disposable-database
tests cover these behaviors but are not production evidence.

The exact manual sequence and safe test-data guidance are in
`docs/DEPLOYMENT.md`. Do not mark these production items passed until their
observed outcomes are added here.
