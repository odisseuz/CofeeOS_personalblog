// hash routing
import { state } from './state.js';
import { openArticle } from './article.js';
import { openFolder } from './finder.js';

export function setHash(h) {
  if (location.hash === h) return;
  try {
    history.replaceState(null, '', location.pathname + location.search + h);
  } catch (e) { /* file:// or restricted context */ }
}

export function hashForFolder(segments) {
  return (segments && segments.length) ? '#~/' + segments.join('/') : '#~/';
}

export function hashForFile(file) {
  if (file === 'posts/about.md') return '#/about';
  return '#~/' + file.replace(/^posts\//, '');
}

export function route() {
  const h = location.hash;
  if (h === '#/about') {
    state.articleFromFinder = false;
    openArticle('posts/about.md');
    return;
  }
  if (h.indexOf('#~/') === 0) {
    const rest = h.slice(3);
    const segments = rest ? rest.split('/').filter(Boolean) : [];
    if (segments.length && segments[segments.length - 1].indexOf('.md') !== -1) {
      state.articleFromFinder = false;
      openArticle('posts/' + segments.join('/'));
    } else {
      openFolder(segments);
    }
  }
}
