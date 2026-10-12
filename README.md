# Relay

A local workflow engine: build flows of triggers and actions on a visual graph and let
them run on their own, with retries, timeouts and steps that wait for external events.
Everything runs on your machine. See [plan.md](plan.md) for the roadmap.

## Run it

Requires Docker (for local Supabase) and pnpm.

```sh
pnpm install
pnpm db:start   # Supabase local: Postgres, Auth, Storage, Studio
pnpm dev        # API + UI
```

- UI: http://localhost:5400 (create an account on the login page; it exists only locally)
- API: http://localhost:4400 (`GET /health`)
- Supabase Studio: http://localhost:54323, Mailpit: http://localhost:54324

## Test

```sh
pnpm test                       # unit specs, API and UI (pure rules, no database)
pnpm --dir api run test:int     # engine against Postgres (needs `pnpm db:start`)
pnpm typecheck
```

Integration tests use a separate `relay_test` database, created and migrated on first run,
so they never touch your dev data.

## Database

Drizzle owns the schema (`api/src/database/schema`). After changing it:

```sh
pnpm --dir api run db:generate   # writes SQL to supabase/migrations
supabase migration up            # applies it locally
```

## API

| Method | Path | |
|---|---|---|
| GET | `/nodes` | Node catalog with config JSON Schemas |
| POST | `/workflows` | Create `{ name }` |
| GET | `/workflows`, `/workflows/:id` | List, get with draft graph |
| PATCH | `/workflows/:id` | Save `{ name?, draftGraph? }` |
| POST | `/workflows/:id/publish` | Freeze the draft as a version (422 with `issues` if invalid) |
| POST | `/workflows/:id/runs` | Start the latest version; body is the trigger payload |
| GET | `/workflows/:id/runs`, `/runs/:id` | List runs, run with steps and attempts |
| POST | `/runs/:id/cancel` | Cancel a running or waiting run |
| GET | `/workflows/:id/trigger` | Manual, webhook URL, or next scheduled fire |
| POST | `/hooks/:token` | Webhook trigger: starts a run with `{ body, query }` |
| POST | `/resume/:token/:nodeId` | Resume a "wait for another app" step (send `Idempotency-Key`) |
| GET / POST | `/resume/:token/:nodeId/:action` | Approval link: GET shows a confirm button, POST answers |
