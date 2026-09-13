#!/usr/bin/env python3
"""Helpers de manifest para a CLI do midnight coffee.

Chamado por bin/coffee. O manifest mantém uma linha por grupo, com arrays
compactos — assim o diff fica mínimo e o arquivo continua legível:

    {
      "readings": [],
      "science": ["education/teaching-zotero.md"]
    }
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MANIFEST = os.path.join(ROOT, "posts", "manifest.json")


def read_manifest():
    try:
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return {}
    except json.JSONDecodeError as e:
        print(f"coffee: posts/manifest.json não é um JSON válido ({e})", file=sys.stderr)
        sys.exit(2)          # 2 = manifest quebrado (1 = item ausente)


def write_manifest(data):
    with open(MANIFEST, "w", encoding="utf-8") as f:
        f.write("{\n")
        groups = list(data.items())
        for i, (group, items) in enumerate(groups):
            arr = "[" + ", ".join(json.dumps(x, ensure_ascii=False) for x in items) + "]"
            comma = "," if i < len(groups) - 1 else ""
            f.write(f"  {json.dumps(group, ensure_ascii=False)}: {arr}{comma}\n")
        f.write("}\n")


def cmd_add(group, item):
    data = read_manifest()
    data.setdefault(group, [])
    if item not in data[group]:
        data[group].append(item)
        write_manifest(data)


def cmd_remove(rel):
    group, _, item = rel.partition("/")
    data = read_manifest()
    if group in data and item in data[group]:
        data[group].remove(item)
    if group in data and not data[group]:
        del data[group]          # grupo vazio não precisa existir
    write_manifest(data)


def cmd_has(rel):
    group, _, item = rel.partition("/")
    return 0 if item in read_manifest().get(group, []) else 1


def main():
    if len(sys.argv) < 2:
        print("uso: manifest_tool.py add|remove|has ...", file=sys.stderr)
        return 2
    action = sys.argv[1]
    args = sys.argv[2:]
    if action == "add":
        cmd_add(args[0], args[1])
        return 0
    if action == "remove":
        cmd_remove(args[0])
        return 0
    if action == "has":
        return cmd_has(args[0])
    print(f"ação desconhecida: {action}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
