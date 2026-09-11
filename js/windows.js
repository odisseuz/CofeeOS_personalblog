// janelas: arrastar, redimensionar, maximizar
function makeWindow(win, handle, resizeHandle) {
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

function resetWindow(win) {
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
  }
}

function makeMaximize(win, btn) {
  if (!win || !btn) return;
  btn.addEventListener('click', function () {
    const maximized = win.classList.toggle('maximized');
    if (maximized) {
      win.style.transform = '';
      btn.textContent = '⤡';
      btn.setAttribute('aria-label', 'Restore');
    } else {
      btn.textContent = '⤢';
      btn.setAttribute('aria-label', 'Maximize');
    }
  });
}

// mantém o foco dentro de um modal
function trapFocus(container, e) {
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

// conteúdo de trás fica inerte quando há modal
function setBackdropInert(on) {
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
}
