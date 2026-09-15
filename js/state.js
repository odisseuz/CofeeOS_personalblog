// estado global compartilhado entre módulos
export const articleOverlay = document.getElementById('overlay');
export const fmOverlay = document.getElementById('fm-overlay');
export const originalTitle = document.title;

export const state = {
  currentNoteFile: null,
  // arquivo aberto no overlay do artigo AGORA (null quando fechado). Não
  // confundir com currentNoteFile: aquele é de quem as NOTAS estão carregadas
  // no painel lateral, e sobrevive ao fechamento do artigo.
  currentArticleFile: null,
  lastFocus: null,
  articleFromFinder: false,
  currentPath: [],
  finderFilter: ''
};
