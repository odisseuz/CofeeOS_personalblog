#!/usr/bin/env python3
"""Estado do projeto: a tela que abre o `coffee` sem argumento.

Reúne o que hoje estava espalhado em `status` (contagem por grupo), `drafts`
(rascunhos) e o git (branch, limpeza), e diz qual é o PRÓXIMO PASSO — que é o
que uma CLI de escritor precisa responder e o `--help` não responde.

Duas saídas:
  resumo   o bloco de estado (usado pelo modo interativo e por `coffee status`)
  menu     as opções numeradas, uma por linha: "1|escrever um post novo"

Os dados saem em texto plano, sem cor, pra poderem ser testados e usados em
pipe. Quem monta a tela é o bash.
"""
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import drafts_tool as dt
import i18n
from i18n import t

# o idioma vem do $LANG (ou do --lang, que o coffee exporta como COFFEE_LANG).
# Sem isso o módulo ficaria sempre em inglês, mesmo com o terminal em pt.
i18n.set_lang(os.environ.get('COFFEE_LANG') or i18n.detecta_lang())

ROOT = dt.ROOT
POSTS = dt.POSTS
MANIFEST = os.path.join(POSTS, "manifest.json")


def git(*args):
    try:
        r = subprocess.run(["git", "-C", ROOT] + list(args),
                           capture_output=True, text=True, check=False)
        return r.stdout.strip() if r.returncode == 0 else ""
    except OSError:
        return ""


def le_manifest():
    try:
        with open(MANIFEST, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def frontmatter(abs_path):
    """Devolve {chave: valor} do frontmatter, sem depender de yaml."""
    try:
        with open(abs_path, encoding="utf-8") as f:
            txt = f.read(4096)
    except OSError:
        return {}
    partes = txt.split("---")
    if len(partes) < 3:
        return {}
    data = {}
    for ln in partes[1].splitlines():
        m = re.match(r"^([A-Za-z_][\w-]*):\s*(.*)$", ln)
        if not m:
            continue
        v = m.group(2).strip()
        if len(v) >= 2 and v[0] == v[-1] and v[0] in "\"'":
            v = v[1:-1]
        data[m.group(1)] = v
    return data


def publicados():
    """[(grupo, item, abs_path, frontmatter)] do manifest."""
    out = []
    for grupo, itens in le_manifest().items():
        for item in itens:
            p = os.path.join(POSTS, grupo, item)
            out.append((grupo, item, p, frontmatter(p)))
    return out


def contar():
    pubs = publicados()
    ds = dt.drafts()
    idiomas = {}
    for _g, _i, _p, d in pubs:
        if d.get("draft", "").lower() in ("true", "yes", "1"):
            continue
        l = d.get("lang") or "en"
        idiomas[l] = idiomas.get(l, 0) + 1
    return pubs, ds, idiomas


def proximo_passo(ds, pubs):
    """Uma sugestão só, a mais útil — não uma lista de tudo que dá pra fazer."""
    # 1. rascunho completo (tem corpo) que ainda não foi publicado
    for d in ds:
        abs_p = os.path.join(ROOT, d)
        fm = frontmatter(abs_p)
        try:
            with open(abs_p, encoding="utf-8") as f:
                txt = f.read()
        except OSError:
            continue
        corpo = txt.split("---", 2)[2] if txt.count("---") >= 2 else ""
        palavras = len(corpo.split())
        if palavras >= 50:
            rel = d[len("posts/"):]
            titulo = fm.get("title") or rel
            return (f"./bin/coffee publish {rel}",
                    t('r_porque_draft', titulo=titulo, n=palavras))

    # 2. mudanças pra commitar
    sujo = git("status", "--porcelain")
    if sujo:
        n = len(sujo.splitlines())
        return ("./bin/coffee commit", t('r_porque_sujo', n=n, s='s' if n > 1 else ''))

    # 3. commits locais que ainda não subiram
    branch = git("rev-parse", "--abbrev-ref", "HEAD")
    if branch:
        upstream = git("rev-parse", "--abbrev-ref", "@{u}")
        if upstream:
            ahead = git("rev-list", "--count", "@{u}..HEAD")
            if ahead and ahead != "0":
                return (f"git push origin {branch}",
                        t('r_porque_ahead', n=ahead, s='s' if ahead != '1' else ''))

    # 4. nada pendente: escrever
    return ("./bin/coffee new science/meu-post", t('r_porque_nada'))


def cmd_resumo():
    pubs, ds, idiomas = contar()
    publicados_de_verdade = [p for p in pubs
                             if p[3].get("draft", "").lower() not in ("true", "yes", "1")]

    n_pub = len(publicados_de_verdade)
    n_dr = len(ds)
    print(f"posts|{t('r_posts', n=n_pub, d=n_dr, s='s' if n_pub != 1 else '', s2='s' if n_dr != 1 else '')}")

    if idiomas:
        print("idiomas|" + " · ".join(f"{k} ({v})" for k, v in sorted(idiomas.items())))

    branch = git("rev-parse", "--abbrev-ref", "HEAD") or t('r_sem_git')
    sujo = git("status", "--porcelain")
    estado_git = t('r_sujo') if sujo else t('r_limpo')
    upstream = git("rev-parse", "--abbrev-ref", "@{u}")
    if upstream:
        ahead = git("rev-list", "--count", "@{u}..HEAD")
        if ahead and ahead != "0":
            estado_git += t('r_sem_subir', n=ahead)
    print(f"git|{branch}, {estado_git}")

    por_grupo = {}
    for g, _i, _p, _d in publicados_de_verdade:
        por_grupo[g] = por_grupo.get(g, 0) + 1
    if por_grupo:
        print("grupos|" + " · ".join(f"{g} ({n})" for g, n in sorted(por_grupo.items())))

    if ds:
        print("rascunhos|")
        for d in ds:
            fm = frontmatter(os.path.join(ROOT, d))
            print(f"  {d[len('posts/'):]}  ({fm.get('title') or t('r_sem_titulo')})")

    cmd, porque = proximo_passo(ds, pubs)
    print(f"proximo|{cmd}")
    print(f"porque|{porque}")
    # os rótulos vão por último, chave a chave: o bash não tem o léxico, e chamar
    # o python uma vez por mensagem seria um processo por linha da tela.
    for chave in ('rot_posts', 'rot_idiomas', 'rot_git', 'rot_grupos', 'rot_drafts',
                  'rot_proximo', 'rot_escolha', 'rot_voltar', 'rot_pergunta'):
        print(f"{chave}|{t(chave)}")
    return 0


def cmd_menu():
    """As opções, uma por linha: tecla|rótulo|comando sugerido."""
    ds = dt.drafts()
    sujo = git("status", "--porcelain")

    print(f"1|{t('menu_escrever')}|new")
    if ds:
        print(f"2|{t('menu_ver_drafts', n=len(ds))}|drafts")
        print(f"3|{t('menu_publicar')}|publish")
    else:
        print(f"2|{t('menu_ver_posts')}|ls")
        print(f"3|{t('menu_sem_drafts')}|drafts")
    if sujo:
        n = len(sujo.splitlines())
        print(f"4|{t('menu_commitar', n=n, s='s' if n > 1 else '')}|commit")
    else:
        print(f"4|{t('menu_commitar_limpo')}|commit")
    print(f"5|{t('menu_servir')}|serve")
    print(f"6|{t('menu_validar')}|verify")
    print(f"7|{t('menu_ver_posts')}|ls")
    print(f"?|{t('menu_ajuda')}|help")
    return 0


def main():
    if len(sys.argv) < 2:
        print("uso: status_tool.py resumo|menu", file=sys.stderr)
        return 2
    acao = sys.argv[1]
    if acao == "resumo":
        return cmd_resumo()
    if acao == "menu":
        return cmd_menu()
    print(f"ação desconhecida: {acao}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
