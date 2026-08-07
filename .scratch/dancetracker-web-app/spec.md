## Problem Statement

DanceTracker helps a dancer track performance/audition opportunities they discover on Instagram — capturing the post, its application deadline and performance date, and syncing those dates to a calendar so nothing is missed. The project started as a native iOS app (SwiftUI + SwiftData + EventKit + a Share Extension), with a working calendar-sync feature (prevent duplicate calendar events on re-sync) already built and test-covered.

Shipping natively to the App Store requires enrolling in the Apple Developer Program ($99/year), which the user does not want to pay. The same tracking + calendar-sync functionality is needed, but delivered as a web app instead, accessible from any browser without a platform fee.

## Solution

Rebuild DanceTracker as a React + Vite + TypeScript web app, backed by Supabase for auth and persistence. Users sign in with Google (via Supabase Auth, requesting Calendar scope), manually paste in opportunity details (replacing the iOS Share Extension, which has no reliable web equivalent), and sync deadline/performance dates to their Google Calendar. The calendar-sync dedup logic already built and tested for iOS (`CalendarService`) ports directly to TypeScript behind a `CalendarClient` seam, backed by a real Google Calendar API implementation. Persistence is abstracted behind an `OpportunityRepository` seam so CRUD and status-transition logic can be tested without hitting Supabase directly.

## User Stories

1. As a dancer, I want to sign in with my Google account, so that the app can act on my behalf without me managing a separate password.
2. As a dancer, I want the app to request Google Calendar access during sign-in, so that it can create and update calendar events for me.
3. As a dancer, I want to add a new opportunity by pasting the Instagram post URL and typing in the caption/details, so that I can capture what I found without relying on a share sheet.
4. As a dancer, I want to enter an organization name, application deadline, and performance date when adding an opportunity, so that the tracker has the dates it needs to sync.
5. As a dancer, I want to see a list of all my tracked opportunities, so that I can review what I've discovered.
6. As a dancer, I want to open a single opportunity's details, so that I can review or edit everything about it.
7. As a dancer, I want to edit an opportunity's fields after creating it, so that I can correct mistakes or add details I didn't have initially.
8. As a dancer, I want to change an opportunity's status (Discovered → Applied → Accepted/Rejected), so that I can track where I am in the process.
9. As a dancer, I want to sync an opportunity's deadline to my Google Calendar with one action, so that I get a reminder before I need to apply.
10. As a dancer, I want to sync an opportunity's performance date to my Google Calendar with one action, so that I get a reminder before the event.
11. As a dancer, I want re-syncing an opportunity (after editing its deadline or performance date) to update the existing calendar event rather than create a duplicate, so that my calendar doesn't fill up with stale duplicate entries.
12. As a dancer, I want the deadline event to include reminders 3 days and 1 day before, so that I have enough lead time to apply.
13. As a dancer, I want the performance event to include a reminder 1 day before, so that I don't forget the event itself.
14. As a dancer, I want the calendar event to include a link back to the original Instagram post (in its notes), so that I can revisit the source easily.
15. As a dancer, I want my opportunities to persist across sessions and devices, so that I don't lose my tracked list if I switch browsers or computers.
16. As a dancer, I want the app to work without installing anything, so that I can use it from any device with a browser.
17. As a dancer, I want an error message if calendar sync fails (e.g. access revoked), so that I know to reconnect rather than silently losing the sync.
18. As a developer, I want the calendar-sync dedup logic tested against a fake calendar client, so that the test suite runs in milliseconds without touching Google's API or requiring OAuth credentials in CI.
19. As a developer, I want opportunity CRUD/status logic tested against a fake repository, so that business-logic tests don't depend on a live Supabase connection.
20. As a developer, I want the Apify scraping token kept out of the browser bundle, so that it isn't publicly exposed to anyone inspecting the app's network requests or source.

## Implementation Decisions

- **Stack:** React + Vite + TypeScript (already scaffolded in `~/DanceTracker`, replacing the prior Swift/SwiftUI project, which was preserved in `~/.Trash/DanceTracker-swift-20260806-202852/`).
- **Backend:** Supabase — Postgres for persistence, Supabase Auth (Google provider) for sign-in, Supabase Edge Functions for anything requiring a server-side secret.
- **Domain model (`Opportunity`)** ported from the SwiftData model to a plain TypeScript interface: `id`, `instagramUrl`, `captionText`, `applicationLink`, `organizationName`, `deadline?`, `performanceDate?`, `deadlineEventId?`, `performanceEventId?`, `status` (`"discovered" | "applied" | "accepted" | "rejected"`), `createdAt`. `deadlineEventId`/`performanceEventId` store the Google Calendar event id once synced, enabling update-not-duplicate on re-sync.
- **`CalendarClient` seam** (already implemented): `saveEvent(input: SaveEventInput): Promise<string>` — creates a new event when `input.identifier` is undefined, or updates the existing event when it's set; returns the saved event's id either way. `SaveEventInput` carries `title`, `startDate`, `endDate`, `notes?`, `reminderMinutesBefore: number[]`.
  - Production implementation: `GoogleCalendarClient`, calling the Google Calendar API with the OAuth token obtained via Supabase Auth.
  - Test implementation: `FakeCalendarClient` (already implemented), records `savedEvents` and generates incrementing `event-N` ids.
- **`CalendarService`** (already implemented, fully tested): `syncDeadlineEvent`/`syncPerformanceEvent`, each a no-op if the corresponding date is unset, otherwise calls `client.saveEvent` with the opportunity's stored event id (if any) and returns the opportunity with the (possibly new) event id set. Deadline event: 1-hour duration, reminders at 3 days and 1 day before. Performance event: 2-hour duration, reminder at 1 day before. Both set `notes` to the opportunity's Instagram URL.
- **`OpportunityRepository` seam (new):** `list(): Promise<Opportunity[]>`, `create(input): Promise<Opportunity>`, `update(id, patch): Promise<Opportunity>`. Production implementation wraps the Supabase client and `opportunities` table. A `FakeOpportunityRepository` (in-memory) backs tests.
- **Google OAuth / Calendar scope:** Supabase Auth's Google provider is configured with the `https://www.googleapis.com/auth/calendar.events` scope in addition to the default profile scopes, `access_type=offline` and `prompt=consent` set on the auth request so a refresh token is actually issued (Supabase does not do this by default), and the resulting provider refresh token persisted server-side (not just session-scoped) so calendar sync keeps working across sessions. This is flagged as the highest-risk unknown in the whole spec and should be proven end-to-end (sign in → grant scope → create one real calendar event) before further UI is built on top of it.
- **Add-opportunity flow:** replaces the iOS Share Extension with a manual paste-a-URL form (Instagram URL + caption/org name/deadline/performance date fields), since Web Share Target only works for installed PWAs on Chrome/Android and isn't a reliable cross-platform substitute.
- **Apify scraping:** moved server-side into a Supabase Edge Function holding the Apify token as a secret; the frontend calls the Edge Function rather than Apify directly, since any token bundled into a Vite build is publicly visible.
- **Env/secrets:** Supabase URL/anon key in Vite env vars (client-safe); Apify token and any Google OAuth client secret live only in Supabase Edge Function / Auth provider config, never shipped to the client.

## Testing Decisions

- Tests only exercise behavior through the two confirmed seams — `CalendarClient` and `OpportunityRepository` — never Supabase or the Google Calendar API directly, and never internal implementation details of `CalendarService` or repository consumers.
- **`CalendarService`** (`src/services/calendarService.test.ts`, already written): tested via `FakeCalendarClient`. Prior art/pattern: this itself is a direct TypeScript port of the iOS `CalendarServiceTests` (XCTest + `FakeEventStore`), preserving the same two cases — re-sync updates rather than duplicates, for both deadline and performance events.
- **Opportunity CRUD / status transitions:** to be tested via `FakeOpportunityRepository`, following the same fake-seam pattern as `CalendarClient` — record calls, assert on what was requested, no real network/database access.
- **Google OAuth + Calendar end-to-end proof:** deliberately NOT unit tested behind a fake — this needs to be verified once, manually or via a scripted integration check against real Supabase/Google infrastructure, precisely because faking it would hide the real risk (scopes, offline token issuance) the spec is trying to surface.
- Test runner: Vitest (already installed and configured; `npm test` runs `vitest run`).

## Out of Scope

- Native iOS app maintenance or App Store submission (the Swift project is preserved in `~/.Trash/DanceTracker-swift-20260806-202850/` but not actively developed further under this spec).
- A true Share Extension / Web Share Target integration — the paste-a-URL flow is the accepted replacement.
- Multi-user/collaboration features (sharing an opportunity list between users).
- Push notifications beyond Google Calendar's own reminder system.
- Offline support / PWA installability.
- Verified-app status with Google (the OAuth consent screen may show an "unverified app" warning and cap at 100 test users under Google's defaults) — acceptable for personal/single-user use, not addressed here.

## Further Notes

- The `CalendarClient`/`CalendarService` pair and its tests already exist in the repo (`src/services/calendarClient.ts`, `calendarClient.fake.ts`, `calendarService.ts`, `calendarService.test.ts`) and needed no changes for this spec — they were ported as-is from the iOS implementation.
- Recommended build order (from prior discussion): Supabase project + schema first (unblocks everything else), then prove Google OAuth + one real calendar write end-to-end before investing in more UI, then add/list opportunities UI, then wire real calendar sync into that UI, then status editing, then Apify auto-extraction last (nice-to-have, not required for the core loop to work).
- While building the iOS version, two unrelated pre-existing bugs were found and fixed (missing `CFBundleExecutable`/`CFBundleDisplayName` in Info.plists) — not relevant to the web port but noted here in case the Swift project is ever revisited.
