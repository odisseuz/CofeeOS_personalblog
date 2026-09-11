// dados: manifest + lista de posts
let manifestCache = null;

function loadManifest() {
  if (manifestCache) return Promise.resolve(manifestCache);
  return fetch('posts/manifest.json')
    .then(function (res) { return res.json(); })
    .then(function (data) { manifestCache = data; return data; })
    .catch(function () { manifestCache = {}; return manifestCache; });
}

let postsCache = null;

function getAllPosts() {
  if (postsCache) return Promise.resolve(postsCache);
  return loadManifest().then(function (manifest) {
    const entries = [];
    Object.keys(manifest).forEach(function (group) {
      (manifest[group] || []).forEach(function (name) {
        entries.push({ group: group, name: name, path: 'posts/' + group + '/' + name });
      });
    });

    return Promise.all(entries.map(function (entry) {
      return fetch(entry.path)
        .then(function (res) {
          if (!res.ok) throw new Error();
          return res.text();
        })
        .then(function (text) {
          const parsed = parseFrontmatter(text);
          return {
            path: entry.path,
            group: entry.group,
            title: parsed.data.title || entry.name.replace(/\.md$/, ''),
            date: parsed.data.date || '',
            body: parsed.body
          };
        })
        .catch(function () {
          return { path: entry.path, group: entry.group, title: entry.name.replace(/\.md$/, ''), date: '', body: '' };
        });
    })).then(function (posts) {
      postsCache = posts;
      return posts;
    });
  });
}

function flattenManifest(manifest) {
  const out = [];
  Object.keys(manifest).forEach(function (group) {
    (manifest[group] || []).forEach(function (name) {
      out.push(group + '/' + name);
    });
  });
  return out;
}

function groupIcon(group) {
  const icons = {
    readings: 'assets/icons/books.svg',
    art: 'assets/icons/art.svg',
    games: 'assets/icons/games.svg',
    science: 'assets/icons/science.svg'
  };
  return icons[group] || 'assets/icons/books.svg';
}

function listLevel(paths, segments) {
  const prefix = segments.length ? segments.join('/') + '/' : '';
  const folderSet = {};
  const folders = [];
  const files = [];
  paths.forEach(function (p) {
    if (prefix && p.indexOf(prefix) !== 0) return;
    const rest = prefix ? p.slice(prefix.length) : p;
    const parts = rest.split('/');
    if (parts.length === 1) {
      files.push(rest);
    } else if (!folderSet[parts[0]]) {
      folderSet[parts[0]] = true;
      folders.push(parts[0]);
    }
  });
  return { folders: folders, files: files };
}

function groupFromFile(file) {
  if (file === 'posts/about.md') return 'about';
  return (file || '').split('/')[1] || '';
}
