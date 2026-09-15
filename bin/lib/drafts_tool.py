#!/usr/bin/env python3
"""Drafts: lê o frontmatter, mantém o .gitignore em dia e alimenta o commit.

Um post é draft quando o frontmatter tem `draft: true`. O estado vive no
próprio .md (fonte única); o .gitignore é *derivado* dele — por isso o bloco
gerado aqui é reescrito a cada chamada, e editar à mão não adianta (a próxima
sobrescreve). Mesmo princípio do posts/index.json gerado pelo build.js.

Comandos:
  list                       lista os drafts (caminho + se o git os vê)
  sync                       reescreve o bloco de drafts no .gitignore
  staged                     lista drafts que o git está rastreando (pra CI)
  publish <arquivo>          tira o draft: do frontmatter
"""
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
POSTS = os.path.join(ROOT, "posts")
GITIGNORE = os.path.join(ROOT, ".gitignore")

INICIO = "# --- drafts (gerado por `coffee commit`; não edite à mão) ---"
FIM = "# --- fim dos drafts ---"

# `draft: true` / `draft: yes` / `draft: 1` no topo do arquivo
DRAFT_RE = re.compile(r"^draft:\s*(true|yes|1)\s*$", re.IGNORECASE | re.MULTILINE)


def is_draft(abs_path):
    try:
        with open(abs_path, encoding="utf-8") as f:
            head = f.read(4096)
    except OSError:
        return False
    # só o frontmatter conta: corta no segundo ---
    partes = head.split("---")
    fm = partes[1] if len(partes) >= 3 else ""
    return bool(DRAFT_RE.search(fm))


def drafts():
    """Caminhos dos drafts, relativos à raiz do repo (ex.: posts/art/x.md)."""
    out = []
    for dirpath, _dn, filenames in os.walk(POSTS):
        for fn in filenames:
            if not fn.endswith(".md"):
                continue
            p = os.path.join(dirpath, fn)
            if is_draft(p):
                out.append(os.path.relpath(p, ROOT).replace(os.sep, "/"))
    return sorted(out)


def git(*args, **kw):
    return subprocess.run(
        ["git"] + list(args), cwd=ROOT,
        capture_output=True, text=True, check=False, **kw
    )


def tracked(paths):
    """Os que o git está rastreando (entrariam no commit)."""
    if not paths:
        return []
    r = git("ls-files", "--", *paths)
    if r.returncode != 0:
        return []
    no_git = set(r.stdout.split())
    return [p for p in paths if p in no_git]


def ler_gitignore():
    try:
        with open(GITIGNORE, encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""


def escrever_gitignore(txt):
    with open(GITIGNORE, "w", encoding="utf-8") as f:
        f.write(txt)


def sem_bloco(txt):
    """Remove o bloco gerado, se existir. Idempotente."""
    linhas = txt.splitlines()
    out, dentro = [], False
    for ln in linhas:
        if ln.strip() == INICIO:
            dentro = True
            continue
        if ln.strip() == FIM:
            dentro = False
            continue
        if not dentro:
            out.append(ln)
    # tira linhas em branco que sobraram no fim e repõe exatamente uma
    while out and not out[-1].strip():
        out.pop()
    return "\n".join(out) + "\n"


def cmd_sync():
    txt = sem_bloco(ler_gitignore())
    ds = drafts()
    if ds:
        bloco = "\n".join([INICIO] + ds + [FIM])
        txt = txt + "\n" + bloco + "\n"
    escrever_gitignore(txt)
    return 0


def cmd_list():
    ds = drafts()
    if not ds:
        print("nenhum draft")
        return 0
    tr = set(tracked(ds))
    for d in ds:
        marca = "RASTREADO (vai pro git!)" if d in tr else "fora do git"
        print(f"  {d}  ({marca})")
    return 0


def cmd_staged():
    """Drafts rastreados — a rede de segurança do CI/verify."""
    tr = tracked(drafts())
    for p in tr:
        print(p)
    return 1 if tr else 0


def cmd_publish(rel):
    rel = rel.lstrip("/")
    if not rel.startswith("posts/"):
        rel = "posts/" + rel
    abs_path = os.path.join(ROOT, rel)
    if not os.path.isfile(abs_path):
        print(f"coffee: não encontrei {rel}", file=sys.stderr)
        return 1
    with open(abs_path, encoding="utf-8") as f:
        txt = f.read()
    novo = re.sub(r"^draft:\s*(true|yes|1)\s*\n?", "", txt, flags=re.IGNORECASE | re.MULTILINE)
    if novo == txt:
        print(f"coffee: {rel} não está marcado como draft")
        return 1
    with open(abs_path, "w", encoding="utf-8") as f:
        f.write(novo)
    print(f"publicado: {rel}")
    return 0


def main():
    if len(sys.argv) < 2:
        print("uso: drafts_tool.py list|sync|staged|publish <arquivo>", file=sys.stderr)
        return 2
    acao = sys.argv[1]
    if acao == "list":
        return cmd_list()
    if acao == "sync":
        return cmd_sync()
    if acao == "staged":
        return cmd_staged()
    if acao == "publish":
        if len(sys.argv) < 3:
            print("uso: drafts_tool.py publish <arquivo>", file=sys.stderr)
            return 2
        return cmd_publish(sys.argv[2])
    print(f"ação desconhecida: {acao}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
