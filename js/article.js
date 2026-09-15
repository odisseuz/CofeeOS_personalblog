// artigo (overlay) + notas
import { articleOverlay, fmOverlay, originalTitle, state } from './state.js';
import { escapeHtml, renderMarkdown, parseFrontmatter } from './markdown.js';
import { extractMath, injectMath, hasMath } from './math.js';
import { resetWindow, notifyOverlayChange, makeTabbable, isNarrow, maximize } from './windows.js';
import { setHash, hashForFile, hashForFolder } from './routing.js';
import { groupFromFile, getPostIndex, seriesPosition } from './data.js';
import { updateDockActive } from './finder.js';
import { isAbout, t } from './lang.js';

let loadToken = 0;
let katexCssLoaded = false;

// O CSS do KaTeX (e as fontes que ele referencia) só é baixado quando o primeiro
// post com fórmula é aberto — as páginas estáticas já trazem o link no <head>.
function ensureKatexCss() {
  if (katexCssLoaded || document.querySelector('link[data-katex]')) {
    katexCssLoaded = true;
    return;
  }
  katexCssLoaded = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'js/vendor/katex/katex.min.css';
  link.setAttribute('data-katex', '');
  document.head.appendChild(link);
}

export function loadNote(file, body, filenameEl, statusEl) {
  const token = ++loadToken;
  const filename = file.split('/').pop();
  if (filenameEl) filenameEl.textContent = filename;
  document.title = filename + ' — note';

  fetch(file)
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.text();
    })
    .then(function (text) {
      if (token !== loadToken) return;
      const parsed = parseFrontmatter(text);
      const title = parsed.data.title;
      const date = parsed.data.date;
      let html = '';
      if (title) {
        html += '<h1 class="note-title">' + escapeHtml(title) + '</h1>';
        if (date) html += '<p class="note-date">' + escapeHtml(date) + '</p>';
      }
      // math primeiro: o marked destruiria o TeX (`_`, `*`, `\`)
      const math = hasMath(parsed.body) ? extractMath(parsed.body) : null;
      html += renderMarkdown(math ? math.text : parsed.body);
      if (parsed.data.series) html += seriesNavHtml();
      body.innerHTML = html;
      if (math) {
        ensureKatexCss();
        injectMath(body.innerHTML, math.found).then(function (final) {
          if (token !== loadToken) return;
          body.innerHTML = final;
          buildToc(body);
        });
      }
      fillSeriesNav(file);
      body.scrollTop = 0;
      const tocPanel = document.getElementById('toc-panel');
      if (tocPanel) tocPanel.scrollTop = 0;
      buildToc(body);
      if (isAbout(file)) {
        body.insertAdjacentHTML('beforeend', contactFormHtml());
        wireContactForm();
      }
      // "zen": a versão limpa (HTML estático) — só pros posts de verdade
      const zen = document.getElementById('zen-post');
      if (zen) {
        const isPost = file.indexOf('posts/') === 0 &&
          !isAbout(file) &&
          file.indexOf('LICENSE') === -1;
        zen.hidden = !isPost;
        if (isPost) zen.href = file.replace(/\.md$/, '.html');
      }
      const words = parsed.body.trim() ? parsed.body.trim().split(/\s+/).length : 0;
      if (statusEl) statusEl.textContent = '"' + filename + '" ' + words + ' words';
    })
    .catch(function () {
      if (token !== loadToken) return;
      let hint = 'create the file, check the path in the link, or check posts/manifest.json.';
      if (window.location.protocol === 'file:') {
        hint = 'you opened this via file://, and fetch cannot read local files.\n\nrun a local server instead, like:\n  python3 -m http.server\n\nthen open http://localhost:8000';
      }
      body.innerHTML = renderMarkdown('could not load "' + filename + '".\n\n' + hint);
      if (statusEl) statusEl.textContent = '"' + filename + '"';
    });
}

export function loadNotesFor(file) {
  const area = document.getElementById('notes-area');
  if (!area) return;
  state.currentNoteFile = file;
  setNotesMode('edit');
  try {
    area.value = localStorage.getItem('coffeeos:notes:' + file) || '';
  } catch (e) {
    area.value = '';
  }
}

export function saveNotes() {
  const area = document.getElementById('notes-area');
  if (!area || !state.currentNoteFile) return;
  try {
    localStorage.setItem('coffeeos:notes:' + state.currentNoteFile, area.value);
  } catch (e) {}
}

// alterna entre editar (textarea) e visualizar (markdown renderizado)
export function setNotesMode(mode) {
  const area = document.getElementById('notes-area');
  const preview = document.getElementById('notes-preview-body');
  const btn = document.getElementById('notes-preview');
  if (!area || !preview) return;
  if (mode === 'preview') {
    preview.innerHTML = renderMarkdown(area.value);
    area.hidden = true;
    preview.hidden = false;
    if (btn) btn.textContent = 'edit';
  } else {
    area.hidden = false;
    preview.hidden = true;
    if (btn) btn.textContent = 'preview';
  }
}

export function downloadNotes() {
  const area = document.getElementById('notes-area');
  if (!area || !state.currentNoteFile) return;
  const content = area.value;
  if (!content.trim()) return;
  const name = (state.currentNoteFile.split('/').pop() || 'notes').replace(/\.md$/, '') + '.notes.md';
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// âncoras internas do artigo (footnotes, links `#`) precisam rolar o
// .editor-body, não a página: o Safari desloca o <html> e a barra de cima
// some (mesmo bug que o índice tinha). Intercepta e rola o container.
document.addEventListener('click', function (e) {
  const link = e.target.closest('a[href^="#"]');
  if (!link) return;
  const body = document.getElementById('editor-body');
  if (!body || !body.contains(link)) return;
  const id = link.getAttribute('href').slice(1);
  if (!id) return;
  const alvo = body.querySelector('#' + CSS.escape(id));
  if (!alvo) return;
  e.preventDefault();
  const scroller = body.closest('.editor-body') || body;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = alvo.getBoundingClientRect().top - scroller.getBoundingClientRect().top +
    scroller.scrollTop - scroller.clientTop;
  scroller.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
});

export function openArticle(file) {
  if (!articleOverlay) return;
  state.lastFocus = document.activeElement;
  state.currentArticleFile = file;
  if (window.getSelection) window.getSelection().removeAllRanges();
  loadNote(file,
    document.getElementById('editor-body'),
    document.getElementById('filename'),
    document.getElementById('status'));
  loadNotesFor(file);
  const editor = document.querySelector('#overlay .editor');
  resetWindow(editor);
  if (editor) {
    editor.classList.remove('show-notes');
    editor.classList.remove('show-toc');
    editor.classList.toggle('is-about', isAbout(file));
    // no celular a janela abre em tela cheia (senão o texto fica espremido)
    if (isNarrow()) maximize(editor);
  }
  if (state.articleFromFinder) {
    articleOverlay.classList.add('over-finder');
  } else {
    articleOverlay.classList.remove('over-finder');
  }
  articleOverlay.classList.add('open');
  notifyOverlayChange();
  const closeBtn = document.getElementById('overlay-close');
  if (closeBtn) closeBtn.focus();
  setHash(hashForFile(file));
  updateDockActive(groupFromFile(file));
}

export function closeArticle() {
  if (!articleOverlay) return;
  saveNotes();
  state.currentArticleFile = null;
  articleOverlay.classList.remove('open');
  articleOverlay.classList.remove('over-finder');
  if (state.articleFromFinder) {
    state.articleFromFinder = false;
    fmOverlay.classList.remove('dimmed');
    notifyOverlayChange();
    setHash(hashForFolder(state.currentPath));
    updateDockActive(state.currentPath.length ? state.currentPath[0] : 'home');
  } else {
    notifyOverlayChange();
    setHash('#/');
    updateDockActive(null);
  }
  document.title = originalTitle;
  if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
}

// navegação de série no pé do artigo: "part 2 of 6" + prev/next.
// Renderiza um container vazio e preenche via DOM (o corpo usa innerHTML,
// então devolvemos só a marcação do container).
function seriesNavHtml() {
  return '<div class="series-nav" data-series-nav hidden></div>';
}

function fillSeriesNav(file) {
  const el = document.querySelector('[data-series-nav]');
  if (!el) return;
  el.innerHTML = '';
  el.hidden = true;
  getPostIndex().then(function (all) {
    const self = all.filter(function (p) { return p.path === file; })[0];
    const pos = seriesPosition(self, all);
    if (!pos) return;
    const prev = pos.index > 1 ? pos.items[pos.index - 2] : null;
    const next = pos.index < pos.total ? pos.items[pos.index] : null;

    const label = document.createElement('p');
    label.className = 'series-label';
    label.textContent = pos.series + '\u00a0\u00b7\u00a0part ' + pos.index + ' of ' + pos.total;
    el.appendChild(label);

    const row = document.createElement('div');
    row.className = 'series-links';
    if (prev) {
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'series-link';
      makeTabbable(a);
      a.textContent = '\u2190 ' + prev.title;
      a.addEventListener('click', function () { openArticle(prev.path); });
      row.appendChild(a);
    }
    if (next) {
      const a = document.createElement('button');
      a.type = 'button';
      a.className = 'series-link series-next';
      makeTabbable(a);
      a.textContent = next.title + ' \u2192';
      a.addEventListener('click', function () { openArticle(next.path); });
      row.appendChild(a);
    }
    el.appendChild(row);
    el.hidden = false;
  });
}

// formulário de contato (página about). Os rótulos saem do léxico de UI
// (js/lang.js), então acompanham o idioma ativo como o resto da página.
function contactFormHtml() {
  return '<div class="contact-form">' +
    '<p class="contact-form-title">' + t('contactTitle') + '</p>' +
    '<input id="contact-subject" type="text" aria-label="' + t('subject') +
      '" placeholder="' + t('subject') + '" spellcheck="false">' +
    '<textarea id="contact-message" aria-label="' + t('message') +
      '" placeholder="' + t('message') + '" spellcheck="false"></textarea>' +
    '<div class="contact-form-row">' +
    '<input id="contact-email" type="email" aria-label="' + t('email') +
      '" placeholder="' + t('email') + '" autocomplete="off" spellcheck="false">' +
    '<button id="contact-send" type="button" tabindex="0">' + t('send') + '</button>' +
    '</div>' +
    '</div>';
}

function wireContactForm() {
  const send = document.getElementById('contact-send');
  const msg = document.getElementById('contact-message');
  const email = document.getElementById('contact-email');
  const subject = document.getElementById('contact-subject');
  if (!send || !msg || !email) return;
  send.addEventListener('click', function () {
    const text = msg.value.trim();
    if (!text) { msg.focus(); return; }
    let body = text;
    if (email.value.trim()) body += '\n\n(' + email.value.trim() + ')';
    const subj = subject && subject.value.trim() ? subject.value.trim() : t('mailSubject');
    window.location.href = 'mailto:andregomes.academico@gmail.com?subject=' +
      encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
  });
}

// índice (table of contents) dos headings
function slugify(s) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/ +/g, '-')
    .replace(/-+/g, '-');
}

function buildToc(container) {
  const tocPanel = document.getElementById('toc-panel');
  if (!tocPanel) return;
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  tocPanel.innerHTML = '';
  if (!headings.length) {
    const empty = document.createElement('p');
    empty.className = 'toc-empty';
    empty.textContent = 'no headings';
    tocPanel.appendChild(empty);
    return;
  }
  const used = {};
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  headings.forEach(function (h) {
    if (h.classList.contains('note-title') || h.closest('.footnotes')) return;
    let id = slugify(h.textContent);
    if (!id) id = 'section';
    if (used[id]) { used[id]++; id = id + '-' + used[id]; }
    else used[id] = 1;
    h.id = id;
    const level = parseInt(h.tagName.charAt(1), 10);
    const link = document.createElement('button');
    link.type = 'button';
    link.className = 'toc-link toc-l' + level;
    makeTabbable(link);
    link.textContent = h.textContent;
    link.addEventListener('click', function () {
      scrollBodyTo(container, h, reduceMotion);
    });
    tocPanel.appendChild(link);
  });
}

// scrolla só o container do artigo (não o documento) — evita o bug de
// scroll suave do Chrome/Safari deslocar o <html> e sumir com a barra de cima
function scrollBodyTo(container, heading, reduceMotion) {
  const scroller = container.closest('.editor-body') || container;
  const target = heading.getBoundingClientRect().top - scroller.getBoundingClientRect().top +
    scroller.scrollTop - scroller.clientTop;
  scroller.scrollTo({
    top: target,
    behavior: reduceMotion ? 'auto' : 'smooth'
  });
}
