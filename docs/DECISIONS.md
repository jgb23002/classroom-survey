# Classroom Survey — Decisions and Specification Review

Date: 2026-11-02 (America/New_York).

All decisions below are proposed implementation defaults derived from the assignment, the supplied specifications, and the user's explicit requirements. They are documented before coding and are not implemented by this review. Original specifications remain unchanged. A change to a default must be recorded here with its reason and verification impact.

## D01 — Authority, filenames and fixed stack

Sources: ASSIGNMENT §§3/5/6; SPEC §§7/8; current user request.

The assignment allows hosting/database alternatives, but SPEC and the user require React + TypeScript + Vite, Tailwind, Router, Supabase JS/Auth/PostgreSQL, Recharts, `qrcode`, Git/GitHub and Cloudflare Pages. Use those technologies throughout. The assignment's longer specification filename refers to the content now supplied as `SPEC.md`; no duplicate is needed. Keep exactly five domain tables; do not add courses/instructors/role tables or future product features. Supabase's managed Auth schema is separate platform infrastructure.

Consequence: no replacement framework/hosting service or custom server during implementation. Development-only test/lint tooling is permitted. All supplied functionality, including duplicate/archive/reorder/date filtering/metadata export, stays in scope even where the assignment describes a smaller baseline.

## D02 — Original TODO marks are not completion evidence

Sources: TODO phases 1–15; assignment §7.A; user preservation/evidence rules.

Contradiction: 123 of 164 supplied tasks are checked, including database and deployment tasks, while the current checkout has no application source, migrations, dependencies or Git repository. The Supabase-project task is unchecked even though its table tasks are checked. External account/project state is unknown.

Resolution at the initial review: preserve a byte-for-byte received snapshot in `docs/TODO_ORIGINAL.md` and do not treat supplied checks as verified work. The user later authorized evidence-backed updates to the current `TODO.md`. Implementation completions require code and/or successful verification suited to the claim; chronological evidence remains in `docs/AI_DEVELOPMENT_HISTORY.md`.

The assignment eventually asks for an updated `TODO.md`, whereas the current instruction forbids editing supplied specs. For this review the no-edit instruction controls: provide evidence-backed status separately. Before final submission, obtain authorization to reconcile `TODO.md` with demonstrated progress, retaining the original snapshot. This is a final-documentation issue, not a reason to stop this review or routine implementation.

## D03 — One public route and one stable published slug

Sources: TODO phase 7 (`/s/:surveyId`), API §9 and UI §1 (`/s/:slug`), DATABASE §6.

Use `/s/:slug`; instructor routes keep internal UUIDs. Generate a high-entropy, URL-safe, nonsequential slug server-side on first successful activation, enforce uniqueness and retry collisions. Retain it across closure/reactivation. Slugs prevent easy enumeration but do not grant access to protected data. Do not implement a second UUID-based public route.

## D04 — Public lookup distinguishes closure without exposing closed content

Sources: DATABASE §8 restricts public reads to active surveys; UI §8 requires distinct closed/not-found states; API §9 exposes only survey/question/choice data.

A normal active-only RLS query cannot distinguish an unknown slug from a closed survey. Use a narrow `get_public_survey` RPC. It returns content only for an active survey; for a previously published closed/archived survey it returns only `state: closed`; for an unknown or draft survey it returns `state: not_found`. No closed title, questions, answers, response count, timestamps or instructor data are returned. A draft remains unavailable even if it retains an earlier slug after editing.

Revoke anonymous direct table access, and expose only this public read and the submission RPC. This preserves active-survey readability without adopting the documents' conceptual direct-SELECT policies as the sole interface. Closed-state distinction reveals only that a known unguessable link is unavailable, which is necessary for the specified UI.

## D05 — Instructor authorization must survive a forged client

Sources: DATABASE §10 permits any authenticated user in the initial deployment; assignment §§5/9 and user require instructor-only management/results.

Risk: anyone able to register or obtain an ordinary Auth account could become an instructor under `using (true)` authenticated policies. A hidden signup form and frontend route guard do not prevent direct API access.

Resolution: administrator-provision the instructor Auth user, disable public signup and anonymous Auth sign-ins, and require a server-managed `app_metadata.role = instructor` claim plus an authenticated user ID in RLS and every privileged definer RPC. Do not authorize using `user_metadata`, an email supplied by the client, or a frontend variable. No public signup or role-management screen is added. Reject ordinary authenticated users even if signup is accidentally enabled.

Role changes require a refreshed session/JWT and may not invalidate an already-issued token immediately; document that operational limit and verify refresh behavior. The plan supports the single-instructor deployment without adding multiple-instructor product features. Supabase documents trusted application metadata and JWT freshness in its [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security), and signup controls in [Auth configuration](https://supabase.com/docs/guides/auth/general-configuration).

## D06 — Publishable configuration and deny-by-default permissions

Sources: assignment §§6/9; user key/security requirements; DATABASE §§7–11.

Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are required frontend configuration. Never put database passwords, privileged CLI credentials, secret keys or service-role keys in frontend environment variables, local source, screenshots, history or Pages build variables. Public configuration is embedded at build time. Populate `.env.example` with placeholders later; exclude `.env` and variants while allowing the example.

Anonymous students use no Auth account or Auth anonymous sign-in. An isolated public Supabase client must not restore an instructor session. Anonymous roles cannot SELECT responses/answers or execute any result/count/export/management function. All five tables use RLS; grants and function privileges are checked separately. A submission returns only its own new receipt ID, as specified by API §10, not a queryable submission record.

Default to security-invoker read functions. A definer RPC needed for public lookup, atomic submission, or protected mutation must set `search_path = ''`, schema-qualify objects, validate inputs/authorization internally, and explicitly revoke broad `PUBLIC`/role execution before granting intended callers. The SQL function privilege defaults are not sufficient. See [Supabase function security](https://supabase.com/docs/guides/database/functions), [API keys](https://supabase.com/docs/guides/getting-started/api-keys), and [Vite environment variables](https://vite.dev/guide/env-and-mode).

## D07 — All v1 questions require one selected choice

Sources: SPEC supported types/schema; UI §7; TODO phases 5/7/9; user required-answer validation.

There is no optional-question flag. Treat every question as required and single-select in v1. Activation requires a nonblank title, at least one complete question, nonblank question/choice text, and valid positions. Multiple-choice questions need at least two nonblank choices. True/false has exactly two fixed labels, `True` and `False`, each with its own choice ID; ordering can change but meaning cannot.

Drafts may be incomplete in structure: an instructor can save a titled draft with no questions or a nonblank multiple-choice question whose choice count is not yet sufficient for activation. Every persisted title and question/choice text must still be nonblank. True/false uses the two fixed choices supplied by the editor. Full question-count/type/choice-count validity is enforced again before activation.

The atomic save contract reports exactly what was persisted. If any current local item cannot satisfy storage constraints, reject the entire save with field errors and preserve the local form. Never silently discard a blank question/choice or claim an incomplete local form was saved. Required-answer enforcement is repeated in the submission RPC; disabling Submit is only UX.

No correctness/grading model, text-answer UI, multiselect or optional-question toggle is added. Keep the schema's nullable historical/future answer fields without exposing unsupported question types.

## D08 — Stable ordering and atomic editor saves

Sources: UI §5; TODO phase 5; DATABASE question/choice positions.

Use 1-based positions, stable IDs in local form state, keyboard-operable up/down controls for both questions and choices, and database uniqueness within each sibling group. Deferred uniqueness or an equivalent transaction-safe reorder avoids temporary collisions. Normalize final order on save.

One instructor RPC saves survey metadata and the complete content graph transactionally. It checks expected `updated_at` under a row lock to detect a stale tab. Return a conflict that preserves local edits; never overwrite another committed save silently. Do not implement autosave or drag-and-drop as required extra features.

## D09 — Lifecycle, editing and historical integrity

Sources: assignment §4.1 emphasizes draft editing; TODO phase 5 blocks active editing until closed; DATABASE §§3/13 allow cascading child deletion; TODO phase 10 requires preserving history.

| State | Permitted behavior |
| --- | --- |
| Draft | Edit/save, duplicate, activate when valid, archive, delete |
| Active | Present, read results, close, duplicate; content edits/archive/delete require closing first |
| Closed with no responses | Edit back into draft, reactivate valid content, duplicate, archive, delete |
| Closed with responses | Read/export results, reopen unchanged, duplicate, archive, confirmed delete; content remains immutable |
| Archived | Read/export historical results, duplicate, confirmed delete; no editing/reactivation or unarchive feature in v1 |

Without a versioned schema, editing/removing questions or choices with responses can corrupt historical meanings or null old selected choices. Freeze title/description/questions/choices after the first response and guide users to Duplicate for a revised survey. Closing is necessary before editing, but does not erase the history constraint.

Reactivating a closed survey retains its slug, responses and per-survey duplicate tokens. Explain that it continues the same collection; Duplicate starts a fresh class/round with no responses or slug. Archive is the default recommendation for retaining data, while Delete remains available with a stronger warning when responses exist. Enforce rules in mutation RPCs, not just disabled buttons.

## D10 — Serialize activation and coordinate closure with submissions

Sources: assignment §4.1; DATABASE §5; API §§7–8; user atomic RPC requirements.

Keep the global partial unique index for active status. Lifecycle functions acquire a shared convention of one transaction-scoped exclusive advisory lock, then lock affected survey rows deterministically and revalidate eligibility. Atomically close the old survey, create a slug if needed and activate the target. Reactivating an already active target is a safe repeat. Failure rolls back the entire change.

Submission acquires a shared row lock on the survey, checks active status after lock acquisition, and holds that lock until its response/answers commit. Multiple students can share this lock; close/content changes/deletion require a conflicting row lock. A previously admitted submission may commit before closure, while no new one is admitted after successful closure commits. Avoid serializing every student behind an exclusive survey lock. Lock ordering and races require actual integration tests; [PostgreSQL locking documentation](https://www.postgresql.org/docs/current/explicit-locking.html) establishes the lock compatibility, not the correctness of an unwritten implementation.

## D11 — Atomic validation is stricter than independent foreign keys

Sources: DATABASE §§3/9/11; API §10.

A valid response must have exactly one answer for every question of the active survey and no additional/repeated questions. Every selected choice must belong to its question. Validate the full JSON payload, token and cross-survey relationships before committing any rows; supplement FK checks with an integrity trigger. Reject null choice IDs/text answers for new v1 submissions. Preserve schema compatibility for historical rows.

Anonymous users cannot insert directly into response/answer tables; the submission RPC performs the bounded write with explicit execution permissions. Likewise, instructor direct DML must not bypass save/lifecycle/history rules. Retain the specified error codes and translate them into friendly UI states; never display raw SQL errors to students. Failed validation must leave no orphan response or partial answers.

## D12 — Browser tokens prevent accidents, not deliberate repeat voting

Sources: assignment §4.2; DATABASE response uniqueness; TODO phase 8.

Generate a cryptographically random UUIDv4 browser token per survey with `crypto.randomUUID()`, persist it in localStorage before the first request, and reuse it for retries. Scope storage keys by survey slug to avoid unnecessary cross-survey tracking. Replace malformed stored values instead of submitting them. The public database wrapper accepts only the canonical UUID shape with a version-4 nibble and RFC 4122 variant, lowercases it before storage, and rejects null, blank, non-UUID and other-version values as `INVALID_ANONYMOUS_TOKEN`. Enforce token uniqueness per survey in PostgreSQL, including concurrent requests. The `(survey_id, anonymous_token)` key means an identical token may submit once to each different survey. Only store a success marker after the database confirms success.

If localStorage is unavailable, retain a token in memory, explain the refresh limitation and permit participation; do not claim persistent duplicate protection in that case. A response committed before a lost network reply may produce the friendly duplicate state on retry, without revealing any prior submission content. Clearing storage or switching browsers/devices can bypass this protection. Anonymous account-free surveys cannot reliably prevent deliberate resubmission from another browser/device or cleared storage, and no CAPTCHA/login/device fingerprinting requirement is added. Record abuse/load limits as a deployment risk.

## D13 — Results semantics, unanswered rows and live behavior

Sources: API §11; UI §§6/9; TODO phases 9/10/16; SPEC future live charts.

Compute counts using an instructor-only consistent SQL aggregate, including every choice with zero counts. Total response count counts response rows. A question's answered count counts valid selected answers; unanswered count is total responses minus that count. For each choice, percentage is its count divided by that question's answered count, displayed to one decimal place; zero answered means 0%, never NaN. Explain the denominator. Rounding may not sum to exactly 100%.

Every new v1 response answers all questions, but legacy nullable choices/partial records need honest unanswered labels rather than disappearing. Preserve historical data and support title/status/created-date filters. Date filters refer to survey `created_at`, not response timestamps; translate the user's inclusive local-calendar selection into UTC half-open bounds. Sort most recent surveys first.

Results charts refresh on demand. Presentation polls instructor-only response counts approximately every five seconds while visible, pauses on hidden/unmounted pages, and shows stale/error state on failure. No Supabase Realtime subscription is required. The numeric count projected by an instructor does not make a count endpoint anonymously readable.

## D14 — CSV metadata and response layout

Sources: assignment §4.1; API §12's example versus its question-text header statement; TODO phase 11 metadata/one-row-per-response requirements.

Use one UTF-8 CSV whose first row contains fixed columns (`row_type`, survey ID/title/description/status/creation time, response ID/submission time) followed by ordered question-text labels prefixed with `Q1`, `Q2`, etc. Emit one explicitly labeled `survey_metadata` record, then one `response` record per actual submission. This keeps metadata available even for zero submissions, preserves one record per response, and avoids pretending a metadata record is a student response. Metadata is the exported snapshot; question definitions remain frozen after collection.

Use ISO 8601 timestamps, deterministic position order, blank fields for unavailable legacy answers, correct quoting for commas/quotes/newlines, and spreadsheet-formula neutralization for every user-controlled cell, including headers. Supply UTF-8/BOM handling suitable for spreadsheet testing. Do not include `anonymous_token`, credentials or private user identity. Paginate data reads rather than silently truncating at an API row cap. Open and verify with a real spreadsheet before claiming compatibility.

## D15 — Minimal accessible UX and complete request states

Sources: API §§13–14; UI §§2–15.

Use the specified minimal neutral styling, semantic fields/fieldsets/labels, visible focus, readable status text, numeric chart alternatives, and at least 44px touch targets. Student screens have no instructor menu/login prompts. Confirm Delete, Archive and Close and explain cascading deletion; protect nonempty editor content against accidental removal/navigation. Avoid decorative motion or a new modal-heavy workflow.

Every async screen has loading/error/empty feedback; mutation buttons disable while pending and recover after error. Friendly public states include submitting, success, duplicate, closed, not-found, validation and network failure. Auth errors do not reveal credential/account details. React escapes survey text; do not render instructor/student-supplied HTML.

## D16 — Performance, dependencies and evidence

Sources: SPEC §5; assignment §§6/9; user evidence rules.

Support 200 concurrent students and an average page load below two seconds as targets to measure, not assertions established by a scaffold. Lazy-load instructor-only charts/QR, use indexed database reads, concurrent shared-lock submissions, and bounded polling. Define measurement conditions and record failed as well as successful outcomes.

The current manifest's version ranges are a starting artifact, not proof that those exact packages resolve or are mutually compatible. Resolve and lock supported package versions and document a matching Node version in phase 1; do not change the specified stack. Configure ESLint/formatting as TODO requests, replacing the obsolete starter lint script in that phase. No dependency installation, build, security test or load test occurred in this review.

## D17 — Cloudflare Pages delivery and manual boundaries

Sources: SPEC §7; assignment §§6–7; TODO phase 15; user Cloudflare requirement.

Deploy the Vite static `dist` using Cloudflare Pages GitHub integration with `npm run build`. Use the documented Pages SPA fallback without a root `404.html`, then verify direct route loads and refreshes. Build-time configuration changes require a rebuild. Keep production and preview database targets explicit and run destructive fixtures only in an owned test context.

The owner must create/authenticate external accounts, select projects/repository/visibility/license, provide local public config, provision the Auth user and trusted role, execute reviewed SQL or authorize authenticated CLI access, authorize GitHub/Cloudflare integration, configure build/Auth URLs, and privately give the grader instructor access. These are manual dependencies for later phases; they do not prevent completing local review/foundation work. No credentials need to be pasted into chat.

Keep a concise interaction history, sanitized database/results screenshots, and a 1–2 page development summary. Record actual deployed URLs, commit/build identifiers and checks before declaring release complete. Cloudflare's [Pages React guide](https://developers.cloudflare.com/pages/framework-guides/deploy-a-react-site/), [Git integration guide](https://developers.cloudflare.com/pages/get-started/git-integration/), and [SPA serving behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/) support these deployment settings; do not replace Pages because another platform is suggested in newer guidance.

## Remaining decisions that require owner context later

- Supabase project/region and GitHub repository owner/name, external account readiness, and chosen open-source license.
- Actual production/preview origins and the private course-approved way to supply grader credentials.
- Availability of a separate test database project and a physical phone/second browser for manual evidence.

These are future setup choices, not unresolved application behavior. Account state, package installation, database security, performance and production behavior remain unverified until their respective phases.
