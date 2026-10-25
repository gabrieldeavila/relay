# Relay pivot: Instagram gossip autopilot

Goal: Relay watches a list of Instagram gossip pages, picks the stories worth covering,
writes its own version in pt-BR, draws the post in Pincel from a fixed template, and
publishes it to my Instagram account, on its own and on cron jobs.

Status: **plan only, nothing built yet.** Decisions made in §1; what's still missing is in §10.

---

## 1. Decisions

| Topic         | Decision |
|---------------|----------|
| Scope         | **Strip Relay down** to the autopilot; keep only the engine and the steps the pipeline uses (§2) |
| IG account    | Already Business/Creator; **Meta developer app still to create** (phase A) |
| Sources       | **Official API only** (Business Discovery). Pages that are personal accounts are left out |
| Approval      | **Automatic above a score**; below it, approve on Telegram |
| Image         | **Edited source photo** (crop + overlay + headline) with credit to the page |
| Format        | Single image **1080x1350** (4:5) |
| Voice         | **pt-BR, playful**, few emojis, credit as `via @page` |
| Cadence       | **As soon as a good story comes in**, with a daily cap, a minimum gap and quiet hours |
| Hosting       | **Supabase cloud**: Postgres + Auth + public Storage bucket for the images |
| Runtime       | **This Mac first** (Relay API/worker + Pincel run locally, Supabase cloud holds the data); **Hetzner VPS later**, maybe |
| Template look | **Bold tabloid** (condensed caps headline, yellow/pink highlight, dark overlay) |

## 2. What stays and what goes

Keep (the pipeline depends on these):

- `engine/` (worker, leases, retries, timeouts, reaper, waits, run stream)
- `triggers/` schedule trigger + poller (drop the folder trigger)
- `nodes/`: `trigger.schedule`, `trigger.manual`, `flow.condition`, `flow.approval`, `set-fields`
- `providers/` only for Pincel over `/api/tools` (`tool-provider.client`, `tool-caller`, `serial-per-key`)
- `ai/` (Claude client), `telegram/` (approvals below the score + failure alerts)
- `accounts/` (sealed secrets), `auth/` (now against Supabase cloud), `health/`
- UI: login, runs view (debugging), Connections → Accounts (trimmed)

Remove (code, tables, UI, docs, tests):

- Visual editor (`ui/app/pages/editor`, `ui/app/flow`, `@xyflow/react`), workflows list
- `builder/` ("describe what you want"), `templates/` catalog (quote, folder→email, sheet summary)
- `email/`, `files/` table reading (`read_table`, CSV/Excel), folder trigger + `seen_files`
- `mcp-server/` + `access-tokens/`, MCP providers (`mcp_http`, `mcp_stdio`, `mcp-connections`)
- `http-request`, `wait-for-webhook`, `webhook-trigger`, `delay` nodes (bring back if needed)

The two pipeline workflows are **built in code** (a seed per user, versioned like today's
templates) instead of drawn in an editor. Settings for them (threshold, cap, schedule)
live in an `autopilot_settings` table and come in as trigger payload / config.

Before starting: commit or stash the uncommitted work currently in `relay`
(run-starter, version-graphs, editor top bar…), since part of it will be deleted.

## 3. The pipeline

```
[collect]  schedule, every 15 min
  for each enabled source ─► Business Discovery: latest posts
  ─► drop already-seen (source_posts.external_id)
  ─► group posts about the same story (AI, against stories from the last 48h)
  ─► score each new story (AI: 0..100, "is it news", "already posted?")
  ─► stories.status = queued

[dispatch]  schedule, every 5 min
  rules (pure, `can-post-now.ts`): under the daily cap, ≥ min gap since the last post,
  outside quiet hours, under Instagram's 24h limit
  ─► take the best queued story that isn't stale (`pick-next-story.ts`)
  ─► start a [post] run for it

[post]  one run per story
  AI: headline + caption + hashtags (structured, pt-BR, playful)
  ─► Pincel template ─► export JPEG
  ─► upload to Supabase Storage (public bucket) ─► public URL
  ─► score ≥ threshold ? continue : Telegram preview + approval (timeout → skip)
  ─► IG: create container ─► wait FINISHED ─► media_publish ─► permalink
  ─► stories.status = posted, delete the image from the bucket
```

Starting defaults to tune later: auto-post score **≥ 75**, cap **8/day**, gap **45 min**,
quiet hours **00:00–08:00**, story stale after **6h**, timezone `America/Sao_Paulo`.

## 4. Reading the gossip pages

Instagram Graph API **Business Discovery**: my Business/Creator account reads public posts
of other Business/Creator accounts by username:
`GET /{my-ig-id}?fields=business_discovery.username(page){media.limit(10){id,caption,media_type,media_url,permalink,timestamp,like_count,comments_count,children{media_url,media_type}}}`

- Adding a source checks it once; a personal account shows "can't be read" and isn't saved
- Videos/reels: use `thumbnail_url` as the photo; carousels: first child
- `media_url` links expire: download the photo when the story is queued and keep it in the
  bucket (`sources/` prefix) until the story is posted or dropped
- Rate limits: one call per source per round; back off on code 4/17/32 (`classify-instagram-error.ts`)

## 5. Writing the post (AI)

- Input: captions of the story's posts, source usernames, times, the last 30 headlines I posted
- Output (structured): `{ headline, caption, hashtags[], credit, photoIndex }`;
  scoring pass returns `{ isNews, score, sameAs?: storyId, summary }`
- Prompt rules: own words (never copy a caption), only what the sources say (no invented
  facts, no "confirmed" when it's a rumor), pt-BR playful with 1–3 emojis, headline ≤ 70 chars,
  caption ends with `via @page` + fixed hashtags
- Models: Claude Sonnet for writing; Claude Haiku for scoring/grouping (runs every 15 min)

## 6. The Pincel template (fixed steps)

Deterministic list of Pincel tool calls with slots, 1080x1350:

1. `create_document` 1080x1350
2. `open_image` / `place_image` the source photo, cover crop to the full canvas
3. Edit so it isn't a plain repost: slight zoom/crop, `apply_filter` (contrast/saturation),
   dark `draw_gradient` on the bottom ~55%
4. Headline: `draw_text` in a box (x 60, y 860, w 960, h 300), `fit: "shrink"`, bold display font
5. Brand bar / logo (`place_image` from assets), credit `via @page` small at the bottom
6. `export_image` `.jpg` quality 90

Fonts and colors live as constants in the template (like `quote-of-the-week`) so it renders
the same every time. Pincel runs one document at a time; Relay already serializes calls to it.

## 7. Publishing to Instagram

Instagram Content Publishing API (Instagram Login, `graph.instagram.com`):

1. `GET /{ig-user-id}/content_publishing_limit`: stop if the 24h quota is used up
2. `POST /{ig-user-id}/media` `{ image_url, caption }` → `container_id` (saved on the story)
3. Poll `status_code` until `FINISHED` (engine wait/retry, ~5 tries)
4. `POST /{ig-user-id}/media_publish` `{ creation_id }` → `media_id` → `permalink`

Idempotent: a retry reuses the saved `container_id`, and if `media_id` is already set it
never publishes again. Token: long-lived (60 days), sealed in `accounts`, refreshed by a
weekly cron, Telegram alert if the refresh fails or it's < 7 days from expiring.

Meta app (phase A): create the app (type Business), add the **Instagram** product with
Instagram Login, permissions `instagram_business_basic` + `instagram_business_content_publish`,
add my account as a tester (no App Review needed while it only posts to my own account).
Business Discovery goes through the Facebook Login path (`instagram_basic` +
`pages_read_engagement` on the linked Page). **Check both paths during phase A**, since
Meta has been moving things between them.

## 8. Code layout (`domain` / `data` / `delivery`)

```
api/src/modules/
  instagram/
    domain/   discovery-media.ts, parse-discovery.ts, publish-steps.ts, publish-limit.ts,
              classify-instagram-error.ts, token-expiry.ts            (+ specs)
    data/     instagram-graph.client.ts, instagram-account.repository.ts,
              token-refresher.ts, publish-post.node.ts
    delivery/ instagram-account.controller.ts      (connect, check, refresh)
  sources/
    domain/   source.ts, pick-new-posts.ts, source-username.ts         (+ specs)
    data/     source.repository.ts, source-post.repository.ts, collect-sources.node.ts
    delivery/ sources.controller.ts                (list, add with check, enable/disable, remove)
  stories/
    domain/   story.ts, story-status.ts, can-post-now.ts, pick-next-story.ts,
              is-stale.ts, needs-approval.ts                            (+ specs)
    data/     story.repository.ts, group-and-score.node.ts, dispatch.node.ts, mark-posted.node.ts
    delivery/ stories.controller.ts                (queue, history, skip, post now)
  writer/
    domain/   gossip-prompt.ts, post-text.schema.ts, score.schema.ts, caption-footer.ts (+ specs)
    data/     write-post.node.ts
  post-template/
    domain/   gossip-template.ts (Pincel steps with slots), headline-box.ts (+ specs)
  public-files/
    data/     supabase-bucket.ts, upload-image.node.ts, delete-image.node.ts
  autopilot/
    domain/   autopilot-settings.ts, autopilot-workflows.ts (collect / dispatch / post graphs) (+ specs)
    data/     autopilot-settings.repository.ts, seed-workflows.ts
    delivery/ autopilot.controller.ts              (settings, overview, pause/resume)
```

Tables (Drizzle, schema `relay`, migrations applied to Supabase cloud):

- `sources`: `id, owner_id, username, label, enabled, last_checked_at, last_error`
- `source_posts`: `source_id, external_id (unique), permalink, caption, media_url, stored_image, posted_at, story_id`
- `stories`: `id, owner_id, status (queued | posting | awaiting_approval | posted | skipped | failed | stale),
  score, summary, headline, caption, image_path, container_id, ig_media_id, permalink, run_id, created_at, posted_at`
- `autopilot_settings`: `owner_id, paused, threshold, daily_cap, min_gap_minutes, quiet_start, quiet_end, timezone, hashtags`
- `accounts`: new kind `instagram` (token sealed, `ig_user_id`, `expires_at`)

UI (`ui/app/pages/`, each with `domain/ api/ hooks/ components/`):

- `autopilot/` home: on/paused, posts today vs. cap, next possible slot, last errors
- `queue/`: stories with score, source posts, preview, Approve / Skip / Post now
- `history/`: posted with thumbnail, headline, permalink, source credit
- `sources/`: add `@username` (checked on add), enable/disable
- `settings/`: threshold, cap, gap, quiet hours, hashtags
- Connections → Instagram, Telegram, Anthropic cards; runs view kept for debugging

## 9. Where it runs

Same Supabase cloud project in both stages: Postgres (Drizzle migrations via `supabase db push`
against the remote URL), Auth (my user only; sign-ups disabled), Storage bucket `posts`
(public read). Local Supabase (Docker) stays only for the integration tests (`relay_test`).

### Stage 1: this Mac (now)

- `pnpm dev` in Relay and in Pincel, as today; `.env` points `DATABASE_URL` / `SUPABASE_*` at the cloud project
- Cron only fires while the Mac is awake: the schedule poller already does **one catch-up fire**
  after sleep, and the dispatch rules (stale after 6h) drop stories that got too old meanwhile.
  Optional: `caffeinate -s` / "Prevent automatic sleeping on power adapter" while plugged in
- Optional: start both at login with a `launchd` agent (`~/Library/LaunchAgents/…plist`)
  so a reboot doesn't stop the autopilot
- Approval links only open on this machine, so approval below the threshold is done with
  **Telegram inline buttons** (Aprovar / Pular) read by polling `getUpdates`: no public URL needed
- Health: Telegram alert when collect/dispatch fails N times in a row, or when no collect
  ran for 2h after the Mac wakes (missed windows)

### Stage 2: VPS (later, if needed)

- Hetzner (CX22/CX32): `docker compose` with `relay-api` (Nest + worker), `relay-ui` (static
  build), `pincel` (API only, `.data` on a volume with fonts/assets), Caddy for HTTPS
- Only the UI/API are exposed (behind Supabase auth); Pincel stays on the internal network
- Nothing to migrate: the data is already in Supabase cloud; move Pincel's fonts/assets and
  the `RELAY_SECRET_KEY` (otherwise sealed accounts can't be opened), stop the Mac instance first
  so two workers don't post at the same time
- Approval links become reachable from the phone too

## 10. Remaining details

- **Sources (suggested, to confirm):** `@hugogloss`, `@alfinetei`, `@gossipdodia`,
  `@fofoquei`, `@choquei`. Each one is checked when added (must be Business/Creator).
  `@choquei` has a history of spreading false stories: give it a lower weight, or require
  a second source before auto-posting
- **Template look:** bold tabloid: condensed headline (Anton or Bebas Neue, all caps),
  yellow `#FFE600` / pink `#FF2E88` highlight on key words, black gradient over the photo,
  brand bar at the top. Still missing: logo (or a text logo with the account's @)
- **Fixed hashtags** and the account's @

## 11. Phases

- [ ] **A. Instagram access:** create the Meta app, connect the account, publish one hand-made
      JPEG from a Supabase public URL, read one source with Business Discovery (proves the whole chain)
- [ ] **B. Strip down + Supabase cloud:** remove the modules in §2, point DB/Auth at Supabase cloud,
      new tables + migrations, specs still green
- [ ] **C. Sources + collect:** Sources page, Business Discovery reader, `source_posts` dedup, photo stored in the bucket
- [ ] **D. Stories:** grouping + scoring (Haiku), queue page
- [ ] **E. Template + writer:** gossip Pincel template, Sonnet writer, preview in the queue
- [ ] **F. Post + dispatch:** dispatch rules, post run, threshold → auto or Telegram approval, publish, history page
- [ ] **G. Run on the Mac for real:** launchd start at login, token refresh cron, failure alerts, a week of watching
- [ ] **H. VPS (optional):** Docker compose on Hetzner, HTTPS, move secrets/assets, turn the Mac instance off
- [ ] **Later:** carousels, reels, insights of my posts to tune the score, several destination accounts

Every new pure rule gets a `*.spec.ts`; the Instagram client gets an integration test
against a fake Graph API (like `fake-telegram.ts`), and the post run gets an end-to-end
test with a fake Pincel + fake IG.
