// busca + card "recent"
function loadRecentPosts() {
  const listEl = document.getElementById('recent-list');
  if (!listEl) return;

  getAllPosts().then(function (posts) {
    const sorted = posts.slice().sort(function (a, b) {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return String(b.date).localeCompare(String(a.date));
    });

    listEl.innerHTML = '';

    if (!sorted.length) {
      const li = document.createElement('li');
      li.className = 'recent-item muted';
      li.textContent = 'no posts yet';
      listEl.appendChild(li);
      return;
    }

    sorted.slice(0, 5).forEach(function (post) {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.className = 'recent-item';
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

function setupSearch() {
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
      getAllPosts().then(function (posts) {
        const matches = posts.filter(function (p) {
          return (p.title + ' ' + p.body).toLowerCase().indexOf(q) !== -1;
        }).slice(0, 8);

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
    articleFromFinder = false;
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
