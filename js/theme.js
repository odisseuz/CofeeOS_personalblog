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
(function () {
  const THEME_KEY = 'coffeeos:theme';
  const root = document.documentElement;
  const options = document.querySelectorAll('#theme-menu .pill-option');
  const themes = ['blue', 'brown', 'black', 'cream', 'light'];

  function savedTheme() {
    try {
      return localStorage.getItem(THEME_KEY);
    } catch (e) {
      return null;
    }
  }

  function apply(name) {
    // "blue" é o padrão: vive no :root, sem atributo
    if (name === 'blue' || themes.indexOf(name) === -1) {
      root.removeAttribute('data-theme');
      name = 'blue';
    } else {
      root.setAttribute('data-theme', name);
    }
    options.forEach(function (opt) {
      opt.setAttribute('aria-pressed', opt.getAttribute('data-theme') === name ? 'true' : 'false');
    });
  }

  const stored = savedTheme();
  let current = (themes.indexOf(stored) !== -1) ? stored : 'blue';
  apply(current);

  options.forEach(function (opt) {
    opt.addEventListener('click', function () {
      current = opt.getAttribute('data-theme');
      apply(current);
      try { localStorage.setItem(THEME_KEY, current); } catch (e) {}
    });
  });
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
