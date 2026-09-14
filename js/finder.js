// file manager
import { fmOverlay, state } from './state.js';
import { loadManifest, getPostIndex, flattenManifest, listLevel, groupIcon, isGroup, groupBySeries } from './data.js';
import { resetWindow, notifyOverlayChange, makeTabbable, isNarrow, maximize } from './windows.js';
import { setHash, hashForFolder } from './routing.js';

export function updateDockActive(key) {
  document.querySelectorAll('.dock-item').forEach(function (el) {
    let active = false;
    if (el.hasAttribute('data-home')) active = key === 'home';
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
  const finder = document.querySelector('#fm-overlay .finder');
  resetWindow(finder);
  if (isNarrow()) maximize(finder);
  fmOverlay.classList.add('open');
  notifyOverlayChange();
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

// linha de arquivo no finder (título + data)
function fileRow(item) {
  const row = document.createElement('button');
  row.className = 'finder-file';
  row.type = 'button';
  makeTabbable(row);
  row.setAttribute('data-file', item.path);

  const icon = document.createElement('img');
  icon.className = 'file-icon';
  icon.src = 'assets/icons/lucide/file.svg';
  icon.alt = '';

  const name = document.createElement('span');
  name.className = 'file-name';
  name.textContent = item.title;

  const date = document.createElement('span');
  date.className = 'file-date';
  date.textContent = item.date || '';

  row.appendChild(icon);
  row.appendChild(name);
  row.appendChild(date);
  return row;
}

export function renderFinder() {
  setHash(hashForFolder(state.currentPath));
  const pathInput = document.getElementById('fm-path');
  const bodyEl = document.getElementById('fm-body');
  const statusEl = document.getElementById('fm-status');
  const backBtn = document.getElementById('fm-back');

  if (pathInput) pathInput.value = state.currentPath.length ? '~/' + state.currentPath.join('/') : '~';
  if (backBtn) backBtn.style.visibility = state.currentPath.length ? 'visible' : 'hidden';

  Promise.all([loadManifest(), getPostIndex()]).then(function (results) {
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
      makeTabbable(row);
      row.setAttribute('data-folder', folder);

      const icon = document.createElement('img');
      icon.className = 'file-icon';
      // subpassa não é um grupo (não tem ícone próprio) → usa a pasta genérica
      icon.src = isGroup(folder) ? groupIcon(folder) : 'assets/icons/lucide/folder.svg';
      icon.alt = '';

      const name = document.createElement('span');
      name.className = 'file-name';
      name.textContent = folder + '/';

      row.appendChild(icon);
      row.appendChild(name);
      bodyEl.appendChild(row);
    });

    // séries: cabeçalho por série + ordem pelo campo `order`
    const blocks = groupBySeries(paths.map(function (path) {
      const post = byPath[path] || { title: path.split('/').pop().replace(/\.md$/, ''), date: '' };
      return {
        path: path,
        title: post.title,
        date: post.date,
        series: post.series || '',
        order: post.order === undefined ? null : post.order
      };
    }));

    blocks.forEach(function (block) {
      if (block.series) {
        const head = document.createElement('p');
        head.className = 'finder-series';
        head.textContent = block.series + ' (' + block.items.length + ')';
        bodyEl.appendChild(head);
      }
      block.items.forEach(function (item) { bodyEl.appendChild(fileRow(item)); });
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
  notifyOverlayChange();
  setHash('#/');
  if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
  updateDockActive(null);
}
