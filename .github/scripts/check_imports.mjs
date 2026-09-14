#!/usr/bin/env node
// Checa se os `import { x } from './y.js'` batem com os exports reais de y.js.
//
// Por que existe: `node --check` valida só a SINTAXE. Um import de nome que não
// existe (ou que foi renomeado) passa no check e só quebra em runtime, no
// navegador — foi exatamente o que já aconteceu aqui duas vezes.
//
// A checagem é estática (lê os arquivos, não executa nada): importar de fato
// exigiria um DOM, já que os módulos tocam em document/window no topo.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const JS_DIR = join(ROOT, 'js');

// módulos do site (fora vendor/ — terceiros não são nosso problema)
function modulosLegiveis() {
  const out = [];
  for (const f of readdirSync(JS_DIR)) {
    if (f.endsWith('.js')) out.push(join(JS_DIR, f));
  }
  return out;
}

// extrai os nomes exportados de um arquivo (export function/const/let/class,
// export { a, b }, e export { a } from './x.js' como reexport)
function extrairExports(src) {
  const nomes = new Set();

  // export function foo / export async function foo / export class Foo
  for (const m of src.matchAll(/export\s+(?:async\s+)?(?:function|class)\s+([A-Za-z_$][\w$]*)/g)) {
    nomes.add(m[1]);
  }
  // export const a = 1, b = 2;  (varias numa linha)
  // Estratégia: pega a lista de declaracoes ate o `;` e, em cada parte
  // separada por virgula, o identificador vem antes do `=` (ou a parte toda,
  // quando nao ha inicializador: `export let x;`)
  for (const m of src.matchAll(/export\s+(?:const|let|var)\s+([^;]*)/g)) {
    // remove o inicializador de cada parte, mantendo so o nome
    m[1].split(',').forEach(function (parte) {
      const antesDoIgual = parte.split('=')[0];
      const nome = antesDoIgual.trim().replace(/\s+.*$/, '').trim();
      if (/^[A-Za-z_$][\w$]*$/.test(nome)) nomes.add(nome);
    });
  }
  // export { a, b as c }
  for (const m of src.matchAll(/export\s*\{([^}]*)\}/g)) {
    m[1].split(',').forEach(function (parte) {
      const t = parte.trim();
      if (!t) return;
      const as = t.split(/\s+as\s+/);
      nomes.add((as[1] || as[0]).trim());
    });
  }
  // export * from './x.js' — não dá pra saber sem seguir; marcamos como coringa
  if (/export\s*\*/.test(src)) nomes.add('*');
  // export default
  if (/export\s+default\b/.test(src)) nomes.add('default');

  return nomes;
}

// extrai os imports de um arquivo: { nomes: [...], de: './x.js' }
function extrairImports(src) {
  const lista = [];
  const re = /import\s+([^'"]+?)\s+from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const clausula = m[1].trim();
    const de = m[2];
    const nomes = [];

    // import Default, { a, b } from  |  import Default from  |  import { a as b }
    const bloco = /\{([^}]*)\}/.exec(clausula);
    if (bloco) {
      bloco[1].split(',').forEach(function (parte) {
        const t = parte.trim();
        if (!t) return;
        nomes.push(t.split(/\s+as\s+/)[0].trim());
      });
    }
    // default: a parte antes do `{` (ou a cláusula toda, se não houver `{`)
    const semBloco = clausula.replace(/\{[^}]*\}/, '').replace(/,\s*$/, '').trim().replace(/,$/, '');
    if (semBloco && !semBloco.startsWith('*')) {
      nomes.push('default');
    }

    // import * as ns — não valida nomes (o namespace sempre existe se o arquivo existir)
    if (/^\*\s+as\s+/.test(clausula)) {
      lista.push({ nomes: [], de: de, namespace: true });
      continue;
    }
    lista.push({ nomes: nomes, de: de });
  }
  return lista;
}

let erros = 0;
const arquivos = modulosLegiveis();
// cache dos exports por caminho absoluto
const cacheExports = {};

function exportsDe(caminho) {
  if (!(caminho in cacheExports)) {
    try {
      cacheExports[caminho] = extrairExports(readFileSync(caminho, 'utf8'));
    } catch (e) {
      cacheExports[caminho] = null;
    }
  }
  return cacheExports[caminho];
}

for (const arquivo of arquivos) {
  const src = readFileSync(arquivo, 'utf8');
  const rel = relative(ROOT, arquivo);
  for (const imp of extrairImports(src)) {
    if (imp.namespace) continue;                  // * as ns: sempre ok
    if (!imp.de.startsWith('.')) continue;        // pacote externo: fora do escopo
    const alvo = resolve(dirname(arquivo), imp.de);

    const disponiveis = exportsDe(alvo);
    if (disponiveis === null) {
      console.log(rel + ': nao consegui ler "' + imp.de + '"');
      erros++;
      continue;
    }
    if (disponiveis.has('*')) continue;           // reexport: nao da pra conferir

    for (const nome of imp.nomes) {
      if (nome === 'default') {
        if (!disponiveis.has('default')) {
          console.log(rel + ': "' + imp.de + '" nao tem export default');
          erros++;
        }
        continue;
      }
      if (!disponiveis.has(nome)) {
        console.log(rel + ': "' + nome + '" nao existe em "' + imp.de + '"');
        erros++;
      }
    }
  }
}

if (erros) {
  console.log('');
  console.log('import check FAILED (' + erros + ')');
  process.exit(1);
}
console.log('import check OK (' + arquivos.length + ' modulos)');
