#!/usr/bin/env python3
"""Scan image files for denylist patterns. Short regex literals are skipped
because compressed PNG bytes often contain 3-letter ASCII coincidences."""
import re
import sys
from pathlib import Path


def load_pats(path: Path):
    pats = []
    for ln in path.read_text().splitlines():
        ln = ln.split("#", 1)[0].strip()
        if ln:
            pats.append(ln)
    return pats


def literal_text(pat: str) -> str:
    # Drop common regex syntax so word-boundary syntax is stripped before measuring length.
    s = re.sub(r"\\[bBdDsSwWAnZ]", "", pat)
    s = re.sub(r"\\.", "", s)
    out = []
    for ch in s:
        out.append(ch if (ch.isalnum() or ch in "-_@.") else " ")
    return "".join(out)


def main():
    if len(sys.argv) != 3:
        print("usage: scan-images.py <patterns-file> <repo-root>", file=sys.stderr)
        return 2
    pats = load_pats(Path(sys.argv[1]))
    root = Path(sys.argv[2])
    compiled = []
    for pat in pats:
        if not re.search(r"[A-Za-z]{4,}", literal_text(pat)):
            continue
        try:
            compiled.append((pat, re.compile(pat, re.I)))
        except re.error:
            compiled.append((pat, re.compile(re.escape(pat), re.I)))
    exts = {".png", ".jpg", ".jpeg", ".gif", ".webp"}
    hits = 0
    for img in root.rglob("*"):
        if img.suffix.lower() not in exts or ".git" in img.parts:
            continue
        data = img.read_bytes()
        text = re.findall(rb"[\x20-\x7e]{4,}", data)
        blob = "\n".join(t.decode("ascii", "ignore") for t in text)
        for pat, rx in compiled:
            if rx.search(blob):
                print("HIT  pattern=%s  source=image-strings  file=%s" % (pat, img.relative_to(root)))
                hits += 1
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main())
