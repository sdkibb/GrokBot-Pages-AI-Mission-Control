# Refresh prompt

Use this as the body of a scheduled routine on your main Grok Bot. It updates data only. It does not redesign the Page.

```
Refresh my AI Mission Control Page.

Pull a fresh Grok Bot usage report with limit 20 so every bot is included, not just the top 5. Update only the data blocks: snapshot time, weekly limit (used, resets, resetAt), mix (chat / routines / bot-to-bot), busiest day, last-8-day labels, type-by-day series, 30-day series, the activity heatmap (per-bot by day; leave hours null unless a real hourly source exists), the bot roster (usage, mix, trend, last line, recent work, open waiting items, routines), dismissed items, and the data-gap notes.

Do not change the layout, colours, icon, or interaction. Keep the design rules already on the Page: neutral This week tiles, red and amber only for issues or elevation, Waiting on you collapsed by default, paused routines hidden unless toggled, one accordion section open at a time, and a Now marker computed from resetAt so it moves by the hour.

Keep every waiting item I have already dismissed: if a new report still lists one whose title matches a dismissed match string for that bot, leave it out. Do not invent numbers. If the report does not show something, leave it empty or "—" or <1% as the Page already does.

Stay quiet unless the run fails. If it fails, tell me in one short message what went wrong.
```

Suggested cadence: three weekday runs, for example about 9 AM, 1 PM, and 5 PM in your time zone. Ask before changing a schedule that is already in place.
