// file manager
import { fmOverlay, state } from './state.js';
import { loadManifest, getAllPosts, flattenManifest, listLevel, groupIcon } from './data.js';
import { resetWindow, setBackdropInert } from './windows.js';
import { setHash, hashForFolder } from './routing.js';

export function updateDockActive(key) {
  document.querySelectorAll('.dock-item').forEach(function (el) {
    let active = false;
    if (el.hasAttribute('data-group')) active = el.getAttribute('data-group') === key;
    else if (el.hasAttribute('data-home')) active = key === 'home';
    else if (el.hasAttribute('data-note')) active = key === 'about';
    el.classList.toggle('active', active);
  });
}

export function openFolder(segments) {
  if (!fmOverlay) return;
  state.lastFocus = document.activeElement;
  state.currentPath = segments || [];
  state.finderFilter = '';
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
  updateDockActive(state.currentPath.length ? state.currentPath[0] : 'home');
}

export function navigateInto(folder) {
  state.currentPath.push(folder);
  renderFinder();
}

export function navigateUp() {
  if (state.currentPath.length) state.currentPath.pop();
  renderFinder();
}

export function applyFinderFilter() {
  const rows = document.querySelectorAll('#fm-body .finder-file');
  const q = (state.finderFilter || '').toLowerCase();
  rows.forEach(function (row) {
    const name = (row.querySelector('.file-name') || {}).textContent || '';
    row.style.display = (!q || name.toLowerCase().indexOf(q) !== -1) ? '' : 'none';
  });
}

export function renderFinder() {
  setHash(hashForFolder(state.currentPath));
  const pathInput = document.getElementById('fm-path');
  const bodyEl = document.getElementById('fm-body');
  const statusEl = document.getElementById('fm-status');
  const backBtn = document.getElementById('fm-back');

  if (pathInput) pathInput.value = state.currentPath.length ? '~/' + state.currentPath.join('/') : '~';
  if (backBtn) backBtn.style.visibility = state.currentPath.length ? 'visible' : 'hidden';

  Promise.all([loadManifest(), getAllPosts()]).then(function (results) {
    const manifest = results[0];
    const posts = results[1];
    const byPath = {};
    posts.forEach(function (p) { byPath[p.path] = p; });

    const all = flattenManifest(manifest);
    const level = listLevel(all, state.currentPath);
    const base = 'posts/' + (state.currentPath.length ? state.currentPath.join('/') + '/' : '');
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

export function closeFolder() {
  if (!fmOverlay) return;
  state.articleFromFinder = false;
  fmOverlay.classList.remove('open');
  fmOverlay.classList.remove('dimmed');
  setBackdropInert(false);
  document.body.style.overflow = '';
  setHash('#/');
  if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  updateDockActive(null);
}
