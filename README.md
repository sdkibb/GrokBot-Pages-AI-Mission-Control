# AI Mission Control

A mobile-first dashboard for a team of [Grok Bots](https://x.ai): weekly usage against the limit, what each bot has been doing, and what is waiting on you.

This repository ships a **single self-contained page** and the prompts to rebuild it as a private Grok Bot Page. The screenshots and committed data are **invented example numbers and made-up bots**. Nothing here is a real usage report.

[![License: MIT](https://img.shields.io/badge/license-MIT-6366f1)](LICENSE)
[![Single file](https://img.shields.io/badge/page-single%20file-8b5cf6)](index.html)
[![Example data](https://img.shields.io/badge/data-example%20only-14b8a6)](data/example.json)
[![Grok Bot](https://img.shields.io/badge/Grok%20Bot-Pages-4f46e5)](canvas/MissionControl.tsx)

![Desktop dashboard with example data](docs/desktop.png)

<p align="center">
  <img src="docs/mobile.png" width="280" alt="Mobile layout of the example dashboard">
  &nbsp;
  <img src="docs/tile-popup.png" width="280" alt="Slide-up tile panel with more detail">
</p>

![Activity-by-bot heatmap](docs/heatmap.png)

## What's on the page

- **Limit week** — percent used, how much of the week has gone, and a projected percent by reset. A Now marker moves by the hour. The striped band is the projection at the current pace.
- **This week tiles** — chat, routines, bot-to-bot, top bot, and busiest day. Tap one and a small panel slides up with a bit more detail. The tiles stay visually neutral; red and green are reserved for issues or elevation.
- **Bot roster** — expand a bot in place for usage, recent work, waiting items, and routines. Paused routines stay hidden until you toggle them.
- **Waiting on you** — one box, collapsed until you open it. Each item expands to what it is, why it is waiting, and what you do.
- **Activity by bot** — a heatmap of the last 7 days. By hour is offered only when real hourly data exists.
- **More** — an accordion for all routines, usage trends (including extra credits), and the limits of the data. Opening one section closes the others.

## Quick start

### In a browser

Open [`index.html`](index.html). There is no build step, no server, and no API key. Everything, including the example JSON, is inline. To refresh the screenshots after a design change, see `scripts/screenshot.sh`.

### As a private Grok Bot Page

1. Copy the prompt in [`prompts/build-prompt.md`](prompts/build-prompt.md) and paste it into a chat with your main Grok Bot.
2. The bot should build a **private** Page in this layout, using *your* usage report (ask for limit 20 so every bot is included), not the example numbers in this repo.
3. You can also paste [`canvas/MissionControl.tsx`](canvas/MissionControl.tsx) into a Page and then ask the bot to replace the example data blocks with your report.

A Grok Bot Page only runs inside Grok Bot. Another design model can edit the code in this repo, but it cannot live-preview that Page until your bot publishes it.

## How refresh works

A scheduled routine should **update data only** and leave the layout alone. Use [`prompts/refresh-prompt.md`](prompts/refresh-prompt.md).

Typical flow:

1. Pull a fresh Grok Bot usage report with **limit 20**.
2. Rewrite the data blocks (snapshot, weekly limit, mix, charts, roster, heatmap, gaps).
3. Keep any waiting items you have already dismissed.
4. Stay quiet unless the run fails.

On the Page itself, pull-to-refresh and the Refresh button redraw in place so a home-screen app does not go blank. They cannot fetch new numbers on their own — they show the last saved snapshot. For a live Page, ask your bot to “update Mission Control,” or let the routine do it.

A good weekday cadence is about three runs (for example 9 AM, 1 PM, and 5 PM in your time zone). Ask before changing a schedule that is already in place.

## Privacy

This public template must stay free of personal data:

- Committed bots (Atlas, Scout, Ledger, Quill, Pilot, Nova, Harbor, Relay) and every number in `data/example.json` are invented and labelled as example data.
- Do not commit real usage percents, real bot names, people, organisations, emails, canvas IDs, tokens, or live avatar assets.
- Real data belongs in a private Page, or in a file such as `data/private.json` that is gitignored.
- Before every push, run `scripts/leak-check.sh`. `scripts/install-hooks.sh` installs a pre-push hook that does the same and blocks the push if anything is flagged.

If you publish your own Page for others, ship a copy that still uses mock data, the way this repo does.

## What's in the repo

| Path | What it is |
| --- | --- |
| `index.html` | Standalone page, all CSS and JS inline, example data embedded |
| `canvas/MissionControl.tsx` | Same layout as a Grok Bot Page source |
| `data/example.json` | The example dataset (must match the embedded block) |
| `data/SCHEMA.md` | Field-by-field schema |
| `docs/` | Desktop, mobile, tile-popup, and heatmap screenshots |
| `prompts/` | Build, refresh, and customize prompts |
| `AGENTS.md` | Instructions for AI agents that edit or publish this |
| `scripts/leak-check.sh` | Denylist + gitleaks + trufflehog |
| `scripts/install-hooks.sh` | Pre-push hook installer |
| `LICENSE` | MIT, copyright AI Mission Control contributors |

## Customize

For a design tweak on a live Page, use [`prompts/customize-prompt.md`](prompts/customize-prompt.md) so the data blocks stay untouched. Design rules are listed in [`AGENTS.md`](AGENTS.md).

## License

[MIT](LICENSE) © AI Mission Control contributors.
