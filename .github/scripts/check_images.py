#!/usr/bin/env python3
"""Checagens de images/.

Quatro coisas, todas antes do deploy:

1. EXIF — foto de câmera carrega GPS, modelo e número de série. Só stdlib:
   lê o bloco APP1/EXIF do JPEG direto.
2. Referência quebrada — um .md aponta pra images/x.jpg que não existe. Isso
   quebra o site, então falha (as outras só avisam).
3. Órfã — imagem em images/ que ninguém referencia. Vai pro deploy de graça.
4. Nome fora da convenção — maiúscula, espaço ou acento (ver README).

A otimização (redimensionar/comprimir) NÃO é aqui: ela reescreve arquivo, e
ferramenta de checagem não deve mexer em nada. Fica no `coffee images --otimizar`.
"""
import os
import re
import struct
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMAGES = os.path.join(ROOT, "images")

# Tags cuja presença vale reportar. GPS é a preocupação real.
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

# Blocos EXIF maiores que isso não valem a caminhada; desiste em vez de chutar.
MAX_BLOCK = 512 * 1024

EXTENSOES = (".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".svg")

# onde procurar referências a imagens
ONDE_REFERENCIA = ("posts", "index.html", "README.md")


# ---------------------------------------------------------------- EXIF

def find_exif(data):
    """Devolve o bloco TIFF do primeiro APP1/EXIF, ou None."""
    if data[:2] != b"\xff\xd8":          # não é JPEG
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
    """Caminha um IFD coletando os números de tag. Devolve (achados, próximo)."""
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
    """Conjunto de tags interessantes presentes no bloco EXIF."""
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
    return set(found)


# ---------------------------------------------------------------- refs

def arquivos_de_conteudo():
    """Todos os arquivos onde uma referência a imagem pode aparecer."""
    out = []
    for nome in ONDE_REFERENCIA:
        p = os.path.join(ROOT, nome)
        if os.path.isfile(p):
            out.append(p)
        elif os.path.isdir(p):
            for dp, _dn, fns in os.walk(p):
                for fn in fns:
                    if fn.endswith((".md", ".html")):
                        out.append(os.path.join(dp, fn))
    return out


def sem_codigo(txt, rel=None):
    """Tira blocos de código e trechos entre crases antes de procurar referências.

    Sem isto, um exemplo de markdown num README (``![](images/exemplo.jpg)``)
    vira "referência quebrada". A checagem existe pra pegar link quebrado de
    verdade, não didática.
    """
    # blocos cercados por ``` (com ou sem linguagem)
    txt = re.sub(r"```[\s\S]*?```", " ", txt)
    # código indentado por 4 espaços (bloco do markdown)
    txt = re.sub(r"(?m)^ {4,}\S.*$", " ", txt)
    # `code` inline
    txt = re.sub(r"`[^`\n]*`", " ", txt)
    return txt


def referencias():
    """Imagens citadas no conteúdo. Devolve {caminho relativo: [quem cita]}.

    Procura tanto markdown (`![](images/x.jpg)`) quanto HTML (`src="images/x.jpg"`),
    e também o `images/x.jpg` solto no texto — é assim que o README cita.
    """
    padrao = re.compile(r"images/[A-Za-z0-9][A-Za-z0-9._/\-]*\.(" +
                        "|".join(e.lstrip(".") for e in EXTENSOES) + r")", re.IGNORECASE)
    achados = {}
    for p in arquivos_de_conteudo():
        try:
            with open(p, encoding="utf-8") as f:
                txt = f.read()
        except OSError:
            continue
        rel = os.path.relpath(p, ROOT).replace(os.sep, "/")
        for m in padrao.finditer(sem_codigo(txt, rel)):
            achados.setdefault(m.group(0), []).append(rel)
    return achados


# ---------------------------------------------------------------- nome

def nome_ok(nome):
    """(ok, motivo) — convenção do README: minúsculas, sem espaço, sem acento."""
    if nome != nome.lower():
        return False, "tem maiúscula"
    if " " in nome:
        return False, "tem espaço"
    if not nome.isascii():
        return False, "tem acento ou caractere fora do ASCII"
    if not re.fullmatch(r"[a-z0-9][a-z0-9._\-]*", nome):
        return False, "tem caractere fora de a-z, 0-9, ponto, hífen"
    return True, ""


# ---------------------------------------------------------------- main

def main():
    # A checagem de referência roda mesmo sem images/: um post que aponta pra
    # images/x.jpg com a pasta ausente é exatamente o caso de link quebrado.
    # (Sair cedo aqui escondia esse bug.)
    no_disco = []
    if os.path.isdir(IMAGES):
        for dp, _dn, fns in os.walk(IMAGES):
            for fn in sorted(fns):
                if fn.startswith("."):
                    continue
                p = os.path.join(dp, fn)
                no_disco.append((p, os.path.relpath(p, ROOT).replace(os.sep, "/")))

    refs = referencias()

    refs = referencias()

    erros = 0        # quebra o site
    avisos = 0       # não quebra, mas é sujeira

    # 1. referência quebrada
    for alvo, quem in sorted(refs.items()):
        if not os.path.isfile(os.path.join(ROOT, alvo)):
            print(f"  - {alvo}: citado em {', '.join(sorted(set(quem)))} mas o arquivo não existe")
            erros += 1

    usados = set(refs)

    for p, rel in no_disco:
        # 2. EXIF — FALHA, não aviso. É o motivo de a checagem existir: GPS
        # vazando localização é diferente de uma imagem órfã ou um nome feio.
        try:
            with open(p, "rb") as f:
                data = f.read()
        except OSError as e:
            print(f"  - {rel}: ilegível ({e})")
            avisos += 1
            continue
        tags = exif_tags(data)
        if tags:
            desc = ", ".join(TAGS[t] for t in sorted(tags) if t in TAGS)
            print(f"  - {rel}: EXIF presente ({desc}) — limpe antes de publicar")
            erros += 1

        # 3. órfã
        if rel not in usados:
            print(f"  - {rel}: ninguém referencia — não precisa estar aqui")
            avisos += 1

        # 4. nome
        ok, motivo = nome_ok(os.path.basename(rel))
        if not ok:
            print(f"  - {rel}: nome fora da convenção ({motivo}) — ver README")
            avisos += 1

    if erros:
        print(f"\nimage check FAILED: {erros} problema(s) que não podem ir pro ar "
              f"(EXIF vazando ou referência quebrada)")
        return 1
    if avisos:
        print(f"\nimage check: {avisos} aviso(s), {len(no_disco)} imagem(ns) — "
              f"rode `./bin/coffee images --otimizar` se for peso")
        return 0
    print(f"image check OK ({len(no_disco)} imagem(ns), sem metadados vazando)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
