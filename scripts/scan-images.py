#!/usr/bin/env python3
"""Scan image files for denylist patterns.

Compressed PNG/JPEG bytes often contain short ASCII coincidences, so this
scanner looks at decompressed pixels and textual metadata instead of the
raw file stream. Short regex literals (under 4 letters) are skipped.
"""
import re
import sys
import zlib
from pathlib import Path
from typing import List

from PIL import Image


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


def printable_blob(data: bytes) -> str:
    text = re.findall(rb"[\x20-\x7e]{4,}", data)
    return "\n".join(t.decode("ascii", "ignore") for t in text)


def png_chunks(data: bytes):
    if not data.startswith(b"\x89PNG\r\n\x1a\n"):
        return
    pos = 8
    while pos + 8 <= len(data):
        n = int.from_bytes(data[pos:pos + 4], "big")
        typ = data[pos + 4:pos + 8]
        start = pos + 8
        end = start + n
        if end + 4 > len(data):
            break
        yield typ, data[start:end]
        pos = end + 4  # skip CRC


def image_blob(path: Path) -> str:
    """Readable text from metadata and decompressed pixels, not compressed streams."""
    parts: List[str] = []
    raw = path.read_bytes()

    if path.suffix.lower() == ".png":
        idat = []
        for typ, chunk in png_chunks(raw):
            if typ == b"IDAT":
                idat.append(chunk)
            elif typ in (b"tEXt", b"iTXt", b"zTXt"):
                parts.append(printable_blob(chunk))
                if typ == b"zTXt":
                    nul = chunk.find(b"\x00")
                    if nul >= 0 and len(chunk) > nul + 2:
                        try:
                            parts.append(printable_blob(zlib.decompress(chunk[nul + 2:])))
                        except zlib.error:
                            pass
        if idat:
            try:
                parts.append(printable_blob(zlib.decompress(b"".join(idat))))
            except zlib.error:
                pass

    try:
        im = Image.open(path)
        # Any leftover info keys plus raw pixel bytes
        for k, v in (im.info or {}).items():
            parts.append(str(k))
            if isinstance(v, (bytes, bytearray)):
                parts.append(printable_blob(bytes(v)))
            else:
                parts.append(str(v))
        parts.append(printable_blob(im.convert("RGBA").tobytes()))
    except Exception:
        # Fallback: raw file, last resort only if we couldn't open the image
        if not parts:
            parts.append(printable_blob(raw))

    return "\n".join(p for p in parts if p)


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
        blob = image_blob(img)
        for pat, rx in compiled:
            if rx.search(blob):
                print("HIT  pattern=%s  source=image-strings  file=%s" % (pat, img.relative_to(root)))
                hits += 1
    return 1 if hits else 0


if __name__ == "__main__":
    sys.exit(main())
