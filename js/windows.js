// janelas: arrastar, redimensionar, maximizar
import { t } from './lang.js';
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

// O botão de maximizar é um toggle: o ícone (quadrado ↔ quadrados sobrepostos),
// o aria-label e o title mudam juntos. Fica num lugar só porque antes isso era
// reescrito em três (resetWindow, makeMaximize e maximize) — bastava um deles
// esquecer pra o botão mentir sobre o próprio estado.
//
// O texto vem do léxico (js/lang.js), e o par de chaves fica no elemento
// (`data-i18n-aria`/`data-i18n-title`) pra o applyUiLang saber repintar depois.
export function setMaximizeState(win, maximized) {
  if (!win) return;
  const btn = win.querySelector('.maximize-btn');
  if (!btn) return;
  btn.classList.toggle('is-restore', !!maximized);
  const chave = maximized ? 'restore' : 'maximize';
  btn.setAttribute('data-i18n-aria', chave);
  btn.setAttribute('data-i18n-title', chave);
  const label = t(chave);
  btn.setAttribute('aria-label', label);
  btn.setAttribute('title', label);
}

export function resetWindow(win) {
  if (!win) return;
  win.classList.remove('maximized');
  win.style.transform = '';
  win.style.width = '';
  win.style.height = '';
  win.style.maxWidth = '';
  win.style.maxHeight = '';
  setMaximizeState(win, false);
}

export function makeMaximize(win, btn) {
  if (!win || !btn) return;
  btn.addEventListener('click', function () {
    const maximized = win.classList.toggle('maximized');
    if (maximized) win.style.transform = '';
    setMaximizeState(win, maximized);
  });
}

// em telas pequenas não dá pra arrastar/redimensionar nem enxergar a alça, e a
// janela encolhida atrapalha a leitura — abre já em tela cheia.
// O botão de maximizar continua funcionando pra voltar ao tamanho normal.
export const isNarrow = function () {
  return window.matchMedia && window.matchMedia('(max-width: 560px)').matches;
};

export function maximize(win) {
  if (!win || win.classList.contains('maximized')) return;
  win.classList.add('maximized');
  win.style.transform = '';
  setMaximizeState(win, true);
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

// as janelas fecham com frequência, então o elemento guardado pode ter saído
// do DOM (o finder é redesenhado a cada navegação, por exemplo). Reancorar no
// pai mais próximo que ainda existe evita devolver o foco pra um órfão — que
// é o mesmo que perder o foco.
function ancora(el) {
  let no = el;
  while (no && !document.contains(no)) no = no.parentElement;
  return no;
}

// `inert` não é decorativo: focar algo dentro de um subárvore inert é
// silenciosamente ignorado pelo browser (o foco fica onde estava). Devolver o
// foco pra dentro de uma janela que acabou de ficar inert não devolve nada.
//
// `body` também não serve de alvo: focá-lo é o mesmo que perder o foco (é
// justamente o que esta pilha existe pra evitar).
function focavel(el) {
  const alvo = ancora(el);
  if (!alvo || !alvo.focus) return null;
  if (alvo === document.body || alvo === document.documentElement) return null;
  if (alvo.closest('[inert]')) return null;
  return alvo;
}

// pilha de quem tinha o foco antes de cada janela abrir.
//
// Não dá pra guardar numa variável só: abrir a imagem a partir de um artigo
// sobrescreveria o foco de antes do artigo, e ao fechar a imagem a pessoa
// voltaria pro lugar errado. Com pilha, cada janela devolve pro nível de baixo.
const focoPilha = [];

export function empilharFoco() {
  const el = document.activeElement;
  focoPilha.push((el && el !== document.body && el !== document.documentElement) ? el : null);
}

// devolve o foco ao nível de baixo, ao fechar uma janela.
//
// A pilha é consumida até achar um alvo focável. Alvo dentro de uma janela que
// ficou inert (ou que saiu do DOM) não serve — focar ali é ignorado ou inútil,
// então descemos um nível. Se a pilha acaba sem candidato, o foco fica onde
// está: forçar o body seria pior que não mexer.
//
// A ordem importa: quem chama isto precisa ter recalculado o inert ANTES
// (ver syncInert), senão a checagem de inert enxerga o estado velho.
export function devolverFoco() {
  let alvo = null;
  while (!alvo && focoPilha.length) alvo = focavel(focoPilha.pop());
  if (alvo) alvo.focus();
}

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
//
// A exceção é o visualizador de imagem aberto SOBRE um artigo (`over-article`):
// ali o artigo de trás continua sendo contexto, então não fica inert. Sem isso
// o fundo ficaria só decorativo — e clicar nele pra fechar a imagem pararia de
// funcionar.
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

  // quando a imagem abre por cima do artigo, o artigo não entra na lista
  const sobreArtigo = activeEl && activeEl.id === 'img-overlay' &&
    activeEl.classList.contains('over-article');

  document.querySelectorAll('.overlay').forEach(function (ov) {
    const poupar = sobreArtigo && ov.id === 'overlay';
    if (on && ov !== activeEl && !poupar) ov.setAttribute('inert', '');
    else ov.removeAttribute('inert');
  });
}
