import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
// simula 390px de largura (celular tipico)
const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'http://localhost:8000/',pretendToBeVisual:true});
const {window}=dom;
global.window=window; global.document=window.document;
const css=readFileSync('style.css','utf8');
// extrai as regras relevantes pra inspecionar
function regra(sel){
  const re=new RegExp('\\'+sel.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\s*\\{([^}]*)\\}');
  const m=re.exec(css); return m?m[1].trim():'(nao achou)';
}
console.log('=== mobile (max-width 560px) ===');
const mob=css.slice(css.indexOf('@media (max-width: 560px)'));
for (const sel of ['.topbar','.statusbar','.search','.search-input','.search-input:focus']) {
  const i=mob.indexOf(sel+' {');
  if(i===-1){console.log(sel+': (nao no mobile)');continue;}
  const fim=mob.indexOf('}',i);
  console.log(sel+':');
  mob.slice(i+sel.length+2,fim).trim().split('\n').forEach(l=>console.log('   '+l.trim()));
}
