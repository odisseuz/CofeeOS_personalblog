// hash routing
function setHash(h) {
  if (location.hash === h) return;
  try {
    history.replaceState(null, '', location.pathname + location.search + h);
  } catch (e) { /* file:// or restricted context */ }
}

function hashForFolder(segments) {
  return (segments && segments.length) ? '#~/' + segments.join('/') : '#~/';
}

function hashForFile(file) {
  if (file === 'posts/about.md') return '#/about';
  return '#~/' + file.replace(/^posts\//, '');
}

function route() {
  const h = location.hash;
  if (h === '#/about') {
    articleFromFinder = false;
    openArticle('posts/about.md');
    return;
  }
  if (h.indexOf('#~/') === 0) {
    const rest = h.slice(3);
    const segments = rest ? rest.split('/').filter(Boolean) : [];
    if (segments.length && segments[segments.length - 1].indexOf('.md') !== -1) {
      articleFromFinder = false;
      openArticle('posts/' + segments.join('/'));
    } else {
      openFolder(segments);
    }
  }
}
