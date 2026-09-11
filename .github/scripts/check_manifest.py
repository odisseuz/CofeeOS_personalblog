#!/usr/bin/env python3
"""Validate posts/ against posts/manifest.json.

Catches, before deploy:
1. A post exists on disk but is missing from the manifest (orphan).
2. A manifest entry points to a file that doesn't exist.
3. Malformed frontmatter (missing/indented keys, empty title, bad date).
"""
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
POSTS = os.path.join(ROOT, "posts")
MANIFEST = os.path.join(POSTS, "manifest.json")

# Root-level files that aren't part of any group.
SPECIAL = {"about.md", "example.md"}

# .md files that aren't posts (no frontmatter) — skipped entirely.
IGNORE = {"LICENSE.md"}

DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
KEY_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$")


def frontmatter_errors(rel, abs_path):
    errors = []
    with open(abs_path, encoding="utf-8") as f:
        lines = f.read().splitlines()

    if not lines or lines[0].strip() != "---":
        return [f"{rel}: missing frontmatter (file must start with '---')"]

    close_idx = None
    for idx in range(1, len(lines)):
        if lines[idx].strip() == "---":
            close_idx = idx
            break
    if close_idx is None:
        return [f"{rel}: unclosed frontmatter (missing closing '---')"]

    data = {}
    for idx in range(1, close_idx):
        line = lines[idx]
        if not line.strip():
            continue  # blank line inside frontmatter is fine
        m = KEY_RE.match(line)
        if not m:
            errors.append(
                f"{rel}: line {idx + 1}: invalid frontmatter "
                f"(expected 'key: value' with no leading spaces): {line!r}"
            )
            continue
        data[m.group(1)] = m.group(2).strip()

    if "title" not in data:
        errors.append(f"{rel}: missing 'title' in frontmatter")
    elif not data["title"]:
        errors.append(f"{rel}: 'title' is empty")

    if "date" in data:
        d = data["date"]
        if not DATE_RE.fullmatch(d):
            errors.append(f"{rel}: 'date' must be YYYY-MM-DD (got {d!r})")
        else:
            try:
                date.fromisoformat(d)
            except ValueError:
                errors.append(f"{rel}: 'date' is not a real date: {d!r}")

    return errors


def main():
    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)

    declared = set()
    for group, names in manifest.items():
        for name in names:
            declared.add(os.path.join(group, name).replace(os.sep, "/"))

    files = {}  # rel path -> absolute path
    for dirpath, _dirnames, filenames in os.walk(POSTS):
        for fn in filenames:
            if not fn.endswith(".md"):
                continue
            abs_path = os.path.join(dirpath, fn)
            rel = os.path.relpath(abs_path, POSTS).replace(os.sep, "/")
            if rel in IGNORE:
                continue
            files[rel] = abs_path

    checkable = {p for p in files if p not in SPECIAL}
    errors = []

    for path in sorted(checkable - declared):
        errors.append(f"orphan post (on disk but not in manifest): {path}")
    for path in sorted(declared - checkable):
        errors.append(f"missing post (in manifest but no file): {path}")

    for rel in sorted(files):
        errors.extend(frontmatter_errors(rel, files[rel]))

    if errors:
        print("manifest check FAILED")
        for e in errors:
            print("  - " + e)
        print(f"\n{len(errors)} issue(s). Fix and push again.")
        return 1

    print(f"manifest check OK ({len(checkable)} posts)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
