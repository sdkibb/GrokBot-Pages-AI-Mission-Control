# Status refresh prompt

Use this as the body of the **status** scheduled routine on your main Grok Bot. It is a separate job from the numbers-only run, so the two can be timed independently. It edits data only and leaves the layout alone.

Suggested cadence: hourly, on the half hour, from 7 AM to 7 PM every day in your time zone (for example 7:30, 8:30, …, 19:30). The numbers-only run fires on the hour so the two never edit the Page at the same time.

```
Refresh the status on my AI Mission Control Page.

Pull a fresh Grok Bot usage report with limit 20 so every bot is included, not just the top 5. Sync each bot's routines (active or paused, schedule, and shares).

Drop any routine a bot reports as deleted and never re-add it from usage history: a deleted routine can keep a usage share for up to 30 days, so a share in the report is not proof the routine still exists.

Read each bot's status file instead of that bot's chat history. The mapping of agent id → Page bot key and name is in /workspace/mission-control/bots.json. Every bot in the fleet is listed there, including a trading or investing bot if I have one. Each file lives at /workspace/mission-control/status/<agentId>.json and follows the "Mission Control status file" skill (botId, bot, updated, last, recent of up to 10 lines newest first, waiting of up to 10 open items with t / what / why / todo; keep only the most important, no need to fill all 10).

From each readable file, fill that bot's last line, recent work, and open waiting items. If a file is missing or unreadable, add it to the gap notes and leave that bot's last / recent / waiting fields as they are (or empty). If a file's `updated` timestamp is more than 3 days old, flag it as stale in the gap notes.

Honour the dismissed-items block: if a status file still lists an item whose title matches a dismissed match string for that bot, leave it out. Never shrink the dismissed-items block; only add to it when I dismiss something.

Keep confidential or employer-sensitive work at area level only (for example "funding document review"), with no names of confidential people, salaries, or internal deal details. Keep investigation-type work to case references only, never names or personal information about subjects. Strip any secrets, passwords, tokens, codes, or card or account numbers if they appear.

Do not change the layout, colours, icon, or interaction. Keep the design rules already on the Page: neutral This week tiles, red and amber only for issues or elevation, Waiting on you collapsed by default, paused routines hidden unless toggled, one accordion section open at a time, and a Now marker computed from resetAt so it moves by the hour.

Do not invent numbers or waiting items. If the report or a status file does not show something, leave it empty or "—" or <1% as the Page already does.

Stay quiet unless the run fails. If it fails, tell me in one short message what went wrong.
```
