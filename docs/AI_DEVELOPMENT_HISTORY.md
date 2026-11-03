# AI Development History

Use: concise record of prompts, changes, verification and problems for the assignment. Summaries are not a verbatim conversation export. Never record credentials, private student information or full secret-bearing tool output.

## 2026-11-02 — Folder preparation and assignment transcription

- **Prompts:** Create the supplied folder structure; remove unrelated starter files; remove and then re-add `ASSIGNMENT.md`; format the pasted assignment as Markdown.
- **Changes:** Created the requested files/folders, removed starter application/configuration/dependency artifacts at the user's direction, restored an empty `ASSIGNMENT.md`, then populated it with the supplied assignment using headings, tables, lists and checklist formatting.
- **Validation:** Verified the requested structure and compared every nonempty pasted source line after Markdown normalization; all 11 assignment sections were present. No application tests or deployment were performed.
- **Problems/context:** The remaining package manifest/README describe a starter app whose implementation files were removed. The later-populated specification files are authoritative inputs to the following review.

## 2026-11-02 — Requirements review and implementation planning

- **Prompt:** Act as senior full-stack assistant; inspect current state; read all six specifications; identify conflicts/security risks/missing decisions; write an implementation plan and decisions; preserve supplied specs/TODO; explain manual setup; keep history; do not generate the whole application.
- **Inspected:** `ASSIGNMENT.md`, `SPEC.md`, `DATABASE.md`, `API.md`, `UI.md`, `TODO.md`, package/README/ignore/env files and source/public/migration/evidence directories. Checked ancestor/project instruction-file availability and local tool versions. Confirmed this is not a Git repository. Consulted official Supabase, PostgreSQL, Vite and Cloudflare documentation for authorization, function privileges, locking, browser configuration and Pages deployment.
- **Changes:** Added `docs/IMPLEMENTATION_PLAN.md`, `docs/DECISIONS.md`, `docs/TODO_STATUS.md`, `docs/TODO_ORIGINAL.md`, and this history. No application source, dependencies, migrations, credentials, account settings or deployment were created/changed.
- **Findings/problems:** Source/public/migration directories are empty; env example is empty; build configuration and dependencies are missing; 123 supplied TODO checks lack corresponding implementation/verification in this checkout. Conflicts include slug versus ID routing, closed/not-found privacy, any-authenticated-user instructor permissions, editing versus historical integrity, required versus unanswered questions, and CSV metadata/header layout.
- **Proposed resolutions:** Preserve the required stack/five tables and supplied specs; document `/s/:slug`, minimal public lookup, trusted instructor claims, transactional lifecycle/save/submission, shared submission locks, immutable collected content, required single-choice answers, scoped browser tokens, instructor-only aggregates and safe CSV export. Keep actual status separate from received checkmarks.
- **Validation:** Read all six specifications; audited all 164 TODO entries (123 checked/41 unchecked); parsed the retained manifest; verified the lack of source/migrations and local Git metadata. SHA-256 preservation checks passed for all six supplied documents; retained package/README/ignore/env files were unchanged; TODO snapshot matched byte-for-byte; all five review documents were nonempty with balanced code fences; all 13 local links/anchors resolved. The plan passed a required-topic presence check, and source/public/migration/evidence directories remained empty. Documentation checks do not establish application correctness, database security or deployment success.
- **Next proposed phase:** Restore the React/TypeScript/Vite foundation and exact required dependencies, Tailwind/Router configuration, safe env handling, minimal home/route shells, ESLint/formatting and useful setup docs; install/typecheck/lint/build and report actual results. Live backend tests follow database/account setup.

## 2026-11-02 — Phase 1: runnable frontend foundation

- **Prompt/scope:** Implement only Phase 1: compatible React/TypeScript/Vite/Tailwind setup, required libraries, lint/format/tests, reusable folders, safe Supabase clients, all UI routes, distinct layouts, professional landing and honest placeholders; verify checks; update TODO/history and stop.
- **Changes:** Restored entry/configuration and strict TypeScript; configured Tailwind's Vite plugin, React Router and required libraries; added contexts/hooks/services/types/utilities/database folders, lazy isolated Supabase clients, shared accessible controls/layouts, modular route pages, env placeholders/ignore rules, ESLint 10/Prettier/Vitest/Playwright and setup documentation. Full inventory and exact pinned versions are in [PHASE_1_REPORT.md](PHASE_1_REPORT.md).
- **Validation:** Clean lockfile install succeeded. Build/typecheck and lint passed. Configuration tests: 20 passed. Chromium foundation tests: 16 passed across desktop and mobile emulation, including navigation, refresh, focus/skip link, disabled login, student isolation, absence of backend calls and viewport fit. Desktop/mobile screenshots were visually inspected; temporary servers/browsers stopped. Git-ignore rules were verified in a temporary repository. Production audit: zero findings; full audit: 13 moderate development-tool findings.
- **Problems/resolutions:** Sandbox DNS and localhost binding blocked initial npm/browser attempts; authorized executions succeeded. Browser evaluate callbacks needed DOM types, so tests received a separate TypeScript config. Initial Router-link lint mapping was corrected, then the optional legacy accessibility lint plugin was removed because it required deprecated ESLint 9; the final supported ESLint 10 setup and browser checks passed. TypeScript 6.0.3 matches the current TypeScript ESLint peer range, unlike the retained starter's TypeScript 7 range. The remaining minimatch development-tool advisory is documented without forced incompatible fixes.
- **Progress:** Updated current TODO under the user's explicit authorization: 11 Phase 1 tasks checked, 153 later tasks unchecked. Preserved all task descriptions and the byte-identical received snapshot. Other supplied specifications are unchanged.
- **Limits/next phase:** No live Auth, route authorization, database/migrations/RLS/RPC, survey operations, QR/charts/CSV, 200-student performance result, GitHub push or deployment is implemented/certified. Owner Supabase setup and the reviewed database phase come next; work stops after Phase 1.

## Later phase entry format

- **Prompt/scope:**
- **Files/behavior changed:**
- **Validation performed and outcomes:**
- **Problems, limits and manual checks remaining:**
- **Next bounded phase:**
