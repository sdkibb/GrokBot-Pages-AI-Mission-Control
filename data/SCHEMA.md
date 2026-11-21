# Example data schema

`data/example.json` is the invented dataset used in `index.html` (embedded as `#amc-data`) and in `canvas/MissionControl.tsx` (as the data constants at the top of the file). Keep those three in sync. A refresh should change only this data, not the layout.

All of it is example data. Real bot names, people, and usage numbers must never be committed here.

## Root object

| Field | Type | Meaning |
| --- | --- | --- |
| `meta.example` | boolean | Always `true` in this repo. |
| `meta.label` | string | Shown as the "Example data" badge. |
| `meta.snapshot` | string | "Updated …" line, for example `Sat Nov 21 · 1:00 PM ET`. |
| `meta.note` | string | Reminder that the numbers are invented. |
| `week.used` | number | Percent of the weekly limit used. |
| `week.resets` | string | Human-readable next reset time. |
| `week.elapsed` | number | Fallback percent of the week already gone, used if `resetAt` cannot be parsed. |
| `week.resetAt` | string | ISO 8601 timestamp with offset. The Now marker and "week gone" percent are computed live from this. |
| `week.extraCredits` | number | Extra credit dollars. `0` means bots pause when the limit runs out, and nothing is charged. |
| `mix.chat` / `mix.routines` / `mix.b2b` | number | Share of last-7-day usage, should add to about 100. |
| `busiest.day` | string | Label for the busiest day tile. |
| `busiest.share` | number | Chat share that day (the tile shows this as a percent). |
| `days` | string[] | Labels for the last 8 UTC days in the charts (index 0 is oldest). |
| `type7.chat` / `type7.routines` / `type7.b2b` | number[] | Daily usage shares, same length as `days`. Values under 1 display as `<1`. |
| `days30` | number[] | Daily usage shares for the last 31 days. |
| `days30Labels` | object | Map of index → date label for the 30-day chart axis (`"0"`, `"10"`, `"20"`, `"30"`). |
| `activity.days` | object | Map of bot `key` → array of daily shares, same length as `days`. Used by the heatmap. |
| `activity.hours` | object or `null` | Map of bot `key` → 24 hourly shares. Leave `null` until a real hourly source exists; the By hour switch then shows an empty state. |
| `bots` | array | Roster. See below. |
| `dismissed` | array | Waiting items to hide on every refresh. `{ bot, match, title, date }`. `match` is a lowercase substring of the item title. |
| `gaps` | string[] | Lines under "What this page can't see". |

## Bot object

| Field | Type | Meaning |
| --- | --- | --- |
| `key` | string | Stable id, used in `activity`, `dismissed`, and expand state. |
| `name` | string | Display name. |
| `role` | string | One-line role. |
| `color` | string | Stored but the layout paints every bot with the same indigo accent. Status colours are separate. |
| `d7` / `d30` | number or `null` | Share of usage over 7 and 30 days. `null` shows as an em dash. |
| `mix` | `[chat, routines, b2b]` or `null` | That bot's 7-day split. |
| `trend` | number[] or `null` | That bot's daily shares, same length as `days`. |
| `last` | string | One-line latest work, shown on the collapsed row. |
| `recent` | `{ when, text }[]` | Short recent-work lines. |
| `open` | `{ t, what, why, todo }[]` | Waiting items. `t` is the title. |
| `routines` | array | See below. |

## Routine object

| Field | Type | Meaning |
| --- | --- | --- |
| `name` | string | Routine name. |
| `sched` | string | Schedule, in plain language. |
| `runs` | string | Runs per week, or `On arrival`, `0`, or `—`. |
| `s7` / `s30` | string | Share over 7 and 30 days, for example `3%`, `<1%`, or `—`. |
| `active` | boolean | Paused routines are hidden until the user toggles them. |
| `note` | string, optional | Extra sentence on the row. |

## Design rules that depend on this data

- The weekly bar Now marker is computed from `week.resetAt` and the current time, so it moves by the hour. Day ticks are midnight in UTC−5.
- The striped band is the linear projection of `week.used` at the current pace. The chip is On track (under 80%), Tight (80–100%), or Over by reset (over 100%).
- This week tiles stay visually neutral. Red and green are only for the projection chip and for usage elevation on a bot row (highest 7-day share is red; 15% or more is amber). A waiting count is grey, or amber only if that bot has 4 or more waiting items.
- Waiting on you starts collapsed.
- The accordion opens one section at a time.
