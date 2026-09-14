// smoke test do renderer de markdown (marked) — roda no CI pra pegar regressão
import { renderMarkdown, parseFrontmatter } from '../../js/markdown.js';
import { extractMath, hasMath } from '../../js/math.js';
import katex from '../../js/vendor/katex/katex.mjs';

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

// séries: campos extras passam pelo parser genérico
const fmSeries = parseFrontmatter('---\ntitle: T\nseries: neuroscience\norder: 2\n---\nx');
eq('frontmatter.series', fmSeries.data.series, 'neuroscience');
eq('frontmatter.order (string do parser)', fmSeries.data.order, '2');
eq('order vira numero no build', Number(fmSeries.data.order), 2);
eq('sem series', parseFrontmatter('---\ntitle: T\n---\nx').data.series, undefined);

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
has('task-list', renderMarkdown('- [ ] a\n- [x] b'), 'type="checkbox"');
has('task checked', renderMarkdown('- [x] b'), 'checked');

// autolink
has('autolink', renderMarkdown('<https://x.com>'), '<a href="https://x.com">');

// link com underscore não vira itálico
has('link underscore', renderMarkdown('[repo](https://github.com/GmailR_Sender_Simple_Script)'), '<a href="https://github.com/GmailR_Sender_Simple_Script">');
lacks('link underscore sem em', renderMarkdown('[repo](https://github.com/GmailR_Sender_Simple_Script)'), '<em>');

// code fence
has('fence com linguagem', renderMarkdown('```js\nlet x = 1;\n```'), 'class="language-js"');

// footnotes
has('footnotes', renderMarkdown('a[^1]\n\n[^1]: nota'), 'footnotes');

// segurança: HTML é escapado e javascript: é bloqueado
lacks('html escapado', renderMarkdown('<script>alert(1)</script>'), '<script>');
has('javascript bloqueado', renderMarkdown('[x](javascript:alert(1))'), 'href="#"');
has('imagem lazy', renderMarkdown('![alt](images/a.jpg)'), 'loading="lazy"');

// features que o renderer antigo não tinha
has('tabela', renderMarkdown('| a | b |\n| --- | --- |\n| 1 | 2 |'), '<table>');
has('lista aninhada', renderMarkdown('- a\n  - b'), '<li>a<ul>');
has('blockquote multi parágrafo', renderMarkdown('> one\n>\n> two'), '<p>two</p>');

// math (KaTeX)
const exm = extractMath('soma $\\sum_{i=1}^{n} x_i$ e $$\\int_0^1 f$$ fim');
eq('math: extrai 2', exm.found.length, 2);
eq('math: display primeiro', exm.found[0].display, true);
eq('math: inline depois', exm.found[1].display, false);
lacks('math: TeX sai do texto', exm.text, '\\sum');
has('math: placeholder presente', exm.text, 'MATH0');
eq('hasMath com $', hasMath('tem $x$'), true);
eq('hasMath sem $', hasMath('texto'), false);
// underscore/asterisco fora de math nao viram placeholder
eq('math: so o math e extraido', extractMath('a_b e $x_i$').found.length, 1);
has('math: texto normal fica', extractMath('a_b e $x_i$').text, 'a_b');
// o KaTeX renderiza de verdade
has('katex renderiza soma', katex.renderToString('\\sum_{i=1}^{n} x_i', { throwOnError: false }), 'class="katex"');
has('katex display block', katex.renderToString('x', { displayMode: true }), 'katex-display');
// formula invalida nao derruba o build
has('katex tolera erro', katex.renderToString('\\frac{1}{', { throwOnError: false }), 'katex');
// o TeX cru vive dentro de <annotation> (acessibilidade), nao visivel
has('katex: TeX em annotation', katex.renderToString('x_1', {}), 'annotation');
console.log('');
if (failures) {
  console.log(failures + ' falha(s)');
  process.exit(1);
}
console.log('renderer smoke test OK');
