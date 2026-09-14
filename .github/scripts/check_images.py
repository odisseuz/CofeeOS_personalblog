#!/usr/bin/env python3
"""Check images/ for metadata that leaks more than it should.

Photos straight from a camera/phone carry EXIF: GPS coordinates, device
model, serial numbers, capture timestamps. Exporting for the web usually
strips it, but it's easy to forget — so this flags it before deploy.

Only stdlib: reads the JPEG APP1/EXIF block directly. Other formats are
skipped (they're rare here and don't carry the same leak by default).

Grows into a warning, not a hard failure: shipping a GPS tag is a mistake,
but it isn't a broken site. CI treats it as failure though — see check_cli.
"""
import os
import struct
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMAGES = os.path.join(ROOT, "images")

# Tags whose presence is worth reporting. GPS is the real concern.
TAGS = {
    0x010F: "camera make",
    0x0110: "camera model",
    0x0112: "orientation",
    0x0132: "file date",
    0x9003: "capture date",
    0x9004: "digitized date",
    0x8825: "GPS location",
    0xA430: "owner name",
    0xA431: "serial number",
}

# EXIF payloads larger than this aren't worth walking; bail instead of guessing.
MAX_BLOCK = 512 * 1024


def find_exif(data):
    """Return the TIFF block of the first APP1/EXIF segment, or None."""
    if data[:2] != b"\xff\xd8":          # not a JPEG
        return None
    i = 2
    while i + 4 <= len(data):
        if data[i] != 0xFF:
            break
        marker = data[i + 1]
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        seglen = struct.unpack(">H", data[i + 2:i + 4])[0]
        if marker == 0xE1 and data[i + 4:i + 10] == b"Exif\x00\x00":
            start = i + 10
            return data[start:start + min(seglen - 8, MAX_BLOCK)]
        i += 2 + seglen
    return None


def read_ifd(data, offset, endian, tags):
    """Walk one IFD, collecting tag numbers. Returns (values, next_ifd)."""
    if offset + 2 > len(data):
        return {}, 0
    (count,) = struct.unpack(endian + "H", data[offset:offset + 2])
    pos = offset + 2
    found = {}
    for _ in range(count):
        if pos + 12 > len(data):
            break
        tag, _typ, _n = struct.unpack(endian + "HHI", data[pos:pos + 8])
        if tag in tags:
            found[tag] = True
        pos += 12
    (nxt,) = struct.unpack(endian + "I", data[pos:pos + 4]) if pos + 4 <= len(data) else (0,)
    return found, nxt


def exif_tags(data):
    """Return the set of interesting tag ids present in the EXIF block."""
    tiff = find_exif(data)
    if not tiff or len(tiff) < 8:
        return set()
    if tiff[:2] == b"II":
        endian = "<"
    elif tiff[:2] == b"MM":
        endian = ">"
    else:
        return set()

    (ifd0,) = struct.unpack(endian + "I", tiff[4:8])
    found, _ = read_ifd(tiff, ifd0, endian, TAGS)
    tags = set(found)

    # the GPS sub-IFD hangs off tag 0x8825 in IFD0; walk it if present
    if 0x8825 in tags:
        tags.add(0x8825)
    return tags


def descriptions(tags):
    return sorted(TAGS[t] for t in tags if t in TAGS)


def main():
    if not os.path.isdir(IMAGES):
        print("image check OK (no images/)")
        return 0

    warnings = 0
    checked = 0
    for dirpath, _dirs, files in os.walk(IMAGES):
        for fn in sorted(files):
            if fn.startswith("."):
                continue
            path = os.path.join(dirpath, fn)
            rel = os.path.relpath(path, ROOT).replace(os.sep, "/")
            try:
                with open(path, "rb") as f:
                    data = f.read()
            except OSError as e:
                print(f"  - {rel}: unreadable ({e})")
                warnings += 1
                continue
            checked += 1
            desc = descriptions(exif_tags(data))
            if desc:
                print(f"  - {rel}: EXIF present ({', '.join(desc)}) — strip before publishing")
                warnings += 1

    if warnings:
        print(f"\nimage check: {warnings} file(s) with metadata ({checked} checked)")
        return 1
    print(f"image check OK ({checked} image(s), no leaking metadata)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
