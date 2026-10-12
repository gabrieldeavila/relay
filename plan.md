# Relay roadmap: local workflow engine

Goal: let anyone automate repeated tasks by building flows of triggers and actions on a
visual graph. Runs locally (nothing goes to the cloud), survives restarts, retries what
fails, and can wait hours or days for external events. Pincel is the first integration:
any app that serves tools in the Claude format (`GET /api/tools`) becomes a set of nodes.

## Stack

- Monorepo like `forecast`: root runs `api/` and `ui/` with `concurrently`
- `api/`: NestJS 11 + Jest, modules split into `domain/` (pure rules + specs),
  `data/` (Postgres, HTTP, processes), `delivery/` (controllers, SSE)
- `ui/`: React Router 8 + Tailwind 4 + primitives kit, i18n `pt-BR` and `en`,
  editor on `@xyflow/react`
- Supabase local (`supabase start`, Docker): Postgres, Auth (email + password, Mailpit),
  Storage, Studio. Never linked or pushed to the cloud
- Config from `.env` via `process.loadEnvFile` (`@nestjs/config` 12 is ESM-only and breaks Jest)
- Workers talk to Postgres directly (Drizzle), not through PostgREST
- Drizzle owns the schema; generated SQL lives in `supabase/migrations/`

| Service      | URL               |
|--------------|-------------------|
| UI           | localhost:5400    |
| API          | localhost:4400    |
| Postgres     | localhost:54322   |
| Supabase API | localhost:54321   |
| Studio       | localhost:54323   |
| Mailpit      | localhost:54324   |

## Domain model

- **Workflow**: editable draft. Publishing creates an immutable **WorkflowVersion**;
  each run is pinned to the version it started with
- **Graph**: `nodes { id, type, config, position }`, `edges { id, source, sourcePort, target }`
- **Run**: one execution of a version, started by a trigger with a payload
- **StepRun** states:
  `pending → ready → running → succeeded | failed | retrying → ready | waiting → ready | timed_out`,
  plus `skipped` (branch not taken) and `cancelled`

## Execution

- Workers claim `ready` steps with `FOR UPDATE SKIP LOCKED` and a lease (`lease_until`),
  renewed by heartbeat while running
- Per-attempt timeout through `AbortController`
- Retry with exponential backoff + full jitter; non-retryable errors fail at once
  (or follow the `error` port when it is connected)
- Reaper puts `running` steps with an expired lease back to `ready` (crash recovery)
- Waiting steps store `wait_key` + `deadline_at`; events land in `event_inbox`
  (deduplicated) and resume the step; an expired deadline follows the `timeout` port
- At-least-once delivery; every attempt gets `idempotencyKey = runId:nodeId:attempt`
- Cron triggers keep `next_fire_at`, claimed with `SKIP LOCKED`; one catch-up fire
  after the machine wakes up
- Concurrency limits per workflow and per provider (Pincel: 1, single document)

## Phases

- [x] **0. Scaffold**: monorepo, Nest API, React Router UI + primitives + i18n, Supabase config
- [x] **1. Pure domain** (specs, no IO)
  - [x] graph model and `validate-graph` (one trigger, DAG, valid ports, required config, reachability)
  - [x] `next-ready-steps` (joins, dead-path skipping after branches)
  - [x] `backoff-delay`, `step-error` (`isRetryable`), `decide-failure` (retry, route to `error` / `timeout`)
  - [x] `resolve-expressions` (`{{ steps.x.output.y }}`, no eval, own properties only)
  - [x] `step-transitions` and `run-status`
- [x] **2. Durable engine**: tables (schema `relay`), worker loop, leases + heartbeat,
      retries with backoff, per-attempt timeouts, reaper, fenced writes (stale attempts dropped);
      manual / HTTP / delay / if / set-fields nodes; REST for workflows, publish, runs, cancel.
      Verified: `kill -9` mid-step, restart, the run finishes (attempt 2)
- [x] **3. Waits and triggers**: schedule trigger (friendly schedule → cron, time zones,
      one catch-up fire after downtime, never twice), webhook trigger (secret URL kept across
      publishes), wait for webhook, approval (confirm page so link previews never answer),
      deadlines with `timeout` port, event inbox (early events kept, duplicates dropped),
      `{{ run.resumeUrl }}` in expressions
  - [ ] Links only work on this machine; reaching them from a phone needs a tunnel (later)
- [x] **4. Editor + local login**: Supabase local sign up / log in (HS256 or JWKS tokens),
      every workflow owned by its creator; workflows list; React Flow canvas with one handle
      per exit, click-to-add palette, forms generated from config JSON Schemas (text, number,
      select, key/value, free value, schedule editor), "Use a value" menu for `{{ }}`,
      publish issues pinned to steps, autosave, Run now. Verified in a headless browser
- [x] **5. Runs view**: live run over SSE (Postgres NOTIFY, so any process can wake
      the screen), read-only canvas colored by step status, step details (attempts in order,
      errors, data in and out), approve / reject from the screen, Cancel, Run again, and
      Retry failed step (same run; finished steps keep their results). Verified in a browser
- [ ] **6. Tool providers + Pincel**: import `/api/tools` catalogs as nodes, image outputs
      saved to Storage, first templates
- [ ] **7. Local building blocks**: watch folder, CSV, SMTP email, Telegram, AI step
- [ ] **8. MCP**: MCP servers as providers; Relay itself exposed over MCP;
      "describe what you want" builder validated by `validate-graph`

## Normie UX principles

- Templates first; forms generated from schemas, never raw JSON
- Expression picker ("use result of → Render image → url") instead of typing `{{ }}`
- "Test this step" with sample data before publishing
- Readable errors ("Pincel did not answer; trying again in 30s, attempt 2 of 3")
