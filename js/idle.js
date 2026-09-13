// modo fantasma: parado um tempo, o chrome da janela do artigo esmaece.
// volta ao normal com atividade real (mouse que se moveu de verdade, tecla, scroll, toque).
import { articleOverlay } from './state.js';
import { frontOverlay } from './windows.js';

const IDLE_MS = 15000;

let timer = null;
let dimmed = false;
let lastX = null;
let lastY = null;

// o artigo precisa estar aberto E ser a janela da frente
function isArticleActive() {
  return !!articleOverlay && articleOverlay.classList.contains('open') && frontOverlay() === articleOverlay;
}

function wake() {
  if (!dimmed) return;
  dimmed = false;
  document.body.classList.remove('chrome-dim');
}

function sleep() {
  if (!isArticleActive()) return;
  dimmed = true;
  document.body.classList.add('chrome-dim');
}

function reset() {
  wake();
  if (timer) clearTimeout(timer);
  if (!isArticleActive()) return;
  timer = setTimeout(sleep, IDLE_MS);
}

export function initIdleChrome() {
  document.addEventListener('keydown', reset, { passive: true });
  document.addEventListener('wheel', reset, { passive: true });
  document.addEventListener('touchstart', reset, { passive: true });
  document.addEventListener('mousedown', reset, { passive: true });

  // só conta movimento real do mouse (evita o "drift" que resetava o timer)
  document.addEventListener('mousemove', function (e) {
    if (lastX === null) { lastX = e.clientX; lastY = e.clientY; return; }
    const moved = Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
    lastX = e.clientX;
    lastY = e.clientY;
    if (moved < 12) return;
    reset();
  }, { passive: true });

  // abrir/fechar/trocar janelas re-arma o estado
  document.querySelectorAll('.overlay').forEach(function (el) {
    new MutationObserver(reset).observe(el, { attributes: true, attributeFilter: ['class'] });
  });

  reset();
}
