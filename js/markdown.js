// markdown renderer — marked + footnote plugin (vendorizado em js/vendor/)
import { Marked } from './vendor/marked.esm.js';
import footnote from './vendor/marked-footnote.esm.js';

export function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// bloqueia URLs perigosas (javascript:, data:, vbscript:)
function safeUrl(url) {
  const u = String(url).trim();
  if (/^(javascript:|data:|vbscript:)/i.test(u)) return '#';
  return escapeHtml(u).replace(/"/g, '&quot;');
}

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    // HTML cru é escapado (segurança, igual o renderer antigo)
    html(token) { return escapeHtml(token.text); },
    // links: bloqueia javascript: e mantém markdown inline no texto
    link(token) {
      const text = token.autolink
        ? escapeHtml(token.text)
        : this.parser.parseInline(token.tokens);
      return '<a href="' + safeUrl(token.href) + '">' + text + '</a>';
    },
    // imagens: safeUrl + loading lazy (como antes)
    image(token) {
      return '<img src="' + safeUrl(token.href) + '" alt="' + escapeHtml(token.text || '') + '" loading="lazy">';
    }
  }
});
marked.use(footnote());

export function renderMarkdown(text) {
  return marked.parse(text);
}

export function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] && lines[0].trim() !== '---') {
    return { data: {}, body: text };
  }
  const data = {};
  let i = 1;
  while (i < lines.length && lines[i].trim() !== '---') {
    const m = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/.exec(lines[i]);
    if (m) data[m[1]] = desquote(m[2].trim());
    i++;
  }
  if (i < lines.length) i++;
  return { data: data, body: lines.slice(i).join('\n') };
}

// Tira as aspas de um valor de frontmatter. Necessário porque um título com
// `:` (ex.: `title: "Ch 1: Cause and Effect"`) precisa das aspas no YAML —
// sem isso, o `:` seria lido como separador. O valor é literal, então as
// aspas são sintaxe, não conteúdo.
function desquote(v) {
  if (v.length >= 2) {
    const primeiro = v[0];
    const ultimo = v[v.length - 1];
    if ((primeiro === '"' && ultimo === '"') || (primeiro === "'" && ultimo === "'")) {
      return v.slice(1, -1);
    }
  }
  return v;
}
