// janelas: arrastar, redimensionar, maximizar
export function makeWindow(win, handle, resizeHandle) {
  if (!win || !handle) return;

  let dx = 0;
  let dy = 0;

  handle.addEventListener('mousedown', function (e) {
    if (e.target.closest('button, input')) return;
    e.preventDefault();
    const sx = e.clientX;
    const sy = e.clientY;
    const ox = dx;
    const oy = dy;

    function move(ev) {
      dx = ox + (ev.clientX - sx);
      dy = oy + (ev.clientY - sy);
      win.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    }
    function up() {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    }
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  });

  if (resizeHandle) {
    resizeHandle.addEventListener('mousedown', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const sx = e.clientX;
      const sy = e.clientY;
      const sw = win.offsetWidth;
      const sh = win.offsetHeight;

      function move(ev) {
        let w = sw + (ev.clientX - sx);
        let h = sh + (ev.clientY - sy);
        w = Math.max(320, Math.min(window.innerWidth - 16, w));
        h = Math.max(240, Math.min(window.innerHeight - 16, h));
        win.style.width = w + 'px';
        win.style.height = h + 'px';
        win.style.maxWidth = 'none';
        win.style.maxHeight = 'none';
      }
      function up() {
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
      }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
  }
}

export function resetWindow(win) {
  if (!win) return;
  win.classList.remove('maximized');
  win.style.transform = '';
  win.style.width = '';
  win.style.height = '';
  win.style.maxWidth = '';
  win.style.maxHeight = '';
  const maxBtn = win.querySelector('.maximize-btn');
  if (maxBtn) {
    maxBtn.textContent = '⤢';
    maxBtn.setAttribute('aria-label', 'Maximize');
    maxBtn.setAttribute('title', 'Maximize');
  }
}

export function makeMaximize(win, btn) {
  if (!win || !btn) return;
  btn.addEventListener('click', function () {
    const maximized = win.classList.toggle('maximized');
    if (maximized) {
      win.style.transform = '';
      btn.textContent = '⤡';
      btn.setAttribute('aria-label', 'Restore');
      btn.setAttribute('title', 'Restore');
    } else {
      btn.textContent = '⤢';
      btn.setAttribute('aria-label', 'Maximize');
      btn.setAttribute('title', 'Maximize');
    }
  });
}

// mantém o foco dentro de um modal
export function trapFocus(container, e) {
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  const list = [];
  focusable.forEach(function (el) {
    if (el.offsetParent !== null) list.push(el);
  });
  if (!list.length) return;

  const first = list[0];
  const last = list[list.length - 1];

  if (!container.contains(document.activeElement)) {
    e.preventDefault();
    first.focus();
    return;
  }

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

// lista de overlays conhecidos, na ordem em que costumam se sobrepor
const OVERLAY_IDS = [
  'img-overlay', 'term-overlay', 'settings-overlay', 'notes-overlay',
  'overlay', 'fm-overlay'
];

// devolve o overlay aberto de maior z-index (a janela da frente), ou null
export function frontOverlay() {
  const ids = OVERLAY_IDS;
  const open = ids
    .map(function (id) { return document.getElementById(id); })
    .filter(function (el) { return el && el.classList.contains('open'); });
  if (!open.length) return null;
  return open.reduce(function (a, b) {
    const za = parseInt(getComputedStyle(a).zIndex, 10) || 0;
    const zb = parseInt(getComputedStyle(b).zIndex, 10) || 0;
    return zb >= za ? b : a;
  });
}

// Safari (macOS) não inclui <button> na navegação por Tab — só inputs, links e
// selects. Um tabindex explícito devolve os botões à ordem do Tab, e não muda
// nada nos navegadores onde já funcionavam. Use em qualquer <button> criado
// em runtime (os estáticos do index.html já vêm com tabindex no HTML).
export function makeTabbable(el) {
  if (el && el.tagName === 'BUTTON' && !el.hasAttribute('tabindex')) {
    el.setAttribute('tabindex', '0');
  }
  return el;
}

// evento: um overlay mudou de estado (abriu/fechou). Quem centraliza o
// inert/scroll escuta e reavalia qual janela está na frente (ver main.js).
export function notifyOverlayChange() {
  document.dispatchEvent(new CustomEvent('coffee:overlay'));
}

// conteúdo de trás fica inerte quando há modal.
//
// Marca inert em tudo que é "fundo" (main, dock, topbar) e nos OUTROS overlays
// abertos, pra que o leitor de tela e o Tab só alcancem a janela da frente.
// `activeEl` é o overlay da janela em uso (ou null pra liberar tudo).
export function setBackdropInert(on, activeEl) {
  const background = [
    document.querySelector('main'),
    document.querySelector('.dock'),
    document.querySelector('.topbar')
  ];
  background.forEach(function (el) {
    if (el) {
      if (on) el.setAttribute('inert', '');
      else el.removeAttribute('inert');
    }
  });

  document.querySelectorAll('.overlay').forEach(function (ov) {
    if (on && ov !== activeEl) ov.setAttribute('inert', '');
    else ov.removeAttribute('inert');
  });
}
