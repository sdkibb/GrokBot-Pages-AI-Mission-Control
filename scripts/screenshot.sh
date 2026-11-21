#!/usr/bin/env bash
# Render docs screenshots of index.html (desktop, mobile, expanded bot, tile popup, heatmap, trends).
# Requires Google Chrome or Chromium, and Node with puppeteer-core
# (install puppeteer-core yourself; it is not a repo dependency).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/docs"
mkdir -p "$OUT"
CHROME="${CHROME:-$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)}"
if [[ -z "$CHROME" ]]; then
  echo "Chrome/Chromium not found. Set CHROME to the binary."
  exit 1
fi
# Serve the folder so file:// quirks don't bite, then shoot.
python3 -m http.server 8765 --directory "$ROOT" >/tmp/amc-http.log 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
sleep 0.4
node "$ROOT/scripts/take-screenshots.js" "http://127.0.0.1:8765/index.html" "$OUT" "$CHROME"
# Strip EXIF / metadata
python3 - << PY
from pathlib import Path
from PIL import Image
out = Path("$OUT")
for p in sorted(out.glob("*.png")):
    im = Image.open(p)
    # re-save without metadata, optimize
    data = list(im.getdata())
    clean = Image.new(im.mode, im.size)
    clean.putdata(data)
    clean.save(p, "PNG", optimize=True)
    print("stripped", p.name, clean.size)
PY
echo "Screenshots written to $OUT"
