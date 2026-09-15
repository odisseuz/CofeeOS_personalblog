// wiring
import { makeWindow, resetWindow, makeMaximize, trapFocus, setBackdropInert, frontOverlay } from './windows.js';
import { articleOverlay, fmOverlay, state } from './state.js';
import { closeArticle, openArticle, setNotesMode, downloadNotes, saveNotes } from './article.js';
import { closeFolder, navigateUp, navigateInto, renderFinder, applyFinderFilter, openFolder } from './finder.js';
import { route } from './routing.js';
import { loadRecentPosts, setupSearch } from './search.js';
import { loadManifest, visiveis, getPostIndex } from './data.js';
import { initLang, setLang, getLang, langLabel, aboutFile, isAbout } from './lang.js';
import { initTerminal, focusTerminal, runCommand } from './terminal.js';
import { initNotepad, focusNotepad } from './notepad.js';
import { initIdleChrome } from './idle.js';
import { onBrewChange } from './sitename.js';
import './theme.js';
import { setTheme } from './theme.js';

// sincroniza inert/scroll: nada de fundo focável enquanto houver janela aberta
function syncInert() {
  const front = frontOverlay();
  setBackdropInert(!!front, front);
  document.body.style.overflow = front ? 'hidden' : '';
}

// acessibilidade: guarda quem tinha o foco ao abrir uma janela e devolve ao
// fechar — pro teclado não voltar pro topo da página sem aviso.
let focusBefore = null;
function rememberFocus() {
  const el = document.activeElement;
  focusBefore = (el && el !== document.body) ? el : null;
}
function restoreFocus() {
  if (!frontOverlay() && focusBefore && focusBefore.focus) focusBefore.focus();
  focusBefore = null;
}

// os módulos avisam quando um overlay abre/fecha; aqui a gente reavalia.
document.addEventListener('coffee:overlay', syncInert);

(function () {
  // o idioma vem antes de tudo: finder, recent, busca e contadores leem ele.
  initLang();

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
    syncInert();
    restoreFocus();
  }
  function openImageViewer(src) {
    if (!imgOverlay || !imgView) return;
    rememberFocus();
    resetWindow(imgViewer);
    imgView.src = src;
    if (imgFilename) imgFilename.textContent = src.split('/').pop() || 'image';
    imgOverlay.classList.add('open');
    syncInert();
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
    syncInert();
    restoreFocus();
  }
  function openTerminal() {
    if (!termOverlay) return;
    rememberFocus();
    resetWindow(termWindow);
    termOverlay.classList.add('open');
    syncInert();
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
    syncInert();
    restoreFocus();
  }
  function openSettings(abrirCardapio) {
    if (!settingsOverlay) return;
    rememberFocus();
    resetWindow(settingsWindow);
    settingsOverlay.classList.add('open');
    syncInert();
    // vindo do chip da bebida, já abre o cardápio: é o que a pessoa quer ver.
    // e marca que foi assim, pra escolher um tema fechar a janela toda — quem
    // abriu o ⚙ por conta própria pode querer mexer em fonte/tamanho depois.
    const picker = document.getElementById('theme-picker');
    if (picker) picker.open = !!abrirCardapio;
    settingsOverlay.setAttribute('data-from-chip', abrirCardapio ? '1' : '0');
    if (settingsClose) settingsClose.focus();
  }
  if (settingsToggle) settingsToggle.addEventListener('click', function () { openSettings(false); });
  // o theme.js fecha o settings ao escolher um tema no cardápio
  window.__closeSettings = closeSettings;

  // o chip da bebida no hero abre o settings com o cardápio já expandido
  const brewTag = document.getElementById('brew-tag');
  if (brewTag) brewTag.addEventListener('click', function () { openSettings(true); });
  onBrewChange(function (bebida) {
    if (brewTag) brewTag.textContent = bebida;
  });
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
    syncInert();
    restoreFocus();
  }
  function openNotepad() {
    if (!notesOverlay) return;
    rememberFocus();
    resetWindow(notepadWindow);
    notesOverlay.classList.add('open');
    syncInert();
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

  // ponte pro terminal: abrir post, abrir app, trocar tema
  window.__openPost = function (file) {
    closeTerminal();
    state.articleFromFinder = false;
    // espera o terminal sair de cena antes de abrir o artigo
    requestAnimationFrame(function () { openArticle(file); });
  };
  window.__openApp = function (app) {
    if (app === 'notes') { closeTerminal(); openNotepad(); }
    else if (app === 'settings') { closeTerminal(); openSettings(false); }
  };
  window.__setTheme = setTheme;

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

    // trava o foco dentro da janela da frente (qualquer uma, não só artigo/finder)
    const front = frontOverlay();
    if (!front) return;
    const dialog = front.querySelector('[role="dialog"]');
    if (dialog) trapFocus(dialog, e);
  });

  // Safari (janelas baixas) não rola até o elemento focado — o Tab então pula
  // o que está fora da vista e o foco "some". Rolar aqui resolve pra todos.
  document.addEventListener('focusin', function (e) {
    const el = e.target;
    if (!el || el === document.body) return;
    if (el.closest('.overlay')) return;          // janelas têm o seu próprio scroll
    const r = el.getBoundingClientRect();
    const margem = 24;
    if (r.top < margem) {
      window.scrollBy({ top: r.top - margem });
    } else if (r.bottom > window.innerHeight - margem) {
      window.scrollBy({ top: r.bottom - window.innerHeight + margem });
    }
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
      let alvo = noteEl.getAttribute('data-note');
      // o dock e o rodapé apontam pro about fixo; o arquivo real depende do
      // idioma (about.pt.md). Resolver aqui mantém o HTML declarativo.
      if (isAbout(alvo)) alvo = aboutFile();
      openArticle(alvo);
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

  // contadores da home: contam só os posts do idioma ativo — a pasta é a mesma
  // gaveta nos dois idiomas, o que muda é o que tem dentro dela.
  function pintarContadores() {
    Promise.all([loadManifest(), getPostIndex()]).then(function (res) {
      const manifest = res[0];
      const posts = visiveis(res[1]);
      document.querySelectorAll('[data-count]').forEach(function (el) {
        const group = el.getAttribute('data-count');
        const n = posts.filter(function (p) {
          return p.path.indexOf('posts/' + group + '/') === 0;
        }).length;
        el.textContent = n + (n === 1 ? ' item' : ' items');
      });
      // manifest fica no Promise.all só pra garantir que o finder já tem o que
      // precisa quando a pessoa clicar numa pasta logo depois da carga
      return manifest;
    });
  }

  // seletor de idioma: um botão (globo + idioma ativo) que abre a lista. Trocar
  // o idioma re-pinta o que depende dele (recent, contadores e, se o finder
  // estiver aberto, a lista dele).
  const langSwitch = document.getElementById('lang-switch');
  const langToggle = document.getElementById('lang-toggle');

  function fecharLang() {
    if (!langSwitch) return;
    langSwitch.classList.remove('open');
    if (langToggle) langToggle.setAttribute('aria-expanded', 'false');
  }

  if (langToggle) {
    langToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const aberto = langSwitch.classList.toggle('open');
      langToggle.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  }

  if (langSwitch) {
    langSwitch.querySelectorAll('.lang-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        fecharLang();
        if (!setLang(btn.getAttribute('data-lang'))) return;
        pintarLang();
        loadRecentPosts();
        pintarContadores();
        if (fmOverlay && fmOverlay.classList.contains('open')) renderFinder();
        // se o about estiver ABERTO, o conteúdo dele muda com o idioma — então
        // a janela recarrega. `currentNoteFile` não serve aqui: é o arquivo das
        // notas do painel lateral, e sobrevive ao fechamento do artigo (era o
        // que fazia trocar o idioma reabrir o about do nada).
        const aberto = state.currentArticleFile;
        if (aberto && isAbout(aberto) && articleOverlay &&
            articleOverlay.classList.contains('open')) {
          openArticle(aboutFile());
        }
      });
    });
  }

  // fecha ao clicar fora ou com Esc (mesmo padrão dos outros menus)
  document.addEventListener('click', function (e) {
    if (!e.target.closest('#lang-switch')) fecharLang();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharLang();
  });

  function pintarLang() {
    const atual = getLang();
    const rotulo = document.getElementById('lang-current');
    if (rotulo) rotulo.textContent = langLabel(atual);
    document.querySelectorAll('.lang-opt').forEach(function (btn) {
      const ativo = btn.getAttribute('data-lang') === atual;
      btn.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });
    if (langToggle) {
      const nome = atual === 'pt' ? 'Português' : 'English';
      langToggle.setAttribute('aria-label', 'Language: ' + nome);
    }
  }

  pintarLang();
  pintarContadores();

  route();
})();
