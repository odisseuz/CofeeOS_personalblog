// dados: manifest + lista de posts
import { parseFrontmatter } from './markdown.js';
import { matchesLang, getLang, isAbout } from './lang.js';

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
            date: parsed.data.date || '',
            series: parsed.data.series || '',
            lang: parsed.data.lang || 'en',
            order: parsed.data.order === undefined ? null : Number(parsed.data.order)
          };
        })
        .catch(function () {
          return { path: entry.path, group: entry.group, title: entry.path.split('/').pop().replace(/\.md$/, ''), date: '', series: '', lang: 'en', order: null };
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
            series: parsed.data.series || '',
            lang: parsed.data.lang || 'en',
            order: parsed.data.order === undefined ? null : Number(parsed.data.order),
            body: parsed.body
          };
        })
        .catch(function () {
          return { path: entry.path, group: entry.group, title: entry.name.replace(/\.md$/, ''), date: '', series: '', lang: 'en', order: null, body: '' };
        });
    })).then(function (posts) {
      postsCache = posts;
      return posts;
    });
  });
}

// filtra a lista pelo idioma ativo. Usado no finder, no recent, na busca e
// nos contadores da home — um lugar só, pra nenhuma superfície esquecer.
export function inLang(posts, lang) {
  return (posts || []).filter(function (p) { return matchesLang(p, lang || getLang()); });
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
    science: 'assets/icons/lucide/science.svg',
    culture: 'assets/icons/lucide/globe.svg'
  };
  if (!icons[group]) {
    console.warn('groupIcon: no icon for group "' + group + '" — falling back to readings. Add it to groupIcon().');
  }
  return icons[group] || 'assets/icons/lucide/readings.svg';
}

// distingue um grupo (pasta da home, tem ícone próprio) de uma subpasta qualquer
export function isGroup(name) {
  return ['readings', 'art', 'games', 'science', 'culture'].indexOf(name) !== -1;
}

// Monta um nível de pasta. `filesPaths` (opcional) restringe os ARQUIVOS: o
// finder passa só os do idioma ativo. As PASTAS vêm sempre de `paths` (árvore
// inteira), porque gaveta vazia continua sendo gaveta — trocar o idioma não
// deve remover a estrutura do OS.
export function listLevel(paths, segments, filesPaths) {
  const prefix = segments.length ? segments.join('/') + '/' : '';
  const folderSet = {};
  const folders = [];
  const files = [];
  const source = filesPaths || paths;

  paths.forEach(function (p) {
    if (prefix && p.indexOf(prefix) !== 0) return;
    const rest = prefix ? p.slice(prefix.length) : p;
    const parts = rest.split('/');
    if (parts.length > 1 && !folderSet[parts[0]]) {
      folderSet[parts[0]] = true;
      folders.push(parts[0]);
    }
  });

  source.forEach(function (p) {
    if (prefix && p.indexOf(prefix) !== 0) return;
    const rest = prefix ? p.slice(prefix.length) : p;
    if (rest.split('/').length === 1) files.push(rest);
  });

  return { folders: folders, files: files };
}

export function groupFromFile(file) {
  if (isAbout(file)) return 'about';
  return (file || '').split('/')[1] || '';
}

// agrupa uma lista de posts em séries, na ordem definida pelo campo `order`.
// Posts sem série (ou com order ausente) ficam no bloco solto, por data.
// Retorna [{ series: '', items: [...] }, { series: 'x', items: [...] }]
export function groupBySeries(posts) {
  const loose = [];
  const buckets = {};
  const order = [];

  posts.forEach(function (p) {
    if (!p.series) { loose.push(p); return; }
    if (!buckets[p.series]) { buckets[p.series] = []; order.push(p.series); }
    buckets[p.series].push(p);
  });

  const byOrder = function (a, b) {
    const ao = a.order === null || a.order === undefined;
    const bo = b.order === null || b.order === undefined;
    if (ao !== bo) return ao ? 1 : -1;                 // com order vem antes
    if (!ao && a.order !== b.order) return a.order - b.order;
    return String(b.date).localeCompare(String(a.date));
  };

  loose.sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
  order.forEach(function (s) { buckets[s].sort(byOrder); });

  const blocks = [];
  if (loose.length) blocks.push({ series: '', items: loose });
  order.forEach(function (s) { blocks.push({ series: s, items: buckets[s] }); });
  return blocks;
}

// posição de um post dentro da sua série (1-based), ou null se não tem série
export function seriesPosition(post, all) {
  if (!post || !post.series) return null;
  const items = (all || []).filter(function (p) { return p.series === post.series; })
    .slice()
    .sort(function (a, b) {
      const ao = a.order === null || a.order === undefined;
      const bo = b.order === null || b.order === undefined;
      if (ao !== bo) return ao ? 1 : -1;
      if (!ao && a.order !== b.order) return a.order - b.order;
      return String(a.date).localeCompare(String(b.date));
    });
  const i = items.findIndex(function (p) { return p.path === post.path; });
  if (i === -1) return null;
  return { index: i + 1, total: items.length, items: items, series: post.series };
}
