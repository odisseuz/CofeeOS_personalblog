// relógio + tema + fontes (preferências de aparência)

// relógio
const timeEls = document.querySelectorAll('.clock-time');
const ampmEls = document.querySelectorAll('.ampm');

function tick() {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const time = h + ':' + m;
  timeEls.forEach(function (el) { el.textContent = time; });
  ampmEls.forEach(function (el) { el.textContent = ampm; });
}

tick();
setInterval(tick, 1000);

// tema
const THEME_KEY = 'coffeeos:theme';
const THEMES = ['blue', 'black', 'blackhoney', 'mocha', 'ethiopian', 'puerh', 'matcha', 'cappuccino', 'latte', 'cream'];

// aplica (e salva) o tema — usado pelo menu de settings e pelo terminal
export function setTheme(name) {
  const root = document.documentElement;
  if (name !== 'blue' && THEMES.indexOf(name) === -1) name = 'blue';
  // transição suave só no clique: sem ela a troca de tema dá um flash seco
  root.classList.add('theme-switching');
  clearTimeout(setTheme._t);
  setTheme._t = setTimeout(function () { root.classList.remove('theme-switching'); }, 400);
  // "blue" é o padrão: vive no :root, sem atributo
  if (name === 'blue') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', name);
  document.querySelectorAll('#theme-menu .menu-item').forEach(function (opt) {
    opt.setAttribute('aria-pressed', opt.getAttribute('data-theme') === name ? 'true' : 'false');
  });
  try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
}

// Aplica o tema só enquanto o mouse está em cima ("provar antes de pedir").
// Guarda o tema real pra restaurar na saída.
let themeAtual = 'blue';
function previewTheme(name) {
  const root = document.documentElement;
  if (name === 'blue') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', name);
}
function endPreview() {
  previewTheme(themeAtual);
}

(function () {
  const options = document.querySelectorAll('#theme-menu .menu-item');

  // nome do tema atual, mostrado no summary quando o cardápio está fechado
  const NOMES = {
    blue: 'Blue Mountain', black: 'Cold Brew', blackhoney: 'Black Honey',
    mocha: 'Mocha', ethiopian: 'Ethiopian', puerh: 'Puerh', matcha: 'Matcha',
    cappuccino: 'Cappuccino', latte: 'Latte', cream: 'Cortado'
  };

  function pintarAtual(name) {
    const nome = document.getElementById('current-theme-name');
    const sw = document.getElementById('current-theme-swatch');
    if (nome) nome.textContent = NOMES[name] || name;
    if (sw) {
      sw.className = 'menu-swatch sw-' + name;
    }
  }

  function savedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  const stored = savedTheme();
  const current = (THEMES.indexOf(stored) !== -1) ? stored : 'blue';
  themeAtual = current;
  setTheme(current);
  pintarAtual(current);

  // preview no hover: o site inteiro muda enquanto o mouse está no item.
  // Só quando o cardápio está ABERTO — fechado, o hover não teria alvo, e
  // trocar o tema sem intenção é pesado pros olhos.
  const semHover = window.matchMedia && window.matchMedia('(hover: none)').matches;
  const picker = document.getElementById('theme-picker');

  options.forEach(function (opt) {
    const nome = opt.getAttribute('data-theme');
    opt.addEventListener('click', function () {
      themeAtual = nome;
      setTheme(nome);
      pintarAtual(nome);
      // fecha o cardápio: escolheu, acabou. (O toggle dispara endPreview, mas
      // o tema do clique já foi salvo, então nada é perdido.)
      if (picker && picker.open) picker.open = false;
    });
    if (semHover) return;   // toque não tem hover: só o clique
    opt.addEventListener('mouseenter', function () {
      if (picker && picker.open) previewTheme(nome);
    });
    opt.addEventListener('mouseleave', endPreview);
    // teclado também "prova": foco é o hover de quem não usa mouse
    opt.addEventListener('focus', function () {
      if (picker && picker.open) previewTheme(nome);
    });
    opt.addEventListener('blur', endPreview);
  });

  // fechar o cardápio com o mouse em cima tem que restaurar o tema
  if (picker) picker.addEventListener('toggle', endPreview);
})();

// fonte (família)
(function () {
  const FAMILY_KEY = 'coffeeos:font-family';
  const root = document.documentElement;
  const articleTrigger = document.getElementById('article-font-toggle');
  const options = document.querySelectorAll('#font-family-menu .pill-option');
  const articleOptions = document.querySelectorAll('#article-font-menu .pill-option');
  const families = ['sans', 'serif', 'mono'];

  function savedFamily() {
    try {
      return localStorage.getItem(FAMILY_KEY);
    } catch (e) {
      return null;
    }
  }

  function apply(name) {
    if (name === 'sans') {
      root.removeAttribute('data-font');
    } else {
      root.setAttribute('data-font', name);
    }
    options.forEach(function (opt) {
      opt.setAttribute('aria-pressed', opt.getAttribute('data-font-family') === name ? 'true' : 'false');
    });
    articleOptions.forEach(function (opt) {
      opt.setAttribute('aria-pressed', opt.getAttribute('data-font-family') === name ? 'true' : 'false');
    });
    if (articleTrigger) {
      articleTrigger.setAttribute('aria-label', 'Font: ' + name);
      articleTrigger.setAttribute('title', 'Font: ' + name);
    }
  }

  const stored = savedFamily();
  let current = (families.indexOf(stored) !== -1) ? stored : 'sans';
  apply(current);

  options.forEach(function (opt) {
    opt.addEventListener('click', function () {
      current = opt.getAttribute('data-font-family');
      apply(current);
      try { localStorage.setItem(FAMILY_KEY, current); } catch (e) {}
    });
  });

  articleOptions.forEach(function (opt) {
    opt.addEventListener('click', function () {
      current = opt.getAttribute('data-font-family');
      apply(current);
      try { localStorage.setItem(FAMILY_KEY, current); } catch (e) {}
    });
  });
})();

// tamanho da fonte (site inteiro)
(function () {
  const FONT_KEY = 'coffeeos:font-size';
  const root = document.documentElement;
  const options = document.querySelectorAll('#font-menu .pill-option');
  const sizes = ['normal', 'large', 'xl'];

  function savedSize() {
    try {
      return localStorage.getItem(FONT_KEY);
    } catch (e) {
      return null;
    }
  }

  function apply(name) {
    if (name === 'normal') {
      root.removeAttribute('data-font-size');
    } else {
      root.setAttribute('data-font-size', name);
    }
    options.forEach(function (opt) {
      const active = opt.getAttribute('data-font-size') === name;
      opt.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  const stored = savedSize();
  let current = (sizes.indexOf(stored) !== -1) ? stored : 'normal';
  apply(current);

  options.forEach(function (opt) {
    opt.addEventListener('click', function () {
      current = opt.getAttribute('data-font-size');
      apply(current);
      try { localStorage.setItem(FONT_KEY, current); } catch (e) {}
    });
  });
})();

// tamanho do texto do artigo
(function () {
  const READER_KEY = 'coffeeos:reader-font';
  const down = document.getElementById('font-down');
  const up = document.getElementById('font-up');
  const label = document.getElementById('reader-size');
  const steps = [0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.75];
  const defaultIndex = 2; // 1.0 = base do editor (0.9rem)

  function savedIndex() {
    try {
      const v = parseInt(localStorage.getItem(READER_KEY), 10);
      return (v >= 0 && v < steps.length) ? v : defaultIndex;
    } catch (e) {
      return defaultIndex;
    }
  }

  let index = savedIndex();

  function apply() {
    const body = document.getElementById('editor-body');
    if (body) body.style.fontSize = (steps[index] * 0.9) + 'rem';
    if (label) label.textContent = Math.round(steps[index] * 100) + '%';
    if (down) down.disabled = index === 0;
    if (up) up.disabled = index === steps.length - 1;
  }

  apply();

  function shift(delta) {
    const next = index + delta;
    if (next < 0 || next >= steps.length) return;
    index = next;
    apply();
    try { localStorage.setItem(READER_KEY, String(index)); } catch (e) {}
  }

  if (down) down.addEventListener('click', function () { shift(-1); });
  if (up) up.addEventListener('click', function () { shift(1); });
})();
