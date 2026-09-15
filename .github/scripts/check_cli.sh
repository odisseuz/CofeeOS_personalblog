#!/usr/bin/env bash
#
# teste da CLI (bin/coffee) — roda no CI pra pegar regressão.
#
# Cada caso roda numa cópia isolada do projeto (num diretório temporário),
# então nada fora do /tmp é tocado. Sai com 1 se qualquer caso falhar.

set -uo pipefail

SRC="$(cd "$(dirname "$0")/../.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass_count=0
fail_count=0

pass() { printf 'PASS | %s\n' "$1"; pass_count=$((pass_count + 1)); }
fail() {
  printf 'FAIL | %s\n' "$1"; fail_count=$((fail_count + 1))
  [ -n "${2:-}" ] && printf '  %s\n' "$2"
}

# cria uma cópia mínima e limpa do projeto pra testar
sandbox() {
  local d="$TMP/$1"
  mkdir -p "$d/posts" "$d/bin/lib" "$d/.github/scripts"
  if ! cp "$SRC/bin/coffee" "$d/bin/coffee" \
     || ! cp "$SRC/bin/lib/"*.py "$d/bin/lib/" \
     || ! cp "$SRC/.github/scripts/check_manifest.py" "$d/.github/scripts/" \
     || ! cp "$SRC/.github/scripts/check_images.py" "$d/.github/scripts/" \
     || ! cp "$SRC/index.html" "$d/index.html" \
     || ! cp "$SRC/posts/manifest.json" "$d/posts/manifest.json" \
     || ! : > "$d/.gitignore"; then
    printf 'ERRO: sandbox não conseguiu copiar os arquivos de %s\n' "$SRC" >&2
    exit 2
  fi
  # copia todos os posts declarados no manifest, pra o sandbox ficar válido
  # mesmo quando o projeto ganhar mais conteúdo
  python3 - "$SRC" "$d" <<'PY'
import json, os, shutil, sys
src, dst = sys.argv[1], sys.argv[2]
manifest = json.load(open(os.path.join(src, 'posts', 'manifest.json'), encoding='utf-8'))
for group, items in manifest.items():
    for item in items:
        rel = os.path.join(group, item)
        s = os.path.join(src, 'posts', rel)
        t = os.path.join(dst, 'posts', rel)
        os.makedirs(os.path.dirname(t), exist_ok=True)
        if os.path.isfile(s):
            shutil.copy(s, t)
PY
  printf '%s' "$d"
}

# ---------------------------------------------------------------------------

echo "=== coffee new ==="
D="$(sandbox new)"
# sanidade: se o sandbox não tem o script, todo o resto dá falso positivo
if [ ! -x "$D/bin/coffee" ]; then
  printf 'ERRO: sandbox sem bin/coffee executável\n' >&2
  exit 2
fi
out="$(cd "$D" && ./bin/coffee new art/poetry/haiku.md 2>&1)"
if [ -f "$D/posts/art/poetry/haiku.md" ]; then pass "new cria o arquivo"; else fail "new cria o arquivo" "$out"; fi
if grep -q '"poetry/haiku.md"' "$D/posts/manifest.json"; then pass "new registra no manifest"; else fail "new registra no manifest" "$(cat "$D/posts/manifest.json")"; fi
if head -1 "$D/posts/art/poetry/haiku.md" | grep -q '^---$'; then pass "new gera frontmatter"; else fail "new gera frontmatter"; fi
if grep -q '^date: [0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}$' "$D/posts/art/poetry/haiku.md"; then pass "new gera date ISO"; else fail "new gera date ISO"; fi

# nao sobrescreve arquivo existente
(cd "$D" && ./bin/coffee new art/poetry/haiku.md > /dev/null 2>&1)
if [ "$(cd "$D" && ./bin/coffee new art/poetry/haiku.md 2>&1 | grep -c 'já existe')" = "1" ]; then
  pass "new recusa sobrescrever"
else
  fail "new recusa sobrescrever"
fi

echo ""
echo "=== coffee rm ==="
# garante que o arquivo existe antes de testar a remoção
if [ ! -f "$D/posts/art/poetry/haiku.md" ]; then
  fail "pré-condição: arquivo existe pra testar rm" "new não criou o arquivo"
else
  (cd "$D" && ./bin/coffee rm art/poetry/haiku.md > /dev/null 2>&1)
  if [ ! -f "$D/posts/art/poetry/haiku.md" ]; then pass "rm apaga o arquivo"; else fail "rm apaga o arquivo"; fi
  if ! grep -q 'haiku' "$D/posts/manifest.json"; then pass "rm tira do manifest"; else fail "rm tira do manifest" "$(cat "$D/posts/manifest.json")"; fi
  if [ ! -d "$D/posts/art" ]; then pass "rm limpa pasta vazia"; else fail "rm limpa pasta vazia"; fi
fi

echo ""
echo "=== manifest continua JSON valido ==="
D2="$(sandbox json)"
(cd "$D2" && ./bin/coffee new art/a.md > /dev/null 2>&1)
(cd "$D2" && ./bin/coffee new games/b.md > /dev/null 2>&1)
(cd "$D2" && ./bin/coffee rm art/a.md > /dev/null 2>&1)
if python3 -c "import json,sys; json.load(open('$D2/posts/manifest.json'))" 2>/dev/null; then
  pass "manifest valido apos add/rm"
else
  fail "manifest valido apos add/rm" "$(cat "$D2/posts/manifest.json")"
fi

echo ""
echo "=== caminhos aceitos ==="
D5="$(sandbox paths)"
(cd "$D5" && ./bin/coffee new posts/readings/p1.md > /dev/null 2>&1)
(cd "$D5" && ./bin/coffee new /readings/p2.md > /dev/null 2>&1)
(cd "$D5" && ./bin/coffee new readings/p3 > /dev/null 2>&1)
if [ -f "$D5/posts/readings/p1.md" ] && [ -f "$D5/posts/readings/p2.md" ] && [ -f "$D5/posts/readings/p3.md" ]; then
  pass "new aceita posts/, / e sem .md"
else
  fail "new aceita posts/, / e sem .md" "$(ls "$D5/posts/readings" 2>&1)"
fi

echo ""
echo "=== coffee check (integra com o check_manifest) ==="
D6="$(sandbox check)"
if (cd "$D6" && ./bin/coffee check > /dev/null 2>&1); then
  pass "check passa num estado limpo"
else
  fail "check passa num estado limpo"
fi
(cd "$D6" && ./bin/coffee new art/orfao-nao-registrado.md > /dev/null 2>&1)
# remove do manifest pra simular orfao
python3 -c "
import json
p='$D6/posts/manifest.json'
d=json.load(open(p)); d['art']=[]; json.dump(d,open(p,'w'))
" 2>/dev/null
if (cd "$D6" && ./bin/coffee check > /dev/null 2>&1); then
  fail "check falha com post orfao" "deveria ter falhado"
else
  pass "check falha com post orfao"
fi

echo ""
echo "=== coffee ls/status ==="
D7="$(sandbox listar)"
out_ls="$(cd "$D7" && ./bin/coffee ls 2>&1 || true)"
if echo "$out_ls" | grep -q 'Teaching Zotero'; then
  pass "ls mostra o titulo"
else
  fail "ls mostra o titulo" "$out_ls"
fi
out_st="$(cd "$D7" && ./bin/coffee status 2>&1 || true)"
if echo "$out_st" | grep -q 'manifest check OK'; then
  pass "status reporta saude"
else
  fail "status reporta saude" "$out_st"
fi

echo ""
echo "=== coffee new --lang / --draft ==="
D11="$(sandbox newflags)"
(cd "$D11" && ./bin/coffee new art/pt-draft --lang pt --draft > /dev/null 2>&1)
if grep -q '^lang: pt$' "$D11/posts/art/pt-draft.md" 2>/dev/null; then
  pass "new --lang escreve o idioma"
else
  fail "new --lang escreve o idioma" "$(cat "$D11/posts/art/pt-draft.md" 2>&1)"
fi
if grep -q '^draft: true$' "$D11/posts/art/pt-draft.md" 2>/dev/null; then
  pass "new --draft marca o rascunho"
else
  fail "new --draft marca o rascunho"
fi
# rascunho nao entra no manifest (quem registra e o publish)
if ! grep -q 'pt-draft' "$D11/posts/manifest.json"; then
  pass "new --draft nao registra no manifest"
else
  fail "new --draft nao registra no manifest" "$(cat "$D11/posts/manifest.json")"
fi

# flags DEPOIS do caminho tambem valem (a ordem nao pode importar)
D12="$(sandbox newflags2)"
(cd "$D12" && ./bin/coffee new art/depois --lang pt --draft > /dev/null 2>&1)
if grep -q '^lang: pt$' "$D12/posts/art/depois.md" 2>/dev/null; then
  pass "new aceita flags depois do caminho"
else
  fail "new aceita flags depois do caminho" "$(cat "$D12/posts/art/depois.md" 2>&1)"
fi

# --lang invalido morre ANTES de criar o arquivo
D13="$(sandbox badlang)"
if (cd "$D13" && ./bin/coffee new art/nao-deve-existir --lang xx > /dev/null 2>&1); then
  fail "new recusa --lang invalido" "deveria ter falhado"
else
  if [ ! -f "$D13/posts/art/nao-deve-existir.md" ]; then
    pass "new recusa --lang invalido (sem criar arquivo)"
  else
    fail "new recusa --lang invalido" "criou o arquivo mesmo assim"
  fi
fi

echo ""
echo "=== coffee status / menu ==="
D14="$(sandbox status)"
out_st2="$(cd "$D14" && ./bin/coffee status 2>&1 || true)"
if echo "$out_st2" | grep -q 'próximo passo'; then
  pass "status sugere o proximo passo"
else
  fail "status sugere o proximo passo" "$out_st2"
fi
# o menu nao pode quebrar quando o stdin fecha (uso em pipe/CI)
out_menu="$(cd "$D14" && ./bin/coffee menu < /dev/null 2>&1 || true)"
if echo "$out_menu" | grep -q 'escrever um post novo'; then
  pass "menu abre com stdin fechado"
else
  fail "menu abre com stdin fechado" "$out_menu"
fi

# ---------------------------------------------------------------------------

echo ""
echo "=== coffee images (EXIF) ==="
D8="$(sandbox imagens)"
if (cd "$D8" && ./bin/coffee images > /dev/null 2>&1); then
  pass "images passa sem pasta images/"
else
  fail "images passa sem pasta images/"
fi
# JPEG sintético com EXIF (make + model + ponteiro de GPS), sem depender de Pillow
python3 - "$D8" <<'PY'
import os, struct, sys
d = sys.argv[1]
os.makedirs(os.path.join(d, 'images'), exist_ok=True)
def ifd(entries):
    out = struct.pack('>H', len(entries))
    for tag in entries:
        out += struct.pack('>HHI', tag, 3, 1) + struct.pack('>H', 1) + b'\x00\x00'
    return out + struct.pack('>I', 0)
tiff = b'MM\x00\x2a' + struct.pack('>I', 8) + ifd([0x010F, 0x0110, 0x8825]) + ifd([0x0001])
payload = b'Exif\x00\x00' + tiff
app1 = b'\xff\xe1' + struct.pack('>H', len(payload) + 2) + payload
open(os.path.join(d, 'images', 'leaky.jpg'), 'wb').write(b'\xff\xd8' + app1 + b'\xff\xd9')
PY
if (cd "$D8" && ./bin/coffee images > /dev/null 2>&1); then
  fail "images falha com EXIF presente" "deveria ter falhado"
else
  pass "images falha com EXIF presente"
fi

echo ""
echo "=== coffee drafts / publish ==="
D9="$(sandbox drafts)"
mkdir -p "$D9/posts/art"
cat > "$D9/posts/art/rascunho.md" <<'MD'
---
title: Um rascunho
date: 2026-09-21
draft: true
---

texto
MD
# sanidade: sem o arquivo, todo o resto dá falso positivo
if [ ! -f "$D9/posts/art/rascunho.md" ]; then
  fail "pré-condição: rascunho existe" "não consegui criar $D9/posts/art/rascunho.md"
fi
out_dr="$(cd "$D9" && ./bin/coffee drafts 2>&1 || true)"
if echo "$out_dr" | grep -q 'rascunho.md'; then
  pass "drafts lista o rascunho"
else
  fail "drafts lista o rascunho" "$out_dr"
fi

# sync põe a linha no .gitignore
(cd "$D9" && python3 bin/lib/drafts_tool.py sync > /dev/null 2>&1)
if grep -q 'posts/art/rascunho.md' "$D9/.gitignore" 2>/dev/null; then
  pass "sync escreve o rascunho no .gitignore"
else
  fail "sync escreve o rascunho no .gitignore" "$(cat "$D9/.gitignore" 2>&1)"
fi

# publish tira o draft e registra no manifest
(cd "$D9" && ./bin/coffee publish art/rascunho.md > /dev/null 2>&1)
if [ -f "$D9/posts/art/rascunho.md" ] && ! grep -q '^draft:' "$D9/posts/art/rascunho.md"; then
  pass "publish tira o draft do frontmatter"
else
  fail "publish tira o draft do frontmatter" "$(cat "$D9/posts/art/rascunho.md" 2>&1)"
fi
if grep -q '"rascunho.md"' "$D9/posts/manifest.json"; then
  pass "publish registra no manifest"
else
  fail "publish registra no manifest" "$(cat "$D9/posts/manifest.json")"
fi

# sync remove a linha quando deixa de ser draft
(cd "$D9" && python3 bin/lib/drafts_tool.py sync > /dev/null 2>&1)
if ! grep -q 'posts/art/rascunho.md' "$D9/.gitignore" 2>/dev/null; then
  pass "sync tira a linha do post publicado"
else
  fail "sync tira a linha do post publicado"
fi

# um draft nao conta como orfao no check
D10="$(sandbox draftcheck)"
mkdir -p "$D10/posts/art"
cat > "$D10/posts/art/escondido.md" <<'MD'
---
title: Escondido
date: 2026-09-21
draft: true
---

texto
MD
if (cd "$D10" && ./bin/coffee check > /dev/null 2>&1); then
  pass "draft nao conta como orfao"
else
  fail "draft nao conta como orfao" "$(cd "$D10" && ./bin/coffee check 2>&1)"
fi

# ---------------------------------------------------------------------------

echo ""
if [ "$fail_count" -gt 0 ]; then
  printf '%d falha(s), %d passaram\n' "$fail_count" "$pass_count"
  exit 1
fi
printf 'CLI test OK (%d)\n' "$pass_count"
