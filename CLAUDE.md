# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Project

DanceTracker is a React + Vite + TypeScript web app (Supabase-backed: Postgres, Auth with Google OAuth, Edge Functions) that helps a dancer track performance/audition opportunities discovered on Instagram, and sync deadlines to Google Calendar. See `.scratch/dancetracker-web-app/spec.md` for the full spec.

- Dev: `npm run dev` (Vite, http://localhost:5173)
- Test: `npm test` (Vitest)
- Typecheck: `npx tsc -b --noEmit`

## Frontend Aesthetics

<frontend_aesthetics>
You tend to converge toward generic, "on distribution" outputs. In frontend design, this creates what users call the "AI slop" aesthetic. Avoid this: make creative, distinctive frontends that surprise and delight. Focus on:

Typography: Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt instead for distinctive choices that elevate the frontend's aesthetics.

Color & Theme: Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes. Draw from IDE themes and cultural aesthetics for inspiration.

Motion: Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (animation-delay) creates more delight than scattered micro-interactions.

Backgrounds: Create atmosphere and depth rather than defaulting to solid colors. Layer CSS gradients, use geometric patterns, or add contextual effects that match the overall aesthetic.

Avoid generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Clichéd color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

Interpret creatively and make unexpected choices that feel genuinely designed for the context. Vary between light and dark themes, different fonts, different aesthetics. You still tend to converge on common choices (Space Grotesk, for example) across generations. Avoid this: it is critical that you think outside the box!
</frontend_aesthetics>

Current direction (established in this repo): a "spotlight on stage" theatrical aesthetic — warm near-black backdrop, gold spotlight accent, `Fraunces` (display/serif) paired with `Instrument Sans` (body), committed dark theme rather than an adaptive light/dark toggle. Match this identity for new UI rather than introducing a new one, unless asked to redesign.

## Architecture

- `src/models/` — domain types (`Opportunity`, `OpportunityStatus`)
- `src/services/` — seams: `CalendarClient` (Google Calendar, tested via `FakeCalendarClient`) and `OpportunityRepository` (Supabase, tested via `FakeOpportunityRepository`). Business logic (`CalendarService`, `OpportunityStore`) is tested against these fakes, never against real Supabase/Google APIs.
- `src/components/` — presentation only; no direct Supabase/Google calls.
- `supabase/migrations/` — schema, applied via `supabase db push`.
