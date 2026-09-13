// dados: manifest + lista de posts
import { parseFrontmatter } from './markdown.js';

let manifestCache = null;

export function loadManifest() {
  if (manifestCache) return Promise.resolve(manifestCache);
  return fetch('posts/manifest.json')
    .then(function (res) { return res.json(); })
    .then(function (data) { manifestCache = data; return data; })
    .catch(function () { manifestCache = {}; return manifestCache; });
}

let postsCache = null;

// lista leve (sem corpo) — vem do posts/index.json gerado pelo build.js;
// se o arquivo não existir (dev, file://), cai pro manifest + frontmatters
export function getPostIndex() {
  if (indexCache) return Promise.resolve(indexCache);
  return fetch('posts/index.json')
    .then(function (res) {
      if (!res.ok) throw new Error();
      return res.json();
    })
    .catch(function () { return buildIndexFromManifest(); })
    .then(function (list) {
      indexCache = list;
      return list;
    });
}

let indexCache = null;

function buildIndexFromManifest() {
  return loadManifest().then(function (manifest) {
    const entries = [];
    Object.keys(manifest).forEach(function (group) {
      (manifest[group] || []).forEach(function (name) {
        entries.push({ group: group, path: 'posts/' + group + '/' + name });
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
            title: parsed.data.title || entry.path.split('/').pop().replace(/\.md$/, ''),
            date: parsed.data.date || ''
          };
        })
        .catch(function () {
          return { path: entry.path, group: entry.group, title: entry.path.split('/').pop().replace(/\.md$/, ''), date: '' };
        });
    }));
  });
}

// NOTE: baixa o corpo de todos os posts — usado só pela busca (sob demanda)
export function getAllPosts() {
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

export function flattenManifest(manifest) {
  const out = [];
  Object.keys(manifest).forEach(function (group) {
    (manifest[group] || []).forEach(function (name) {
      out.push(group + '/' + name);
    });
  });
  return out;
}

export function groupIcon(group) {
  const icons = {
    readings: 'assets/icons/lucide/readings.svg',
    art: 'assets/icons/lucide/art.svg',
    games: 'assets/icons/lucide/games.svg',
    science: 'assets/icons/lucide/science.svg'
  };
  if (!icons[group]) {
    console.warn('groupIcon: no icon for group "' + group + '" — falling back to readings. Add it to groupIcon().');
  }
  return icons[group] || 'assets/icons/lucide/readings.svg';
}

export function listLevel(paths, segments) {
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

export function groupFromFile(file) {
  if (file === 'posts/about.md') return 'about';
  return (file || '').split('/')[1] || '';
}
