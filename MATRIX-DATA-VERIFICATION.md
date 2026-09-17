# MATRIX data verification

MATRIX is the application name. LifeOS is the concept alias. Existing local storage keys retain the alias so previously saved records remain accessible.

## Supabase

- Project: matrix (`fgcnhkzuoakclrrlvodg`).
- Read all 143 records from `public.entities`, across 17 database entity types, belonging to one owner. No deleted records were present.
- Preserved the existing schema, records, and row-level security. Owner access uses `auth.uid() = user_id`.
- Configured the public client with a publishable key in ignored `.env.local`. No privileged credential is used in the app.
- Verified the REST API is reachable and signed-out users receive zero entity rows.
- Added account sign-in and a paginated owner-scoped reader. Live authenticated loading still needs the account owner to sign in on the MATRIX data screen. No password should be placed in code or sent through chat.
- Connected records are read-only for this review. New local records are not uploaded; complete two-way sync remains outstanding.

## Developer preview

- Data source control is on Home and in Settings.
- The fetched snapshot is at `/private/tmp/matrix-preview.8PlPPD/entities.json`, outside the source repository and release bundle.
- The preview server listens only on `127.0.0.1:8766`. The iOS Simulator can use it; a physical phone or Android emulator needs its own explicitly configured development connection.
- Developer scenarios are restricted to development builds: full (143), empty (0), sparse (3), and duplicated stress data (2,145). They replace the visible data source, remain in memory, and do not mutate production or overwrite local records.
- The app resets its preview on restart. The server may need restarting after a development session ends.
- Visually verified all four scenarios rendering on iOS. This is not a claim that every app workflow has been exhaustively verified.
- Opening a real reminder exposed PostgreSQL timestamp formatting incompatibility with iOS. Added ISO normalization and regression coverage. Source labels now distinguish preview, Supabase, and local data.

## Mapping and scenarios

`matrix-adapter.ts` maps database types/subtypes to the catalog. It retains original data fields, including nested objects as JSON text. All 143 rows mapped without loss of record IDs.

Automated checks cover missing titles, unknown types, zero amounts, nested data, soft deletion, completion status, device-only flags and timestamp normalization. Existing store checks cover concurrent writes, edits, relationships, deletion and corrupt-data preservation.

People now reads the selected source with searchable people, family, group and organization filters, a virtualized list, and links to saved details. Insights now calculates task completion and record counts from that source, and displays stored insight records separately from its calculated overview. Both support light/dark appearance, refresh, errors and empty states. TypeScript and mapping/store regression checks pass.

Follow-up iOS UI verification with the full snapshot: People shows 10 connections; Organizations filters to 2. Insights shows 1 of 7 tasks completed, all 143 records distributed across 7 areas, and the 5 stored insight records. Settings wording distinguishes read-only connected data from local saves and future sync.

Messages now reads actual conversation/message entities with search, group/unread/local filters, summary-to-record navigation and persistent local drafts. Five threads are projected from the full snapshot; call logs are excluded from chat threads. Hardcoded chat content and nonfunctional call/video buttons were removed. Stored previews are explicitly distinguished from full chat histories, and local drafts are labelled not delivered. Mapping, store, form and TypeScript checks pass; native screen interaction verification remains pending.

Remaining scenario work: pagination under a live owner session, session expiry/offline recovery, long-field layout and list performance, production Android verification, date-specific dashboard fixtures, and actual authenticated messaging delivery, entity sharing and read receipts.
