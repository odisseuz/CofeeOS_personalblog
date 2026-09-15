// drafts: um post com `draft: true` no frontmatter não aparece no site.
//
// O estado vive no próprio .md — é a fonte única. A CLI (`coffee commit`) lê
// daqui pra manter o .gitignore em dia, e o build.js usa a mesma regra pra
// tirar o draft do index.json e do sitemap.

export function isDraft(post) {
  if (!post) return false;
  const v = post.draft;
  if (v === true) return true;
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    return s === 'true' || s === 'yes' || s === '1';
  }
  return false;
}

// tira os drafts de uma lista de posts
export function semDrafts(posts) {
  return (posts || []).filter(function (p) { return !isDraft(p); });
}
