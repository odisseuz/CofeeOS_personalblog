# Vendor — bibliotecas self-hosted

Bibliotecas vendorizadas pra não depender de CDN em runtime. Versões pinadas.

## markdown

| arquivo | lib | versão | licença | fonte |
|---|---|---|---|---|
| `marked.esm.js` | marked | 18.0.13 | MIT | https://www.npmjs.com/package/marked |
| `marked-footnote.esm.js` | marked-footnote | 1.4.0 | MIT | https://www.npmjs.com/package/marked-footnote |

- `marked` — MIT. O cabeçalho de copyright já está embutido no topo do arquivo.
- `marked-footnote` — MIT, por Beni Arisandi (https://github.com/bent10/marked-extensions).

## math

| arquivo | lib | versão | licença | fonte |
|---|---|---|---|---|
| `katex/katex.mjs` | KaTeX | 0.18.7 | MIT | https://www.npmjs.com/package/katex |
| `katex/katex.min.css` | KaTeX | 0.18.7 | MIT | idem |
| `katex/fonts/*.woff2` | KaTeX | 0.18.7 | MIT | idem |

Só o `.mjs` (ESM) e as `.woff2` (formato moderno) foram trazidos; as `.ttf` e
`.woff` do pacote ficaram de fora. O `katex.min.css` foi editado: os
`@font-face` que apontavam pra `.ttf`/`.woff` foram removidos e os `url()`
reapontados pra `fonts/…` (relativo ao próprio CSS, pra funcionar tanto no
localhost quanto numa subpasta do GitHub Pages).

O `katex.mjs` é carregado pelo `js/math.js` com `import()` dinâmico, e só
quando o post tem `$`. O `build.js` importa o mesmo arquivo pra gerar o HTML
estático das páginas de SEO.

### Atualizar

```bash
npm pack katex@<versao>     # baixa katex-<versao>.tgz
tar -xzf katex-<versao>.tgz
cp package/dist/katex.mjs      js/vendor/katex/
cp package/dist/katex.min.css  js/vendor/katex/
cp package/dist/fonts/*.woff2  js/vendor/katex/fonts/
```

Depois, no `katex.min.css`: remover os `@font-face` de `.ttf` e `.woff`
(deixando só `.woff2` — o pacote não traz as `.ttf`, e o navegador tentaria
baixar arquivos inexistentes). Pra atualizar o markdown, baixe a nova versão,
substitua o arquivo, e rode `node .github/scripts/check_render.js`.
