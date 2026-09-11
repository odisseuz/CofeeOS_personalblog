// markdown renderer
let footnotes = {};

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function safeUrl(url) {
  const u = url.trim();
  if (/^(javascript:|data:|vbscript:)/i.test(u)) return '#';
  return escapeHtml(u).replace(/"/g, '&quot;');
}

function extractFootnotes(lines) {
  const notes = {};
  const rest = [];
  let i = 0;
  while (i < lines.length) {
    const m = /^\[\^([^\]]+)\]:\s*(.*)$/.exec(lines[i]);
    if (m) {
      const parts = [m[2]];
      i++;
      while (i < lines.length && /^\s{2,}/.test(lines[i])) {
        parts.push(lines[i].trim());
        i++;
      }
      notes[m[1]] = parts.join(' ');
    } else {
      rest.push(lines[i]);
      i++;
    }
  }
  return { footnotes: notes, lines: rest };
}

function inline(s) {
  let out = escapeHtml(s);

  // escapes: \* \_ \` \[ \] … viram texto literal
  const escaped = [];
  out = out.replace(/\\(.)/g, function (m, ch) {
    if ('\\`*_~[]()'.indexOf(ch) !== -1) {
      escaped.push(ch);
      return '\u0000' + (escaped.length - 1) + '\u0000';
    }
    return m;
  });

  out = out.replace(/\[\^([^\]]+)\]/g, function (m, label) {
    if (!footnotes[label]) return m;
    return '<sup><a href="#fn-' + label + '" id="fnref-' + label + '">' + label + '</a></sup>';
  });
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, url) {
    return '<img src="' + safeUrl(url) + '" alt="' + alt.replace(/"/g, '&quot;') + '" loading="lazy">';
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, text, url) {
    return '<a href="' + safeUrl(url) + '">' + text + '</a>';
  });
  // autolinks <https://...>
  out = out.replace(/&lt;((?:https?:\/\/|ftp:\/\/)[^\s<>&]+)&gt;/g, function (m, url) {
    return '<a href="' + safeUrl(url) + '">' + url + '</a>';
  });
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  out = out.replace(/_([^_]+)_/g, '<em>$1</em>');
  out = out.replace(/~~([^~]+)~~/g, '<s>$1</s>');

  // restaura os escapes
  out = out.replace(/\u0000(\d+)\u0000/g, function (m, idx) {
    return escaped[Number(idx)];
  });

  return out;
}

function isBlockStart(line) {
  const t = line.trim();
  return t === '' ||
    /^```/.test(t) ||
    /^#{1,6}\s/.test(t) ||
    /^\s*(---|\*\*\*|___)\s*$/.test(t) ||
    /^\s*>\s?/.test(t) ||
    /^\s*[-*+]\s/.test(t) ||
    /^\s*\d+\.\s/.test(t);
}

function renderMarkdown(text) {
  const raw = text.replace(/\r\n/g, '\n').split('\n');
  const extracted = extractFootnotes(raw);
  footnotes = extracted.footnotes;
  const lines = extracted.lines;
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.trim().startsWith('```')) {
      const lang = line.trim().slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      const langClass = lang ? ' class="language-' + escapeHtml(lang) + '"' : '';
      out.push('<pre><code' + langClass + '>' + escapeHtml(buf.join('\n')) + '</code></pre>');
      continue;
    }

    if (line.trim() === '') { i++; continue; }

    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const level = h[1].length;
      out.push('<h' + level + '>' + inline(h[2]) + '</h' + level + '>');
      i++;
      continue;
    }

    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push('<blockquote>' + inline(buf.join(' ')) + '</blockquote>');
      continue;
    }

    if (/^\s*[-*+]\s+\[[ xX]\]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+\[[ xX]\]\s+/.test(lines[i])) {
        const m = /^\s*[-*+]\s+\[([ xX])\]\s+(.*)$/.exec(lines[i]);
        const checked = m[1].toLowerCase() === 'x';
        items.push('<li><input type="checkbox" disabled' + (checked ? ' checked' : '') + '>' + inline(m[2]) + '</li>');
        i++;
      }
      out.push('<ul class="task-list">' + items.join('') + '</ul>');
      continue;
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push('<li>' + inline(lines[i].replace(/^\s*[-*+]\s+/, '')) + '</li>');
        i++;
      }
      out.push('<ul>' + items.join('') + '</ul>');
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push('<li>' + inline(lines[i].replace(/^\s*\d+\.\s+/, '')) + '</li>');
        i++;
      }
      out.push('<ol>' + items.join('') + '</ol>');
      continue;
    }

    const buf = [];
    while (i < lines.length && !isBlockStart(lines[i])) {
      buf.push(lines[i].trim());
      i++;
    }
    if (buf.length) out.push('<p>' + inline(buf.join(' ')) + '</p>');
  }

  if (Object.keys(footnotes).length) {
    const items = [];
    Object.keys(footnotes).forEach(function (label) {
      items.push('<li id="fn-' + label + '">' + inline(footnotes[label]) + ' <a href="#fnref-' + label + '" class="fn-back">↩</a></li>');
    });
    out.push('<div class="footnotes"><hr><ol>' + items.join('') + '</ol></div>');
  }

  return out.join('\n');
}

function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] && lines[0].trim() !== '---') {
    return { data: {}, body: text };
  }
  const data = {};
  let i = 1;
  while (i < lines.length && lines[i].trim() !== '---') {
    const m = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/.exec(lines[i]);
    if (m) data[m[1]] = m[2].trim();
    i++;
  }
  if (i < lines.length) i++;
  return { data: data, body: lines.slice(i).join('\n') };
}
