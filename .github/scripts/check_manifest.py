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
import subprocess
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
POSTS = os.path.join(ROOT, "posts")
MANIFEST = os.path.join(POSTS, "manifest.json")

# Root-level files that aren't part of any group. O about existe por idioma
# (about.md, about.pt.md) — por isso o padrão em vez de um nome fixo.
SPECIAL = {"about.md"}
ABOUT_RE = re.compile(r"^about(\.[a-z]{2})?\.md$")

# .md files that aren't posts (no frontmatter is not required) — skipped entirely.
IGNORE = {"LICENSE.md", "LICENSE-MIT.md"}

DATE_RE = re.compile(r"\d{4}-\d{2}-\d{2}")
KEY_RE = re.compile(r"^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$")


def desquote(v):
    """Tira as aspas de um valor de frontmatter.

    Um título com `:` (ex.: `title: "Ch 1: Cause and Effect"`) precisa das
    aspas no YAML, senão o `:` seria lido como separador. As aspas são
    sintaxe, não conteúdo.
    """
    if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
        return v[1:-1]
    return v


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
        data[m.group(1)] = desquote(m.group(2).strip())

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

    if "order" in data:
        o = data["order"]
        if not o.isdigit():
            errors.append(f"{rel}: 'order' must be a positive integer (got {o!r})")

    if "series" in data and not data["series"]:
        errors.append(f"{rel}: 'series' is empty (remove the key or name the series)")

    return errors


def gitignored():
    """Caminhos (relativos à raiz do repo) que o git está ignorando.

    Rascunhos de post ficam no disco mas fora do git de propósito (ver README,
    seção *Drafts*). Eles não são "posts órfãos" — são posts que ainda não
    subiram. Sem isto, o draft em escrita quebraria o `verify` todo dia.
    """
    try:
        saida = subprocess.run(
            ["git", "check-ignore", "--stdin"],
            input="\n".join(
                os.path.join("posts", os.path.relpath(os.path.join(dp, f), POSTS))
                .replace(os.sep, "/")
                for dp, _dn, fns in os.walk(POSTS)
                for f in fns
            ),
            capture_output=True, text=True, cwd=ROOT, check=False,
        )
        return set(saida.stdout.split())
    except (OSError, subprocess.SubprocessError):
        return set()          # sem git (ex.: tarball): não ignora nada


def is_draft(rel, abs_path):
    """Post com `draft: true` no frontmatter não está publicado.

    O estado vive no próprio .md (fonte única); o .gitignore é derivado dele
    por `coffee commit`. Um draft nunca é órfão: ele está fora do site de
    propósito, até alguém tirar a linha e rodar `coffee publish`.
    """
    try:
        with open(abs_path, encoding="utf-8") as f:
            head = f.read(4096)
    except OSError:
        return False
    partes = head.split("---")
    fm = partes[1] if len(partes) >= 3 else ""
    return bool(re.search(r"^draft:\s*(true|yes|1)\s*$", fm, re.IGNORECASE | re.MULTILINE))


def main():
    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)

    declared = set()
    for group, names in manifest.items():
        for name in names:
            declared.add(os.path.join(group, name).replace(os.sep, "/"))

    files = {}  # rel path -> absolute path
    ignorados = gitignored()
    for dirpath, _dirnames, filenames in os.walk(POSTS):
        for fn in filenames:
            if not fn.endswith(".md"):
                continue
            abs_path = os.path.join(dirpath, fn)
            rel = os.path.relpath(abs_path, POSTS).replace(os.sep, "/")
            if rel in IGNORE:
                continue
            # rascunho no .gitignore (ver README) nao e post orfao: esta no disco
            # de proposito, pra escrita, e sobe quando estiver pronto.
            if os.path.join("posts", rel) in ignorados:
                continue
            if is_draft(rel, abs_path):
                continue
            files[rel] = abs_path

    checkable = {p for p in files if p not in SPECIAL and not ABOUT_RE.match(p)}
    errors = []

    # Um post declarado no manifest mas ignorado pelo git (draft ainda no
    # disco, ver README secao Drafts) nao e "faltando": o arquivo existe,
    # so nao esta rastreado ainda. So conta como missing se o arquivo nem
    # existir de verdade no disco.
    declared_paths = {
        os.path.join("posts", p).replace(os.sep, "/"): p for p in declared
    }
    missing_de_verdade = set()
    for full, rel in declared_paths.items():
        if rel in checkable:
            continue
        if full in ignorados and os.path.isfile(os.path.join(POSTS, rel)):
            continue  # draft: existe no disco, so esta fora do git
        missing_de_verdade.add(rel)

    for path in sorted(checkable - declared):
        errors.append(f"orphan post (on disk but not in manifest): {path}")
    for path in sorted(missing_de_verdade):
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
