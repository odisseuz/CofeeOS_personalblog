// terminal
import { loadManifest, getPostIndex, getAllPosts } from './data.js';

const PROMPT = 'guest@coffeeOS:~$';
let output = null;
let input = null;

function scrollToBottom() {
  output.scrollTop = output.scrollHeight;
}

function printLine(text, cls) {
  const div = document.createElement('div');
  div.className = 'line' + (cls ? ' ' + cls : '');
  div.textContent = text;
  output.appendChild(div);
  scrollToBottom();
}

function print(lines) {
  lines.forEach(function (line) {
    printLine(line);
  });
}

function printPrompt(cmd) {
  const div = document.createElement('div');
  div.className = 'line';
  const p = document.createElement('span');
  p.className = 'prompt';
  p.textContent = PROMPT;
  div.appendChild(p);
  div.appendChild(document.createTextNode(' ' + cmd));
  output.appendChild(div);
  scrollToBottom();
}

function neofetchLines() {
  const art = [
    '      ( (',
    '       ) )',
    '    ........',
    '    |      |]',
    '    \\      /',
    "     `----'",
  ];
  return art.concat([
    '',
    'guest@coffeeOS',
    '--------------',
    'OS: coffeeOS 1.0 (midnight)',
    'Host: github pages',
    'Kernel: insomnia',
    'Shell: sh',
    'Uptime: since forever',
    'Memory: 1 cup / 1 cup',
  ]);
}

const commands = {
  help: function () {
    return [
      'available commands:',
      '  help        show this help',
      '  whoami      print current user',
      '  pwd         print working directory',
      '  date        print current date/time',
      '  echo <txt>  print text',
      '  ls          list files',
      '  cat <file>  print a file',
      '  grep <term> search posts',
      '  neofetch    system info',
      '  coffee      brew a cup',
      '  clear       clear the screen',
    ];
  },
  whoami: function () { return ['guest']; },
  pwd: function () { return ['/home/guest']; },
  uname: function () { return ['coffeeOS']; },
  date: function () { return [new Date().toString()]; },
  echo: function (args) { return [args.join(' ')]; },
  ls: function () {
    return loadManifest().then(function (manifest) {
      const lines = [];
      Object.keys(manifest).forEach(function (group) {
        const names = manifest[group] || [];
        if (names.length) {
          lines.push(group + '/');
          names.forEach(function (f) { lines.push('  ' + f); });
        }
      });
      return lines.length ? lines : ['(no posts yet)'];
    });
  },
  cat: function (args) {
    if (args.length === 0) return ['usage: cat <file>'];
    const target = args[0];
    return loadManifest().then(function (manifest) {
      let path = null;
      if (target.indexOf('/') !== -1) {
        path = 'posts/' + target.replace(/\.md$/, '') + '.md';
      } else {
        Object.keys(manifest).forEach(function (group) {
          if (path) return;
          (manifest[group] || []).forEach(function (name) {
            if (!path && name.split('/').pop() === target) {
              path = 'posts/' + group + '/' + name;
            }
          });
        });
      }
      if (!path) return ['cat: ' + target + ': no such file', '(tip: check posts/manifest.json)'];
      return fetch(path)
        .then(function (res) {
          if (!res.ok) throw new Error();
          return res.text();
        })
        .then(function (text) { return text.split('\n'); })
        .catch(function () { return ['cat: ' + target + ': could not read', '(tip: check posts/manifest.json)']; });
    });
  },
  grep: function (args) {
    if (args.length === 0) return ['usage: grep <term>'];
    const term = args.join(' ').toLowerCase();
    // metadados primeiro (leve); corpos só se nada casar no índice
    return getPostIndex().then(function (index) {
      const byMeta = index.filter(function (p) {
        return (p.title + ' ' + p.group).toLowerCase().indexOf(term) !== -1;
      });
      if (byMeta.length) return byMeta;
      return getAllPosts().then(function (posts) {
        return posts.filter(function (p) {
          return (p.title + ' ' + p.body).toLowerCase().indexOf(term) !== -1;
        });
      });
    }).then(function (matches) {
      if (!matches.length) return ['no matches'];
      return matches.map(function (p) {
        return p.title + '  (' + p.group + ')';
      });
    });
  },
  coffee: function () { return ['brewing...', '☕ your cup is ready.']; },
  neofetch: function () { return neofetchLines(); },
  clear: function () { return '__clear__'; },
};

// roda um comando e escreve a saída no terminal
export function runCommand(raw) {
  if (!output) return;
  const trimmed = raw.trim();
  if (!trimmed) return;

  printPrompt(trimmed);

  const parts = trimmed.split(/\s+/);
  const name = parts[0];
  const args = parts.slice(1);

  const handler = commands[name];
  if (!handler) {
    print(['sh: ' + name + ': command not found']);
    return;
  }

  const result = handler(args);
  if (result && typeof result.then === 'function') {
    result.then(function (lines) {
      if (lines === '__clear__') { output.textContent = ''; return; }
      print(lines);
    });
    return;
  }
  if (result === '__clear__') {
    output.textContent = '';
    return;
  }
  print(result);
}

export function focusTerminal() {
  if (input) input.focus();
}

export function initTerminal() {
  output = document.getElementById('term-output');
  input = document.getElementById('term-input');
  if (!output || !input) return;

  const history = [];
  let histIndex = 0;

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const value = input.value;
      if (value.trim()) {
        history.push(value);
        histIndex = history.length;
      }
      input.value = '';
      runCommand(value);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histIndex > 0) {
        histIndex -= 1;
        input.value = history[histIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIndex < history.length - 1) {
        histIndex += 1;
        input.value = history[histIndex];
      } else {
        histIndex = history.length;
        input.value = '';
      }
    }
  });

  print([
    'coffeeOS 1.0 (midnight)',
    'type "help" and press enter to see the commands.',
    '',
  ]);
}
