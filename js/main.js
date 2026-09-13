// wiring
import { makeWindow, resetWindow, makeMaximize, trapFocus } from './windows.js';
import { articleOverlay, fmOverlay, state } from './state.js';
import { closeArticle, openArticle, setNotesMode, downloadNotes, saveNotes } from './article.js';
import { closeFolder, navigateUp, navigateInto, renderFinder, applyFinderFilter, openFolder } from './finder.js';
import { route } from './routing.js';
import { loadRecentPosts, setupSearch } from './search.js';
import { loadManifest } from './data.js';
import { initTerminal, focusTerminal, runCommand } from './terminal.js';
import { initNotepad, focusNotepad } from './notepad.js';
import { initIdleChrome } from './idle.js';
import './theme.js';

(function () {
  makeWindow(
    document.querySelector('#overlay .editor'),
    document.querySelector('#overlay .editor-bar'),
    document.querySelector('#overlay .resize-handle')
  );
  makeWindow(
    document.querySelector('#fm-overlay .finder'),
    document.querySelector('#fm-overlay .finder-bar'),
    document.querySelector('#fm-overlay .resize-handle')
  );

  makeMaximize(
    document.querySelector('#overlay .editor'),
    document.getElementById('editor-maximize')
  );
  makeMaximize(
    document.querySelector('#fm-overlay .finder'),
    document.getElementById('fm-maximize')
  );

  // visualizador de imagem (janela)
  const imgOverlay = document.getElementById('img-overlay');
  const imgViewer = document.querySelector('#img-overlay .img-viewer');
  const imgView = document.getElementById('img-view');
  const imgFilename = document.getElementById('img-filename');
  const imgClose = document.getElementById('img-close');
  const imgBackdrop = document.getElementById('img-backdrop');
  makeWindow(imgViewer, document.querySelector('#img-overlay .img-bar'), document.querySelector('#img-overlay .resize-handle'));
  makeMaximize(imgViewer, document.getElementById('img-maximize'));

  function closeImageViewer() {
    if (imgOverlay) imgOverlay.classList.remove('open');
    if (imgView) imgView.removeAttribute('src');
  }
  function openImageViewer(src) {
    if (!imgOverlay || !imgView) return;
    resetWindow(imgViewer);
    imgView.src = src;
    if (imgFilename) imgFilename.textContent = src.split('/').pop() || 'image';
    imgOverlay.classList.add('open');
    if (imgClose) imgClose.focus();
  }

  document.addEventListener('click', function (e) {
    const img = e.target.closest('.editor-body img');
    if (!img || img.closest('a')) return;
    e.preventDefault();
    openImageViewer(img.src);
  });
  if (imgClose) imgClose.addEventListener('click', closeImageViewer);
  if (imgBackdrop) imgBackdrop.addEventListener('click', closeImageViewer);

  // janela de terminal
  const termOverlay = document.getElementById('term-overlay');
  const termWindow = document.querySelector('#term-overlay .term-window');
  const termClose = document.getElementById('term-close');
  const termBackdrop = document.getElementById('term-backdrop');
  makeWindow(termWindow, document.getElementById('term-window-bar'), document.querySelector('#term-overlay .resize-handle'));
  makeMaximize(termWindow, document.getElementById('term-maximize'));

  function closeTerminal() {
    if (termOverlay) termOverlay.classList.remove('open');
  }
  function openTerminal() {
    if (!termOverlay) return;
    resetWindow(termWindow);
    termOverlay.classList.add('open');
    focusTerminal();
  }
  if (termClose) termClose.addEventListener('click', closeTerminal);
  if (termBackdrop) termBackdrop.addEventListener('click', closeTerminal);

  // terminal de verdade (só inicializa depois dos elementos existirem)
  initTerminal();

  // hom prompt: digitar na home abre a janela e roda o comando lá
  const homeTerm = document.getElementById('home-term');
  const homeTermInput = document.getElementById('home-term-input');
  if (homeTerm && homeTermInput) {
    homeTerm.addEventListener('click', function () {
      homeTermInput.focus();
    });
    homeTermInput.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter') return;
      const value = homeTermInput.value.trim();
      homeTermInput.value = '';
      if (!value) { openTerminal(); return; }
      openTerminal();
      runCommand(value);
    });
  }

  // janela de configurações (System Settings)
  const settingsOverlay = document.getElementById('settings-overlay');
  const settingsWindow = document.querySelector('#settings-overlay .settings-window');
  const settingsClose = document.getElementById('settings-close');
  const settingsBackdrop = document.getElementById('settings-backdrop');
  const settingsToggle = document.getElementById('settings-toggle');
  makeWindow(
    settingsWindow,
    document.getElementById('settings-bar'),
    document.querySelector('#settings-overlay .resize-handle')
  );
  makeMaximize(settingsWindow, document.getElementById('settings-maximize'));

  function closeSettings() {
    if (settingsOverlay) settingsOverlay.classList.remove('open');
  }
  function openSettings() {
    if (!settingsOverlay) return;
    resetWindow(settingsWindow);
    settingsOverlay.classList.add('open');
    if (settingsClose) settingsClose.focus();
  }
  if (settingsToggle) settingsToggle.addEventListener('click', openSettings);
  if (settingsClose) settingsClose.addEventListener('click', closeSettings);
  if (settingsBackdrop) settingsBackdrop.addEventListener('click', closeSettings);

  // janela de notepad
  const notesOverlay = document.getElementById('notes-overlay');
  const notepadWindow = document.querySelector('#notes-overlay .notepad-window');
  const notepadClose = document.getElementById('notepad-close');
  const notesBackdrop = document.getElementById('notes-backdrop');
  makeWindow(notepadWindow, document.getElementById('notepad-bar'), document.querySelector('#notes-overlay .resize-handle'));
  makeMaximize(notepadWindow, document.getElementById('notepad-maximize'));

  function closeNotepad() {
    if (notesOverlay) notesOverlay.classList.remove('open');
  }
  function openNotepad() {
    if (!notesOverlay) return;
    resetWindow(notepadWindow);
    notesOverlay.classList.add('open');
    focusNotepad();
  }
  if (notepadClose) notepadClose.addEventListener('click', closeNotepad);
  if (notesBackdrop) notesBackdrop.addEventListener('click', closeNotepad);
  initNotepad();
  initIdleChrome();

  // popover de apps no dock
  const appsPop = document.getElementById('apps-pop');
  const appsToggle = document.getElementById('apps-toggle');
  if (appsPop && appsToggle) {
    appsToggle.addEventListener('click', function () {
      const open = appsPop.classList.toggle('open');
      appsToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!appsPop.classList.contains('open')) return;
      if (e.target.closest('.dock-pop-item')) {
        appsPop.classList.remove('open');
        appsToggle.setAttribute('aria-expanded', 'false');
        return;
      }
      if (appsPop.contains(e.target)) return;
      appsPop.classList.remove('open');
      appsToggle.setAttribute('aria-expanded', 'false');
    });
  }

  if (articleOverlay) {
    const closeBtn = document.getElementById('overlay-close');
    const backdrop = document.getElementById('overlay-backdrop');
    if (closeBtn) closeBtn.addEventListener('click', closeArticle);
    if (backdrop) backdrop.addEventListener('click', closeArticle);
  }

  if (fmOverlay) {
    const closeBtn = document.getElementById('fm-close');
    const backdrop = document.getElementById('fm-backdrop');
    const backBtn = document.getElementById('fm-back');
    if (closeBtn) closeBtn.addEventListener('click', closeFolder);
    if (backdrop) backdrop.addEventListener('click', closeFolder);
    if (backBtn) backBtn.addEventListener('click', navigateUp);

    const body = document.getElementById('fm-body');
    if (body) {
      body.addEventListener('click', function (e) {
        const folderBtn = e.target.closest('.finder-folder');
        if (folderBtn) {
          navigateInto(folderBtn.getAttribute('data-folder'));
          return;
        }
        const fileBtn = e.target.closest('.finder-file');
        if (!fileBtn) return;
        state.articleFromFinder = true;
        fmOverlay.classList.add('dimmed');
        openArticle(fileBtn.getAttribute('data-file'));
      });
    }

    const pathInput = document.getElementById('fm-path');
    if (pathInput) {
      pathInput.addEventListener('keydown', function (e) {
        if (e.key !== 'Enter') return;
        const cleaned = pathInput.value.trim().replace(/^~\/?/, '').replace(/^\/+/, '');
        state.currentPath = cleaned ? cleaned.split('/').filter(Boolean) : [];
        renderFinder();
      });
    }

    const searchInput = document.getElementById('fm-search');
    if (searchInput) {
      searchInput.addEventListener('input', function () {
        state.finderFilter = searchInput.value;
        applyFinderFilter();
      });
    }
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (appsPop && appsPop.classList.contains('open')) { appsPop.classList.remove('open'); appsToggle.setAttribute('aria-expanded', 'false'); return; }
      if (imgOverlay && imgOverlay.classList.contains('open')) { closeImageViewer(); return; }
      if (settingsOverlay && settingsOverlay.classList.contains('open')) { closeSettings(); return; }
      if (notesOverlay && notesOverlay.classList.contains('open')) { closeNotepad(); return; }
      if (termOverlay && termOverlay.classList.contains('open')) { closeTerminal(); return; }
      if (articleOverlay && articleOverlay.classList.contains('open')) closeArticle();
      else if (fmOverlay && fmOverlay.classList.contains('open')) closeFolder();
      return;
    }
    if (e.key !== 'Tab') return;

    let container = null;
    if (articleOverlay && articleOverlay.classList.contains('open')) {
      container = articleOverlay.querySelector('.editor');
    } else if (fmOverlay && fmOverlay.classList.contains('open')) {
      container = fmOverlay.querySelector('.finder');
    }
    if (container) trapFocus(container, e);
  });

  document.addEventListener('click', function (e) {
    const homeEl = e.target.closest('[data-home]');
    if (homeEl) {
      e.preventDefault();
      openFolder([]);
      return;
    }
    const searchEl = e.target.closest('[data-dock-search]');
    if (searchEl) {
      e.preventDefault();
      const input = document.getElementById('search-input');
      if (input) {
        input.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }
    const termEl = e.target.closest('[data-dock-term]');
    if (termEl) {
      e.preventDefault();
      openTerminal();
      return;
    }
    const notesEl = e.target.closest('[data-dock-notes]');
    if (notesEl) {
      e.preventDefault();
      openNotepad();
      return;
    }
    const groupEl = e.target.closest('[data-group]');
    if (groupEl) {
      e.preventDefault();
      openFolder([groupEl.getAttribute('data-group')]);
      return;
    }
    const noteEl = e.target.closest('[data-note]');
    if (noteEl) {
      e.preventDefault();
      state.articleFromFinder = false;
      openArticle(noteEl.getAttribute('data-note'));
    }
  });

  loadRecentPosts();
  setupSearch();

  const notesEditor = document.querySelector('#overlay .editor');
  const notesToggle = document.getElementById('notes-toggle');
  const notesArea = document.getElementById('notes-area');
  const notesQuote = document.getElementById('notes-quote');
  const notesClear = document.getElementById('notes-clear');
  const notesPreviewBtn = document.getElementById('notes-preview');
  const notesDownloadBtn = document.getElementById('notes-download');
  const notesPreviewBody = document.getElementById('notes-preview-body');

  if (notesEditor && notesToggle) {
    notesToggle.addEventListener('click', function () {
      notesEditor.classList.toggle('show-notes');
      if (notesEditor.classList.contains('show-notes') && notesArea) notesArea.focus();
    });
  }

  const tocToggle = document.getElementById('toc-toggle');
  if (tocToggle && notesEditor) {
    tocToggle.addEventListener('click', function () {
      notesEditor.classList.toggle('show-toc');
    });
  }

  if (notesPreviewBtn && notesArea && notesPreviewBody) {
    notesPreviewBtn.addEventListener('click', function () {
      if (notesArea.hidden) {
        setNotesMode('edit');
      } else {
        setNotesMode('preview');
      }
    });
  }

  if (notesDownloadBtn) {
    notesDownloadBtn.addEventListener('click', downloadNotes);
  }

  if (notesArea) {
    let saveTimer = null;
    notesArea.addEventListener('input', function () {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(saveNotes, 300);
    });
  }

  if (notesClear) {
    notesClear.addEventListener('click', function () {
      if (notesArea) {
        notesArea.value = '';
        saveNotes();
      }
    });
  }

  if (notesQuote) {
    notesQuote.addEventListener('click', function () {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !notesArea) return;
      const text = sel.toString().trim();
      if (!text) return;
      notesArea.value = (notesArea.value ? notesArea.value + '\n\n' : '') + '> ' + text + '\n';
      saveNotes();
      sel.removeAllRanges();
      notesArea.focus();
    });
  }

  loadManifest().then(function (manifest) {
    document.querySelectorAll('[data-count]').forEach(function (el) {
      const group = el.getAttribute('data-count');
      const n = (manifest[group] || []).length;
      el.textContent = n + (n === 1 ? ' item' : ' items');
    });
  });

  route();
})();
