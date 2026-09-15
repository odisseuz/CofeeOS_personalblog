#!/usr/bin/env python3
"""Commit: o caminho normal pra subir mudanças.

A ferramenta é dona do estado dos drafts:
  1. lê `draft: true` do frontmatter e sincroniza o .gitignore (via drafts_tool)
  2. registra no manifest os posts publicados que ainda não estavam lá
  3. monta a mensagem a partir do post que está entrando
  4. faz add + commit (o push fica com a CLI, que é quem pergunta)

Sai com 10 se não há nada pra commitar (a CLI trata como "nada a fazer").
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import drafts_tool as dt

ROOT = dt.ROOT
POSTS = dt.POSTS


def git(*args):
    return subprocess.run(["git"] + list(args), cwd=ROOT,
                          capture_output=True, text=True, check=False)


def is_draft(abs_path):
    return dt.is_draft(abs_path)


def titulo_de(abs_path):
    try:
        with open(abs_path, encoding="utf-8") as f:
            txt = f.read(2048)
    except OSError:
        return None
    partes = txt.split("---")
    fm = partes[1] if len(partes) >= 3 else ""
    for ln in fm.splitlines():
        k, _, v = ln.partition(":")
        if k.strip() == "title":
            v = v.strip()
            if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
                v = v[1:-1]
            return v
    return None


def registra_novos():
    """Publicados que ainda não estão no manifest. Devolve o que adicionou."""
    with open(os.path.join(POSTS, "manifest.json"), encoding="utf-8") as f:
        data = json.load(f)

    novos = []
    for dirpath, _dn, fns in os.walk(POSTS):
        for fn in fns:
            if not fn.endswith(".md"):
                continue
            abs_p = os.path.join(dirpath, fn)
            rel = os.path.relpath(abs_p, POSTS).replace(os.sep, "/")
            if re.match(r"^about(\.[a-z]{2})?\.md$", rel) or os.path.basename(rel).startswith("LICENSE"):
                continue
            if "/" not in rel or is_draft(abs_p):
                continue
            group, _, inner = rel.partition("/")
            if inner not in data.get(group, []):
                novos.append((group, inner))

    if novos:
        for g, i in novos:
            data.setdefault(g, []).append(i)
        with open(os.path.join(POSTS, "manifest.json"), "w", encoding="utf-8") as f:
            f.write("{\n")
            itens = list(data.items())
            for n, (g, arr) in enumerate(itens):
                a = "[" + ", ".join(json.dumps(x, ensure_ascii=False) for x in arr) + "]"
                c = "," if n < len(itens) - 1 else ""
                f.write(f"  {json.dumps(g, ensure_ascii=False)}: {a}{c}\n")
            f.write("}\n")
    return novos


def mensagem():
    r = git("diff", "--cached", "--name-only")
    arqs = r.stdout.split()

    # candidatos: .md de POST (posts/<grupo>/...), não about nem LICENSE.
    # Se houver vários, o de data mais recente dá o tom da mensagem.
    candidatos = []
    for a in arqs:
        if not a.startswith("posts/") or not a.endswith(".md"):
            continue
        rel = a[len("posts/"):]
        if "/" not in rel or re.match(r"^about(\.[a-z]{2})?\.md$", rel):
            continue
        if os.path.basename(rel).startswith("LICENSE"):
            continue
        candidatos.append(a)

    titulo, data = None, ""
    for a in candidatos:
        abs_p = os.path.join(ROOT, a)
        t = titulo_de(abs_p)
        if not t:
            continue
        d = data_de(abs_p)
        if titulo is None or d > data:
            titulo, data = t, d

    n = len(arqs)
    if titulo:
        extra = f" (+{n - 1} arquivo{'s' if n - 1 > 1 else ''})" if n > 1 else ""
        return f"post: {titulo}{extra}"
    return f"update: {n} arquivo{'s' if n > 1 else ''}"


def data_de(abs_path):
    try:
        with open(abs_path, encoding="utf-8") as f:
            txt = f.read(2048)
    except OSError:
        return ""
    partes = txt.split("---")
    fm = partes[1] if len(partes) >= 3 else ""
    for ln in fm.splitlines():
        k, _, v = ln.partition(":")
        if k.strip() == "date":
            return v.strip()
    return ""


def main():
    # 1. .gitignore em dia com o frontmatter
    dt.cmd_sync()

    # 2. nenhum draft pode estar rastreado (rede de segurança)
    vazando = dt.tracked(dt.drafts())
    if vazando:
        for v in vazando:
            print(f"coffee: draft rastreado pelo git: {v}", file=sys.stderr)
        return 1

    # 3. manifest
    novos = registra_novos()
    for g, i in novos:
        print(f"  manifest: + {g}/{i}")

    # 4. add
    git("add", "-A")

    if git("diff", "--cached", "--quiet").returncode == 0:
        print("nada pra commitar")
        return 10

    r = git("--no-pager", "diff", "--cached", "--stat")
    print()
    print(r.stdout.rstrip())

    # a mensagem so sai daqui se a CLI nao tiver recebido uma com -m; ela manda
    # a sua na linha MSG:: e a CLI decide qual usar.
    msg = os.environ.get("COFFEE_MSG") or mensagem()
    print(f"\nmensagem: {msg}")
    print(f"MSG::{msg}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
