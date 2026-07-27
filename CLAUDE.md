# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev              # start dev server (Turbopack) on :3000
npm run build             # production build
npm run start             # run a built production server
npm run lint               # eslint (eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit           # type-check without emitting
npm run test                # vitest run (all *.test.ts files)
npx vitest run src/lib/goals.test.ts   # run a single test file
npx vercel --prod --yes    # deploy to production (Vercel CLI must be authenticated)
```

There is no dedicated `vitest.config`; it runs with Vitest defaults against `*.test.ts` files (currently only `src/lib/goals.ts` has a test file alongside it).

## Architecture

Nutrical is a calorie counter: Next.js 16 (App Router, Turbopack) + React 19 + Tailwind v4 + shadcn/ui, backed by Supabase (Postgres + Auth). Deployed on Vercel as project `jitesh-mediajadecos-projects/nutrical`.

### Data layer: repository + query hooks

All data access goes through two files, and nothing else should talk to Supabase directly:

- `src/lib/data/repository.ts` — every DB operation (profiles, goals, foods, log entries, history) as a plain async function, keyed by name (`getProfile`, `saveGoals`, `searchFoods`, `addEntry`, `deleteEntry`, `getHistorySummary`, etc.). Internally it maps between the DB's snake_case rows (typed via `src/types/database.ts`, generated from the live schema) and the app's camelCase domain types (`src/types/nutrical.ts`).
- `src/lib/data/queries.ts` — wraps every repository function in a React Query hook (`useProfile`, `useGoalsForDate`, `useAddEntry`, etc.). Components only ever import from here, never from `repository.ts` directly, except where a plain async call is needed outside a component (e.g. redirect logic in `src/app/page.tsx`).

This repository originally had a localStorage-backed implementation (built before Supabase was wired up) with the exact same function signatures as today's Supabase version — the swap only touched `repository.ts`, no call sites changed. If you ever need an offline/local mode again, that's the seam to reintroduce it at.

`seed/foods.json` (196 hand-curated food items) was the one-time source used to seed the `foods` table directly via SQL; it is **not** imported by the app anymore — the `foods` table in Supabase is now the source of truth, publicly readable, user-writable only for `is_custom = true` rows.

### Auth & routing

- `src/proxy.ts` is the auth gate (Next.js 16 renamed the `middleware.ts` convention to `proxy.ts` — don't rename it back). It redirects unauthenticated requests to `/login` and authenticated requests away from `/login`/`/signup`, using `src/lib/supabase/middleware.ts`'s `updateSession`.
- `src/lib/supabase/client.ts` (browser client, used by `repository.ts`) vs `src/lib/supabase/server.ts` (server client, used by server actions) — pick based on whether the calling code runs client- or server-side.
- Auth itself (login/signup/logout) is done via Server Actions in `src/server/actions/auth.ts`, wired to `useActionState` in the `(auth)/login` and `(auth)/signup` pages.
- Route groups: `(auth)` = login/signup (public), `(app)` = today/history/profile (the authenticated app shell with the bottom nav), `onboarding` = the post-signup stats/goal wizard, ungrouped `/` just redirects based on whether `profile.onboardingCompletedAt` is set.

### Supabase project

Project ref `dkuvbevguagkpytyhsdr` (org "nutrical"). Four tables, all RLS-enabled with an `auth.uid() = user_id` (or `= id` for `profiles`) ownership policy; `foods` is the exception (public read, insert only for a user's own `is_custom` rows). A `handle_new_user` trigger on `auth.users` auto-creates the matching `profiles` row on signup (its EXECUTE grant is revoked from `anon`/`authenticated` so it can't be called directly as an API endpoint). Goals are versioned by `effective_date` in `daily_goals` rather than mutated in place, so changing your target doesn't rewrite history; `food_log_entries` stores macros computed at write time (from `quantity × food.macros`), not recomputed from the current `foods` row, so editing a food later doesn't retroactively change past logs.

**Known constraint**: Supabase's built-in email service on the free tier has a very low send rate limit, so repeated signup testing can hit "email rate limit exceeded" quickly. For heavy auth testing, disable "Confirm email" in Supabase Dashboard → Authentication → Providers → Email, or space out signups.

### UI patterns worth knowing before touching them

- **`ResponsiveModal`** (`src/components/ui/responsive-modal.tsx`): renders a Drawer (bottom sheet) below the `sm` breakpoint and a Dialog above it, same content either way. Used for the add/edit-entry flow.
- **`AddEntryDrawer`** (`src/components/log/add-entry-drawer.tsx`): the search → quantity → quick-add wizard for logging food. Its internal state is intentionally reset via a React `key` (a `sessionId` counter bumped by the caller each time the drawer opens for a new add/edit) rather than a `useEffect` syncing state to props — this was a deliberate fix for a lint/correctness issue (`react-hooks/set-state-in-effect`). Follow the same key-remount pattern rather than reintroducing a reset effect.
- Editing an existing log entry does **not** re-fetch the food record — `foodFromEntry()` in the same file reconstructs per-serving macros from the entry's own stored totals (`entry.calories / entry.quantity`, etc.). This keeps the edit drawer instant and consistent with the "computed at write time" design above.
- `useMediaQuery` (`src/hooks/use-media-query.ts`) uses `useSyncExternalStore`, not a `useEffect` + `useState` pair — same lint rule as above.
- Macro color coding is fixed by convention: `chart-1` = calories/primary, `chart-2` = protein, `chart-3` = carbs, `chart-4` = fat (see `MacroBar`, `CalorieRing`, and the history charts).
