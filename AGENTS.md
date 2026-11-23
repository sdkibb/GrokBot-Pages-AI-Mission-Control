# AGENTS.md

Instructions for an AI agent creating, updating, or publishing AI Mission Control.

## What this is

A mobile-first dashboard for a team of Grok Bots: weekly usage against the limit, shares by chat / routines / bot-to-bot, a roster that expands in place, a waiting-on-you list, an activity heatmap, and an accordion for routines, trends, and data gaps.

There are two implementations, both driven by the same example dataset:

- `index.html` — a single self-contained file. All CSS and JS are inline. It runs in a browser with no build step and no API keys.
- `canvas/MissionControl.tsx` — the same layout for a Grok Bot Page. A Grok Bot user pastes it into a Page. Only Grok Bot can publish or live-preview that Page; another design model can edit the file but cannot run it.

Real usage numbers and real bot names do not belong in this repository. The committed data is invented and labelled "Example data".

## How to create it for someone

1. Ask them to clone this repo, or copy `index.html`.
2. For a **private Grok Bot Page**: paste `prompts/build-prompt.md` into a chat with their main bot. The bot should rebuild the Page from their own usage report (limit 20, so every bot is included) and keep the layout here. They can also paste `canvas/MissionControl.tsx` and then ask the bot to replace the example data blocks with their report.
3. For a **plain browser**: open `index.html`, or serve the folder. The example dataset is already embedded.
4. Add two separate refresh routines with the prompts under `prompts/` (see `prompts/refresh-prompt.md`): a numbers-only run hourly on the hour from 7 AM to 7 PM, and a status run hourly on the half hour in the same window.
5. Give every bot the "Mission Control status file" skill (`skills/mission-control-status-file/SKILL.md`) and a standing rule to write its file whenever a waiting item is added, answered, completed or dropped, or at the end of a turn with notable work, keeping up to 10 recent items and up to 10 waiting items (only the most important; no need to fill all 10). List every bot, including a trading or investing bot if they have one, in `/workspace/mission-control/bots.json`. Use placeholders such as `<trader-agent-id>` in this repository.
6. If they want a design tweak, use `prompts/customize-prompt.md` so the data blocks stay untouched.

## Data schema

The source of truth for the example dataset is `data/example.json`. The same JSON is embedded in `index.html` as `<script type="application/json" id="amc-data">`. The Grok Bot Page keeps the same fields as constants at the top of `canvas/MissionControl.tsx` (`SNAPSHOT`, `WEEK`, `MIX`, `BUSIEST`, `DAYS`, `TYPE7`, `DAYS30`, `ACTIVITY`, `D30L`, `BOTS`, `GAPS`, `DISMISSED`).

Documented field-by-field in `data/SCHEMA.md`. In short:

- `week` — `used`, `resets`, `elapsed` (fallback), `resetAt` (ISO 8601 with offset), `extraCredits`.
- `mix` — `chat`, `routines`, `b2b` shares for the last 7 days.
- `busiest` — `day`, `share`.
- `days` / `type7` — 8 UTC-day labels and the three daily series.
- `days30` / `days30Labels` — 31 daily shares and axis labels.
- `activity.days` — per-bot daily shares for the heatmap. `activity.hours` is `null` until a real hourly source exists.
- `bots[]` — `key`, `name`, `role`, `d7`, `d30`, `mix`, `trend`, `last`, `recent[]`, `open[]`, `routines[]`. On a live Page, `d7` and `d30` come from the numbers-only run; `last`, `recent`, and `open` come from each bot's status file via the status run; `routines` are synced by the status run.
- `dismissed[]` — `{ bot, match, title, date }`. `match` is a lowercase substring of the waiting-item title. The status run keeps these hidden and never shrinks this block.
- `gaps[]` — notes under "What this page can't see". The status run adds a note when a status file is missing, unreadable, or older than 3 days (stale).

After any data edit, `data/example.json` and the embedded `#amc-data` block must match. `scripts/leak-check.sh` verifies that.

## How to update data without touching the design

Edit only the data:

- In the standalone page: edit `data/example.json`, then copy it into the `#amc-data` script tag in `index.html`, **or** regenerate that tag and leave the CSS and JS alone.
- In the Grok Bot Page: edit the constants listed above. Do not rewrite components, styles, or event handlers.
- On a live personal Page, two separate routines (`prompts/refresh-prompt.md`) edit data only and stay quiet unless a run fails:
  - The numbers-only run (`prompts/numbers-refresh-prompt.md`) pulls a usage report with **limit 20** and writes the snapshot time, the weekly limit block, and each bot's 7-day and 30-day share. It does not read chats or status files.
  - The status run (`prompts/status-refresh-prompt.md`) pulls the full usage report, syncs routines, honours dismissed items without shrinking that block, reads each bot's status file instead of chat history, keeps confidential work at area level and investigation work to case references, and strips secrets.

Never paste a real usage report, a live `bots.json`, or real status files into this public repository.

## Design rules

Keep these unless the owner explicitly overrides one of them:

- This week tiles are visually neutral. Do not colour them red or green; they are just data, not a standing.
- Red and amber are only for issues or elevation. The highest 7-day usage may be red. A share of 15% or more may be amber. A waiting count may be amber only if that bot has 4 or more items; otherwise it stays grey. The used fill on the weekly bar is green/teal. The chip and the striped projection follow the projection: under 95% On track (green), 95–100% Near limit (amber), over 100% Over by reset (red).
- One calm indigo accent. Teal, violet, coral, and periwinkle may be used as thin decorative edges only.
- Waiting on you is collapsed by default.
- Paused routines stay hidden until the user toggles them.
- The More accordion opens one section at a time; opening one closes the others.
- The weekly Now marker is computed from `week.resetAt` and the current time, so it moves by the hour. There are no hour labels on the axis. Noon sits halfway through that day's segment.
- A striped band on the bar is the linear projection of current usage by reset.
- Extra credits belong under Usage trends, not as a This week tile.
- Pull-to-refresh and the Refresh button redraw in place. Do not do a full page reload (that can go blank in a home-screen app). A client-side refresh cannot fetch new numbers; show a short toast with the last snapshot time.
- If a figure is missing, show empty, "—", or `<1%`. Never invent a number.
- The header icon is generic (radar / orbit). Do not put a person's initials in it.
- Do not add a page description under the title.

## How to edit the design

- Prefer CSS and the render functions in `index.html`, and the matching components in `canvas/MissionControl.tsx`, so the two stay close.
- After a visual change, open `index.html` in a browser (or run `scripts/screenshot.sh` if you have Chrome and puppeteer-core) and check desktop, a narrow phone width, a tile slide-up, an expanded bot row, the heatmap, and an open accordion section.
- If you add or rename a data field, update `data/example.json`, the embedded block, the canvas constants, `data/SCHEMA.md`, and this file together.
- Use `prompts/customize-prompt.md` when asking another bot to tweak a live Page so it does not overwrite data.

## Publishing and leak check

This repository is meant to stay public and free of personal data.

Before every push:

1. Run `scripts/leak-check.sh` from the repo root. It greps the working tree and git history against `scripts/denylist.txt` plus, if present, a private denylist **outside** the repo (`AMC_PRIVATE_DENYLIST`, default `/workspace/amc-private-denylist.txt`). It also runs gitleaks and trufflehog when those tools are installed, checks image strings, and confirms the embedded JSON matches `data/example.json`.
2. Fix any hit. Do not weaken a pattern to make the check pass.
3. `scripts/install-hooks.sh` installs a pre-push hook that runs the same check and blocks the push on failure. Install it after `git clone` or `git init`.

Never commit `data/private*.json`, real usage reports, real bot or people names, personal URLs, canvas IDs, emails, tokens, avatar assets from a live Page, real agent ids, or live status files. Screenshots in `docs/` must show only the example dataset; strip EXIF before committing (`scripts/screenshot.sh` does this).

Do not force-push to `main`.
