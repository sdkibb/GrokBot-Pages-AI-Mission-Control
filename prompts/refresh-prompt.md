# Refresh prompts

Two scheduled routines refresh a live AI Mission Control Page. They stay as separate jobs so their timing can be set independently. Both run hourly from 7 AM to 7 PM every day in your time zone. The numbers-only run fires on the hour; the status run fires on the half hour, so they never edit the Page at the same time.

Both edit data only. They do not redesign the Page.

- **Numbers-only run** — [`prompts/numbers-refresh-prompt.md`](numbers-refresh-prompt.md). Pulls the plan usage report once (limit 20) and, in one batched edit, writes the snapshot time, the weekly limit block (percent used and reset time), and each bot's 7-day and 30-day share. It does not read chats or status files, and it does not sync routines.
- **Status run** — [`prompts/status-refresh-prompt.md`](status-refresh-prompt.md). Pulls the full usage report, syncs routines (active or paused per bot), honours the dismissed-items block (and never shrinks it), keeps confidential or employer-sensitive work at area level, keeps investigation-type work to case references, strips any secrets, and reads each bot's status file instead of that bot's chat history. A missing or unreadable file is added to the gap notes; a file older than 3 days is flagged stale.

On the Page itself, pull-to-refresh and the Refresh button redraw in place so a home-screen app does not go blank. They cannot fetch new numbers on their own — they show the last saved snapshot. For a live Page, ask your bot to “update Mission Control,” or let the routines do it.
