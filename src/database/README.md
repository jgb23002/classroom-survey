# Database code

Versioned PostgreSQL migrations belong in `supabase/migrations/`, and database integration tests in `supabase/tests/`. Both are reserved for the database phase.

After migrations are applied and verified, generate the actual Supabase TypeScript database types here and type the shared clients with them. Do not invent a generated schema or assume tables exist before database setup. `DATABASE.md` remains the supplied schema reference.
