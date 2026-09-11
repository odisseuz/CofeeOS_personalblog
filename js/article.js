// artigo (overlay) + notas
import { articleOverlay, fmOverlay, originalTitle, state } from './state.js';
import { escapeHtml, renderMarkdown, parseFrontmatter } from './markdown.js';
import { resetWindow, setBackdropInert } from './windows.js';
import { setHash, hashForFile, hashForFolder } from './routing.js';
import { groupFromFile } from './data.js';
import { updateDockActive } from './finder.js';

export function loadNote(file, body, filenameEl, statusEl) {
  const filename = file.split('/').pop();
  if (filenameEl) filenameEl.textContent = filename;
  document.title = filename + ' — note';

  fetch(file)
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.text();
    })
    .then(function (text) {
      const parsed = parseFrontmatter(text);
      const title = parsed.data.title;
      const date = parsed.data.date;
      let html = '';
      if (title) {
        html += '<h1 class="note-title">' + escapeHtml(title) + '</h1>';
        if (date) html += '<p class="note-date">' + escapeHtml(date) + '</p>';
      }
      html += renderMarkdown(parsed.body);
      body.innerHTML = html;
      if (file === 'posts/about.md') {
        body.insertAdjacentHTML('beforeend', contactFormHtml());
        wireContactForm();
      }
      const words = parsed.body.trim() ? parsed.body.trim().split(/\s+/).length : 0;
      if (statusEl) statusEl.textContent = '"' + filename + '" ' + words + ' words';
    })
    .catch(function () {
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

export function openArticle(file) {
  if (!articleOverlay) return;
  state.lastFocus = document.activeElement;
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
    editor.classList.toggle('is-about', file === 'posts/about.md');
  }
  if (state.articleFromFinder) {
    articleOverlay.classList.add('over-finder');
  } else {
    articleOverlay.classList.remove('over-finder');
  }
  articleOverlay.classList.add('open');
  setBackdropInert(true);
  document.body.style.overflow = 'hidden';
  const closeBtn = document.getElementById('overlay-close');
  if (closeBtn) closeBtn.focus();
  setHash(hashForFile(file));
  updateDockActive(groupFromFile(file));
}

export function closeArticle() {
  if (!articleOverlay) return;
  saveNotes();
  articleOverlay.classList.remove('open');
  articleOverlay.classList.remove('over-finder');
  if (state.articleFromFinder) {
    state.articleFromFinder = false;
    fmOverlay.classList.remove('dimmed');
    document.body.style.overflow = 'hidden';
    setHash(hashForFolder(state.currentPath));
    updateDockActive(state.currentPath.length ? state.currentPath[0] : 'home');
  } else {
    setBackdropInert(false);
    document.body.style.overflow = '';
    setHash('#/');
    updateDockActive(null);
  }
  document.title = originalTitle;
  if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
}

// formulário de contato (página about)
function contactFormHtml() {
  return '<div class="contact-form">' +
    '<p class="contact-form-title">write me a message</p>' +
    '<input id="contact-subject" type="text" aria-label="Subject" placeholder="subject" spellcheck="false">' +
    '<textarea id="contact-message" aria-label="Message" placeholder="your message…" spellcheck="false"></textarea>' +
    '<div class="contact-form-row">' +
    '<input id="contact-email" type="email" aria-label="Your email" placeholder="your email (so I can reply)" autocomplete="off" spellcheck="false">' +
    '<button id="contact-send" type="button">send</button>' +
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
    if (email.value.trim()) body += '\n\n— ' + email.value.trim();
    const subj = subject && subject.value.trim() ? subject.value.trim() : 'Hello from coffeeOS';
    window.location.href = 'mailto:andregomes.academico@gmail.com?subject=' +
      encodeURIComponent(subj) + '&body=' + encodeURIComponent(body);
  });
}
