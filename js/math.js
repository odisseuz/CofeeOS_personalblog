// math (KaTeX) — carregado só quando um post tem fórmula.
//
// O problema: o marked trata `_`, `*`, `\` e `[` dentro de uma fórmula como
// markdown, e destrói `\sum_{i=1}^{n}`. Então a fórmula sai do texto ANTES do
// marked (vira um placeholder) e volta depois, já renderizada pelo KaTeX.

const INLINE = /\$([^$\n]+?)\$/g;      // $...$
const BLOCK = /\$\$([\s\S]+?)\$\$/g;   // $$...$$

let katexPromise = null;

// Marcador do placeholder: NÃO pode ser \u0000, porque o parser HTML do
// navegador descarta caracteres nulos (o placeholder sumiria). Área de uso
// privado do Unicode: preservado pelo parser e impossível de digitar no texto.
const MARK = '\uE000';
const MARK_RE = /\uE000MATH(\d+)\uE000/g;

// import dinâmico: um post sem fórmula nunca baixa o KaTeX
function loadKatex() {
  if (!katexPromise) katexPromise = import('./vendor/katex/katex.mjs');
  return katexPromise;
}

export function hasMath(text) {
  return /\$/.test(text);
}

// tira as fórmulas do texto e devolve os pedaços pra renderizar depois
export function extractMath(text) {
  const found = [];
  let out = text;

  out = out.replace(BLOCK, function (_m, tex) {
    found.push({ tex: tex, display: true });
    return MARK + 'MATH' + (found.length - 1) + MARK;
  });
  out = out.replace(INLINE, function (_m, tex) {
    found.push({ tex: tex, display: false });
    return MARK + 'MATH' + (found.length - 1) + MARK;
  });

  return { text: out, found: found };
}

// troca os placeholders pelas fórmulas renderizadas (assíncrono: o KaTeX
// precisa ter carregado). Se falhar, mostra o TeX cru em vez de sumir.
export function injectMath(html, found) {
  if (!found.length) return Promise.resolve(html);
  return loadKatex().then(function (katex) {
    return html.replace(MARK_RE, function (_m, i) {
      const item = found[Number(i)];
      if (!item) return '';
      try {
        return katex.default.renderToString(item.tex.trim(), {
          displayMode: item.display,
          throwOnError: false,
          strict: false
        });
      } catch (e) {
        return item.display
          ? '<pre class="math-error">' + item.tex + '</pre>'
          : '<code>' + item.tex + '</code>';
      }
    });
  });
}
