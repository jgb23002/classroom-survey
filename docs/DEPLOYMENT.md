# Production Deployment Record

Last audited: 2026-11-03 (America/New_York).

## Production target

- Public origin: `https://e22ba2d3-classroom-survey.jiya-bhadreshbhai-gorasiya.workers.dev`
- Provider observed from response headers: Cloudflare.
- Application: Vite production bundle served over HTTPS.
- Intended repository build command: `npm run build`.
- Intended static output directory: `dist`.

The public hostname is a `workers.dev` hostname, not the usual `pages.dev`
hostname. The HTTP response proves a Cloudflare deployment exists, but it does
not prove whether the Cloudflare dashboard resource is Pages, Workers Static
Assets, or whether it is connected to GitHub. Confirm those dashboard details
manually before describing the deployment specifically as Cloudflare Pages.

## Browser environment

The production bundle must contain only public browser configuration:

| Variable                        | Production requirement                           | Audit result                                                                                                                                                                |
| ------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | HTTPS Supabase project origin                    | Present and usable; the hostname is intentionally not reproduced here.                                                                                                      |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public `sb_publishable_...` browser key          | Present and accepted by Supabase. Never replace it with a secret/service-role key.                                                                                          |
| `VITE_PUBLIC_APP_URL`           | Preferred explicit production application origin | Not embedded in the audited bundle. The implemented browser-origin fallback resolves to the correct `workers.dev` origin, but explicitly setting this value is recommended. |

Vite substitutes these values at build time. Any change requires a new
production build and deployment. The published JavaScript contained no
JWT-shaped credential. Text such as `sb_secret_` and `service-role` occurs only
inside client-side rejection/error logic; no corresponding secret value was
found.

## Checks performed without credentials

- `/`, `/login`, `/dashboard`, `/surveys/new`, `/auth/callback`,
  `/reset-password`, and `/s/production-audit-invalid-slug` returned HTTP 200.
- The direct-route documents matched the root document byte-for-byte, proving
  the production SPA fallback for those routes.
- The login form rendered enabled email, password and Log in controls.
- Signed-out visits to `/dashboard` and `/surveys/new` redirected to `/login`
  with a local `returnTo` parameter.
- A nonexistent student slug called the hosted `get_public_survey` RPC and
  displayed the friendly Survey not found state.
- Desktop Chromium/Firefox (1280x800) and mobile Chromium (390x844) smoke checks
  found no horizontal overflow, console errors, page errors or failed requests.
- Anonymous reads of `responses` and `answers` and anonymous execution of
  `activate_survey`, `close_survey`, `get_survey_results`, and
  `duplicate_survey` were rejected with PostgreSQL permission error `42501`.
- Public reads of surveys, questions and choices succeeded. A final
  pre-submission recheck found exactly one active hosted survey; its public RPC
  returned three questions and eight ordered choices without exposing results.

These checks are deliberately read-only. They did not sign in, create a survey,
submit answers, change production data, or inspect private results.

## Final verification matrix

`Verified` means direct production evidence was collected during this audit.
`Manual` means local automation exists but production evidence is still needed.

| #   | Production requirement      | Result   | Evidence or remaining check                                                                                                              |
| --- | --------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Build and deployment        | Verified | Local production build passed and the deployed Vite assets returned 200. Dashboard build history remains manual.                         |
| 2   | Environment variables       | Partial  | Supabase URL/key work. Explicit public app URL and Cloudflare variable screen remain manual.                                             |
| 3   | SPA direct refresh          | Verified | Root and six nested routes served the identical shell.                                                                                   |
| 4   | Instructor login/logout     | Manual   | Login UI is enabled; valid credentials/logout were not used.                                                                             |
| 5   | Protected instructor routes | Partial  | Signed-out dashboard/editor redirects passed; instructor and non-instructor sessions remain manual.                                      |
| 6   | Real create/edit            | Manual   | Requires an authorized instructor and production mutation.                                                                               |
| 7   | Activation/closure          | Manual   | Anonymous execution is denied; authorized behavior remains manual.                                                                       |
| 8   | Production QR URL           | Partial  | Runtime origin fallback is production-safe; an active survey QR/PNG and phone scan remain manual.                                        |
| 9   | Anonymous mobile access     | Partial  | Hosted active-survey data is anonymously readable and the public UI passed at 390x844; a physical-phone survey visit remains manual.     |
| 10  | Submission persistence      | Manual   | An active survey is readable, but this audit inserted no production data; hosted submission persistence remains manual.                  |
| 11  | Duplicate protection        | Manual   | Requires two real same-browser attempts; database behavior is verified only in disposable tests.                                         |
| 12  | Instructor-only results     | Partial  | Anonymous results RPC was denied; authorized results remain manual.                                                                      |
| 13  | Charts and percentages      | Manual   | Requires known production responses and visual comparison.                                                                               |
| 14  | CSV export                  | Manual   | Requires an instructor session, responses and spreadsheet inspection.                                                                    |
| 15  | Historical results          | Manual   | Requires closing/archiving a production test survey.                                                                                     |
| 16  | RLS/unauthorized access     | Partial  | Anonymous private table/RPC denial passed; normal authenticated non-instructor testing remains manual.                                   |
| 17  | Responsive/browser support  | Partial  | Production desktop Chromium/Firefox and mobile Chromium smoke passed; Safari and a physical device remain manual.                        |
| 18  | No frontend secret          | Verified | Only public configuration was detected; no JWT-shaped secret was present.                                                                |
| 19  | No console errors           | Partial  | Public and signed-out smoke paths were clean; the authenticated workflow remains manual.                                                 |
| 20  | No fake database features   | Partial  | Production public lookup reached Supabase and source pages use real services; each authenticated feature still needs the workflow below. |

## Cloudflare and Supabase settings to verify manually

1. In Cloudflare, confirm the production branch, `npm run build`, output
   directory `dist`, Node version compatible with `package.json`, and all three
   production variables above. Set `VITE_PUBLIC_APP_URL` exactly to the public
   origin shown above, without a trailing path, then redeploy.
2. Confirm whether the site is a Pages project or a Workers Static Assets
   project and whether it is connected to the intended GitHub repository.
3. In Supabase Authentication URL Configuration, set the Site URL to the public
   origin and allow at least `/auth/callback` and `/reset-password` on that
   origin. Keep localhost callbacks only if still needed for development.
4. Confirm the instructor's Auth user has trusted
   `app_metadata.role = "instructor"`, then refresh or sign in again so the JWT
   includes the current claim.
5. Use browser developer tools during the manual workflow below. Record failed
   Network requests and console errors without copying tokens or passwords.

## Manual production workflow

Use a disposable survey title such as `Production verification YYYY-MM-DD` and
non-sensitive answers.

1. Sign in at `/login`; refresh `/dashboard`; open `/surveys/new` directly; log
   out; confirm all protected routes return to Login.
2. Create a draft with one Multiple Choice and one True/False question. Save,
   reload and edit/reorder it. Confirm the same data persists.
3. Activate it. Confirm any prior active survey closes and the presentation URL
   begins with the exact production origin.
4. Copy the URL, download the QR PNG, and scan it on a phone using cellular data
   or normal Wi-Fi. The phone must not be signed into the instructor account.
5. Submit all answers once. Confirm success and a new hosted response count.
   Refresh and attempt again in the same browser; confirm the friendly duplicate
   state. A different browser/storage profile may submit once by design.
6. Open results as the instructor. Check every count and percentage against the
   known submission and verify zero-count choices remain visible.
7. Export CSV and open it in a spreadsheet. Confirm one row per response,
   readable Unicode, timestamps and safe values.
8. Close the survey and verify the public URL rejects a new submission. Archive
   it and confirm results and CSV remain available.
9. In a signed-out/private window, confirm result and editor URLs redirect to
   Login. Optionally test a normal authenticated non-instructor account; it must
   be signed out/denied and must receive database permission errors.

Do not delete legitimate surveys or use real student information for this
verification. Record the observed outcomes in `docs/TESTING.md` before checking
the remaining production TODO items.
