# Build prompt

Paste this into a chat with your main Grok Bot to build a private AI Mission Control Page from this template. The Page should use your real usage report, not the example numbers in this repository.

```
Build me a private Grok Bot Page called "AI Mission Control" from the template in this repository (index.html and canvas/MissionControl.tsx). Follow the layout and design rules exactly. Use my real Grok Bot usage report, with limit 20 so every bot is included, plus each bot's routines and the status files described in this repository (not chat histories).

Layout:
- Compact header: a generic radar-style icon on the left (no initials), the title "AI Mission Control" beside it, a small "Updated …" line under the title, and an icon-only Refresh button. No page description at the top.
- A full-width weekly limit bar: percent used, percent of the week gone, and a projected percent by reset. The Now marker is computed from the next reset time so it moves by the hour. Day ticks sit on a date axis, with no hour labels. A striped band shows the projection at the current pace. The used fill is green/teal. Colour the status chip and the striped projection from the projection: under 95% On track, 95–100% Near limit, over 100% Over by reset.
- A "This week" row of tiles: Chat with you, Routines, Bot-to-bot, Top bot, Busiest day. These tiles are visually neutral — no red or green, because they are just data, not a standing. Tapping a tile slides up a small overlay panel with a bit more detail (top bots or top routines, and a day chart). Close the panel by tapping outside it, swiping it down, or tapping ✕. Do not add an Extra credits tile; put credit and limit notes under Usage trends.
- A list of my bots with initial avatars (or their real profile pictures if I have uploaded them as Page assets). Tapping a bot expands it in place: 7- and 30-day share, mix of chat / routines / bot-to-bot, waiting items, recent work, routines, and a 7-day sparkline. Sort by usage or by waiting items. Paused routines stay hidden until I toggle them.
- A "Waiting on you" box below the bots, collapsed by default. Each item expands to What it is, Why it's waiting, and What you do.
- An "Activity by bot" heatmap of last-7-day usage, by day. Offer a By hour switch, but only show hourly cells when real hourly data exists.
- A More accordion (Routines, Usage trends, What this page can't see). Opening one section closes the others.

Design rules:
- One calm indigo accent. Soft teal, violet, coral, and periwinkle may be used as decoration only.
- Red and amber are only for issues or elevation: the highest 7-day usage may be red, 15% or more may be amber, and a waiting count may be amber only if that bot has 4 or more items. Waiting counts otherwise stay grey.
- Use only real figures from the usage report. If something is missing, show it as empty or "—" instead of guessing. Shares under 1% show as <1%.
- Pull-to-refresh and the Refresh button must redraw the Page in place. Do not do a full reload; that can go blank in a home-screen app. A pull cannot fetch new numbers on its own — say so in a short toast with the last update time.
- Keep the Page private. Never put real names or numbers in a public repo.

Then create two separate scheduled routines that edit data only and stay quiet unless a run fails. Use the prompts in this repository as the templates:

1. A numbers-only run, hourly on the hour from 7 AM to 7 PM every day, that pulls the usage report once (limit 20) and writes only the snapshot time, the weekly limit block, and each bot's 7-day and 30-day share. It does not read chats or status files.
2. A status run, hourly on the half hour from 7 AM to 7 PM every day, that pulls the full usage report, syncs routines, honours dismissed items without shrinking that block, reads each bot's status file instead of chat history, keeps confidential work at area level and investigation work to case references, and strips secrets. Missing or unreadable files go in the gap notes; a file older than 3 days is flagged stale.

Give every bot a standing rule to keep its status file current per the "Mission Control status file" skill, and list every bot in /workspace/mission-control/bots.json, including a trading or investing bot if I have one.
```
