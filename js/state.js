// estado global compartilhado entre módulos
export const articleOverlay = document.getElementById('overlay');
export const fmOverlay = document.getElementById('fm-overlay');
export const originalTitle = document.title;

export const state = {
  currentNoteFile: null,
  lastFocus: null,
  articleFromFinder: false,
  currentPath: [],
  finderFilter: ''
};
