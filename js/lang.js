// idioma do site (en padrão, pt opcional)
//
// O idioma mora na URL (`?lang=pt`), não no hash. Isso é de propósito: o hash
// muda a cada navegação, e o link que a pessoa compartilha no WhatsApp precisa
// carregar o idioma junto — inclusive pra quem nunca visitou o site.
//
// A precedência é: URL > localStorage > padrão. O `?lang=` também é gravado no
// localStorage, então quem clica uma vez num link em português continua em
// português nas visitas seguintes.

const KEY = 'coffeeos:lang';
export const PADRAO = 'en';
export const LANGS = ['en', 'pt'];

// rótulo curto pro seletor e pro <html lang>
const NOMES = { en: 'EN', pt: 'PT' };

let atual = PADRAO;

function valido(l) {
  return LANGS.indexOf(l) !== -1;
}

function daUrl() {
  try {
    const p = new URLSearchParams(location.search).get('lang');
    return valido(p) ? p : null;
  } catch (e) {
    return null;
  }
}

function doStorage() {
  try {
    const v = localStorage.getItem(KEY);
    return valido(v) ? v : null;
  } catch (e) {
    return null;
  }
}

// resolve o idioma inicial (e o grava de volta, se veio da URL)
export function initLang() {
  const url = daUrl();
  atual = url || doStorage() || PADRAO;
  if (url) {
    try { localStorage.setItem(KEY, url); } catch (e) {}
  }
  aplicarNoHtml();
  return atual;
}

export function getLang() {
  return atual;
}

export function langLabel(l) {
  return NOMES[l] || NOMES[PADRAO];
}

// troca o idioma: grava, reflete na URL e no <html lang>
export function setLang(l) {
  if (!valido(l)) l = PADRAO;
  if (l === atual) return false;
  atual = l;
  try { localStorage.setItem(KEY, l); } catch (e) {}

  // o ?lang= na URL é o que faz o link compartilhado abrir no idioma certo.
  // Em `en` ele sai da URL: o padrão não precisa sujar o endereço.
  try {
    const url = new URL(location.href);
    if (l === PADRAO) url.searchParams.delete('lang');
    else url.searchParams.set('lang', l);
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  } catch (e) { /* file:// ou contexto restrito */ }

  aplicarNoHtml();
  return true;
}

function aplicarNoHtml() {
  document.documentElement.setAttribute('lang', atual);
}

// um post entra na lista do idioma ativo? Post sem `lang` é em inglês (os que
// já estavam no ar continuam onde estão, sem migração).
export function matchesLang(post, lang) {
  const l = post && post.lang ? post.lang : PADRAO;
  return l === (lang || atual);
}

// A nota "about" existe em dois arquivos (about.md / about.pt.md) e é aberta
// por hash fixo (`#/about`), por botão do dock e pelo rodapé — nenhum deles sabe
// o idioma. O caminho real fica resolvido aqui, num lugar só.
export function aboutFile(lang) {
  return (lang || atual) === PADRAO ? 'posts/about.md' : 'posts/about.' + (lang || atual) + '.md';
}

// o inverso: um arquivo é alguma versão do about?
export function isAbout(file) {
  return /^posts\/about(\.[a-z]{2})?\.md$/.test(file || '');
}

// idioma declarado no nome do arquivo do about (about.pt.md → pt)
export function aboutLang(file) {
  const m = /^posts\/about\.([a-z]{2})\.md$/.exec(file || '');
  return m ? m[1] : PADRAO;
}
