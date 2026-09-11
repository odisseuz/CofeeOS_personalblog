// smoke test do renderer de markdown — roda no CI pra pegar regressão
import { renderMarkdown, parseFrontmatter } from '../../js/markdown.js';

let failures = 0;
const B = String.fromCharCode(92); // backslash

function pass(name) {
  console.log('PASS | ' + name);
}

function fail(name, detail) {
  failures++;
  console.log('FAIL | ' + name);
  if (detail) console.log('  ' + detail);
}

function eq(name, actual, expected) {
  if (actual === expected) pass(name);
  else fail(name, 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}

function has(name, html, needle) {
  if (html.indexOf(needle) !== -1) pass(name);
  else fail(name, 'esperava conter ' + JSON.stringify(needle));
}

function lacks(name, html, needle) {
  if (html.indexOf(needle) === -1) pass(name);
  else fail(name, 'não deveria conter ' + JSON.stringify(needle));
}

// frontmatter
const fm = parseFrontmatter('---\ntitle: Teste\ndate: 2026-01-01\n---\ncorpo');
eq('frontmatter.title', fm.data.title, 'Teste');
eq('frontmatter.body', fm.body, 'corpo');
eq('sem frontmatter', parseFrontmatter('só texto').body, 'só texto');

// blocos
has('heading', renderMarkdown('# título'), '<h1>título</h1>');
has('parágrafo', renderMarkdown('texto'), '<p>texto</p>');
has('blockquote', renderMarkdown('> citação'), '<blockquote>');
has('lista', renderMarkdown('- a\n- b'), '<ul>');

// inline
has('negrito', renderMarkdown('**x**'), '<strong>x</strong>');
has('itálico', renderMarkdown('*x*'), '<em>x</em>');
has('code inline', renderMarkdown('`x`'), '<code>x</code>');

// escapes
has('escape literal', renderMarkdown(B + '*' + 'x' + B + '*'), '*x*');
lacks('escape não vira itálico', renderMarkdown(B + '*' + 'x' + B + '*'), '<em>');

// task list
has('task-list', renderMarkdown('- [ ] a\n- [x] b'), 'class="task-list"');
has('task checked', renderMarkdown('- [x] b'), 'checked');

// autolink
has('autolink', renderMarkdown('<https://x.com>'), '<a href="https://x.com">');

// code fence
has('fence com linguagem', renderMarkdown('```js\nlet x = 1;\n```'), 'class="language-js"');

// footnotes
has('footnotes', renderMarkdown('a[^1]\n\n[^1]: nota'), 'footnotes');

// segurança: HTML é escapado
lacks('html escapado', renderMarkdown('<script>alert(1)</script>'), '<script>');

console.log('');
if (failures) {
  console.log(failures + ' falha(s)');
  process.exit(1);
}
console.log('renderer smoke test OK');
