// busca + card "recent"
import { getAllPosts, getPostIndex, inLang } from './data.js';
import { state } from './state.js';
import { openArticle } from './article.js';
import { makeTabbable } from './windows.js';

function byNewest(a, b) {
  if (!a.date && !b.date) return 0;
  if (!a.date) return 1;
  if (!b.date) return -1;
  return String(b.date).localeCompare(String(a.date));
}

export function loadRecentPosts() {
  const listEl = document.getElementById('recent-list');
  if (!listEl) return;

  getPostIndex().then(function (posts) {
    const sorted = inLang(posts).sort(byNewest);

    listEl.innerHTML = '';

    if (!sorted.length) {
      const li = document.createElement('li');
      li.className = 'recent-item muted';
      li.textContent = 'no posts yet';
      listEl.appendChild(li);
      return;
    }

    sorted.slice(0, 5).forEach(function (post, i) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'recent-item' + (i === 0 ? ' is-latest' : '');
      link.href = '#';
      link.setAttribute('data-note', post.path);

      const title = document.createElement('span');
      title.className = 'recent-item-title';
      title.textContent = post.title;

      const meta = document.createElement('span');
      meta.className = 'recent-item-meta';
      meta.textContent = post.group + (post.date ? ' · ' + post.date : '');

      link.appendChild(title);
      link.appendChild(meta);
      li.appendChild(link);
      listEl.appendChild(li);
    });
  });
}

export function setupSearch() {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  if (!input || !results) return;

  let timer = null;

  function hide() {
    results.hidden = true;
    results.innerHTML = '';
  }

  input.addEventListener('input', function () {
    clearTimeout(timer);
    const term = input.value.trim();
    if (!term) { hide(); return; }
    timer = setTimeout(function () {
      const q = term.toLowerCase();
      // busca primeiro nos metadados (índice, leve); só baixa os corpos se
      // nenhum título casar, pra não puxar todos os .md em toda digitação
      getPostIndex().then(function (index) {
        const byTitle = inLang(index).filter(function (p) {
          return (p.title + ' ' + p.group).toLowerCase().indexOf(q) !== -1;
        });
        if (byTitle.length) return { matches: byTitle };
        return getAllPosts().then(function (posts) {
          const matches = inLang(posts).filter(function (p) {
            return (p.title + ' ' + p.body).toLowerCase().indexOf(q) !== -1;
          });
          return { matches: matches };
        });
      }).then(function (result) {
        const matches = result.matches.slice(0, 8);

        results.innerHTML = '';
        if (!matches.length) {
          const empty = document.createElement('div');
          empty.className = 'search-empty';
          empty.textContent = 'no matches';
          results.appendChild(empty);
          results.hidden = false;
          return;
        }

        matches.forEach(function (post) {
          const btn = document.createElement('button');
          btn.className = 'search-item';
          btn.type = 'button';
          makeTabbable(btn);
          btn.setAttribute('data-file', post.path);

          const title = document.createElement('span');
          title.className = 'search-item-title';
          title.textContent = post.title;

          const group = document.createElement('span');
          group.className = 'search-item-group';
          group.textContent = post.group;

          btn.appendChild(title);
          btn.appendChild(group);
          results.appendChild(btn);
        });
        results.hidden = false;
      });
    }, 150);
  });

  results.addEventListener('click', function (e) {
    const btn = e.target.closest('.search-item');
    if (!btn) return;
    state.articleFromFinder = false;
    openArticle(btn.getAttribute('data-file'));
    input.value = '';
    hide();
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search')) hide();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { hide(); input.blur(); }
  });
}
