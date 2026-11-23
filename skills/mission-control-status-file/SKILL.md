---
name: Mission Control status file
description: >-
  Use this whenever your list of items waiting on the user changes (added,
  answered, done, dismissed), or when asked to publish your status for the AI
  Mission Control dashboard.
---
# Mission Control status file

Each bot keeps one small JSON file that the Mission Control status run reads instead of reading chat history. Keeping it current is what makes your recent work and waiting items show on the dashboard.

## Where
`/workspace/mission-control/status/<your agent id>.json` (your agent id is the folder name of your profile under `/home/box/agent-data/agents/`). One file per bot; only write your own.

A `bots.json` file in `/workspace/mission-control/` maps each agent id to the Page's bot key and display name. Every bot in the fleet is listed there, including a trading or investing bot if you have one. In this public repository, agent ids are placeholders such as `<trader-agent-id>`. Do not commit real agent ids.

## When
- Whenever an item waiting on the user is added, answered, completed or dropped.
- At the end of any turn where you finished notable work (update `last` and `recent`).
- No need to write when nothing changed.

## Format
```json
{
  "botId": "<your agent id>",
  "bot": "<your display name>",
  "updated": "2026-11-21T14:00:00-05:00",
  "last": "One short line on the latest thing you finished.",
  "recent": ["Up to 10 short lines of recent work, newest first"],
  "waiting": [
    {"t": "Short title", "what": "What the user needs to do", "why": "Why it matters or the deadline", "todo": "The next action once they answer"}
  ]
}
```
- `updated` is the current time in the user's zone with its offset.
- `recent` holds up to 10 short lines, newest first. Keep only the most important; no need to fill all 10.
- `waiting` holds only open items, up to 10, most important first. An empty list means nothing is waiting. No need to fill all 10.
- Keep every line short and plain.

## How
1. Build the JSON with the fields above.
2. Write it to a temp file in the same folder, then move it over the real file (`mkdir -p` the folder first), so a reader never sees a half-written file.
3. Validate it parses (`jq . file` or `python3 -m json.tool`).

## Privacy rules
- Never put secrets, passwords, tokens, codes, card or account numbers in the file.
- Confidential or employer-sensitive work stays at area level (e.g. "funding document review"), with no names of confidential people, salaries, or internal deal details.
- Investigation work uses case references only, never names or personal information about subjects.
- The file is read by the user's own dashboard only; still write it as if a colleague could see it.
