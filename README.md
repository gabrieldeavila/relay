# Relay

An image and video studio on your computer that an AI drives over MCP. Two editors in one
app:

- **Images** (like a small Photoshop): layers, text, shapes, gradients, filters, masks,
  selections, retouching. The engine comes from Pincel.
- **Videos** (like a small CapCut): a timeline of video, audio, image and text clips on
  layers, with trims, fades, picture-in-picture and captions. Rendered with ffmpeg.

Claude (or any MCP client) does the editing and checks its work through rendered previews.
The UI shows the results live.

## Run it

Requires Docker (for the local Supabase Postgres), pnpm and ffmpeg (`brew install ffmpeg`).

```sh
pnpm install
pnpm db:start            # local Postgres
supabase migration up    # creates Relay's tables
pnpm dev                 # API + UI
```

- UI: http://localhost:5400
- API: http://localhost:4400 (`GET /health`)

Relay listens on `127.0.0.1` only and has no login. It is meant for one person on their
own machine.

## Use it from Claude

```sh
claude mcp add --transport http relay http://localhost:4400/mcp
```

Then ask, for example: "make a 1080x1920 cover that says BEACH DAY, then a vertical video
from ~/Movies/beach.mov with the cover as the first 2 seconds and a caption".

## How it works

- **Assets** (`api/src/modules/assets`): every photo, video or audio file Relay uses is
  copied under `ASSETS_DIR` (default `api/.data/assets`) and probed with ffprobe. Exports
  become assets too, so an exported image can go straight into a video.
- **Images** (`api/src/modules/images`): a document is its setup plus a log of edit
  commands. Pixels are rebuilt by replaying the log with `@napi-rs/canvas`, which gives
  undo/redo for free. Placed images are stored as `asset:<id>` references.
- **Videos** (`api/src/modules/videos`): a project is also its setup plus a command log,
  replayed into a timeline. `build-ffmpeg-args.ts` turns a timeline into one ffmpeg
  `filter_complex`. Previews render a single frame at any moment, so they stay fast. Text
  clips are drawn with the image engine's text layout.
- **MCP** (`api/src/modules/mcp-server`): Streamable HTTP at `/mcp`. Image tools take an
  `imageId` and video tools a `videoId`.

## Tests

```sh
pnpm test                         # unit tests (API + UI)
pnpm --dir api run test:int       # MCP end to end; needs pnpm db:start and ffmpeg
pnpm typecheck
```

The integration tests use a separate `relay_test` database, so they never touch dev data.

Schema changes: edit `api/src/database/schema/*.table.ts`, then
`pnpm --dir api run db:generate`.
