// terminal
import { loadManifest, getPostIndex, getAllPosts } from './data.js';

const PROMPT = 'guest@coffeeOS:~$';
const THEMES = ['blue', 'brown', 'black', 'cream', 'light'];
let output = null;
let input = null;
let history = [];
let histIndex = 0;

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

// acha um post pelo nome do arquivo, título ou sufixo do caminho
function findPost(posts, term) {
  const t = term.toLowerCase().replace(/\.md$/, '');
  return posts.find(function (p) {
    const file = p.path.split('/').pop().replace(/\.md$/, '').toLowerCase();
    return file === t || p.title.toLowerCase() === t;
  }) || posts.find(function (p) {
    return p.path.toLowerCase().indexOf(t) !== -1;
  });
}

const commands = {
  help: function () {
    return [
      'available commands:',
      '  help          show this help',
      '  ls [-l]       list posts',
      '  open <post>   open a post (tab to complete)',
      '  cat <post>    print a post (raw markdown)',
      '  random        open a random post',
      '  grep <term>   search posts',
      '  notes         open the notepad',
      '  theme <name>  switch theme (blue|brown|black|cream|light)',
      '  whoami        print current user',
      '  pwd           print working directory',
      '  uname         print the OS name',
      '  date          print current date/time',
      '  echo <txt>    print text',
      '  history       show command history',
      '  neofetch      system info',
      '  coffee        brew a cup',
      '  clear         clear the screen',
    ];
  },
  whoami: function () { return ['guest']; },
  pwd: function () { return ['/home/guest']; },
  uname: function () { return ['coffeeOS']; },
  date: function () { return [new Date().toString()]; },
  echo: function (args) { return [args.join(' ')]; },

  ls: function (args) {
    const long = args.indexOf('-l') !== -1;
    return getPostIndex().then(function (posts) {
      if (!posts.length) return ['(no posts yet)'];
      const lines = [];
      let group = null;
      posts.forEach(function (p) {
        if (p.group !== group) {
          group = p.group;
          lines.push(group + '/');
        }
        const file = p.path.split('/').pop();
        lines.push(long ? '  ' + file.padEnd(34) + p.date : '  ' + file);
      });
      return lines;
    });
  },

  open: function (args) {
    if (!args.length) return ['usage: open <post>'];
    return getPostIndex().then(function (posts) {
      const post = findPost(posts, args.join(' '));
      if (!post) return ['open: ' + args.join(' ') + ': no such post'];
      // deixa o evento terminar antes de trocar de janela
      setTimeout(function () { window.__openPost(post.path); }, 0);
      return ['opening ' + post.path.split('/').pop() + ' …'];
    });
  },

  cat: function (args) {
    if (!args.length) return ['usage: cat <post>'];
    return getPostIndex().then(function (posts) {
      const post = findPost(posts, args.join(' '));
      if (!post) return ['cat: ' + args.join(' ') + ': no such post'];
      return fetch(post.path)
        .then(function (res) {
          if (!res.ok) throw new Error();
          return res.text();
        })
        .then(function (text) { return text.split('\n'); })
        .catch(function () { return ['cat: could not read ' + post.path]; });
    });
  },

  grep: function (args) {
    if (!args.length) return ['usage: grep <term>'];
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
        return p.path.split('/').pop() + '  (' + p.group + ')';
      });
    });
  },

  random: function () {
    return getPostIndex().then(function (posts) {
      if (!posts.length) return ['no posts yet'];
      const pick = posts[Math.floor(Math.random() * posts.length)];
      setTimeout(function () { window.__openPost(pick.path); }, 0);
      return ['rolling the dice…', 'opening ' + pick.path.split('/').pop()];
    });
  },

  notes: function () {
    setTimeout(function () { window.__openApp('notes'); }, 0);
    return ['opening notes …'];
  },

  theme: function (args) {
    if (!args.length) return ['themes: ' + THEMES.join(', ')];
    const name = args[0].toLowerCase();
    if (THEMES.indexOf(name) === -1) {
      return ['theme: ' + args[0] + ': unknown', 'try: ' + THEMES.join(', ')];
    }
    window.__setTheme(name);
    return ['theme → ' + name];
  },

  history: function () {
    if (!history.length) return ['(no history)'];
    return history.map(function (cmd, i) {
      return String(i + 1).padStart(4) + '  ' + cmd;
    });
  },

  neofetch: function () { return neofetchLines(); },
  coffee: function () { return ['brewing...', '☕ your cup is ready.']; },
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

// tab: completa o comando ou o nome do post
function complete() {
  const value = input.value;
  const parts = value.split(/\s+/);
  const isFirstWord = parts.length === 1;

  return (isFirstWord ? Promise.resolve(Object.keys(commands)) : getPostIndex().then(function (posts) {
    return posts.map(function (p) { return p.path.split('/').pop().replace(/\.md$/, ''); });
  })).then(function (candidates) {
    const frag = (isFirstWord ? parts[0] : parts[parts.length - 1]).toLowerCase();
    const hits = candidates.filter(function (c) { return c.toLowerCase().indexOf(frag) === 0; });
    if (!hits.length) return;

    if (hits.length === 1) {
      if (isFirstWord) input.value = hits[0] + ' ';
      else { parts[parts.length - 1] = hits[0]; input.value = parts.join(' '); }
    } else {
      print([value]);
      print(hits.map(function (h) { return '  ' + h; }));
    }
  });
}

export function initTerminal() {
  output = document.getElementById('term-output');
  input = document.getElementById('term-input');
  if (!output || !input) return;

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      const value = input.value;
      if (value.trim()) {
        history.push(value.trim());
        histIndex = history.length;
      }
      input.value = '';
      runCommand(value);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
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
    'type "help" for the commands, tab to complete.',
    '',
  ]);
}
