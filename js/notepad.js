// notepad — janela de notas (scratch.md)
import { renderMarkdown } from './markdown.js';

const KEY = 'coffeeos:notes:scratch';
let area = null;
let preview = null;
let previewBtn = null;

export function initNotepad() {
  area = document.getElementById('pad-area');
  preview = document.getElementById('pad-preview-body');
  previewBtn = document.getElementById('pad-preview');
  if (!area || !preview) return;

  try {
    area.value = localStorage.getItem(KEY) || '';
  } catch (e) {
    area.value = '';
  }

  let saveTimer = null;
  area.addEventListener('input', function () {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 300);
  });

  if (previewBtn) {
    previewBtn.addEventListener('click', function () {
      if (area.hidden) {
        area.hidden = false;
        preview.hidden = true;
        previewBtn.textContent = 'preview';
      } else {
        preview.innerHTML = renderMarkdown(area.value);
        area.hidden = true;
        preview.hidden = false;
        previewBtn.textContent = 'edit';
      }
    });
  }

  const download = document.getElementById('pad-download');
  if (download) download.addEventListener('click', downloadScratch);
}

function save() {
  if (!area) return;
  try {
    localStorage.setItem(KEY, area.value);
  } catch (e) {}
}

export function focusNotepad() {
  if (area) area.focus();
}

export function downloadScratch() {
  if (!area || !area.value.trim()) return;
  const blob = new Blob([area.value], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'scratch.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
