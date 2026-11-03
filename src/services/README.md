# Services

Put typed application data-access operations here when database integration begins. Reuse the lazy clients in `../lib/supabase.ts`; public participation must use the isolated public client. Do not add browser storage pretending to be the database or hard-coded survey records.

Survey save/duplicate/lifecycle/submission operations will call the reviewed database RPCs from the implementation plan. No RPCs or migrations exist in Phase 1.
