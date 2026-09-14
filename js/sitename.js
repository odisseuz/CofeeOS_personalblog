// selo da bebida — o tema escolhido aparece no hero como uma pista de que os
// temas existem (o cardápio fica escondido atrás do ⚙).
//
// O nome do site NÃO muda: continua "midnight coffee". A bebida é um detalhe,
// como o "· latte" ao lado da tagline.

const BEBIDAS = {
  latte: 'latte',
  blue: 'blue mountain',
  black: 'cold brew',
  blackhoney: 'black honey',
  mocha: 'mocha',
  ethiopian: 'ethiopian',
  puerh: 'puerh',
  matcha: 'matcha',
  cappuccino: 'cappuccino',
  cream: 'cortado'
};

const listeners = [];
let atual = BEBIDAS.latte;

export function brewName() {
  return atual;
}

export function onBrewChange(fn) {
  listeners.push(fn);
  fn(atual);
}

// chamado pelo theme.js quando o tema muda (e na carga inicial)
export function setBrewFromTheme(theme) {
  const bebida = BEBIDAS[theme] || BEBIDAS.latte;
  if (bebida === atual) return;
  atual = bebida;
  listeners.forEach(function (fn) { fn(atual); });
}
