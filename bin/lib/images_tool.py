#!/usr/bin/env python3
"""Otimiza as imagens de images/ pro tamanho que o site precisa.

Por padrão só MOSTRA o que faria (`--dry-run` é o padrão). Pra aplicar:

    coffee images --otimizar --sim

Por que não vem junto com a checagem: checar não deve mexer em arquivo. Aqui a
gente reescreve, então é um comando separado e explícito.

FERRAMENTA: não embutimos compressor (seria uma dependência pesada). A gente
detecta o que existe na máquina e usa:

    macOS    sips          (vem no sistema)
    Linux    convert       (ImageMagick; comum em distro desktop)
    Windows  magick        (ImageMagick, se instalado)
    qualquer cwebp/ffmpeg  (se instalado)

Se não houver nenhuma, diz o que instalar em vez de falhar calado.
"""
import os
import shutil
import struct
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import conf

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
IMAGES = os.path.join(ROOT, "images")

# Padrões: "o suficiente pro website". Uma foto de perfil aparece num círculo
# pequeno; 900px de largura é o teto que faz sentido aqui.
MAX_LARGURA_PADRAO = 900
QUALIDADE_PADRAO = 80
PESO_OK = 200 * 1024        # acima disso, vale olhar
MIN_ECONOMIA = 0.10         # menos que 10% de ganho não compensa reescrever


def dimensoes(path):
    """(largura, altura) de JPEG/PNG, lendo o cabeçalho. None se não souber."""
    try:
        with open(path, "rb") as f:
            data = f.read(64 * 1024)
    except OSError:
        return None
    if data[:2] == b"\xff\xd8":                       # JPEG
        i = 2
        while i + 9 <= len(data):
            if data[i] != 0xFF:
                break
            marker = data[i + 1]
            if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
                i += 2
                continue
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                h, w = struct.unpack(">HH", data[i + 5:i + 9])
                return w, h
            seglen = struct.unpack(">H", data[i + 2:i + 4])[0]
            i += 2 + seglen
        return None
    if data[:8] == b"\x89PNG\r\n\x1a\n":              # PNG
        w, h = struct.unpack(">II", data[16:24])
        return w, h
    return None


def ferramenta():
    """(nome, função) do compressor a usar. (None, None) se não houver."""
    if sys.platform == "darwin" and shutil.which("sips"):
        return ("sips", _com_sips)
    if shutil.which("magick"):
        return ("magick", _com_magick)
    if shutil.which("convert"):
        return ("convert", _com_convert)
    return (None, None)


def _com_sips(path, largura, qualidade):
    # -Z redimensiona mantendo a proporção (o lado maior vira `largura`);
    # formatOptions mexe na qualidade do JPEG.
    r = subprocess.run(["sips", "-Z", str(largura), "-s", "formatOptions", str(qualidade), path],
                       capture_output=True, text=True, check=False)
    return r.returncode == 0


def _com_magick(path, largura, qualidade):
    r = subprocess.run(["magick", path, "-resize", f"{largura}x{largura}>",
                        "-quality", str(qualidade), path],
                       capture_output=True, text=True, check=False)
    return r.returncode == 0


def _com_convert(path, largura, qualidade):
    r = subprocess.run(["convert", path, "-resize", f"{largura}x{largura}>",
                        "-quality", str(qualidade), path],
                       capture_output=True, text=True, check=False)
    return r.returncode == 0


def humano(n):
    if n >= 1024 * 1024:
        return f"{n / 1024 / 1024:.1f}M"
    return f"{round(n / 1024)}K"


def main():
    aplicar = "--sim" in sys.argv

    if not os.path.isdir(IMAGES):
        print("sem images/ — nada a fazer")
        return 0

    nome_f, func = ferramenta()
    if nome_f is None or func is None:
        print("não achei nenhum compressor de imagem nesta máquina.", file=sys.stderr)
        print("\ninstale um deles:", file=sys.stderr)
        print("  macOS    já vem (sips)", file=sys.stderr)
        print("  Linux    sudo apt install imagemagick", file=sys.stderr)
        print("  Windows  winget install ImageMagick.ImageMagick", file=sys.stderr)
        return 1

    largura = int(conf.get("COFFEE_IMG_MAX") or MAX_LARGURA_PADRAO)
    qualidade = int(conf.get("COFFEE_IMG_Q") or QUALIDADE_PADRAO)

    print(f"usando {nome_f} · teto {largura}px · qualidade {qualidade}\n")

    alvos = []
    for dp, _dn, fns in os.walk(IMAGES):
        for fn in sorted(fns):
            if fn.startswith(".") or not fn.lower().endswith((".jpg", ".jpeg", ".png")):
                continue
            alvos.append(os.path.join(dp, fn))

    if not alvos:
        print("nenhuma imagem pra otimizar")
        return 0

    mexeu = 0
    for p in alvos:
        rel = os.path.relpath(p, ROOT).replace(os.sep, "/")
        antes = os.path.getsize(p)
        dim = dimensoes(p)
        dim_txt = f"{dim[0]}×{dim[1]}" if dim else "?"

        # já está pequena e no tamanho? deixa quieta
        cabe = dim and max(dim) <= largura
        if antes <= PESO_OK and cabe:
            print(f"  {rel}  {dim_txt}  {humano(antes)}  (ok, deixando)")
            continue

        if not aplicar:
            print(f"  {rel}  {dim_txt}  {humano(antes)}  →  redimensiona/comprime")
            mexeu += 1
            continue

        # preserva pra poder desfazer se der errado
        backup = p + ".bak"
        shutil.copy2(p, backup)
        if not func(p, largura, qualidade):
            shutil.move(backup, p)
            print(f"  {rel}: falhou ao otimizar (deixei como estava)")
            continue

        depois = os.path.getsize(p)
        novo_dim = dimensoes(p)
        novo_txt = f"{novo_dim[0]}×{novo_dim[1]}" if novo_dim else "?"

        # não ganhou peso suficiente? desfaz — reescrever sem ganho só perde qualidade
        if depois >= antes * (1 - MIN_ECONOMIA):
            shutil.move(backup, p)
            print(f"  {rel}  {humano(antes)}  (já estava no ponto, deixando)")
            continue

        os.remove(backup)
        ganho = 100 - round(depois / antes * 100)
        print(f"  {rel}  {dim_txt} → {novo_txt}   {humano(antes)} → {humano(depois)}  (-{ganho}%)")
        mexeu += 1

    if not aplicar:
        if mexeu:
            print(f"\n{mexeu} imagem(ns) pra otimizar. aplique com: coffee images --otimizar --sim")
        else:
            print("\ntudo no ponto")
    else:
        print(f"\n{mexeu} imagem(ns) otimizada(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
