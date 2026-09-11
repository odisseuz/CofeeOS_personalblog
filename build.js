// build.js — gera HTML estático dos posts (SEO) + sitemap.xml
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderMarkdown, parseFrontmatter } from './js/markdown.js';

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

function excerpt(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);
}

// imagens no markdown são relativas à raiz (images/...); nas páginas geradas,
// elas precisam do prefixo relativo pra apontar pra raiz de novo
function rootRelative(html, depth) {
  const prefix = '../'.repeat(depth);
  return html
    .replaceAll('src="images/', 'src="' + prefix + 'images/')
    .replaceAll('href="images/', 'href="' + prefix + 'images/');
}

function page(relMd, data, bodyHtml, recent) {
  const relHtml = relMd.replace(/\.md$/, '.html');
  const depth = relHtml.split('/').length - 1;
  const up = '../'.repeat(depth);
  const title = data.title || relMd.split('/').pop().replace(/\.md$/, '');
  const desc = excerpt(bodyHtml);
  const url = baseUrl + relHtml;
  const dateHtml = data.date ? '<p class="note-date">' + esc(data.date) + '</p>' : '';
  const body = rootRelative(bodyHtml, depth);

  const links = recent
    .filter(function (p) { return p.relHtml !== relHtml; })
    .map(function (p) {
      return '      <li><a href="' + esc(up + p.relHtml) + '">' + esc(p.title) + '</a></li>';
    })
    .join('\n');

  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="UTF-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<title>' + esc(title) + ' — midnight coffee</title>\n' +
    '<meta name="description" content="' + esc(desc) + '">\n' +
    '<link rel="canonical" href="' + esc(url) + '">\n' +
    '<meta property="og:type" content="article">\n' +
    '<meta property="og:title" content="' + esc(title) + '">\n' +
    '<meta property="og:description" content="' + esc(desc) + '">\n' +
    '<meta property="og:url" content="' + esc(url) + '">\n' +
    '<meta name="twitter:card" content="summary">\n' +
    '<link rel="icon" type="image/svg+xml" href="' + up + 'favicon.svg">\n' +
    '<link rel="stylesheet" href="' + up + 'style.css">\n' +
    '</head>\n' +
    '<body>\n' +
    '<main class="page static-page">\n' +
    '  <article class="editor-body static-article">\n' +
    '    <h1 class="note-title">' + esc(title) + '</h1>\n' +
    (dateHtml ? '    ' + dateHtml + '\n' : '') +
    body + '\n' +
    '  </article>\n' +
    '  <p class="static-back"><a href="' + esc(up + 'index.html#~/' + relMd.replace(/^posts\//, '')) + '">← abrir no coffeeOS</a></p>\n' +
    '  <footer class="static-footer">\n' +
    '    <p class="static-home"><a href="' + esc(up + 'index.html') + '">← midnight coffee</a></p>\n' +
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
const posts = entries.map(function (relMd) {
  const { data } = parseFrontmatter(readFileSync(join(ROOT, relMd), 'utf8'));
  return {
    relMd: relMd,
    relHtml: relMd.replace(/\.md$/, '.html'),
    title: data.title || relMd.split('/').pop().replace(/\.md$/, ''),
    date: data.date || ''
  };
});

// posts recentes (por data) pra linkar no rodapé
const recent = posts.slice().sort(function (a, b) {
  return String(b.date).localeCompare(String(a.date));
}).slice(0, 5);

// segunda passada: gera as páginas
for (const p of posts) {
  const absMd = join(ROOT, p.relMd);
  const { data, body } = parseFrontmatter(readFileSync(absMd, 'utf8'));
  const html = page(p.relMd, data, renderMarkdown(body), recent);
  const absHtml = join(ROOT, p.relHtml);
  mkdirSync(dirname(absHtml), { recursive: true });
  writeFileSync(absHtml, html);
}

const urls = entries
  .map(function (relMd) {
    return '  <url><loc>' + esc(baseUrl + relMd.replace(/\.md$/, '.html')) + '</loc></url>';
  })
  .join('\n');
writeFileSync(
  join(ROOT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls + '\n' +
    '</urlset>\n'
);

console.log('build: ' + entries.length + ' páginas HTML + sitemap.xml');
if (!baseUrl) {
  console.log('  (aviso: BASE_URL não definida — canonical/og/sitemap ficaram com URL relativa)');
}
