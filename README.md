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

## Connect Pincel

Start Pincel (`pnpm dev` in its folder), then in Relay open **Connections** and connect
`http://localhost:4300`. Its tools show up in the editor palette under "Pincel". Images a
tool returns are saved under `api/.data/files/<run>/` (set `FILES_DIR` to change it) and
shown in the runs view; later steps can use their `url` or local `path`.

## Accounts and templates

Steps that deliver results use accounts set up once under **Connections → Accounts**:
email (your own SMTP server; Gmail, Outlook and iCloud are filled in from the address and
need an app password), a Telegram bot (token from @BotFather; send it a message, then
"Find my chat"), and an Anthropic API key for **Ask AI**. Secrets are encrypted with a key
kept in `api/.data/secret.key` (or `RELAY_SECRET_KEY`, base64 of 32 bytes).

The workflows page offers templates. Using one creates a draft; publishing points at the
fields only you can fill (a folder, a spreadsheet path).

Steps read local files by full path (`~/` works): **When a file appears in a folder**
gives later steps `{{ trigger.path }}`, **Read a spreadsheet** reads `.csv` / `.xlsx` and
gives the rows plus one picked `row` (`{{ steps.<id>.output.row.<column> }}`).

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
| GET | `/nodes` | Node catalog (built-in + connected apps' tools) with config JSON Schemas |
| GET / POST | `/providers` | Connected apps; POST `{ name, baseUrl }` reads `<baseUrl>/api/tools` |
| POST / DELETE | `/providers/:id/refresh`, `/providers/:id` | Re-read an app's tools, disconnect it |
| GET | `/files/:runId/:name` | A file a run produced (e.g. a Pincel render), owner only |
| GET | `/accounts` | Email, Telegram and AI accounts (never their secrets) |
| PUT / DELETE | `/accounts/:kind` | Save `{ settings, secret? }` (no secret keeps the stored one), remove |
| POST | `/accounts/:kind/check` | Sign in / try the key; answers `{ ok, message }` |
| GET | `/accounts/telegram/chats` | Chats that wrote to the bot lately |
| GET | `/templates` | Templates with what each needs and what is set up |
| POST | `/templates/:id/use` | Create a draft workflow from a template `{ name? }` |
| POST | `/workflows` | Create `{ name }` |
| GET | `/workflows`, `/workflows/:id` | List, get with draft graph |
| PATCH | `/workflows/:id` | Save `{ name?, draftGraph? }` |
| POST | `/workflows/:id/publish` | Freeze the draft as a version (422 with `issues` if invalid) |
| POST | `/workflows/:id/runs` | Start the latest version; body is the trigger payload |
| GET | `/workflows/:id/runs`, `/runs/:id` | List runs, run with its graph, steps and attempts |
| GET | `/runs/:id/events` | Live run (server-sent events: `run` on every change, `ping`) |
| POST | `/runs/:id/cancel` | Cancel a running or waiting run |
| POST | `/runs/:id/retry` | Retry the steps that failed the run, in the same run |
| GET | `/workflows/:id/trigger` | Manual, webhook URL, next scheduled fire, or watched folder |
| POST | `/hooks/:token` | Webhook trigger: starts a run with `{ body, query }` |
| POST | `/resume/:token/:nodeId` | Resume a "wait for another app" step (send `Idempotency-Key`) |
| GET / POST | `/resume/:token/:nodeId/:action` | Approval link: GET shows a confirm button, POST answers |
