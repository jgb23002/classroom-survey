# Classroom Survey Development Summary

## Specification-driven development

The application was developed from the supplied `ASSIGNMENT.md`, `SPEC.md`,
`DATABASE.md`, `API.md`, `UI.md`, and `TODO.md` documents. Before implementation,
the specifications were compared for contradictions and translated into an
implementation plan and explicit decisions. The original documents and original
TODO snapshot remain preserved, while the current TODO records only work
supported by code or verification evidence.

The project uses the required React, TypeScript, Vite, Tailwind CSS, React
Router, Supabase, Recharts, QR-code, Git, and Cloudflare Pages-oriented stack.
The AI coding agent assisted with architecture, frontend components, database
migrations, test fixtures, debugging, documentation, and security review. The
project owner remains responsible for account setup, trusted instructor
provisioning, hosted SQL execution, deployment, physical-device testing, and
submission evidence.

## Application and database architecture

The frontend is divided into protected instructor routes and an isolated public
student route. Supabase Auth restores instructor sessions, while both frontend
checks and server-side database functions require the trusted
`app_metadata.role = instructor` claim. The student client does not persist or
restore instructor sessions.

Five PostgreSQL tables store surveys, questions, choices, responses, and
answers. Foreign keys, unique constraints, checks, indexes, timestamp triggers,
and Row Level Security enforce the model. Versioned migrations add atomic
functions for survey editing, activation, closure, anonymous submission,
results, export, and duplication. Anonymous users can retrieve active public
content and call only the submission/public lookup functions; they cannot read
responses, answers, drafts, archived surveys, or instructor results.

Frontend services call Supabase through typed reusable operations rather than
embedding queries in route components. Complex graph writes and lifecycle
changes are database transactions, preventing partially saved surveys or
responses. Results aggregation returns counts rather than exposing student
records to public routes. CSV export is instructor-only, omits browser tokens,
escapes delimiters and Unicode, and neutralizes spreadsheet formulas.

## Debugging and verification

Several problems were found through evidence-driven debugging. A hosted survey
save failure was traced to a missing editor RPC rather than hidden by a generic
message. Later duplication and results failures were traced with safe public-key
probes to missing remote migrations `004` and `005`; no remote write was made.
The frontend now reports the specific missing migration. QR codes originally
used the browser origin, which makes localhost unreachable from a phone. The app
now supports a validated `VITE_PUBLIC_APP_URL` so displayed, copied, and encoded
student links use one deployed origin.

Verification is layered. Vitest covers utilities and service contracts.
Playwright covers the complete instructor-to-student workflow across Chromium
and Firefox, including responsive layouts and automated accessibility checks.
A disposable PostgreSQL cluster applies every migration and checks schema,
RLS, authorization, atomicity, historical results, duplication, and concurrency
without connecting to production. Exact commands, counts, failures, and limits
are recorded in `docs/TESTING.md`.

## Deployment status and lessons

The repository is configured for Cloudflare Pages using `npm run build` and the
`dist` output directory. Production requires the public Supabase URL,
publishable key, and deployed application origin as Pages build variables, plus
matching Supabase Auth callback URLs. At this review, deployment and the hosted
end-to-end workflow are not verified and remain correctly unchecked in
`TODO.md`.

The work demonstrates that full-stack correctness cannot be established from a
working interface alone. Authorization must be enforced in PostgreSQL, compound
writes need transactional boundaries, anonymous access must be tested with the
actual public role, and local browser tests must be distinguished from hosted
evidence. It also shows why public QR links, database schema state, accessibility,
and secret scanning belong in the release process rather than being treated as
last-minute polish.
