// wiring
import { makeWindow, resetWindow, makeMaximize, trapFocus } from './windows.js';
import { articleOverlay, fmOverlay, state } from './state.js';
import { closeArticle, openArticle, setNotesMode, downloadNotes, saveNotes } from './article.js';
import { closeFolder, navigateUp, navigateInto, renderFinder, applyFinderFilter, openFolder } from './finder.js';
import { route } from './routing.js';
import { loadRecentPosts, setupSearch } from './search.js';
import { loadManifest } from './data.js';
import { initTerminal, focusTerminal, runCommand } from './terminal.js';
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

  // menu de display (Aa): abre no clique, fecha fora/Esc
  const displayMenu = document.getElementById('display-menu');
  const displayToggle = document.getElementById('display-toggle');
  if (displayMenu && displayToggle) {
    displayToggle.addEventListener('click', function () {
      const open = displayMenu.classList.toggle('open');
      displayToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (displayMenu.contains(e.target) || !displayMenu.classList.contains('open')) return;
      displayMenu.classList.remove('open');
      displayToggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape' || !displayMenu.classList.contains('open')) return;
      displayMenu.classList.remove('open');
      displayToggle.setAttribute('aria-expanded', 'false');
      displayToggle.focus();
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
      if (imgOverlay && imgOverlay.classList.contains('open')) { closeImageViewer(); return; }
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
      if (input) { input.focus(); input.scrollIntoView({ block: 'nearest' }); }
      return;
    }
    const termEl = e.target.closest('[data-dock-term]');
    if (termEl) {
      e.preventDefault();
      openTerminal();
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
