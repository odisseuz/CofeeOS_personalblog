#!/usr/bin/env bash
#
# install.sh — deixa o `coffee` disponível em qualquer diretório.
#
#   ./install.sh                    instala em /usr/local (pede sudo se preciso)
#   ./install.sh --prefix ~/.local  instala em outro prefixo
#
# O QUE ELE NÃO FAZ: copiar o código. O link aponta pro bin/coffee DESTE
# projeto — assim `coffee` de qualquer diretório enxerga o posts/ e o manifest
# deste repositório, e editar o código aqui já muda o comando instalado (sem
# reinstalar). Se um dia isso virar pacote, aí copia.

set -euo pipefail

PREFIX="/usr/local"
if [ "${1:-}" = "--prefix" ] && [ -n "${2:-}" ]; then
  PREFIX="$2"
elif [ "${1:-}" = "--help" ] || [ "${1:-}" = "-h" ]; then
  printf 'uso: ./install.sh [--prefix <dir>]  (padrão: /usr/local)\n'
  exit 0
elif [ $# -gt 0 ]; then
  printf 'install: argumento desconhecido: %s\n' "$1" >&2
  exit 2
fi

ORIGEM="$(cd "$(dirname "$0")" && pwd)"
BIN="$PREFIX/bin"

printf 'instalando o comando coffee em %s\n\n' "$BIN"

falta=0
for cmd in bash python3 git; do
  if command -v "$cmd" > /dev/null 2>&1; then
    printf '  %-8s ok\n' "$cmd"
  else
    printf '  %-8s FALTA (instale antes de continuar)\n' "$cmd"
    falta=1
  fi
done
[ "$falta" = 0 ] || { printf '\nfaltam dependências\n' >&2; exit 1; }

if [ ! -d "$ORIGEM/.git" ]; then
  printf '\n  aviso: %s não parece um clone do projeto (sem .git)\n' "$ORIGEM"
  printf '  o comando vai apontar pra cá de qualquer forma.\n'
fi

mkdir -p "$BIN" 2>/dev/null || true
if [ ! -w "$BIN" ]; then
  printf '\nsem permissão de escrita em %s\n' "$BIN" >&2
  printf 'rode com sudo, ou use: ./install.sh --prefix ~/.local\n' >&2
  exit 1
fi

ln -sf "$ORIGEM/bin/coffee" "$BIN/coffee"
printf '\n  link: %s -> %s/bin/coffee\n' "$BIN/coffee" "$ORIGEM"

printf '\npronto. teste com:\n\n  coffee help\n  coffee status      (de qualquer diretório)\n\n'
printf 'Pra desinstalar: rm %s/coffee\n' "$BIN"
