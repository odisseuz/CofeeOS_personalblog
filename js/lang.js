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

// Textos da interface que não vêm de um .md. Um lugar só, com o idioma ao lado
// do texto — assim traduzir uma string nova é editar uma linha.
//
// O que NÃO entra aqui: nome de janela (Terminal, Settings, sh, File manager).
// São nomes de sistema, não instrução pro leitor — um macOS em português ainda
// diz "Terminal". Traduzir quebraria a metáfora de SO que o site constrói.
const UI = {
  en: {
    // formulário de contato
    contactTitle: 'write me a message',
    subject: 'subject',
    message: 'your message…',
    email: 'your email (so I can reply)',
    send: 'send',
    mailSubject: 'Hello from coffeeOS',
    // topbar / busca
    search: 'search',
    searchPosts: 'Search posts',
    // pastas e listas
    filter: 'filter',
    filterFiles: 'Filter files',
    emptyFolder: 'empty folder',
    noPosts: 'no posts yet',
    noMatches: 'no matches',
    noHeadings: 'no headings',
    items: function (n) { return n + (n === 1 ? ' item' : ' items'); },
    words: function (n) { return n + (n === 1 ? ' word' : ' words'); },
    partOf: function (i, t) { return 'part ' + i + ' of ' + t; },
    // notas do leitor
    notesPlaceholder: 'write notes about this…',
    notesEdit: 'edit',
    notesPreview: 'preview',
    notesQuote: 'quote',
    notesDownload: 'download',
    notesClear: 'clear',
    notesActions: 'Notes actions',
    notesMore: 'More actions',
    notesToggle: 'Notes',
    previewAsMarkdown: 'Preview as markdown',
    quoteSelection: 'Quote the selected text from the article',
    downloadAsMd: 'Download as .md',
    eraseNotes: 'Erase these notes',
    // leitura / aparência
    toc: 'Table of contents',
    readerFont: 'Font',
    changeFont: 'Change the font',
    readerSizeDown: 'Decrease text size',
    readerSizeUp: 'Increase text size',
    cleanVersion: 'Read the clean version',
    cleanVersionLink: 'zen ↗',
    // acessibilidade / rótulos
    close: 'Close',
    maximize: 'Maximize',
    restore: 'Restore',
    up: 'Up',
    goUp: 'Go up one level',
    home: 'Home',
    about: 'About',
    apps: 'Apps',
    settings: 'Settings',
    theme: 'Change theme',
    mainNav: 'Main navigation',
    path: 'Path',
    language: 'Language',
    languageName: 'English',
    // terminal
    termCommand: 'Terminal command',
    termOpen: 'Terminal',
    termHint: 'Type a command (press Enter to open the terminal)',
    termPlaceholder: 'type help…',
    // notepad
    padOpen: 'Notepad',
    padArea: 'Notepad',
    padPlaceholder: '…'
  },
  pt: {
    contactTitle: 'me escreva uma mensagem',
    subject: 'assunto',
    message: 'sua mensagem…',
    email: 'seu email (pra eu poder responder)',
    send: 'enviar',
    mailSubject: 'Olá, vim do coffeeOS',
    search: 'buscar',
    searchPosts: 'Buscar posts',
    filter: 'filtrar',
    filterFiles: 'Filtrar arquivos',
    emptyFolder: 'pasta vazia',
    noPosts: 'nenhum post ainda',
    noMatches: 'nada encontrado',
    noHeadings: 'sem seções',
    items: function (n) { return n + (n === 1 ? ' item' : ' itens'); },
    words: function (n) { return n + (n === 1 ? ' palavra' : ' palavras'); },
    partOf: function (i, t) { return 'parte ' + i + ' de ' + t; },
    notesPlaceholder: 'escreva notas sobre isso…',
    notesEdit: 'editar',
    notesPreview: 'ver',
    notesQuote: 'citar',
    notesDownload: 'baixar',
    notesClear: 'limpar',
    notesActions: 'Ações das notas',
    notesMore: 'Mais ações',
    notesToggle: 'Notas',
    previewAsMarkdown: 'Ver como markdown',
    quoteSelection: 'Citar o texto selecionado no artigo',
    downloadAsMd: 'Baixar como .md',
    eraseNotes: 'Apagar estas notas',
    toc: 'Índice',
    readerFont: 'Fonte',
    changeFont: 'Mudar a fonte',
    readerSizeDown: 'Diminuir o texto',
    readerSizeUp: 'Aumentar o texto',
    cleanVersion: 'Ler a versão limpa',
    cleanVersionLink: 'zen ↗',
    close: 'Fechar',
    maximize: 'Maximizar',
    restore: 'Restaurar',
    up: 'Subir',
    goUp: 'Subir um nível',
    home: 'Início',
    about: 'Sobre',
    apps: 'Apps',
    settings: 'Configurações',
    theme: 'Mudar o tema',
    mainNav: 'Navegação principal',
    path: 'Caminho',
    language: 'Idioma',
    languageName: 'Português',
    termCommand: 'Comando do terminal',
    termOpen: 'Terminal',
    termHint: 'Digite um comando (Enter abre o terminal)',
    termPlaceholder: 'digite help…',
    padOpen: 'Notepad',
    padArea: 'Notepad',
    padPlaceholder: '…'
  }
};

// devolve o texto no idioma ativo; se faltar, cai no padrão
// (assim uma string nova sem tradução aparece em inglês, não em branco)
//
// Valores que são FUNÇÃO (plurais, contadores) voltam como a função, pra quem
// precisa deles chamar com os números: tfn('items')(3). Valores simples — mesmo
// que a função não espere argumento — são resolvidos aqui.
export function t(chave, lang) {
  const l = lang || atual;
  const bloco = UI[l] || UI[PADRAO];
  let v = bloco[chave] !== undefined ? bloco[chave] : UI[PADRAO][chave];
  if (v === undefined) return '';
  if (typeof v === 'function') v = v();
  return v;
}

// a versão que devolve a FUNÇÃO (pra plurais): tfn('items')(3)
export function tfn(chave, lang) {
  const l = lang || atual;
  const bloco = UI[l] || UI[PADRAO];
  const v = bloco[chave] !== undefined ? bloco[chave] : UI[PADRAO][chave];
  return typeof v === 'function' ? v : function () { return v || ''; };
}

// Aplica os textos no HTML estático. O elemento declara o que é:
//   data-i18n="search"            -> textContent
//   data-i18n-aria="close"         -> aria-label
//   data-i18n-title="theme"        -> title
//   data-i18n-placeholder="search" -> placeholder
//
// O que NÃO leva data-i18n: nome de janela e o que o JS monta em runtime (esses
// chamam t() direto).
const ATRIBUTOS = [
  ['data-i18n', null],
  ['data-i18n-aria', 'aria-label'],
  ['data-i18n-title', 'title'],
  ['data-i18n-placeholder', 'placeholder']
];

export function applyUiLang(lang) {
  const l = lang || atual;
  ATRIBUTOS.forEach(function (par) {
    const chave = par[0];
    const attr = par[1];
    document.querySelectorAll('[' + chave + ']').forEach(function (el) {
      const texto = t(el.getAttribute(chave), l);
      if (attr) el.setAttribute(attr, texto);
      else el.textContent = texto;
    });
  });
}
