# Numbers-only refresh prompt

Use this as the body of the **numbers-only** scheduled routine on your main Grok Bot. It is a separate job from the status run, so the two can be timed independently. It edits only a few data fields and leaves the layout alone.

Suggested cadence: hourly, on the hour, from 7 AM to 7 PM every day in your time zone (for example 7:00, 8:00, …, 19:00). Offset the status run to the half hour so the two never edit the Page at the same time.

```
Refresh the numbers on my AI Mission Control Page.

Pull a fresh Grok Bot usage report once, with limit 20 so every bot is included, not just the top 5. In one batched edit, change only:

- the snapshot time
- the weekly limit block (percent used, and the reset time / resetAt)
- each bot's 7-day share and 30-day share

Do not read chat histories or status files. Do not sync routines, waiting items, recent work, mix, charts, the heatmap, dismissed items, or gap notes. Do not change the layout, colours, icon, or interaction.

Do not invent numbers. If the report does not show a share, leave it empty or "—" or <1% as the Page already does.

Stay quiet unless the run fails. If it fails, tell me in one short message what went wrong.
```
