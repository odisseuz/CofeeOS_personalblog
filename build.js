// build.js — gera HTML estático dos posts (SEO) + sitemap.xml
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, parseFrontmatter } from './js/markdown.js';
import { extractMath, hasMath } from './js/math.js';
import katex from './js/vendor/katex/katex.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const rawBase = (process.env.BASE_URL || '').trim().replace(/\/+$/, '');
const baseUrl = rawBase ? rawBase + '/' : '';

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// texto puro pra meta description / JSON-LD. O MathML precisa sair inteiro:
// senão o TeX cru e as duplicatas de acessibilidade do KaTeX vazam pro Google.
function excerpt(html) {
  return html
    .replace(/<math[\s\S]*?<\/math>/g, ' ')
    .replace(/<span class="katex-html"[\s\S]*?<\/span>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
}

// qualquer URL relativa em src/href (images/, assets/, ...) precisa do prefixo
// relativo nas páginas geradas pra apontar de volta pra raiz; externos, âncoras
// e mailto: ficam intactos
function rootRelative(html, depth) {
  const prefix = '../'.repeat(depth);
  return html.replace(
    /(src|href)="(?!(?:https?:)?\/\/|\/|#|mailto:|data:)([^"]+)"/g,
    function (m, attr, url) {
      return attr + '="' + prefix + url + '"';
    }
  );
}

// primeira imagem do post (pra usar como og:image)
// mesma extração do viewer, mas síncrona: o KaTeX já está carregado aqui.
// Sem isso o marked come `_`, `*` e `\,` dentro da fórmula.
function renderBody(md) {
  const body = hasMath(md) ? extractMath(md) : null;
  let html = renderMarkdown(body ? body.text : md);
  if (!body) return html;
  return html.replace(/\uE000MATH(\d+)\uE000/g, function (_m, i) {
    const item = body.found[Number(i)];
    if (!item) return '';
    try {
      return katex.renderToString(item.tex.trim(), {
        displayMode: item.display,
        throwOnError: false,
        strict: false
      });
    } catch (e) {
      return item.display
        ? '<pre class="math-error">' + esc(item.tex) + '</pre>'
        : '<code>' + esc(item.tex) + '</code>';
    }
  });
}

// Nome do site. Fixo de propósito: o <h1> mostra "midnight coffee" e a bebida
// escolhida aparece ao lado da tagline como um detalhe (ver js/sitename.js).
const SITE_NAME = 'midnight coffee';

function firstImage(html) {
  const m = /<img[^>]*src="([^"]+)"/.exec(html);
  return m ? m[1] : '';
}

function page(relMd, data, bodyHtml, recent, hasFormula) {
  const relHtml = relMd.replace(/\.md$/, '.html');
  const depth = relHtml.split('/').length - 1;
  const up = '../'.repeat(depth);
  const title = data.title || relMd.split('/').pop().replace(/\.md$/, '');
  const desc = excerpt(bodyHtml);
  const url = baseUrl + relHtml;
  const lang = data.lang === 'pt' ? 'pt' : 'en';
  const dateHtml = data.date ? '<p class="note-date">' + esc(data.date) + '</p>' : '';
  const body = rootRelative(bodyHtml, depth);

  // KaTeX só entra em post com fórmula: 28 KB de CSS + fontes sob demanda
  const mathCss = hasFormula
    ? '<link rel="stylesheet" href="' + up + 'js/vendor/katex/katex.min.css">\n'
    : '';

  const image = firstImage(bodyHtml);
  const ogImage = image ? baseUrl + image : '';
  const twitterCard = image ? 'summary_large_image' : 'summary';
  const ogImageMeta = ogImage
    ? '<meta property="og:image" content="' + esc(ogImage) + '">\n' +
      '<meta name="twitter:image" content="' + esc(ogImage) + '">\n'
    : '';

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: desc,
    url: url,
    datePublished: data.date || undefined,
    author: { '@type': 'Person', name: 'André Gomes' }
  }).replace(/</g, '\\u003c');

  const links = recent
    .filter(function (p) { return p.relHtml !== relHtml; })
    .map(function (p) {
      return '      <li><a href="' + esc(up + p.relHtml) + '">' + esc(p.title) + '</a></li>';
    })
    .join('\n');

  return '<!DOCTYPE html>\n' +
    '<html lang="' + lang + '">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(title) + ' — ' + SITE_NAME + '</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<link rel="canonical" href="' + esc(url) + '">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:url" content="' + esc(url) + '">\n' +
    '<meta property="og:site_name" content="' + SITE_NAME + '">\n' +
    '<meta name="twitter:card" content="' + twitterCard + '">\n' +
    ogImageMeta +
    '<script type="application/ld+json">' + jsonLd + '</script>\n' +
    '<link rel="icon" type="image/svg+xml" href="' + up + 'favicon.svg">\n' +
    '<link rel="stylesheet" href="' + up + 'style.css">\n' +
    mathCss +
    '</head>\n' +
    '<body>\n' +
    '<main class="page static-page">\n' +
    '  <article class="editor-body static-article">\n' +
    '    <h1 class="note-title">' + esc(title) + '</h1>\n' +
    (dateHtml ? '    ' + dateHtml + '\n' : '') +
    body + '\n' +
    '  </article>\n' +
    '  <p class="static-back"><a href="' + esc(up + 'index.html#~/' + relMd.replace(/^posts\//, '')) + '">← open in coffeeOS</a></p>\n' +
    '  <footer class="static-footer">\n' +
    '    <p class="static-home"><a href="' + esc(up + 'index.html') + '">← ' + SITE_NAME + '</a></p>\n' +
    '    <p class="static-recent-title">recent</p>\n' +
    '    <ul class="static-recent">\n' +
    links + '\n' +
    '    </ul>\n' +
    '  </footer>\n' +
    '</main>\n' +
    '</body>\n' +
    '</html>\n';
}

const manifest = JSON.parse(readFileSync(join(ROOT, 'posts', 'manifest.json'), 'utf8'));
const entries = [];
for (const [group, names] of Object.entries(manifest)) {
  for (const name of names) entries.push('posts/' + group + '/' + name);
}

// primeira passada: metadados (pra montar os links internos)
// `draft: true` no frontmatter tira o post do site inteiro: nada de index.json,
// sitemap ou página HTML. O arquivo continua no disco (e no git), só não 
// existe pro visitante.
const todos = entries.map(function (relMd) {
  const { data } = parseFrontmatter(readFileSync(join(ROOT, relMd), 'utf8'));
  return {
    relMd: relMd,
    relHtml: relMd.replace(/\.md$/, '.html'),
    title: data.title || relMd.split('/').pop().replace(/\.md$/, ''),
    date: data.date || '',
    series: data.series || '',
    lang: data.lang === 'pt' ? 'pt' : 'en',
    draft: /^(true|yes|1)$/i.test(String(data.draft || '').trim()),
    order: data.order === undefined ? null : Number(data.order)
  };
});

const posts = todos.filter(function (p) { return !p.draft; });
const drafts = todos.filter(function (p) { return p.draft; });

// posts recentes (por data) pra linkar no rodapé. O corte é por idioma: uma
// página em português não deve empurrar o leitor pro meio do site em inglês.
function recentFor(lang) {
  return posts
    .filter(function (p) { return p.lang === lang; })
    .sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); })
    .slice(0, 5);
}

// segunda passada: gera as páginas
for (const p of posts) {
  const absMd = join(ROOT, p.relMd);
  const { data, body } = parseFrontmatter(readFileSync(absMd, 'utf8'));
  const html = page(p.relMd, data, renderBody(body), recentFor(p.lang), hasMath(body));
  const absHtml = join(ROOT, p.relHtml);
  mkdirSync(dirname(absHtml), { recursive: true });
  writeFileSync(absHtml, html);
}

const urls = ['  <url><loc>' + esc(baseUrl || 'index.html') + '</loc></url>']
  .concat(posts.map(function (p) {
    return '  <url><loc>' + esc(baseUrl + p.relHtml) + '</loc></url>';
  }))
  .join('\n');
writeFileSync(
  join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls + '\n' +
    '</urlset>\n'
);

// índice leve (sem corpo) pra home/busca/finder não baixarem todos os .md
const index = posts.map(function (p) {
  return { path: p.relMd, group: p.relMd.split('/')[1], title: p.title, date: p.date, series: p.series, lang: p.lang, order: p.order };
});
writeFileSync(join(ROOT, 'posts', 'index.json'), JSON.stringify(index, null, 2) + '\n');

// robots.txt gerado a partir do mesmo BASE_URL do sitemap — assim trocar de
// domínio é editar UM lugar só (a env do workflow), sem arquivos esquecidos.
// O "Sitemap:" exige URL absoluta, então sem BASE_URL ele não é escrito.
//
// Bots de IA NÃO são bloqueados, de propósito. O raciocínio está no próprio
// arquivo gerado (quem pergunta isso abre o robots.txt, não o código).
const robots = [
  '# Search engines are welcome: the point of a blog is being found.',
  'User-agent: *',
  'Allow: /',
  '',
  '# AI crawlers are deliberately not blocked. robots.txt is voluntary: the',
  '# crawlers that obey it are the ones that cite and link back, and the rest',
  '# ignore it anyway. Google also warns that a page blocked this way can still',
  '# be indexed, just without a description — strictly worse than allowing it.',
  '',
  '',
].join('\n');
writeFileSync(
  join(ROOT, 'robots.txt'),
  robots + (baseUrl ? 'Sitemap: ' + baseUrl + 'sitemap.xml\n' : '')
);

console.log('build: ' + posts.length + ' páginas HTML + sitemap.xml + robots.txt + posts/index.json' +
  (drafts.length ? ' (' + drafts.length + ' draft(s) fora do site)' : ''));
if (!baseUrl) {
  console.log('  (aviso: BASE_URL não definida — canonical/og/sitemap ficaram com URL relativa)');
}
