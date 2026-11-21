import { useGrokTheme, useState, useRef, ReactNode } from "grok/canvas";

// AI Mission Control — Grok Bot Page source (example data only).
// Refresh routine: update the data blocks below, do not rewrite the layout.

// ===== Snapshot data (the refresh routine updates these) =====
const SNAPSHOT = "Sat Nov 21 · 2:00 PM ET";
const WEEK = { used: 49.0, resets: "Tue Nov 24, 6:30 PM ET", elapsed: 54, resetAt: "2026-11-24T18:30:00-05:00", extraCredits: 0 };
const WEEK_MS = 7 * 24 * 3600 * 1000;
function weekElapsed(): number {
  const end = new Date(WEEK.resetAt).getTime();
  if (isNaN(end)) return WEEK.elapsed;
  const pct = ((Date.now() - (end - WEEK_MS)) / WEEK_MS) * 100;
  return Math.max(0, Math.min(100, pct));
}
function projected(used: number, elapsed: number): number {
  return elapsed > 0 ? Math.round((used / elapsed) * 100) : used;
}
function projColors(p: number): [string, string, string] {
  if (p < 80) return ["#10b981", "#06b6d4", "On track"];
  if (p <= 100) return ["#f59e0b", "#f97316", "Tight"];
  return ["#ef4444", "#db2777", "Over by reset"];
}
const MIX = {"chat": 60, "routines": 31, "b2b": 9};
const BUSIEST = {"day": "Wed Nov 18", "share": 17};

type Open = { t: string; what: string; why: string; todo: string };
type Item = { when: string; text: string };
type Rt = { name: string; sched: string; runs: string; s7: string; s30: string; active: boolean; note?: string };
type Bot = { key: string; name: string; role: string; color: string; d7: number | null; d30: number | null; mix: [number, number, number] | null; trend: number[] | null; last: string; recent: Item[]; open: Open[]; routines: Rt[]; note?: string };

const DAYS = ["Fri 13", "Sat 14", "Sun 15", "Mon 16", "Tue 17", "Wed 18", "Thu 19", "Fri 20"];
const TYPE7 = {"chat": [3, 4, 5, 8, 7, 17, 9, 7], "routines": [3, 4, 3, 4, 5, 5, 4, 3], "b2b": [1, 1, 0, 2, 1, 1, 2, 1]};
const DAYS30: number[] = [2, 1, 2, 3, 2, 2, 1, 2, 3, 2, 2, 4, 3, 2, 3, 2, 4, 3, 2, 3, 5, 3, 3, 4, 4, 8, 5, 4, 6, 4, 5];
const ACTIVITY: { days: Record<string, number[]>; hours: Record<string, number[]> | null } = {
  days: {
      "atlas": [2, 2, 3, 4, 3, 5, 4, 4],
      "scout": [1, 1, 1, 2, 2, 8, 2, 2],
      "ledger": [1, 2, 1, 2, 2, 1, 2, 2],
      "quill": [1, 0, 1, 2, 2, 3, 2, 1],
      "pilot": [1, 1, 1, 1, 1, 1, 2, 1],
      "nova": [0, 0, 1, 2, 1, 2, 2, 0],
      "harbor": [1, 1, 1, 1, 0, 1, 1, 1],
      "relay": [0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5]
  },
  hours: null,
};
const D30L: Record<number, string> = { 0: "Oct 21", 10: "Oct 31", 20: "Nov 10", 30: "Nov 20" };

const BOTS: Bot[] = [
  {
    key: "atlas", name: "Atlas", role: "Coordinates the team", color: "#6366f1",
    d7: 27, d30: 26, mix: [16, 8, 3], trend: [2, 2, 3, 4, 3, 5, 4, 4],
    last: "Wrapped Monday's briefing outline and sent it for a quick yes",
    recent: [{"when": "Sat 11:20 AM", "text": "Wrapped Monday's briefing outline and sent it for a quick yes."}, {"when": "Fri 4:02 PM", "text": "Rebuilt the weekly briefing around open items and usage."}, {"when": "Fri 11:20 AM", "text": "Moved the mail router to four weekday checks."}, {"when": "Thu 6:15 PM", "text": "Trimmed two quiet routines down to weekdays only."}],
    open: [{"t": "Approve Monday's briefing outline", "what": "A tight one-page outline of what the team will cover on Monday. The draft is ready.", "why": "Atlas is holding the send until you say it looks right.", "todo": "Open Atlas's chat, take a look, and say send — or ask for a tweak."}],
    routines: [
      { name: "Team morning digest", sched: "Weekdays about 8 AM", runs: "5", s7: "3%", s30: "4%", active: true },
      { name: "Usage dashboard refresh", sched: "Weekdays about 9 AM, 1 PM, 5 PM", runs: "15", s7: "2%", s30: "2%", active: true },
      { name: "Midweek check-in", sched: "Wednesdays about 2 PM", runs: "1", s7: "1%", s30: "1%", active: true },
      { name: "Weekend quiet check", sched: "Paused", runs: "0", s7: "<1%", s30: "1%", active: false }
    ],
  },
  {
    key: "scout", name: "Scout", role: "Research and briefings", color: "#6366f1",
    d7: 19, d30: 16, mix: [16, 2, 1], trend: [1, 1, 1, 2, 2, 8, 2, 2],
    last: "Finished a one-page market brief from four public notes",
    recent: [{"when": "Fri 3:40 PM", "text": "Finished a one-page market brief from four public notes."}, {"when": "Thu 2:11 PM", "text": "Flagged two sources that still need a yes or no."}],
    open: [{"t": "Pick the two sources for the market brief", "what": "The brief is otherwise ready. Two of the four public sources still need a yes or no.", "why": "Scout will finish and send it once you choose.", "todo": "Tell Scout which two sources to keep."}],
    routines: [
      { name: "Overnight research sweep", sched: "Daily about 6 AM", runs: "7", s7: "2%", s30: "2%", active: true }
    ],
  },
  {
    key: "ledger", name: "Ledger", role: "Money and invoices", color: "#6366f1",
    d7: 13, d30: 12, mix: [4, 8, 1], trend: [1, 2, 1, 2, 2, 1, 2, 2],
    last: "Logged this week's invoices and marked two as paid",
    recent: [{"when": "Fri 10:05 AM", "text": "Logged this week's invoices and marked two as paid."}, {"when": "Wed 4:30 PM", "text": "Started the monthly spend summary."}],
    open: [],
    routines: [
      { name: "Invoice inbox check", sched: "Weekdays 10 AM and 3 PM", runs: "10", s7: "2%", s30: "3%", active: true },
      { name: "Old weekly recap", sched: "Paused", runs: "0", s7: "—", s30: "1%", active: false }
    ],
  },
  {
    key: "quill", name: "Quill", role: "Writing and drafts", color: "#6366f1",
    d7: 12, d30: 11, mix: [10, 1, 1], trend: [1, 0, 1, 2, 2, 3, 2, 1],
    last: "Drafted a short welcome note, ready for a quick look",
    recent: [{"when": "Fri 2:18 PM", "text": "Drafted a short welcome note, ready for a quick look."}, {"when": "Thu 9:40 AM", "text": "Tightened the project kickoff outline."}],
    open: [{"t": "Review the welcome note before it goes out", "what": "A short, warm welcome note, still on a draft card.", "why": "Nothing has been sent. One yes and it goes out.", "todo": "Read it in Quill's chat. Say send, or ask for a rewrite."}],
    routines: [],
  },
  {
    key: "pilot", name: "Pilot", role: "Calendar and reminders", color: "#6366f1",
    d7: 9, d30: 11, mix: [3, 6, 0], trend: [1, 1, 1, 1, 1, 1, 2, 1],
    last: "Added next Tuesday's review to the calendar",
    recent: [{"when": "Fri 1:12 PM", "text": "Added next Tuesday's review to the calendar."}, {"when": "Thu 8:50 AM", "text": "Caught a double-booked Friday and left a note."}],
    open: [],
    routines: [
      { name: "Calendar change watch", sched: "Weekdays every 2 hours, 8 AM to 6 PM", runs: "25", s7: "2%", s30: "3%", active: true }
    ],
  },
  {
    key: "nova", name: "Nova", role: "Projects", color: "#6366f1",
    d7: 8, d30: 8, mix: [5, 1, 2], trend: [0, 0, 1, 2, 1, 2, 2, 0],
    last: "Updated the project board after the planning call",
    recent: [{"when": "Thu 5:22 PM", "text": "Updated the project board after the planning call."}, {"when": "Thu 4:05 PM", "text": "Opened a kickoff checklist with two suggested dates."}],
    open: [{"t": "Choose a date for the project kickoff", "what": "Nova has two suggested dates for a short kickoff call. The checklist is otherwise ready.", "why": "The first tasks get assigned once a date is set.", "todo": "Pick a date in Nova's chat."}],
    routines: [],
  },
  {
    key: "harbor", name: "Harbor", role: "Home life", color: "#6366f1",
    d7: 7, d30: 9, mix: [4, 3, 0], trend: [1, 1, 1, 1, 0, 1, 1, 1],
    last: "Put the weekend packing list on the family board",
    recent: [{"when": "Fri 6:40 PM", "text": "Put the weekend packing list on the family board."}, {"when": "Fri 5:05 PM", "text": "Passed along a school reminder."}],
    open: [],
    routines: [
      { name: "School notice sweep", sched: "Weekdays about 5 PM", runs: "5", s7: "1%", s30: "2%", active: true },
      { name: "Weekend board preview", sched: "Paused", runs: "0", s7: "<1%", s30: "1%", active: false }
    ],
  },
  {
    key: "relay", name: "Relay", role: "Mail and handoffs", color: "#6366f1",
    d7: 5, d30: 7, mix: [2, 2, 1], trend: [0.5, 0.5, 0.5, 1, 0.5, 0.5, 1, 0.5],
    last: "Routed this morning's mail to the right bots",
    recent: [{"when": "Sat 9:10 AM", "text": "Routed this morning's mail to the right bots."}, {"when": "Fri 3:10 PM", "text": "Afternoon pass found nothing new."}],
    open: [],
    routines: [
      { name: "Mail router", sched: "Weekdays 9 AM, 12 PM, 3 PM, 6 PM", runs: "20", s7: "1%", s30: "2%", active: true }
    ],
  }
];

const GAPS: string[] = [
  "No token or dollar counts: the usage report gives shares of usage and the weekly percent only.",
  "The weekly limit may be shared with other apps; this page cannot break that out.",
  "Bots with no usage in a period show 0%; shares under 1% show as <1%.",
  "The Activity by bot heatmap is by day only until an hourly source exists.",
  "Recent work and waiting items come from each bot's latest messages, so older items may be missing.",
  "Days in the charts are UTC days."
];

const DISMISSED: { bot: string; match: string; title: string; date: string }[] = [
  { bot: "quill", match: "old draft", title: "Old draft sitting in review", date: "2026-11-18" },
  { bot: "ledger", match: "receipt", title: "Missing receipt from last week", date: "2026-11-18" }
];

const ACCENT = "#6366f1";
const TEAL = "#2dd4bf";
const VIOLET = "#a78bfa";
const CORAL = "#fb7185";
const PERI = "#818cf8";
const RING: Record<string, string> = { atlas: CORAL, scout: TEAL, ledger: VIOLET, quill: PERI, pilot: TEAL, nova: VIOLET, harbor: CORAL, relay: TEAL };
const TILE_ACCENT: Record<string, string> = { "Chat with you": TEAL, "Routines": VIOLET, "Bot-to-bot": CORAL, "Top bot": VIOLET, "Busiest day": PERI };
const ACC_ACCENT: Record<string, string> = { routines: TEAL, trends: VIOLET, gaps: CORAL };
BOTS.forEach((b: Bot) => {
  b.open = b.open.filter((o: Open) => !DISMISSED.some((d) => d.bot === b.key && o.t.toLowerCase().indexOf(d.match) >= 0));
  b.color = ACCENT;
});
const MAX_D7 = Math.max(...BOTS.map((b: Bot) => b.d7 || 0));
function heat(d7: number | null): string | null {
  if (d7 === null) return null;
  if (d7 === MAX_D7) return "#ef4444";
  if (d7 >= 15) return "#f59e0b";
  return null;
}
function waitTone(n: number): string {
  return n >= 4 ? "#f59e0b" : "#64748b";
}

const OPEN_TOTAL = BOTS.reduce((n: number, b: Bot) => n + b.open.length, 0);
const OPEN_BOTS = BOTS.filter((b: Bot) => b.open.length > 0).length;
const ACTIVE_RT = BOTS.reduce((n: number, b: Bot) => n + b.routines.filter((r: Rt) => r.active).length, 0);
const PAUSED_RT = BOTS.reduce((n: number, b: Bot) => n + b.routines.filter((r: Rt) => !r.active).length, 0);
const C = { chat: "#4f46e5", routines: "#818cf8", b2b: "#c4b5fd" };
function shareNum(s: string): number {
  if (s === "—" || s === "") return -1;
  if (s.indexOf("<") === 0) return 0.5;
  const n = parseFloat(s);
  return isNaN(n) ? -1 : n;
}
function fmtShare(n: number): string {
  return n < 1 && n > 0 ? "<1%" : n + "%";
}

function Face(props: { b: Bot; size: number }) {
  const s = props.size;
  const ring = "0 0 0 2px " + (RING[props.b.key] || props.b.color);
  const ini = props.b.name.split(" ").map((w: string) => w.charAt(0)).join("").slice(0, 2);
  return <div style={{ width: s, height: s, borderRadius: 9999, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg," + props.b.color + ",#0891b2)", color: "#fff", fontWeight: 700, fontSize: Math.round(s / 2.6), boxShadow: ring }}>{ini}</div>;
}

function Tile(props: { label: string; value: string; sub?: string; onClick?: () => void }) {
  const theme = useGrokTheme();
  const a = ACCENT;
  return (
    <div role={props.onClick ? "button" : undefined} tabIndex={props.onClick ? 0 : undefined} onClick={props.onClick} style={{ background: "linear-gradient(135deg," + a + "24," + a + "0a)", border: "1px solid " + a + "38", borderTop: "3px solid " + (TILE_ACCENT[props.label] || a), color: theme.text.primary, borderRadius: 18, padding: "14px 16px", minHeight: 104, display: "flex", flexDirection: "column", justifyContent: "space-between", gap: 6, cursor: props.onClick ? "pointer" : "default", position: "relative" }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: a }}>{props.label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.05 }}>{props.value}</div>
      {props.sub ? <div style={{ fontSize: 12.5, opacity: 0.92, lineHeight: 1.3 }}>{props.sub}</div> : null}
      {props.onClick ? <span style={{ position: "absolute", top: 12, right: 14, fontSize: 16, color: theme.text.tertiary }}>›</span> : null}
    </div>
  );
}

function WeekBar(props: { used: number; elapsed: number }) {
  const end = new Date(WEEK.resetAt).getTime();
  const start = end - WEEK_MS;
  const proj = projected(props.used, props.elapsed);
  const col = projColors(proj);
  const DN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const DAY = 24 * 3600 * 1000;
  const OFF = 5 * 3600 * 1000;
  const bounds: number[] = [start];
  for (let m = Math.floor((start - OFF) / DAY) * DAY + DAY + OFF; m < end; m += DAY) bounds.push(m);
  bounds.push(end);
  const ticks: { pct: number; top: string; bot: string }[] = [];
  const lines: number[] = [];
  for (let i = 0; i < bounds.length - 1; i++) {
    const a = ((bounds[i] - start) / WEEK_MS) * 100;
    const b = ((bounds[i + 1] - start) / WEEK_MS) * 100;
    if (i > 0) lines.push(a);
    const d = new Date(bounds[i] - OFF);
    ticks.push({ pct: (a + b) / 2, top: b - a < 8 ? "" : DN[d.getUTCDay()], bot: String(d.getUTCDate()) });
  }
  const e = props.elapsed;
  const u = Math.min(100, props.used);
  const pr = Math.min(100, proj);
  return (
    <div style={{ gridColumn: "1 / -1", background: "linear-gradient(135deg,#3730a3,#4f46e5 60%,#6366f1)", color: "#fff", borderRadius: 18, padding: "14px 16px 12px", boxShadow: "0 6px 18px #4f46e533" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", opacity: 0.9 }}>Limit week</div>
        <div style={{ fontSize: 12.5, fontWeight: 700, background: "linear-gradient(90deg," + col[0] + "," + col[1] + ")", padding: "3px 10px", borderRadius: 9999 }}>{col[2]}</div>
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "6px 0 12px", fontSize: 13.5 }}>
        <span><b style={{ fontSize: 20 }}>{props.used}%</b> used</span>
        <span><b style={{ fontSize: 20 }}>{Math.round(e)}%</b> of week gone</span>
        <span><b style={{ fontSize: 20 }}>~{proj}%</b> projected by reset</span>
      </div>
      <div style={{ position: "relative", padding: "18px 0 0" }}>
        <div style={{ position: "absolute", left: e + "%", top: 0, transform: e > 85 ? "translateX(-100%)" : e < 15 ? "none" : "translateX(-50%)", fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" }}>Now</div>
        <div style={{ position: "relative", height: 18, borderRadius: 9999, background: "rgba(255,255,255,0.22)", overflow: "hidden" }}>
          {pr > u ? <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pr + "%", borderRadius: 9999, background: "repeating-linear-gradient(135deg," + col[0] + "55 0 6px," + col[0] + "22 6px 12px)" }} /> : null}
          <div style={{ position: "relative", width: u + "%", minWidth: 6, height: "100%", borderRadius: 9999, background: "linear-gradient(90deg," + col[0] + "," + col[1] + ")" }} />
          {lines.map((p: number, i: number) => <div key={i} style={{ position: "absolute", left: p + "%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.3)" }} />)}
        </div>
        <div style={{ position: "absolute", left: "calc(" + e + "% - 1.5px)", top: 14, height: 26, width: 3, borderRadius: 2, background: "#fff", boxShadow: "0 0 6px rgba(0,0,0,0.4)" }} />
      </div>
      <div style={{ position: "relative", height: 30, marginTop: 6 }}>
        {ticks.map((t, i: number) => (
          <div key={i} style={{ position: "absolute", left: t.pct + "%", transform: "translateX(-50%)", textAlign: "center", lineHeight: 1.15, opacity: t.top ? 1 : 0.7 }}>
            <div style={{ fontSize: 10, opacity: 0.8 }}>{t.top}</div>
            <div style={{ fontSize: 11.5, fontWeight: 700 }}>{t.bot}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>Resets {WEEK.resets} · striped = projected at the current pace</div>
    </div>
  );
}

function SectionTitle(props: { text: string; sub?: string }) {
  const theme = useGrokTheme();
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", margin: "4px 2px 10px" }}>
      <span style={{ width: 4, height: 18, borderRadius: 2, background: "linear-gradient(180deg," + ACCENT + "," + TEAL + ")", alignSelf: "center" }} />
      <div style={{ fontSize: 19, fontWeight: 750, color: theme.text.primary }}>{props.text}</div>
      {props.sub ? <div style={{ fontSize: 13, color: theme.text.tertiary }}>{props.sub}</div> : null}
    </div>
  );
}

function MixBar(props: { mix: [number, number, number]; width: string }) {
  return (
    <div style={{ display: "flex", height: 8, width: props.width, minWidth: 14, borderRadius: 6, overflow: "hidden" }}>
      <div style={{ flex: props.mix[0] + " 1 0", background: C.chat }} />
      <div style={{ flex: props.mix[1] + " 1 0", background: C.routines }} />
      <div style={{ flex: props.mix[2] + " 1 0", background: C.b2b }} />
    </div>
  );
}

function Chip(props: { color: string; text: string }) {
  return <span style={{ fontSize: 12, fontWeight: 650, color: props.color, background: props.color + "1f", padding: "3px 9px", borderRadius: 9999 }}>{props.text}</span>;
}

function WaitItem(props: { o: Open; color: string; lead?: string }) {
  const theme = useGrokTheme();
  const [open, setOpen] = useState<boolean>(false);
  return (
    <div style={{ borderRadius: 14, border: "1px solid " + (open ? props.color : theme.border.default), background: open ? props.color + "12" : theme.bg.base, overflow: "hidden" }}>
      <div role="button" tabIndex={0} onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", minHeight: 48, cursor: "pointer" }}>
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: props.color, flex: "none" }} />
        <div style={{ flex: "1 1 0", minWidth: 0, fontSize: 14.5, fontWeight: 600, color: theme.text.primary, lineHeight: 1.35 }}>
          {props.lead ? <span style={{ color: props.color, marginRight: 6 }}>{props.lead}</span> : null}
          {props.o.t}
        </div>
        <span style={{ fontSize: 18, color: theme.text.tertiary, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
      </div>
      {open ? (
        <div style={{ padding: "0 14px 14px 34px", display: "flex", flexDirection: "column", gap: 8 }}>
          {[["What it is", props.o.what], ["Why it's waiting", props.o.why], ["What you do", props.o.todo]].map((p: string[], i: number) => (
            <div key={i} style={{ fontSize: 13.5, lineHeight: 1.45, color: theme.text.secondary }}>
              <span style={{ fontWeight: 700, color: i === 2 ? props.color : theme.text.primary }}>{p[0]}: </span>
              {p[1]}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function RtRow(props: { r: Rt; color: string; lead?: string }) {
  const theme = useGrokTheme();
  const r = props.r;
  const runs = r.runs === "On arrival" ? "On arrival" : r.runs !== "0" && r.runs !== "—" ? r.runs + " runs/wk" : "";
  return (
    <div style={{ display: "flex", gap: 10, padding: "10px 4px", borderBottom: "1px solid " + theme.border.subtle, alignItems: "flex-start", opacity: r.active ? 1 : 0.75 }}>
      <span style={{ width: 4, alignSelf: "stretch", borderRadius: 4, background: r.active ? props.color : theme.border.strong, flex: "none" }} />
      <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "baseline" }}>
          {props.lead ? <span style={{ fontSize: 12, fontWeight: 700, color: props.color }}>{props.lead}</span> : null}
          <span style={{ fontSize: 14.5, fontWeight: 650, color: theme.text.primary }}>{r.name}</span>
        </div>
        <div style={{ fontSize: 13, color: theme.text.secondary, lineHeight: 1.4 }}>{r.sched}{r.note ? ". " + r.note : ""}</div>
      </div>
      <div style={{ flex: "none", textAlign: "right", display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontSize: 15, fontWeight: 750, color: theme.text.primary }}>{r.s7}</span>
        <span style={{ fontSize: 11.5, color: theme.text.tertiary }}>{runs || (r.active ? "" : "paused")}</span>
      </div>
    </div>
  );
}

function Spark(props: { values: number[]; color: string }) {
  const theme = useGrokTheme();
  const max = Math.max(...props.values, 1);
  const W = 320;
  const H = 110;
  const head = 16;
  const bw = W / props.values.length;
  return (
    <svg width="100%" viewBox={"0 0 " + W + " " + (H + 18)} style={{ display: "block" }}>
      {props.values.map((v: number, i: number) => {
        const h = Math.max(3, (v / max) * (H - head));
        return (
          <g key={i}>
            <rect x={i * bw + 5} y={H - h} width={bw - 10} height={h} rx={5} fill={props.color} opacity={0.35 + (0.65 * v) / max} />
            <text x={i * bw + bw / 2} y={H - h - 4} textAnchor="middle" fontSize="10" fill={theme.text.secondary} fontFamily={theme.font.family}>{v < 1 ? "<1" : v}</text>
            <text x={i * bw + bw / 2} y={H + 14} textAnchor="middle" fontSize="9.5" fill={theme.text.tertiary} fontFamily={theme.font.family}>{DAYS[i].split(" ")[1]}</text>
          </g>
        );
      })}
    </svg>
  );
}

function BotBody(props: { b: Bot }) {
  const theme = useGrokTheme();
  const b = props.b;
  const [showPaused, setShowPaused] = useState<boolean>(false);
  const active = b.routines.filter((r: Rt) => r.active);
  const paused = b.routines.filter((r: Rt) => !r.active);
  const mini = (label: string, value: string) => (
    <div style={{ flex: "1 1 90px", borderRadius: 14, padding: "10px 12px", background: "linear-gradient(135deg," + b.color + "26," + b.color + "0d)", border: "1px solid " + b.color + "40" }}>
      <div style={{ fontSize: 11.5, fontWeight: 650, color: theme.text.secondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: theme.text.primary }}>{value}</div>
    </div>
  );
  const head = (t: string) => <div style={{ fontSize: 13, fontWeight: 750, color: b.color, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 6 }}>{t}</div>;
  return (
    <div style={{ padding: "4px 14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ fontSize: 13, color: theme.text.secondary }}>{b.role}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {mini("7 days", b.d7 !== null ? b.d7 + "%" : "—")}
        {mini("30 days", b.d30 !== null ? b.d30 + "%" : "—")}
        {mini("Waiting", String(b.open.length))}
      </div>
      {b.mix ? (
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 12.5, color: theme.text.secondary }}>
          <span><b style={{ color: C.chat }}>{b.mix[0]}%</b> chat</span>
          <span><b style={{ color: C.routines }}>{b.mix[1]}%</b> routines</span>
          <span><b style={{ color: C.b2b }}>{b.mix[2] < 1 ? "<1" : b.mix[2]}%</b> bot-to-bot</span>
        </div>
      ) : null}
      {b.note ? <div style={{ fontSize: 12.5, color: theme.text.tertiary }}>{b.note}</div> : null}
      {b.open.length > 0 ? head("Waiting on you") : null}
      {b.open.map((o: Open, i: number) => <WaitItem key={i} o={o} color={b.color} />)}
      {head("Recent work")}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {b.recent.map((r: Item, i: number) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ width: 8, height: 8, marginTop: 6, borderRadius: 9999, background: b.color, flex: "none" }} />
            <div style={{ fontSize: 13.5, lineHeight: 1.45, color: theme.text.primary }}>
              <span style={{ color: theme.text.tertiary, fontWeight: 600, marginRight: 6 }}>{r.when}</span>
              {r.text}
            </div>
          </div>
        ))}
      </div>
      {b.routines.length > 0 ? head("Routines") : null}
      {active.map((r: Rt, i: number) => <RtRow key={i} r={r} color={b.color} />)}
      {paused.length > 0 ? (
        <div role="button" tabIndex={0} onClick={() => setShowPaused(!showPaused)} style={{ fontSize: 13, fontWeight: 650, color: b.color, cursor: "pointer", padding: "8px 2px" }}>
          {showPaused ? "Hide paused" : "Show " + paused.length + " paused"}
        </div>
      ) : null}
      {showPaused ? paused.map((r: Rt, i: number) => <RtRow key={"p" + i} r={r} color={b.color} />) : null}
      {b.trend ? head("Usage by day, last 7 days") : null}
      {b.trend ? <Spark values={b.trend} color={b.color} /> : null}
    </div>
  );
}

function Acc(props: { id: string; open: string | null; setOpen: (v: string | null) => void; title: string; sub: string; from: string; to: string; children?: ReactNode }) {
  const theme = useGrokTheme();
  const on = props.open === props.id;
  return (
    <div style={{ borderRadius: 18, overflow: "hidden", border: "1px solid " + theme.border.default, background: theme.bg.elevated }}>
      <div role="button" tabIndex={0} onClick={() => props.setOpen(on ? null : props.id)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", minHeight: 60, cursor: "pointer", borderLeft: "5px solid " + (ACC_ACCENT[props.id] || VIOLET), background: "linear-gradient(120deg," + props.from + "," + props.to + ")", color: "#fff" }}>
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <div style={{ fontSize: 16.5, fontWeight: 750 }}>{props.title}</div>
          <div style={{ fontSize: 12.5, opacity: 0.9 }}>{props.sub}</div>
        </div>
        <span style={{ fontSize: 22, transform: on ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
      </div>
      {on ? <div style={{ padding: 14 }}>{props.children}</div> : null}
    </div>
  );
}

function Trend30() {
  const theme = useGrokTheme();
  const W = 620;
  const H = 150;
  const max = 10;
  const bw = W / DAYS30.length;
  return (
    <svg width="100%" viewBox={"0 0 " + W + " " + (H + 22)} style={{ display: "block" }}>
      <defs>
        <linearGradient id="g30" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8b5cf6" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {DAYS30.map((v: number, i: number) => {
        const h = Math.max(2, (v / max) * H);
        return <rect key={i} x={i * bw + 2} y={H - h} width={bw - 4} height={h} rx={3} fill="url(#g30)" opacity={v >= 7 ? 1 : 0.55} />;
      })}
      {Object.keys(D30L).map((k: string) => {
        const i = Number(k);
        return <text key={k} x={Math.min(W - 24, Math.max(24, i * bw + bw / 2))} y={H + 16} textAnchor="middle" fontSize="11" fill={theme.text.tertiary} fontFamily={theme.font.family}>{D30L[i]}</text>;
      })}
      {DAYS30.map((v: number, i: number) => (v === Math.max(...DAYS30) ? <text key={"t" + i} x={i * bw + bw / 2} y={H - (v / max) * H - 4} textAnchor="middle" fontSize="11" fill={theme.text.secondary} fontFamily={theme.font.family}>{v + "%"}</text> : null))}
    </svg>
  );
}

function Trend7() {
  const theme = useGrokTheme();
  const W = 620;
  const H = 150;
  const max = 30;
  const bw = W / DAYS.length;
  return (
    <svg width="100%" viewBox={"0 0 " + W + " " + (H + 22)} style={{ display: "block" }}>
      {DAYS.map((d: string, i: number) => {
        const a = (TYPE7.chat[i] / max) * H;
        const r = (TYPE7.routines[i] / max) * H;
        const c = (TYPE7.b2b[i] / max) * H;
        const tot = TYPE7.chat[i] + TYPE7.routines[i] + TYPE7.b2b[i];
        const x = i * bw + 10;
        const w = bw - 20;
        return (
          <g key={i}>
            <rect x={x} y={H - r} width={w} height={r} rx={3} fill={C.routines} />
            <rect x={x} y={H - r - c} width={w} height={c} fill={C.b2b} />
            <rect x={x} y={H - r - c - a} width={w} height={a} rx={3} fill={C.chat} />
            <text x={x + w / 2} y={H - r - c - a - 5} textAnchor="middle" fontSize="11" fill={theme.text.secondary} fontFamily={theme.font.family}>{Math.round(tot) + "%"}</text>
            <text x={x + w / 2} y={H + 16} textAnchor="middle" fontSize="11" fill={theme.text.tertiary} fontFamily={theme.font.family}>{d}</text>
          </g>
        );
      })}
    </svg>
  );
}

function Legend3() {
  const theme = useGrokTheme();
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 12.5, color: theme.text.secondary }}>
      {[["Chat with you", C.chat], ["Routines", C.routines], ["Bot-to-bot", C.b2b]].map((p: string[]) => (
        <span key={p[0]} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 3, background: p[1] }} />
          {p[0]}
        </span>
      ))}
    </div>
  );
}

const SHEETS: Record<string, { title: string; accent: string }> = {
  chat: { title: "Chat with you", accent: TEAL },
  routines: { title: "Routines", accent: VIOLET },
  b2b: { title: "Bot-to-bot", accent: CORAL },
  top: { title: "Top bot", accent: VIOLET },
  busiest: { title: "Busiest day", accent: PERI },
};

function DayBars(props: { values: number[]; color: string; highlightMax?: boolean }) {
  const theme = useGrokTheme();
  const max = Math.max(...props.values, 1);
  const mi = props.values.indexOf(Math.max(...props.values));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, padding: "0 2px" }}>
      {props.values.map((v: number, i: number) => (
        <div key={i} style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
          <span style={{ fontSize: 10.5, color: theme.text.secondary }}>{v === 0 ? "0" : v < 1 ? "<1" : String(Math.round(v * 10) / 10)}</span>
          <div style={{ width: "100%", maxWidth: 30, height: Math.max(3, (v / max) * 80), borderRadius: 6, background: props.color, opacity: props.highlightMax && i !== mi ? 0.45 : 1 }} />
          <span style={{ fontSize: 10, color: theme.text.tertiary, whiteSpace: "nowrap" }}>{DAYS[i].split(" ")[0].slice(0, 2) + " " + DAYS[i].split(" ")[1]}</span>
        </div>
      ))}
    </div>
  );
}

function RankRow(props: { b?: Bot; label: string; sub?: string; value: number; max: number; color: string }) {
  const theme = useGrokTheme();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0" }}>
      {props.b ? <Face b={props.b} size={30} /> : null}
      <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 650, color: theme.text.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{props.label}</span>
          <span style={{ fontSize: 14, fontWeight: 750, color: theme.text.primary, flex: "none" }}>{props.value < 0 ? "—" : fmtShare(props.value)}</span>
        </div>
        {props.sub ? <span style={{ fontSize: 12, color: theme.text.tertiary }}>{props.sub}</span> : null}
        <div style={{ height: 6, borderRadius: 4, background: theme.border.subtle, overflow: "hidden" }}>
          <div style={{ width: (props.max > 0 && props.value > 0 ? (props.value / props.max) * 100 : 0) + "%", minWidth: props.value > 0 ? 4 : 0, height: "100%", borderRadius: 4, background: props.color }} />
        </div>
      </div>
    </div>
  );
}

function SheetBody(props: { id: string; top: Bot }) {
  const theme = useGrokTheme();
  const acc = SHEETS[props.id].accent;
  const h = (t: string) => <div style={{ fontSize: 12.5, fontWeight: 750, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.text.secondary, margin: "14px 0 6px" }}>{t}</div>;
  const stat = (label: string, value: string) => (
    <div style={{ flex: "1 1 90px", borderRadius: 14, padding: "10px 12px", background: acc + "1a", border: "1px solid " + acc + "40" }}>
      <div style={{ fontSize: 11.5, fontWeight: 650, color: theme.text.secondary, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: theme.text.primary }}>{value}</div>
    </div>
  );
  const withMix = BOTS.filter((b: Bot) => b.mix !== null);
  if (props.id === "chat") {
    const ranked = withMix.slice().sort((a: Bot, b: Bot) => (b.mix as number[])[0] - (a.mix as number[])[0]).slice(0, 3);
    const max = ranked.length ? (ranked[0].mix as number[])[0] : 0;
    return (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{stat("Share, 7 days", MIX.chat + "%")}{stat("Peak day", String(Math.max(...TYPE7.chat)) + "%")}</div>
        {h("Top bots by chat share")}
        {ranked.map((b: Bot) => <RankRow key={b.key} b={b} label={b.name} value={(b.mix as number[])[0]} max={max} color={acc} />)}
        {h("Chat by day, last 7 days")}
        <DayBars values={TYPE7.chat} color={acc} />
      </div>
    );
  }
  if (props.id === "routines") {
    const all: { b: Bot; r: Rt }[] = [];
    BOTS.forEach((b: Bot) => b.routines.forEach((r: Rt) => all.push({ b, r })));
    const ranked = all.slice().sort((x, y) => shareNum(y.r.s7) - shareNum(x.r.s7)).slice(0, 5);
    const max = ranked.length ? shareNum(ranked[0].r.s7) : 0;
    return (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{stat("Share, 7 days", MIX.routines + "%")}{stat("Active", String(ACTIVE_RT))}{stat("Paused", String(PAUSED_RT))}</div>
        {h("Top routines by share, 7 days")}
        {ranked.map((x, i: number) => <RankRow key={i} b={x.b} label={x.r.name} sub={x.b.name + (x.r.active ? "" : " · paused")} value={shareNum(x.r.s7)} max={max} color={acc} />)}
        {h("Routines by day, last 7 days")}
        <DayBars values={TYPE7.routines} color={acc} />
      </div>
    );
  }
  if (props.id === "b2b") {
    const ranked = withMix.filter((b: Bot) => (b.mix as number[])[2] > 0).sort((a: Bot, b: Bot) => (b.mix as number[])[2] - (a.mix as number[])[2]);
    const max = ranked.length ? (ranked[0].mix as number[])[2] : 0;
    return (
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{stat("Share, 7 days", MIX.b2b + "%")}{stat("Bots handing off", ranked.length ? String(ranked.length) : "—")}</div>
        {h("Who hands off the most")}
        {ranked.length ? ranked.map((b: Bot) => <RankRow key={b.key} b={b} label={b.name} value={(b.mix as number[])[2]} max={max} color={acc} />) : <div style={{ fontSize: 13.5, color: theme.text.tertiary }}>—</div>}
        {h("Bot-to-bot by day, last 7 days")}
        <DayBars values={TYPE7.b2b} color={acc} />
      </div>
    );
  }
  if (props.id === "top") {
    const b = props.top;
    const m = b.mix;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <Face b={b} size={44} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 750, color: theme.text.primary }}>{b.name}</div>
            <div style={{ fontSize: 12.5, color: theme.text.tertiary }}>{b.role}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{stat("7 days", b.d7 !== null ? b.d7 + "%" : "—")}{stat("30 days", b.d30 !== null ? b.d30 + "%" : "—")}</div>
        {h("Where its usage went, 7 days")}
        {m ? (
          <div>
            <MixBar mix={m} width="100%" />
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 13, color: theme.text.secondary, marginTop: 8 }}>
              <span><b style={{ color: theme.text.primary }}>{fmtShare(m[0])}</b> chat</span>
              <span><b style={{ color: theme.text.primary }}>{fmtShare(m[1])}</b> routines</span>
              <span><b style={{ color: theme.text.primary }}>{fmtShare(m[2])}</b> bot-to-bot</span>
            </div>
          </div>
        ) : <div style={{ fontSize: 13.5, color: theme.text.tertiary }}>—</div>}
        {b.trend ? h("By day, last 7 days") : null}
        {b.trend ? <DayBars values={b.trend} color={acc} highlightMax /> : null}
      </div>
    );
  }
  const tot = DAYS.map((d: string, i: number) => TYPE7.chat[i] + TYPE7.routines[i] + TYPE7.b2b[i]);
  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{stat("Busiest", BUSIEST.day)}{stat("Chat that day", BUSIEST.share + "%")}</div>
      {h("All usage by day, last 7 days")}
      <DayBars values={tot} color={acc} highlightMax />
      <div style={{ marginTop: 10 }}><Legend3 /></div>
    </div>
  );
}

function BrandIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 64 64" role="img" aria-label="AI Mission Control" style={{ flex: "none", filter: "drop-shadow(0 4px 10px rgba(79,70,229,0.35))" }}>
      <defs>
        <linearGradient id="mcBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3730a3" />
          <stop offset="0.55" stopColor="#7c3aed" />
          <stop offset="1" stopColor="#fb7185" />
        </linearGradient>
        <linearGradient id="mcGloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="mcDot" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ccfbf1" />
          <stop offset="1" stopColor="#2dd4bf" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="15" fill="url(#mcBg)" />
      <path d="M2 17 A15 15 0 0 1 17 2 H47 A15 15 0 0 1 62 17 V26 C44 34 22 34 2 26 Z" fill="url(#mcGloss)" />
      <ellipse cx="32" cy="33" rx="23" ry="9" fill="none" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="2.2" transform="rotate(-24 32 33)" />
      <circle cx="32" cy="33" r="3.2" fill="#ffffff" />
      <circle cx="32" cy="33" r="8" fill="none" stroke="#ffffff" strokeOpacity="0.7" strokeWidth="1.6" />
      <circle cx="32" cy="33" r="13" fill="none" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="1.4" />
      <path d="M32 20 v-4 M32 50 v-4 M20 33 h-4 M48 33 h4" stroke="#ffffff" strokeOpacity="0.8" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="51.5" cy="24.5" r="4.2" fill="url(#mcDot)" stroke="#ffffff" strokeWidth="1.2" />
      <rect x="2.5" y="2.5" width="59" height="59" rx="14.5" fill="none" stroke="#ffffff" strokeOpacity="0.18" />
    </svg>
  );
}

export default function App() {
  const theme = useGrokTheme();
  const [openBot, setOpenBot] = useState<string | null>(null);
  const [sec, setSec] = useState<string | null>(null);
  const [showPausedAll, setShowPausedAll] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<"usage" | "waiting">("usage");
  const [waitOpen, setWaitOpen] = useState<boolean>(false);
  const [heatMode, setHeatMode] = useState<"day" | "hour">("day");
  const [sheet, setSheet] = useState<string | null>(null);
  const [closing, setClosing] = useState<boolean>(false);
  const [drag, setDrag] = useState<number>(0);
  const sheetY = useRef<number | null>(null);
  const openSheet = (id: string) => { setClosing(false); setDrag(0); setSheet(id); };
  const closeSheet = () => {
    setClosing(true);
    window.setTimeout(() => { setSheet(null); setClosing(false); setDrag(0); }, 240);
  };
  const [pull, setPull] = useState<number>(0);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [nonce, setNonce] = useState<number>(0);
  const startY = useRef<number | null>(null);
  const PULL_AT = 70;
  const atTop = () => {
    const el = document.scrollingElement || document.documentElement;
    return (el ? el.scrollTop : 0) <= 0 && (window.scrollY || 0) <= 0;
  };
  const [toast, setToast] = useState<string | null>(null);
  const doRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setPull(PULL_AT);
    window.setTimeout(() => {
      setNonce(nonce + 1);
      setRefreshing(false);
      setPull(0);
      setToast("Showing latest saved numbers (updated " + SNAPSHOT + ")");
      window.setTimeout(() => setToast(null), 3000);
    }, 700);
  };
  const onTS = (y: number) => { startY.current = atTop() && !refreshing && !sheet ? y : null; };
  const onTM = (y: number) => {
    if (startY.current === null) return;
    const d = y - startY.current;
    if (d <= 0) { setPull(0); return; }
    setPull(Math.min(110, d * 0.5));
  };
  const onTE = () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= PULL_AT) doRefresh(); else setPull(0);
  };

  const bots = BOTS.slice().sort((a: Bot, b: Bot) =>
    sortBy === "waiting" ? b.open.length - a.open.length || (b.d7 || 0) - (a.d7 || 0) : (b.d7 === null ? -1 : b.d7) - (a.d7 === null ? -1 : a.d7) || (b.d30 || 0) - (a.d30 || 0)
  );
  const allRt: { b: Bot; r: Rt }[] = [];
  BOTS.forEach((b: Bot) => b.routines.forEach((r: Rt) => allRt.push({ b, r })));
  const top = BOTS.filter((b: Bot) => b.d7 !== null).sort((a: Bot, b: Bot) => (b.d7 || 0) - (a.d7 || 0))[0];
  const panel = { background: theme.bg.elevated, border: "1px solid " + theme.border.default, borderRadius: 20, padding: 14 };
  const pill = (on: boolean, color: string) => ({ fontSize: 13, fontWeight: 650, padding: "8px 14px", borderRadius: 9999, cursor: "pointer", border: "1px solid " + (on ? color : theme.border.default), background: on ? color : "transparent", color: on ? "#fff" : theme.text.secondary, minHeight: 36 });

  return (
    <div key={nonce} onTouchStart={(e) => onTS(e.touches[0].clientY)} onTouchMove={(e) => onTM(e.touches[0].clientY)} onTouchEnd={() => onTE()} style={{ fontFamily: theme.font.family, color: theme.text.primary, maxWidth: 1080, margin: "0 auto", padding: "18px 14px 40px", display: "flex", flexDirection: "column", gap: 26, overscrollBehaviorY: "contain" }}>
      <style>{"@keyframes mcspin{to{transform:rotate(360deg)}}@keyframes mcup{from{transform:translateY(100%)}to{transform:translateY(0)}}@keyframes mcfade{from{opacity:0}to{opacity:1}}"}</style>
      {pull > 0 || refreshing ? (
        <div style={{ height: pull, marginBottom: -26, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", transition: startY.current === null ? "height 0.2s" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 26, height: 26, borderRadius: 9999, background: "conic-gradient(#4f46e5,#818cf8,#c4b5fd,#4f46e5)", WebkitMask: "radial-gradient(circle, transparent 7px, #000 8px)", mask: "radial-gradient(circle, transparent 7px, #000 8px)", transform: "rotate(" + pull * 4 + "deg)", animation: refreshing ? "mcspin 0.8s linear infinite" : "none" }} />
            <span style={{ fontSize: 12.5, fontWeight: 650, color: theme.text.secondary }}>{refreshing ? "Refreshing…" : pull >= PULL_AT ? "Release to refresh" : "Pull to refresh"}</span>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div style={{ position: "fixed", left: "50%", bottom: 24, transform: "translateX(-50%)", zIndex: 50, maxWidth: "90%", background: "#312e81", color: "#fff", fontSize: 13, fontWeight: 600, padding: "10px 16px", borderRadius: 9999, boxShadow: "0 6px 18px rgba(0,0,0,0.25)", textAlign: "center" }}>{toast}</div>
      ) : null}
      <div style={{ alignSelf: "flex-start", fontSize: 11, fontWeight: 750, letterSpacing: "0.08em", textTransform: "uppercase", color: "#ccfbf1", background: "linear-gradient(90deg,#0f766e,#4f46e5)", padding: "4px 10px", borderRadius: 9999 }}>Example data</div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: -10 }}>
        <BrandIcon />
        <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.015em", color: theme.text.primary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.2 }}>AI Mission Control</div>
          <div style={{ fontSize: 12, color: theme.text.tertiary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Updated {SNAPSHOT}</div>
        </div>
        <div role="button" tabIndex={0} aria-label="Refresh" title="Refresh" onClick={() => doRefresh()} style={{ width: 40, height: 40, flex: "none", borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: ACCENT + "1f", border: "1px solid " + ACCENT + "55" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" style={{ animation: refreshing ? "mcspin 0.8s linear infinite" : "none" }}>
            <path d="M20 12a8 8 0 1 1-2.34-5.66" fill="none" stroke="#818cf8" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M20 4v5h-5" fill="none" stroke="#818cf8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", width: "100%" }}>
        <WeekBar used={WEEK.used} elapsed={weekElapsed()} />
      </div>

      <div>
        <SectionTitle text="This week" sub="Shares of Grok Bot usage, last 7 days" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
          <Tile label="Chat with you" value={MIX.chat + "%"} sub="Work you asked for" onClick={() => openSheet("chat")} />
          <Tile label="Routines" value={MIX.routines + "%"} sub={ACTIVE_RT + " active, " + PAUSED_RT + " paused"} onClick={() => openSheet("routines")} />
          <Tile label="Bot-to-bot" value={MIX.b2b + "%"} sub="Bots handing off work" onClick={() => openSheet("b2b")} />
          <Tile label="Top bot" value={top.d7 + "%"} sub={top.name} onClick={() => openSheet("top")} />
          <Tile label="Busiest day" value={BUSIEST.share + "%"} sub={BUSIEST.day + ", chat"} onClick={() => openSheet("busiest")} />
        </div>
      </div>

      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10, alignItems: "center" }}>
          <div role="button" tabIndex={0} onClick={() => setSortBy("usage")} style={pill(sortBy === "usage", ACCENT)}>By usage</div>
          <div role="button" tabIndex={0} onClick={() => setSortBy("waiting")} style={pill(sortBy === "waiting", ACCENT)}>By waiting items</div>
          <div style={{ flex: "1 1 auto" }} />
          <Legend3 />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bots.map((b: Bot) => {
            const on = openBot === b.key;
            return (
              <div key={b.key} style={{ borderRadius: 18, overflow: "hidden", background: theme.bg.elevated, border: "1px solid " + (on ? b.color : theme.border.default), boxShadow: on ? "0 8px 24px " + b.color + "33" : "none" }}>
                <div role="button" tabIndex={0} onClick={() => setOpenBot(on ? null : b.key)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", minHeight: 70, cursor: "pointer", background: "linear-gradient(90deg," + b.color + (on ? "2e" : "18") + ",transparent 70%)", borderLeft: "5px solid " + (RING[b.key] || b.color) }}>
                  <Face b={b} size={46} />
                  <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 16.5, fontWeight: 750, color: theme.text.primary }}>{b.name}</span>
                      {b.open.length > 0 ? <Chip color={waitTone(b.open.length)} text={b.open.length + " waiting"} /> : null}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.35, color: theme.text.secondary }}>{b.last}</div>
                    {b.mix && b.d7 !== null ? <MixBar mix={b.mix} width={(b.d7 / 40) * 100 + "%"} /> : null}
                  </div>
                  <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 21, fontWeight: 800, color: b.d7 === null ? theme.text.tertiary : heat(b.d7) || theme.text.primary }}>{b.d7 !== null ? b.d7 + "%" : "—"}</div>
                      <div style={{ fontSize: 11, color: theme.text.tertiary }}>7 days</div>
                    </div>
                    <span style={{ fontSize: 22, color: theme.text.tertiary, transform: on ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
                  </div>
                </div>
                {on ? <BotBody b={b} /> : null}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ borderRadius: 20, padding: 3, background: "linear-gradient(135deg,#4f46e5,#a78bfa 60%,#fb7185)", boxShadow: "0 8px 24px #4f46e526" }}>
        <div style={{ borderRadius: 17, background: theme.bg.elevated, overflow: "hidden" }}>
          <div role="button" tabIndex={0} onClick={() => setWaitOpen(!waitOpen)} style={{ padding: "14px 16px", background: "linear-gradient(120deg,#4f46e5,#6366f1)", color: "#fff", display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
            <div style={{ fontSize: 30, fontWeight: 850, lineHeight: 1 }}>{OPEN_TOTAL}</div>
            <div style={{ flex: "1 1 0", minWidth: 0 }}>
              <div style={{ fontSize: 17, fontWeight: 750 }}>Waiting on you</div>
              <div style={{ fontSize: 12.5, opacity: 0.92 }}>{"Across " + OPEN_BOTS + " bots · " + (waitOpen ? "tap one for details" : "tap to open")}</div>
            </div>
            <span style={{ fontSize: 22, transform: waitOpen ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
          </div>
          {waitOpen ? (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {BOTS.filter((b: Bot) => b.open.length > 0).map((b: Bot) => b.open.map((o: Open, i: number) => <WaitItem key={b.key + i} o={o} color={b.color} lead={b.name} />))}
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <SectionTitle text="Activity by bot" />
        <div style={{ ...panel, padding: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
            <div role="button" tabIndex={0} onClick={() => setHeatMode("hour")} style={{ ...pill(heatMode === "hour", ACCENT), opacity: ACTIVITY.hours ? 1 : 0.55 }}>By hour</div>
            <div role="button" tabIndex={0} onClick={() => setHeatMode("day")} style={pill(heatMode === "day", ACCENT)}>By day</div>
          </div>
          {heatMode === "hour" && !ACTIVITY.hours ? (
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: theme.text.secondary, padding: "18px 4px" }}>By hour needs hourly activity per bot, which the usage report doesn't give yet. Showing it only when real hourly data is added.</div>
          ) : (() => {
            const src = heatMode === "hour" && ACTIVITY.hours ? ACTIVITY.hours : ACTIVITY.days;
            const keys = BOTS.map((b: Bot) => b.key).filter((k: string) => src[k]);
            const n = keys.length ? src[keys[0]].length : 0;
            const max = Math.max(1, ...keys.map((k: string) => Math.max(...src[k])));
            const cols = heatMode === "hour" ? Array.from({ length: n }, (_, i: number) => (i % 3 === 0 ? String(i).padStart(2, "0") : "")) : DAYS.map((d: string) => d.split(" ")[1]);
            return (
              <div style={{ overflowX: "auto" }}>
                <div style={{ display: "grid", gridTemplateColumns: "92px repeat(" + n + ", minmax(22px, 1fr))", gap: 4, alignItems: "center", minWidth: 92 + n * 26 }}>
                  {keys.map((k: string) => {
                    const b = BOTS.find((x: Bot) => x.key === k) as Bot;
                    return [
                      <div key={k + "n"} style={{ fontSize: 12.5, fontWeight: 600, color: theme.text.secondary, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</div>,
                      ...src[k].map((v: number, i: number) => (
                        <div key={k + i} title={b.name + " · " + (heatMode === "day" ? DAYS[i] : i + ":00") + " · " + (v === 0 ? "0" : v < 1 ? "<1%" : v + "%")} style={{ height: 22, borderRadius: 5, background: v === 0 ? theme.border.subtle : ACCENT, opacity: v === 0 ? 1 : 0.18 + 0.82 * Math.sqrt(v / max) }} />
                      )),
                    ];
                  })}
                  <div />
                  {cols.map((c: string, i: number) => <div key={"c" + i} style={{ fontSize: 10.5, color: theme.text.tertiary, textAlign: "center" }}>{c}</div>)}
                </div>
              </div>
            );
          })()}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <div style={{ fontSize: 12.5, color: theme.text.tertiary }}>Share of Grok Bot usage by bot and day, last 7 days (UTC days).</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, color: theme.text.tertiary }}>
              Fewer
              {[0.2, 0.4, 0.6, 0.8, 1].map((o: number) => <span key={o} style={{ width: 12, height: 12, borderRadius: 3, background: ACCENT, opacity: o }} />)}
              More
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <SectionTitle text="More" />
        <Acc id="routines" open={sec} setOpen={setSec} title="Routines" sub={ACTIVE_RT + " active · paused hidden"} from="#4f46e5" to="#6366f1">
          <div style={{ display: "flex", flexDirection: "column" }}>
            {allRt.filter((x) => x.r.active).map((x, i: number) => <RtRow key={i} r={x.r} color={x.b.color} lead={x.b.name} />)}
            <div role="button" tabIndex={0} onClick={() => setShowPausedAll(!showPausedAll)} style={{ fontSize: 13.5, fontWeight: 650, color: ACCENT, cursor: "pointer", padding: "12px 2px" }}>
              {showPausedAll ? "Hide paused routines" : "Show " + PAUSED_RT + " paused routines"}
            </div>
            {showPausedAll ? allRt.filter((x) => !x.r.active).map((x, i: number) => <RtRow key={"p" + i} r={x.r} color={x.b.color} lead={x.b.name} />) : null}
          </div>
        </Acc>
        <Acc id="trends" open={sec} setOpen={setSec} title="Usage trends" sub="Daily shares, last 7 and 30 days" from="#4338ca" to="#6366f1">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
            <div style={panel}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Last 7 days, by type</div>
              <Legend3 />
              <Trend7 />
            </div>
            <div style={panel}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Last 30 days</div>
              <Trend30 />
            </div>
          </div>
          <div style={{ fontSize: 13, color: theme.text.secondary, marginTop: 10 }}>Spikes come from longer chat sessions. Routines stay fairly steady day to day. Days are UTC.</div>
          <div style={{ ...panel, marginTop: 14, borderTop: "3px solid " + TEAL }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Limit and extra credits</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13.5, color: theme.text.secondary, marginBottom: 8 }}>
              <span><b style={{ color: theme.text.primary }}>${WEEK.extraCredits || 0}</b> extra credits</span>
              <span><b style={{ color: theme.text.primary }}>{WEEK.used}%</b> of the weekly limit used</span>
              <span><b style={{ color: projColors(projected(WEEK.used, weekElapsed()))[0] }}>~{projected(WEEK.used, weekElapsed())}%</b> projected by reset</span>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: theme.text.primary }}>No extra credits are set, so if the weekly limit runs out, bots and routines pause until it resets. Nothing is charged. Next reset: {WEEK.resets}.</div>
          </div>
        </Acc>
        <Acc id="gaps" open={sec} setOpen={setSec} title="What this page can't see" sub="Limits of the data" from="#64748b" to="#475569">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {GAPS.map((g: string, i: number) => (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 13.5, lineHeight: 1.45, color: theme.text.secondary }}>
                <span style={{ width: 6, height: 6, marginTop: 7, borderRadius: 9999, background: "#64748b", flex: "none" }} />
                {g}
              </div>
            ))}
          </div>
        </Acc>
      </div>

      {sheet ? (
        <div style={{ position: "fixed", inset: 0, zIndex: 60 }}>
          <div onClick={() => closeSheet()} style={{ position: "absolute", inset: 0, background: "rgba(15,12,40,0.55)", opacity: closing ? 0 : 1, transition: "opacity 0.24s", animation: "mcfade 0.24s ease" }} />
          <div
            role="dialog"
            aria-label={SHEETS[sheet].title}
            style={{ position: "absolute", left: 0, right: 0, bottom: 0, margin: "0 auto", maxWidth: 640, maxHeight: "78vh", display: "flex", flexDirection: "column", background: theme.bg.elevated, color: theme.text.primary, borderRadius: "22px 22px 0 0", borderTop: "3px solid " + SHEETS[sheet].accent, boxShadow: "0 -12px 40px rgba(0,0,0,0.35)", transform: closing ? "translateY(100%)" : "translateY(" + drag + "px)", transition: sheetY.current === null ? "transform 0.24s cubic-bezier(.2,.8,.2,1)" : "none", animation: "mcup 0.3s cubic-bezier(.2,.8,.2,1)" }}
          >
            <div
              onTouchStart={(e) => { e.stopPropagation(); sheetY.current = e.touches[0].clientY; }}
              onTouchMove={(e) => { e.stopPropagation(); if (sheetY.current !== null) setDrag(Math.max(0, e.touches[0].clientY - sheetY.current)); }}
              onTouchEnd={(e) => { e.stopPropagation(); sheetY.current = null; if (drag > 90) closeSheet(); else setDrag(0); }}
              style={{ padding: "8px 16px 6px", flex: "none", touchAction: "none" }}
            >
              <div style={{ width: 40, height: 5, borderRadius: 9999, background: theme.border.strong, margin: "0 auto 10px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: 9999, background: SHEETS[sheet].accent, flex: "none" }} />
                <div style={{ flex: "1 1 0", fontSize: 18, fontWeight: 800, color: theme.text.primary }}>{SHEETS[sheet].title}</div>
                <div role="button" tabIndex={0} aria-label="Close" onClick={() => closeSheet()} style={{ width: 34, height: 34, borderRadius: 9999, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: theme.border.subtle, color: theme.text.secondary, fontSize: 18, fontWeight: 700 }}>✕</div>
              </div>
            </div>
            <div onTouchStart={(e) => e.stopPropagation()} style={{ overflowY: "auto", padding: "0 16px 28px", WebkitOverflowScrolling: "touch" }}>
              <SheetBody id={sheet} top={top} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
