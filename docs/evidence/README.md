# Database Evidence Checklist

The assignment requires real screenshots from the hosted Supabase project and
deployed application. They are intentionally not fabricated or inferred from
local tests.

Before submission, add sanitized images to this directory showing:

1. `01-database-tables.png` — the five required tables in Supabase.
2. `02-survey-and-questions.png` — one synthetic survey with related questions
   and choices.
3. `03-stored-response.png` — one synthetic response and its answers.
4. `04-application-results.png` — the instructor results page for that synthetic
   response.

Optional evidence may show RLS enabled and the installed RPC functions. Before
committing any screenshot:

- use synthetic classroom data, not real student information;
- crop or redact account email, project reference, browser tokens, user UUIDs,
  database connection details, API keys, passwords, and notification content;
- do not show `.env`, Auth credentials, SQL connection strings, request headers,
  secret/service-role keys, or the browser developer-tools storage panel;
- inspect image metadata and the full visible frame, not only the intended crop;
- confirm the image file is reasonably sized before staging it.

Keep the database-evidence and production TODO items unchecked until these
screenshots and the corresponding hosted behavior have actually been verified.
