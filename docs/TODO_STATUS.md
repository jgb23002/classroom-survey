# TODO Evidence Audit

Review date: 2026-11-02 (America/New_York).

## Preservation and interpretation

At the initial review, the received checklist contained **164 tasks: 123 checked, 41 unchecked**. [TODO_ORIGINAL.md](TODO_ORIGINAL.md) preserves those supplied marks byte-for-byte. The user subsequently authorized updating the current [TODO.md](../TODO.md) during Phase 1. It now contains **11 checked Phase 1 tasks and 153 unchecked later tasks**; unsupported completion claims were reset without changing task wording.

**At the initial review, no original application task was certified complete.** Existing root folders and the starter manifest are partial setup evidence; they do not establish the requested runnable project structure. Missing local code/migrations does not prove external accounts or resources do not exist. It means their state and successful operation have not been verified.

## Initial review — historical phase audit

Counts and observations below describe the received checklist at the initial review, not current completion. All implementation phases need their own code/verification evidence before their status can advance.

| Original phase                      | Received checked | Received unchecked | Evidence observed / actual status                                                                                           |
| ----------------------------------- | ---------------: | -----------------: | --------------------------------------------------------------------------------------------------------------------------- |
| 1 — Project Setup                   |               11 |                  0 | Partial root folder structure and starter manifest only; source/configuration/dependencies/env names/build evidence absent. |
| 2 — Supabase Project and Database   |               10 |                  5 | No migrations; database project, deployed tables, policies and live access tests unverified.                                |
| 3 — Instructor Authentication       |                7 |                  0 | No authentication implementation.                                                                                           |
| 4 — Instructor Dashboard            |               14 |                  0 | No dashboard implementation.                                                                                                |
| 5 — Survey Editor                   |               15 |                  0 | No editor implementation.                                                                                                   |
| 6 — Survey Activation               |               11 |                  0 | No activation RPC or presentation/QR implementation.                                                                        |
| 7 — Student Survey Page             |               12 |                  0 | No public student page or submission implementation.                                                                        |
| 8 — Duplicate Submission Protection |                6 |                  0 | No token code, migration uniqueness index or duplicate verification.                                                        |
| 9 — Results Dashboard               |                9 |                  0 | No aggregate RPC or results UI.                                                                                             |
| 10 — Historical Results             |                5 |                  0 | No history UI, filters or persisted-history verification.                                                                   |
| 11 — CSV Export                     |                5 |                  2 | No export implementation or spreadsheet verification.                                                                       |
| 12 — Survey Duplication             |                6 |                  0 | No duplication operation or editor redirect.                                                                                |
| 13 — UI Polish                      |                8 |                  1 | No UI implementation or accessibility verification.                                                                         |
| 14 — Testing                        |                0 |                 14 | No application tests present or executed.                                                                                   |
| 15 — Deployment                     |                4 |                  6 | Not a local Git repository; GitHub/Pages account and deployment state unverified.                                           |
| 16 — Post-MVP Enhancements          |                0 |                 13 | Deferred future enhancements; not release requirements.                                                                     |

## Initial review — verification record

- Read all six supplied documents in full and inspected root/source/public/migration/evidence directories.
- Parsed `package.json`; only React/React DOM runtime dependencies are declared. No lockfile or installed dependencies were found.
- Confirmed the local environment has Node/npm/Git/GitHub CLI. Those version checks are not application tests.
- `git rev-parse --show-toplevel` returned “not a git repository”. No remote or hosted project was inspected.
- SHA-256 comparisons passed for all six supplied documents; retained package/README/ignore/env files were also unchanged. The TODO snapshot matched byte-for-byte, all five new documents were nonempty, Markdown fences were balanced, and all 13 local document links/anchors resolved. Source/public/migration/evidence folders remain empty. These are documentation checks only.
- No install, typecheck, lint, application build, browser workflow, database migration execution, RLS/RPC test, load test, GitHub push or deployment occurred in this review.

### Preserved specification hashes

SHA-256 values captured before writing review documents and successfully compared afterward:

| Supplied file   | SHA-256                                                            |
| --------------- | ------------------------------------------------------------------ |
| `ASSIGNMENT.md` | `29868c31be7dee79f54f55c95c5d0ece7119977a35974974f5417ab97baabeed` |
| `SPEC.md`       | `b182cfb9192816e4738322054e469ec07ac82d5253efd171919b5f3c21d3bcab` |
| `DATABASE.md`   | `952f79d78ae90fe1610fd2cf00c9a1b1d26df1dcc14fc9ee87190cc0cb302345` |
| `API.md`        | `71e9257e47abd315b5bbf3d65f5f2818f1cdcc9107d1becd665f563f1ec5364e` |
| `UI.md`         | `855a550ade7374b68e3625cb9c2a7f9fd559d2ad05cc78775c5b4f5a4b68259f` |
| `TODO.md`       | `9b50b7da074231b7ee226ee70b16fc309103ca67b3c32be98232c7e29cac9dd9` |

## Recording future progress

Add evidence rows below after each bounded phase. Use `pending`, `implemented — verification pending`, `verified` or `blocked by external setup`, with a source-file/commit reference and actual command/manual outcome. Distinguish local, test-database and production verification. Do not use supplied marks as evidence. The user authorized updating the current TODO during Phase 1; every new completion needs implementation and verification evidence. Preserve the original snapshot.

| Original task / implementation phase | Actual status                                                 | Implementation reference                                                  | Verification and environment                                                                                                                                                    | Remaining work                                                     |
| ------------------------------------ | ------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Phase 1 — project setup              | Verified locally                                              | React/Vite/Tailwind/Router source and tooling; see report inventory       | Clean locked install, strict TypeScript/build, lint, formatting, 20 unit tests, 16 Chromium desktop/mobile checks, visual review and Git-ignore checks                          | No remaining Phase 1 setup; live backend configuration comes later |
| Phase 2 — database implementation    | Implemented and verified locally; remote verification pending | Versioned migration and `supabase/tests`; see Phase 2 report              | Fresh PostgreSQL 16.13 migration, security/integrity and concurrency suites passed; migration reported manually applied remotely                                                | Run remote rollback-safe SQL and real role/client checks           |
| Phase 3 — instructor authentication  | Implemented and verified locally                              | Auth provider/service/guard, login/recovery pages and browser tests       | Configured Auth endpoint returned HTTP 200; 24 unit and 22 desktop/mobile browser tests passed, including instructor/ordinary-user paths                                        | Manually verify the real instructor account and recovery email     |
| Phase 4 — instructor dashboard       | Implemented and verified locally                              | Responsive dashboard, survey service/types/cards and filters              | 27 unit tests and 28 desktop/mobile browser tests passed; Supabase response/mutation calls were intercepted in browser tests                                                    | Manually verify against the configured hosted project              |
| Phase 5 — survey editor              | Implemented and verified locally; remote migration pending    | Atomic editor migration/RPC, editor components/services/types/utilities   | Fresh PostgreSQL editor suite, 31 unit tests and desktop/mobile browser persistence tests passed                                                                                | Apply migration 002 and run editor verification remotely           |
| Phase 6 — activation/presentation    | Implemented and verified locally; hosted verification pending | Presentation page, URL/QR utilities, lifecycle/presentation services      | Disposable database lifecycle/concurrency suite and desktop/mobile QR/copy/download/close browser tests passed                                                                  | Scan the deployed QR and verify real hosted counts/lifecycle       |
| Phase 7 — anonymous student survey   | Implemented and verified locally; hosted verification pending | Public page, isolated service, typed parser, per-slug token utility       | Database security/atomicity suite, 43 unit tests and desktop/mobile load/validation/submission/state tests passed                                                               | Verify a real anonymous hosted submission from a second device     |
| Phase 8 — duplicate protection       | Implemented and verified locally; remote migration pending    | Per-slug UUIDv4 token, synchronous click lock, strict RPC wrapper/index   | Browser verified replacement/persistence/refresh/double-click/duplicate states; parallel DB sessions committed exactly one row and allowed same token once per different survey | Apply migration 003 and verify with hosted anonymous clients       |
| Phase 9 — instructor results         | Implemented and verified locally; remote migration pending    | Aggregate/export RPC migration, results service/page/chart/utilities      | Database authorization/count/unanswered/zero/export suite, 54 unit tests and desktop/mobile refresh/chart/CSV checks passed                                                     | Apply migration 004 and verify hosted instructor/public denial     |
| Phase 10 — historical results        | Implemented and verified locally; hosted verification pending | Inclusive title/date filters and status-independent instructor results    | Unit/browser filtering passed; disposable PostgreSQL retained identical response/answer counts through active, closed and archived states                                       | Verify archived results against the hosted project                 |
| Phase 11 — CSV export                | Implemented and verified locally                              | Protected export RPC and spreadsheet-safe browser serializer              | Automated escaping/row-count fixture and desktop/mobile download passed; Excel 16.114.1 parsed a synthetic production-shaped fixture with line breaks, Unicode and formula text | Verify a real hosted export; optional Numbers/LibreOffice coverage |
| Phase 12 — survey duplication        | Implemented and verified locally; remote migration pending    | Atomic instructor-only duplication RPC and editor redirect                | Disposable PostgreSQL verified ordering/content, authorization, no response/slug copy, original/failure integrity; desktop/mobile redirect passed                               | Apply migration 005 and test with the hosted instructor            |
| Phase 13 — UI polish                 | Implemented and verified locally                              | Shared layouts/styles, semantic editor/student improvements and Axe tests | 56 unit tests and 63 desktop/tablet/mobile browser cases passed; required route types had no Axe WCAG A/AA findings or horizontal overflow                                      | Complete documented assistive-technology/device checks             |
| Phases 14–15                         | Pending                                                       | Remaining broad testing and deployment                                    | No multi-engine browser run, assistive-technology session, load test, GitHub push or production verification                                                                    | Continue with Phase 14                                             |
| Phase 16                             | Deferred                                                      | Supplied future-enhancement list                                          | Outside required release                                                                                                                                                        | Revisit after delivery                                             |

## Phase 1 verification and limits

- The current TODO update is explicitly authorized by the user's Phase 1 request. All 164 original task descriptions and the original snapshot are preserved.
- `npm run build` and `npm run lint` pass using the compatible supported toolchain. Configuration unit tests: 20 passed. Browser foundation checks: 16 passed across desktop and mobile Chromium emulation. These are not live Auth, database, two-browser-engine, physical-phone or production tests.
- Public/instructor layouts and every specified route shell render without credentials. Login is disabled; placeholders issue no survey requests and contain no mock database records.
- The lazy Supabase module rejects absent/unsafe/placeholder configuration without exposing values. The public client disables instructor-session persistence, refresh and URL detection. No live client/database connection has been certified.
- Final npm production audit reports zero findings. The full audit reports 13 moderate development-tool findings through the minimatch advisory; see the report. No forced major transitive overrides were applied.
- Only `TODO.md` among supplied specifications was updated. The other five supplied documents, planning/decisions documents, and `TODO_ORIGINAL.md` remain unchanged from this phase's baseline.
- Exact files, dependency versions, commands, outcomes and manual responsibilities: [PHASE_1_REPORT.md](PHASE_1_REPORT.md).

The Phase 1 request resolves the earlier TODO-editing restriction for the current progress file. [DECISIONS D02](DECISIONS.md#d02--original-todo-marks-are-not-completion-evidence) remains the historical record of the original audit. Keep the original snapshot when recording later verified progress.

## Phase 2 verification and limits

- The five tables, foreign keys/delete actions, indexes, timestamps/status checks, RLS policies, trusted instructor claim checks and required RPCs are implemented in one versioned migration.
- A disposable local PostgreSQL 16.13 cluster applied the migration successfully. Schema/security/integrity tests and actual parallel-session lifecycle tests passed; the last close operation waited 670 ms for an admitted submission and rejected the later request.
- Current TODO marks the ten locally verified Phase 2 implementation tasks complete. Supabase project creation plus four hosted role/API verification tasks remain unchecked.
- No remote Supabase schema, Auth account, API request or browser integration has been configured or verified. Follow [the manual setup guide](SUPABASE_SETUP.md) and record hosted evidence before advancing those tasks.
- Exact implementation, checks and limits are in [the Phase 2 report](PHASE_2_REPORT.md).

## 2026-11-03 full-project audit

- Checked Supabase project creation because the configured hosted Auth endpoint was reached successfully. This does not prove the remote migration or RLS behavior.
- Checked the Phase 3 authentication tasks and instructor-login/unauthorized-access tests from the implemented provider, trusted-claim checks, protected routes, unit tests and intercepted desktop/mobile browser flows.
- Checked only the database-backed activation, one-active, automatic-close, slug and duplicate-token items that passed disposable PostgreSQL verification. Their frontend controls remain unimplemented.
- Kept dashboard, editor, presentation, public survey, results, CSV, historical browsing, duplication UI, deployment and production checks open. Their current route files explicitly render placeholders and make no survey-data calls.
- Kept the four hosted role/API verification items open because `REMOTE_DATABASE_VERIFICATION.md` still records both the remote SQL role test and real Supabase client-session checks as not run.

## Phase 4 verification and limits

- The protected dashboard reads surveys and response counts through the authenticated Supabase client, ordered newest-first. It includes status badges, title search, status filtering, reset, loading/error/retry/empty/no-match states and responsive cards.
- State-aware actions use the existing activation/closure RPCs and instructor-authorized DML for archive/delete. Duplication copies survey content into a fresh draft and performs compensating deletion if a child copy fails. All successful mutations refresh the list.
- Native confirmation dialogs cover close, archive and delete. Delete warns that questions/responses/answers are permanently removed and recommends archive when responses exist.
- New/Edit, Present QR and View Results links intentionally open protected placeholder routes owned by Phases 5, 6 and 9. Their action links are complete dashboard navigation, not claims that those later features exist.
- TypeScript, lint, production build, 27 unit tests and 28 Playwright desktop/mobile tests passed. Browser data and mutations were intercepted; a real instructor dashboard session against hosted rows remains a manual check.

## Phase 5 verification and limits

- `/surveys/new` and `/surveys/:id/edit` share one responsive editor with stable UUIDs, field-level errors, multiple-choice and fixed True/False choices, keyboard ordering controls, delete confirmations, save/activate controls and unsaved-change warnings.
- The new `save_survey` definer RPC validates trusted instructor authorization, locks existing surveys, rejects stale tabs, preserves historical response graphs, converts editable closed/no-response surveys back to draft and atomically applies metadata/question/choice inserts, updates, deletes and positions.
- Active, archived and closed-with-responses surveys render a locked explanation rather than editable controls. Activation still uses the existing atomic lifecycle RPC after a successful editor save.
- Fresh PostgreSQL migration/editor/security/concurrency checks passed. Unit suite: 31 passed. Browser editor validation, True/False normalization, ordered RPC payload, reload, unsaved warning and active lock passed on desktop/mobile using intercepted Supabase calls.
- Hosted persistence remains unverified until migration `202611030002` and `003_editor.sql` are manually run in Supabase. No existing response row was deleted or recreated by the editor tests.

## Phase 6 verification and limits

- The protected `/surveys/:id/present` route loads the real survey title/status/slug and response count, generates its `/s/:slug` URL from the current application origin, generates a QR PNG with `qrcode`, and supports copy, PNG download, fullscreen, results navigation, activation and confirmed closure.
- Active presentations poll the instructor-only count every five seconds while the page is visible. Poll failures retain and label the last known count; a concurrent activation is reflected as a closed status on the next refresh.
- The existing lifecycle RPC remains the server authority: it serializes activation, closes the prior active survey, preserves an existing random slug, and row-locks closure against student submissions. No RLS policy or schema was weakened or replaced.
- The disposable PostgreSQL suite passed single-active, sequential switch, reactivation slug preservation, concurrent activation, close/submission locking and post-close rejection. Unit and desktop/mobile browser tests passed URL, generated QR data, clipboard copy, downloaded PNG signature, count display and closure using intercepted API responses.
- A local presentation deliberately warns that its loopback QR is development-only. The URL automatically uses the Cloudflare/application origin after deployment, but a physical-phone scan, hosted response-count update, and real-session hosted lifecycle switch remain manual checks.

## Phase 7 verification and limits

- `/s/:slug` uses the isolated non-persistent public Supabase client and the narrow `get_public_survey` RPC. It displays only active survey title/description and position-ordered questions/choices; closed and unknown slugs receive content-free states.
- The single-column form uses labeled radio groups, inline required errors, 44px-or-larger choices, a full-width submit control, pending-state click protection and friendly success/duplicate/closed/not-found/network feedback. No login or instructor navigation is rendered.
- Submission uses only `submit_survey_response`; browser tests assert that no direct `responses` or `answers` REST request occurs. The database function remains responsible for active-state locking, exact coverage, relationship validation, duplicate uniqueness and atomic response/answer writes.
- A random token is scoped to the survey slug, written before the request and reused for retries. A success marker is written only after confirmation. If local storage is unavailable, the current-page in-memory token remains usable and the limitation is disclosed.
- The disposable database suite and intercepted desktop/mobile browser tests passed locally. A real anonymous request through the hosted publishable key, a second-device QR flow, hosted closure race and physical mobile browsers remain manual verification.

## Phase 8 verification and limits

- `crypto.randomUUID()` creates a UUIDv4 token before the first request. A valid token is persisted under a slug-scoped localStorage key and reused on refresh; a malformed stored value is replaced. A synchronous ref lock prevents two same-tick click events from starting two requests before React rerenders.
- Migration `202611030003` retains the reviewed transactional insertion as a non-executable private function and exposes an `anon`-only wrapper. The wrapper requires a UUIDv4/RFC-variant token, lowercases it, and rejects null, blank, malformed and non-v4 tokens with `INVALID_ANONYMOUS_TOKEN` before a write.
- The existing partial unique index on `(survey_id, anonymous_token)` remains the concurrency authority. Two parallel database sessions using the same pair produced one committed response and one `DUPLICATE_RESPONSE`; the row count was exactly one. The same token then committed once in each of two different surveys.
- Desktop/mobile browser tests fired two DOM clicks in the same synchronous turn and observed exactly one RPC request. They also verified UUID shape, tampered-token replacement, localStorage persistence, success-marker persistence, refresh-to-duplicate state and a content-free friendly duplicate error.
- These tests reduce accidental duplicates; they cannot prevent deliberate resubmission after clearing storage or from another browser/device. Migration 003 and real anonymous concurrency remain unverified on the hosted project.

## Phase 9 verification and limits

- Migration `202611030004` adds `get_survey_results` and `export_survey_responses`. Both have an empty search path, require `private.is_instructor()` internally and grant execution only to `authenticated`; anonymous and ordinary authenticated test callers were denied.
- Aggregation executes in PostgreSQL and returns ordered questions plus every ordered choice, including zeros. It reports total submissions, per-question answered/unanswered counts and raw choice counts. The frontend uses answered count—not total submissions—as the percentage denominator and rounds to one decimal place.
- `/surveys/:id/results` remains protected by the instructor route guard, displays survey metadata/status, total submissions, exact text counts and percentages, Recharts bars, zero-response and incomplete-history states, manual refresh and responsive actions. Recharts is lazy-loaded away from the public student path.
- Export uses a separate authorized snapshot that excludes `anonymous_token`. The browser creates a UTF-8 BOM CSV with metadata plus one row per response, ordered question columns, timestamps, CSV quoting and spreadsheet-formula neutralization. Automated download/content tests passed, and Excel 16.114.1 correctly imported a synthetic production-shaped fixture. A hosted export and high-volume/paginated behavior remain unverified.

## Phases 10–12 verification and limits

- Dashboard title and inclusive local-calendar date filters compose with status filtering and reset together. Results RPC verification proved active, closed and archived access while response/answer counts remained unchanged.
- CSV tests cover one row per response, metadata, IDs/timestamps, question headings, blank historical answers, commas, quotes, line breaks, Unicode and leading-whitespace formula injection. Excel compatibility evidence is recorded in [CSV_SPREADSHEET_TEST.md](CSV_SPREADSHEET_TEST.md).
- Duplication is a single instructor-only database transaction. It creates fresh survey/question/choice IDs in Draft state, preserves ordering and content, omits slug/responses/answers, and leaves the original unchanged. Failure and unauthorized paths leave no copy.
- Migrations 002–005 and these workflows still require hosted-project application and verification; local/disposable evidence is not presented as remote success.
- Disposable PostgreSQL verification and intercepted desktop/mobile browser tests passed. Migration 004, real hosted result counts, hosted authorization denial and production CSV remain unverified.
