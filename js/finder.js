// file manager
function updateDockActive(key) {
  document.querySelectorAll('.dock-item').forEach(function (el) {
    let active = false;
    if (el.hasAttribute('data-group')) active = el.getAttribute('data-group') === key;
    else if (el.hasAttribute('data-home')) active = key === 'home';
    else if (el.hasAttribute('data-note')) active = key === 'about';
    el.classList.toggle('active', active);
  });
}

function openFolder(segments) {
  if (!fmOverlay) return;
  lastFocus = document.activeElement;
  currentPath = segments || [];
  finderFilter = '';
  const searchInput = document.getElementById('fm-search');
  if (searchInput) searchInput.value = '';
  fmOverlay.classList.remove('dimmed');
  renderFinder();
  resetWindow(document.querySelector('#fm-overlay .finder'));
  fmOverlay.classList.add('open');
  setBackdropInert(true);
  document.body.style.overflow = 'hidden';
  const closeBtn = document.getElementById('fm-close');
  if (closeBtn) closeBtn.focus();
  updateDockActive(currentPath.length ? currentPath[0] : 'home');
}

function navigateInto(folder) {
  currentPath.push(folder);
  renderFinder();
}

function navigateUp() {
  if (currentPath.length) currentPath.pop();
  renderFinder();
}

function applyFinderFilter() {
  const rows = document.querySelectorAll('#fm-body .finder-file');
  const q = (finderFilter || '').toLowerCase();
  rows.forEach(function (row) {
    const name = (row.querySelector('.file-name') || {}).textContent || '';
    row.style.display = (!q || name.toLowerCase().indexOf(q) !== -1) ? '' : 'none';
  });
}

function renderFinder() {
  setHash(hashForFolder(currentPath));
  const pathInput = document.getElementById('fm-path');
  const bodyEl = document.getElementById('fm-body');
  const statusEl = document.getElementById('fm-status');
  const backBtn = document.getElementById('fm-back');

  if (pathInput) pathInput.value = currentPath.length ? '~/' + currentPath.join('/') : '~';
  if (backBtn) backBtn.style.visibility = currentPath.length ? 'visible' : 'hidden';

  Promise.all([loadManifest(), getAllPosts()]).then(function (results) {
    const manifest = results[0];
    const posts = results[1];
    const byPath = {};
    posts.forEach(function (p) { byPath[p.path] = p; });

    const all = flattenManifest(manifest);
    const level = listLevel(all, currentPath);
    const base = 'posts/' + (currentPath.length ? currentPath.join('/') + '/' : '');
    const paths = level.files.map(function (f) { return base + f; });

    bodyEl.innerHTML = '';

    level.folders.forEach(function (folder) {
      const row = document.createElement('button');
      row.className = 'finder-file finder-folder';
      row.type = 'button';
      row.setAttribute('data-folder', folder);

      const icon = document.createElement('img');
      icon.className = 'file-icon';
      icon.src = groupIcon(folder);
      icon.alt = '';

      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = folder + '/';

      row.appendChild(icon);
      row.appendChild(name);
      bodyEl.appendChild(row);
    });

    paths.forEach(function (path) {
      const post = byPath[path] || { title: path.split('/').pop().replace(/\.md$/, ''), date: '' };
      const row = document.createElement('button');
      row.className = 'finder-file';
      row.type = 'button';
      row.setAttribute('data-file', path);

      const icon = document.createElement('img');
      icon.className = 'file-icon';
      icon.src = 'assets/icons/file.svg';
      icon.alt = '';

      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = post.title;

      const date = document.createElement('span');
      date.className = 'file-date';
      date.textContent = post.date || '';

      row.appendChild(icon);
      row.appendChild(name);
      row.appendChild(date);
      bodyEl.appendChild(row);
    });

    if (!level.folders.length && !paths.length) {
      const empty = document.createElement('p');
      empty.className = 'finder-empty';
      empty.textContent = 'empty folder';
      bodyEl.appendChild(empty);
    }

    const total = level.folders.length + paths.length;
    if (statusEl) statusEl.textContent = total + (total === 1 ? ' item' : ' items');
    applyFinderFilter();
  });
}

function closeFolder() {
  if (!fmOverlay) return;
  articleFromFinder = false;
  fmOverlay.classList.remove('open');
  fmOverlay.classList.remove('dimmed');
  setBackdropInert(false);
  document.body.style.overflow = '';
  setHash('#/');
  if (lastFocus && lastFocus.focus) lastFocus.focus();
  updateDockActive(null);
}
