# Vendor — markdown renderer (self-hosted)

Bibliotecas vendorizadas pra não depender de CDN em runtime. Versões pinadas.

| arquivo | lib | versão | licença | fonte |
|---|---|---|---|---|
| `marked.esm.js` | marked | 18.0.13 | MIT | https://www.npmjs.com/package/marked |
| `marked-footnote.esm.js` | marked-footnote | 1.4.0 | MIT | https://www.npmjs.com/package/marked-footnote |

- `marked` — MIT. O cabeçalho de copyright já está embutido no topo do arquivo.
- `marked-footnote` — MIT, por Beni Arisandi (https://github.com/bent10/marked-extensions).

Pra atualizar: baixa a nova versão, substitui o arquivo, e roda `node .github/scripts/check_render.js`.
