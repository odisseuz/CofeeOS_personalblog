// estado global compartilhado entre módulos
const articleOverlay = document.getElementById('overlay');
const fmOverlay = document.getElementById('fm-overlay');
const originalTitle = document.title;

let currentNoteFile = null;
let lastFocus = null;
let articleFromFinder = false;
let currentPath = [];
let finderFilter = '';
