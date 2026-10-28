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

## Optional: image AI

Relay works fully without it. To let Claude generate elements that are hard to draw
(realistic objects, stickers, textures), pick a provider in `api/.env` and restart:

| `IMAGE_AI_PROVIDER` | Key | Default model | Transparent PNG |
|---|---|---|---|
| `openai` | `OPENAI_API_KEY` | `gpt-image-1` | yes |
| `gemini` | `GEMINI_API_KEY` | `gemini-2.5-flash-image` | no |
| `replicate` | `REPLICATE_API_TOKEN` | `black-forest-labs/flux-schnell` | no |
| `fal` | `FAL_KEY` | `fal-ai/flux/schnell` | no |

`IMAGE_AI_MODEL` picks another model from the same provider. For Replicate and fal, that
model needs to take a prompt plus an aspect ratio or image size, as FLUX models do.

This adds a `generate_image` tool that saves the result as an asset for Claude to place
and compose. Providers without transparency return the element on plain white, and the
tool tells Claude how to cut it out with Relay's selection tools. Without a provider the
tool isn't offered at all. Each generation is billed by the provider and sends the prompt
to them.

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

## Optional: speech to text (auto captions)

Relay can transcribe speech on your machine with [whisper.cpp](https://github.com/ggml-org/whisper.cpp).
Nothing is sent anywhere. Install it, download a model, and set it in `api/.env`:

```sh
brew install whisper-cpp
curl -L -o ~/models/ggml-small.bin --create-dirs \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin
```

```sh
WHISPER_MODEL_PATH=~/models/ggml-small.bin
WHISPER_LANGUAGE=pt   # or en, ...; "auto" (the default) detects it
# WHISPER_CLI_PATH=/path/to/whisper-cli   if it is not on PATH
```

This adds two tools:

- `auto_captions` adds CapCut-style captions to a video: a few words at a time, timed to the
  voice, with the word being said highlighted (a color, or a box behind it), in a style preset
  (`bold`, `yellow`, `boxed`, `clean`). They are ordinary text clips, so you can fix a word or
  restyle them, and the whole thing is one undo step. `add_text` and `update_clip` take the same
  `highlight` for single titles.
- `transcribe_video` returns the transcript sentence by sentence with times, for finding the
  best moments to cut into a short.

Transcripts are cached next to each asset, so a file is only transcribed once per model and
language.
