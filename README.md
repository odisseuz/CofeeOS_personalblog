# midnight coffee ☕

![deploy](https://img.shields.io/github/actions/workflow/status/odisseuz/CofeeOS_personalblog/deploy.yml?branch=main&label=deploy) ![license](https://img.shields.io/github/license/odisseuz/CofeeOS_personalblog) ![static](https://img.shields.io/badge/site-static-8b949e) ![deps](https://img.shields.io/badge/runtime%20deps-0-79c0ff) ![coffee](https://img.shields.io/badge/made%20with-coffee-c98d5a)

Blog pessoal com estética "coffeeOS" — HTML/CSS/JS puro, sem bundler nem CDN em runtime (as dependências ficam vendorizadas em `js/vendor/`; só um `build.js` leve roda no CI pra gerar HTML de SEO).

## Início rápido

Toda a administração é feita pela CLI `bin/coffee`, rodada **na raiz do projeto**:

```bash
cd ~/Downloads/neocities-andregomes     # ou onde você clonou

./bin/coffee                            # estado do projeto + menu
./bin/coffee serve                      # abre o site em localhost:8000
```

Sem argumento, o `coffee` mostra **onde as coisas estão** e um menu — é o ponto de partida quando você não lembra o comando:

```
midnight coffee

  posts       3 publicados · 2 rascunhos
  idiomas     en (2) · pt (1)
  git         main, limpo

  próximo passo:
    ./bin/coffee publish science/psychology/history/descartes-hume-and-kant.md

  o que você quer fazer?

    1) escrever um post novo
    2) ver os rascunhos (2)
    …
```

**Escrever um post:**

```bash
./bin/coffee new science/education/meu-post --lang pt --draft
# → cria o .md com título, data, idioma e o marca como rascunho

./bin/coffee commit                     # cuida do resto: manifest, .gitignore, push
```

> O `./` deixa explícito que é um arquivo da pasta atual (e não um comando do sistema).
> O site precisa do `./bin/coffee serve` pra funcionar — abrir o `index.html` direto (via `file://`) quebra o `fetch`.

Pra não escrever `./bin/` toda vez, o `./install.sh` deixa o comando global — ver **CLI** abaixo.

## Estrutura

```
index.html
style.css
build.js        # gera HTML estático dos posts (SEO) + sitemap.xml + posts/index.json
package.json    # "type": "module" (node roda os módulos ES)
bin/coffee      # CLI: interativo (sem argumento) + new/rm/publish/commit/verify/serve
bin/serve       # servidor de dev (no-cache)
bin/lib/        # helpers python da CLI (manifest, drafts, commit, status, i18n, conf, imagens)
install.sh      # cria o link <prefix>/bin/coffee pro projeto
js/
  state.js      # estado global compartilhado
  markdown.js   # renderer de markdown (marked) + frontmatter
  vendor/       # marked + marked-footnote (self-hosted)
  lang.js       # idioma (en/pt): filtro, about, léxico de UI
  drafts.js     # `draft: true`: o que não vai pro site
  data.js       # manifest + lista de posts (índice leve + corpos)
  windows.js    # arrastar/resize/maximize/focus-trap
  routing.js    # hash routing
  finder.js     # file manager
  article.js    # artigo + notas + formulário de contato
  theme.js      # relógio + tema + fontes
  sitename.js   # nome da bebida do tema atual (o chip no hero)
  math.js       # extração de $...$ e ponte pro KaTeX (só carrega se houver fórmula)
  idle.js       # modo fantasma (esmaece a barra quando parado)
  terminal.js   # terminal
  notepad.js    # bloco de notas (scratch.md)
  search.js     # busca + recent
  main.js       # wiring (conecta tudo)
posts/          # conteúdo em .md + manifest.json
images/         # imagens (ver Imagens)
.github/        # CI (deploy + validação)
```

Os scripts são módulos ES (`import`/`export`) com um único ponto de entrada — `js/main.js`, carregado via `<script type="module">`. Sem bundler, sem CDN — as dependências (marked e KaTeX) são vendorizadas em `js/vendor/`.

## Como escrever um post

### Drafts (escrever sem publicar)

Um rascunho é um post com `draft: true` no frontmatter:

```markdown
---
title: Fichamento: variáveis instrumentais
date: 2026-09-21
lang: pt
draft: true
---
```

O estado vive **no próprio arquivo** — essa é a fonte única. Quem deriva dele:

| Onde | O que acontece |
| :--- | :--- |
| site (finder, recent, busca, contador) | o draft **não aparece** |
| `build.js` | não gera HTML, não entra no `sitemap.xml` nem no `index.json` |
| `.gitignore` | ganha a linha do arquivo (bloco gerado — não edite à mão) |
| `manifest.json` | não é registrado |

O `.gitignore` é **derivado**, como o `posts/index.json`: quem escreve nele é o `coffee commit`. Por isso um draft nunca vaza pro GitHub mesmo se você usar `git add -A` no lugar da CLI.

Um draft **não cria pasta**: um rascunho em `posts/science/segredo/x.md` não faz `segredo/` aparecer (senão o caminho denunciaria o que ele é).

Quando o texto estiver pronto:

```bash
./bin/coffee publish science/education/fichamento.md
```

Isso tira o `draft:` do frontmatter e registra no manifest. Depois, `./bin/coffee commit` — e a linha sai do `.gitignore` sozinha.

Pra ver o que está em rascunho a qualquer momento:

```bash
./bin/coffee drafts
```

### O caminho normal

O jeito mais rápido é a CLI (veja **`./bin/coffee`** mais abaixo):

```bash
./bin/coffee new science/education/meu-post.md
```

Isso cria o `.md` com o frontmatter já preenchido (título e data de hoje) e registra no `posts/manifest.json` automaticamente. Depois é só abrir o arquivo e escrever.

Pra fazer na mão, o processo é:

1. Cria o arquivo em `posts/<grupo>/<subpasta>/nome-do-post.md` (grupo = `readings`, `art`, `games`, `science` ou `culture`; a subpasta é opcional):

   ```markdown
   ---
   title: Título do post
   date: 2026-09-11
   ---

   conteúdo em markdown…
   ```

   - `title` vira o nome no gerenciador de arquivos e o título do artigo.
   - `date` aparece no gerenciador e no card de "recent" (use `AAAA-MM-DD` pra ordenar certo).
   - `series` e `order` são opcionais, e servem pra agrupar posts relacionados (ver **Séries** abaixo).
   - `lang` é o idioma do post (`en` ou `pt`); sem ele, assume `en`. Ver **Idiomas** abaixo.
   - `draft: true` deixa o post fora do site e fora do git. Ver **Drafts** acima.

2. Adiciona o caminho (com a subpasta, se houver) no array certo de `posts/manifest.json`:

   ```json
   { "art": ["poetry/meu-poema.md"], "science": ["psychology/minhas-notas.md"] }
   ```

Pronto — ele aparece no file manager (com subpastas navegáveis) e no card de "recent". As subpastas são livres (`fiction/`, `poetry/`, `psychology/`, `chill-games/`…), mas precisam estar refletidas no caminho do manifest.

Se esquecer de registrar um post (ou registrar um que não existe), o CI falha no push. Ele também checa o frontmatter (título presente e não-vazio, `date` no formato `YYYY-MM-DD`, `order` inteiro quando existir, e nenhuma indentação nas chaves). Pra rodar a checagem local:

```
python3 .github/scripts/check_manifest.py
```

### Séries

Uma série é um conjunto de posts que se leem em ordem, tipo "introdução às neurociências" fatiada em seis partes. Dois campos no frontmatter ligam isso:

```markdown
---
title: What is a neuron
date: 2026-09-10
series: neuroscience
order: 1
---
```

- `series` é o nome da série (aparece como cabeçalho no file manager). Todos os posts com o mesmo valor ficam juntos.
- `order` controla a posição. Sem ele, o post não entra na ordenação da série e cai pro critério de data.

Com isso, o file manager mostra os posts da pasta agrupados sob o nome da série, **na ordem de `order`** (não na ordem de publicação), e cada artigo ganha no pé um `neuroscience · part 2 of 6` com links **previous** / **next**.

O nome da série é livre, mas mantenha igual entre os arquivos (`neuroscience`, não `Neurociência` num e `neuroscience` no outro). A série não precisa viver numa pasta só: o agrupamento é pelo campo, não pelo caminho.

### Convenção de nomes

Os nomes de arquivo são a parte "localizável" dos dados: valem como identificadores e entram na URL (`#~/science/neuroscience/what-is-a-neuron.md`). A regra é simples:

- minúsculas, palavras separadas por `-`, sem acento e sem espaço (`what-is-a-neuron.md`)
- nome que descreva o conteúdo, não a posição (`part-1.md` envelhece mal quando você fatiar diferente)
- a URL é permanente: renomear um arquivo quebra quem linkou. Se o conteúdo mudar de ideia, escreva outro post.

Não há checagem automática de nome — depende de disciplina. O `date` é o que garante a ordem cronológica, não o nome.

## CLI (`bin/coffee`)

Uma CLI pequena pra escrever posts sem editar o manifest na mão. Bash (Bash 3.2, o do macOS) com helpers em `python3` — sem dependências novas, já que o `python3` é usado pelo build e pelo CI.

Rode **da raiz do projeto**. Tem dois modos:

```bash
./bin/coffee                    # interativo: mostra o estado e um menu
./bin/coffee <comando> [flags]  # declarativo: não pergunta nada
```

### O modo interativo

Sem argumento, a CLI mostra **o estado do projeto** e o que fazer a seguir:

```
midnight coffee

  posts        3 publicados · 2 rascunhos
  idiomas      en (2) · pt (1)
  git          main, com mudanças
  grupos       culture (1) · science (2)

  rascunhos:
    science/psychology/history/descartes-hume-and-kant.md  (Descartes, Hume…)

  próximo passo:
    ./bin/coffee publish science/psychology/history/descartes-hume-and-kant.md
    (o rascunho "Descartes, Hume…" tem 367 palavras)

  o que você quer fazer?

    1) escrever um post novo
    2) ver os rascunhos (2)
    3) publicar um rascunho
    4) commitar (2 arquivos)
    5) subir o servidor local
    6) validar tudo
    7) ver os posts
    ?) ajuda

  escolha (número ou letra, Enter sai):
```

O **próximo passo** é a parte que importa: o `--help` lista o que existe, mas não responde "o que eu faço agora?". A sugestão é uma só, a mais útil — rascunho pronto > mudanças pra commitar > commits sem subir > nada pendente.

A escolha aceita o **número** e a **letra** inicial do comando (`4` ou `c` pra commitar). `q` ou Enter saem. Cada ação volta pro menu.

O menu lê o stdin normalmente, então funciona em pipe e no CI (`./bin/coffee menu < /dev/null`).

### Os comandos

```
escrever
  new [--lang en|pt] [--draft] <grupo>/[.../]nome.md
  rm  <grupo>/[subpasta/]nome.md
  publish <grupo>/[.../]nome.md

ver
  status                           o estado do projeto, sem menu
  ls [grupo]                       lista os posts (título e data)
  drafts                           lista os rascunhos (draft: true)

publicar
  commit [-m msg]                  .gitignore + manifest + add + commit (+ push?)
  verify                           roda todas as checagens
  check                            manifest + frontmatter (igual ao CI)
  serve [porta]                    servidor local, sem cache (padrão da config)

imagens
  images                           checa EXIF, referência quebrada, órfãs e nomes
  images --otimizar [--sim]        redimensiona e comprime (ver Imagens)

outros
  --lang pt|en                     idioma das mensagens da CLI
  conf                             caminho do ~/.coffee.conf
```

### Idioma da CLI

As mensagens saem em português ou inglês:

```bash
./bin/coffee --lang pt status
./bin/coffee --lang en status
./bin/coffee lang                 # qual está sendo usado
```

Sem `--lang`, o idioma vem do `$LANG` do terminal (começando com `pt` → português; o resto, inglês). O `--lang` é global: vale pra qualquer comando, inclusive o menu.

O léxico fica em `bin/lib/i18n.py` — separado do `js/lang.js`, que é do navegador. Aquela é a mesma ideia (idioma ao lado do texto), mas o público é outro: uma é lida pelo leitor do site, a outra por quem escreve no terminal.

### Configuração (`~/.coffee.conf`)

Arquivo opcional pra fixar porta, idioma e o padrão das imagens, sem repetir flag:

```bash
./bin/coffee conf        # onde ele fica
```

```ini
#COFFEE_PORT=8000       # porta padrão do `coffee serve`
#COFFEE_LANG=           # pt ou en (vazio = detecta pelo $LANG)
#COFFEE_IMG_MAX=900     # teto de largura pro `images --otimizar`
#COFFEE_IMG_Q=80        # qualidade JPEG do `images --otimizar`
```

Ele **nasce comentado**: o arquivo é pra ser descoberto (você abre, vê as opções, descomenta o que quer), não pra mudar comportamento sem você saber.

A precedência é **variável de ambiente > arquivo > padrão**. Então `COFFEE_PORT=9000 coffee serve` ganha do arquivo — útil pra testar uma porta sem editar nada.

### Instalar o comando

Pra chamar `coffee` de qualquer diretório:

```bash
./install.sh                    # /usr/local (pede sudo se não for dono)
./install.sh --prefix ~/.local  # sem sudo
```

Ele cria um **link simbólico** pro `bin/coffee` deste projeto (não copia nada). Assim o comando enxerga o `posts/` e o `manifest.json` daqui, e editar o código já muda o comando instalado. O `bin/coffee` resolve o link pra achar a raiz certa — sem isso ele procuraria `posts/` dentro de `/usr/local`.

O caminho aceita variações (`posts/science/x.md`, `/science/x.md`, sem o `.md`). O `rm` também limpa subpastas que ficaram vazias.

As flags do `new` valem em **qualquer posição** (`new --lang pt x` e `new x --lang pt` são a mesma coisa). `--lang` aceita só `en` ou `pt` — outro valor falha **antes** de criar o arquivo. `--draft` já escreve `draft: true` no frontmatter e **não** registra no manifest (quem registra é o `publish`).

O `status` é o comando do dia a dia: mostra o estado e aponta problemas (órfãos, entradas quebradas, frontmatter inválido). Se o `./bin/coffee status` estiver limpo, está tudo certo.

### `commit` — o caminho normal pra subir

A CLI é dona do estado dos rascunhos, então commitar por ela é mais seguro que `git add -A`:

```bash
./bin/coffee commit
```

O que acontece:

1. lê o `draft:` de cada `.md` e **reescreve o bloco de rascunhos no `.gitignore`**;
2. registra no `manifest.json` os posts publicados que ainda não estavam lá;
3. mostra o resumo, propõe uma mensagem (o título do post que está entrando) e pede confirmação;
4. pergunta se quer fazer push.

```
  manifest: + science/education/fichamento-causalidade.md
 posts/about.pt.md        | 22 +++
 style.css                | 40 +++++
 19 files changed, 767 insertions(+)

mensagem: post: Fichamento: Causalidade e Contrafactuais (+18 arquivos)
commitar? [Y/n]
```

Um rascunho **nunca** entra no commit. Se você preferir escrever a mensagem, `./bin/coffee commit -m "..."`.

O bloco gerado no `.gitignore` fica assim (e não deve ser editado à mão — a próxima execução sobrescreve):

```
# --- drafts (gerado por `coffee commit`; não edite à mão) ---
posts/science/psychology/history/descartes-hume-and-kant.md
# --- fim dos drafts ---
```

### `verify`

Antes de commitar, um comando só:

```bash
./bin/coffee verify
```

```
bash                            ok
python                          ok
js                              ok
manifest + frontmatter          ok
drafts fora do git              ok
testes da CLI                   ok
testes do markdown              ok
imports                         ok
metadados de imagem             ok
otimizador de imagem            ok
build + SEO                     ok
gitignore                       ok
tabindex (botões)               ok

tudo ok
```

Roda sintaxe (bash/python/js), os testes, o build, e cinco checagens que pegam erro que já aconteceu aqui:

- **`drafts fora do git`** — um `draft: true` que o git esteja rastreando subiria pro GitHub. O `.gitignore` por pasta não existe mais (virou bloco gerado), então este passo confere o resultado.
- **`imports`** — confere se cada `import { x } from './y.js'` bate com os exports reais de `y.js`. O `node --check` valida só a **sintaxe**: um export renomeado passa no check e só quebra no navegador. Foi assim que o `makeTabbable` sumiu do `article.js` e do `finder.js` em duas ocasiões.
- **`gitignore`** — um padrão `lucide*` no `.gitignore` deixava todos os ícones fora do git, e o site viria sem ícones num clone.
- **`tabindex`** — o Safari no macOS não navega por Tab entre `<button>` sem `tabindex` explícito. Se você adicionar um botão novo sem o atributo, o `verify` aponta o arquivo e a linha.
- **`metadados de imagem`** — foto exportada direto da câmera carrega EXIF com GPS, modelo e número de série. O `verify` falha se encontrar (ver [Imagens](#imagens)).

## Acessibilidade e o Safari

O Safari (com a configuração padrão do macOS) **não inclui `<button>` na navegação por Tab** — só inputs, links, selects e textareas. Sem correção, quem usa teclado não alcança as pastas da home, o dock, nem os botões das janelas.

Por isso **todo `<button>` leva `tabindex="0"`**:

- Os do `index.html` têm o atributo no próprio HTML.
- Os criados em runtime (finder, busca, índice do artigo, formulário de contato) usam `makeTabbable()` do `js/windows.js`.

Ao criar um `<button>` novo, adicione o `tabindex` junto (ou chame `makeTabbable()`). O `./bin/coffee verify` avisa se esquecer.

## Grupos, pastas e ícones

Os grupos (as "pastas" da home) são: `readings`, `art`, `games`, `science`, `culture`.

### Adicionar uma pasta principal

São três edições manuais:

1. Uma chave nova no `manifest.json`: `{ "music": [] }`.
2. Na home (`index.html`), um `<button class="folder" data-group="music">` com ícone, `<span class="folder-name">` e `<span class="folder-count" data-count="music">` — copie o padrão de um grupo existente.
3. Em `js/data.js`, a linha no mapa `groupIcon`: `music: 'assets/icons/lucide/music.svg',`.

Depois é só copiar um SVG do [Lucide](https://lucide.dev) pra `assets/icons/lucide/music.svg` e criar os posts normalmente:

```bash
./bin/coffee new music/album-review.md
```

O card de "recent", o file manager, a busca e o terminal leem o `manifest.json`, então o grupo novo aparece neles automaticamente.

### Remover uma pasta principal

Apaga a pasta `posts/<grupo>/`, tira a chave do `manifest.json`, o `<button>` da home e a linha do `groupIcon`.

### Outras operações

**Trocar o ícone** de um grupo existente: substitui o `.svg` em `assets/icons/lucide/` (mantendo o nome) ou aponta outro caminho no `groupIcon`. Os ícones são do [Lucide](https://lucide.dev) (`stroke="#1b1b1b"` assado, sem `width`/`height` no `<svg>`) e o CSS os recolore por tema via `--icon-filter`.

**Renomear um grupo** (ex.: `science` → `philosophy`): renomeia a pasta `posts/science/`, muda a chave no `manifest.json`, o `data-group`/`id`/ícone na home, e a chave no `groupIcon`.

## Imagens

Coloca em `images/` e referencia no markdown assim:

```markdown
![descrição](images/minha-imagem.jpg)
```

Clicar numa imagem de um post abre ela num **visualizador em janela** (com o nome do arquivo na barra; arrastável, redimensionável e maximizável).

### Antes de publicar

Duas coisas: **peso** e **metadado**.

**Peso** — o `coffee` resolve, você não precisa pensar:

```bash
./bin/coffee images --otimizar          # mostra o que faria (não mexe em nada)
./bin/coffee images --otimizar --sim    # aplica
```

```
usando sips · teto 900px · qualidade 80

  images/me.jpeg  1015×977 → 900×866   348K → 98K  (-72%)
```

O teto e a qualidade saem da [config](#configuração-coffeeconf) (`COFFEE_IMG_MAX`, `COFFEE_IMG_Q`). "O suficiente pro website" é o padrão: 900 px de largura, qualidade 80.

Ele **não reescreve sem ganho**: se a economia for menor que 10%, desfaz — reescrever só perderia qualidade. E guarda um `.bak` durante o processo, restaurando se a ferramenta falhar.

Não embutimos compressor (seria dependência pesada). A gente detecta o que existe na máquina:

| Sistema | Ferramenta | Vem instalada? |
| :--- | :--- | :--- |
| macOS | `sips` | ✅ sempre |
| Linux | `convert` (ImageMagick) | comum em distro desktop |
| Windows | `magick` (ImageMagick) | precisa instalar |

Se não houver nenhuma, o comando diz o que instalar em vez de falhar calado.

O comando **não tem `--sim` por padrão** de propósito: ele reescreve seus arquivos, então mostrar antes é o certo.

**Metadado** — a checagem:

```bash
./bin/coffee images
```

Ela olha quatro coisas:

| O que | Ação |
| :--- | :--- |
| EXIF (GPS, modelo, serial) | **falha** — não pode ir pro ar |
| Referência quebrada (`![](images/x.jpg)` sem arquivo) | **falha** — quebra o site |
| Imagem órfã (ninguém referencia) | avisa |
| Nome fora da convenção (maiúscula, espaço, acento) | avisa |

O `./bin/coffee verify` roda isso junto com o resto, e o CI também — então uma foto com GPS não passa no deploy.

A checagem de EXIF lê o bloco APP1/EXIF de JPEGs direto, sem dependência. Outros formatos carregam metadado de outro jeito e passam batido — se um dia incomodar, é aí que o script cresce.

## Sobre (about)

A página `posts/about.md` tem dois comportamentos especiais: a primeira imagem vira **círculo** (foto de perfil), e no fim é injetado um **formulário de contato** (assunto + mensagem + email → `mailto`). O email de destino fica hardcoded em `js/article.js` (função `wireContactForm`); os rótulos saem do léxico de UI em `js/lang.js` (função `t`), então acompanham o idioma ativo.

Ela existe por idioma (`about.md`, `about.pt.md`) — ver [Idiomas](#idiomas). Quem decide qual abrir é o `aboutFile()` do `js/lang.js`, e os dois passam pelas mesmas regras acima.

## Markdown suportado

O renderer é o [marked](https://marked.js.org/) (vendorizado em `js/vendor/`), com GFM + notas de rodapé. Suporta:

- títulos (`#`–`######`), parágrafos, linha horizontal (`---`)
- **negrito**, *itálico*, ~~riscado~~, `inline code`, [links](...), imagens `![alt](url)` (com `loading="lazy"`)
- **listas aninhadas** (ordenadas e não-ordenadas) e **tabelas** (`| a | b |`)
- citações (`>`), inclusive **multi-parágrafo**
- **task lists**: `- [ ]` (pendente) e `- [x]` (feito)
- **notas de rodapé** `[^1]` … `[^1]: texto`
- **autolinks** `<https://exemplo.com>` e **escapes** `\*literal\*`
- **código** com ou sem linguagem (`class="language-js"` quando declarada)
- **matemática** com KaTeX (ver abaixo)

Por segurança, HTML cru é escapado e URLs `javascript:`/`data:` são neutralizadas. Pra atualizar o marked, vê `js/vendor/README.md`.

### Matemática

Use `$...$` pra fórmula no meio do texto e `$$...$$` pra fórmula em bloco:

```markdown
O estimador é $\hat{\beta} = (X^\top X)^{-1} X^\top y$.

$$
\sum_{i=1}^{n} (y_i - \hat{y}_i)^2
$$
```

O KaTeX entra **só em posts que têm `$`**. Um post sem fórmula não baixa nada: nem o JS, nem o CSS, nem as fontes. Quando o post tem, o custo é o `katex.mjs` (589 KB, ~147 KB com gzip do servidor — uma vez, fica em cache) + 24 KB de CSS + as fontes dos símbolos que aparecerem de fato.

Duas coisas que valem saber:

- A fórmula é extraída do texto **antes** do marked. Sem isso, o `_` de `x_i` viraria itálico e o `\` de `\sum` sumiria. Fórmula quebrada aparece como TeX cru em vez de derrubar a página.
- O KaTeX gera MathML, então a fórmula é legível por leitor de tela (e o TeX cru fica em `<annotation>`, fora da meta description).

## Notas

As notas do painel (`✎` no artigo) ficam salvas no **localStorage** do navegador — só no seu dispositivo, por artigo.

No painel de notas:
- **preview / edit** — alterna entre editar (textarea) e ver renderizado em markdown.
- menu **⋮** — **download** (baixa como `.md`), **quote** (copia a seleção do artigo como citação) e **clear** (limpa).

### Índice do artigo

O botão `☰` na barra do artigo abre um painel lateral com o índice, montado a partir dos headings (`#`, `##`, `###`…). Clicar num item rola até a seção.

### Terminal

O `terminal` (no popover `apps ▸` do dock, ou digitando no prompt da home) tem um punhado de comandos:

| comando | o que faz |
| --- | --- |
| `open <post>` | abre um post (aceita caminho parcial) |
| `ls [-l]` | lista os posts |
| `cat <post>` | mostra o markdown cru |
| `random` | abre um post aleatório |
| `grep <termo>` | busca nos títulos e no corpo |
| `theme <nome>` | troca o tema |
| `notes` | abre o notepad |
| `history` | comandos já usados |
| `uname`, `coffee`, `help`, `clear` | o resto |
| `whoami`, `pwd`, `date`, `echo`, `neofetch` | mais easter eggs :)|

`Tab` completa comandos e caminhos de posts.

### Notepad

Um bloco de notas solto (ícone `notes` no popover `apps`), pra escrever sem abrir um artigo. Fica salvo no localStorage sob `coffeeos:notes:scratch`, e tem preview em markdown e download.

## Temas

Dez temas, todos com **nome de bebida**. O botão `⚙` no topo abre o System Settings, que é uma **sequência de três cardápios** (tema, fonte e tamanho), todos com a mesma linguagem visual: fechados mostram a escolha atual, abertos listam as opções com linha pontilhada.

```
┌──────────────────────────────────────┐
│ What is your order today?            │
│                          Latte   ●   │
├──────────────────────────────────────┤
│ how do you like it printed?          │
│                           Sans       │
├──────────────────────────────────────┤
│ what cup size?                       │
│                         Normal       │
└──────────────────────────────────────┘
```

Abrindo o primeiro, os itens aparecem **agrupados por o que a bebida é** (`coffee`, `tea`, `single origin & brew`). Escolher um fecha o cardápio de novo.

### O chip da bebida no hero

O nome do site **não muda**: o `<h1>` é sempre `midnight coffee`. Ao lado da tagline há um **chip** mostrando o tema escolhido:

```
        midnight coffee
   a personal notebook  ( ● latte )
```

Ele resolve o problema de **descoberta** — sem ele, os dez temas ficariam visíveis só pra quem abrisse o `⚙`. O chip também é o atalho: clicar abre o settings **com o cardápio já expandido**, e escolher um tema fecha a janela toda (quem abriu o `⚙` sozinho continua nele, e pode querer mexer em fonte/tamanho).

A fonte única do nome da bebida é `js/sitename.js`: o `theme.js` avisa quando o tema muda, e o `main.js` escreve no chip.

### Os dez

| Nome no cardápio | `data-theme` | Caráter |
|---|---|---|
| **Latte** | *sem atributo* (**o padrão**, vive no `:root`) | claro médio, texto escuro |
| **Blue Mountain** | `blue` | azul frio, luz de tela |
| **Mocha** | `mocha` | marrom café, o mais escuro dos quentes |
| **Cappuccino** | `cappuccino` | marrom médio, acento cremoso |
| **Black Honey** | `blackhoney` | quase preto, acento dourado |
| **Matcha** | `matcha` | verde dessaturado |
| **Puerh** | `puerh` | rosa-vinho, terroso |
| **Cold Brew** | `black` | preto neutro, sem matiz |
| **Ethiopian** | `ethiopian` | roxo, frutado |
| **Cortado** | `cream` | claro, papel quente |

O **`latte` é o padrão** e, como tal, **vive no `:root` sem atributo** — é o único que não tem bloco `[data-theme="..."]`. Todos os outros nove têm. Então o array `THEMES` em `js/theme.js` lista **nove**, e a constante `PADRAO` guarda o décimo. Isso é de propósito: um tema a menos pra manter em dois lugares, e a página abre sem `data-theme` (nada de flash na primeira pintura).

No **terminal**, `theme` aceita o nome da **bebida** (`theme cold brew`) e também o `data-theme` cru (`theme black`) como atalho.

### Preview e transição

Passar o mouse num item do cardápio **aplica o tema na hora**, e sair dele restaura o escolhido — dá pra "provar antes de pedir". Duas salvaguardas:

- O preview só roda com o cardápio **aberto**, e é **desligado no toque** (`hover: none`): no celular, só o clique.
- Escolher (clique) aplica com uma **transição de 0.5s**. O preview é instantâneo de propósito — animar a cada passada de mouse viraria borrão.

Quem tem **"reduzir movimento"** ligado no sistema recebe tudo instantâneo: o bloco `prefers-reduced-motion` zera as transições.

### Adicionar um tema

1. Um bloco `[data-theme="nome-da-bebida"] { ... }` no `style.css`, copiando um existente e trocando os tokens.
2. O nome no array `THEMES` em `js/theme.js` (o tema padrão **não** entra nesse array — ele vive no `:root`).
3. Um botão `.menu-item` no `#theme-menu` (`index.html`), no mapa `NOMES` do `theme.js` e no `THEMES` do `terminal.js` (nome da bebida → `data-theme`).
4. Um `.sw-NOME { background: ... }` com a cor de referência.

**Trocar o tema padrão** é mais trabalhoso que adicionar um: o padrão mora no `:root`, então é preciso trocar os tokens dele com os do novo padrão, mover o antigo pra um bloco `[data-theme="..."]`, ajustar `PADRAO` no `theme.js` e o que o cabeçalho do cardápio mostra no `index.html`.

**Sobre o swatch:** use o `--caramel` do tema nos temas **escuros** e o `--bg-0` nos **claros**. O acento de um tema claro é escuro por necessidade (contraste), e sumiria contra o menu escuro.

### Contraste

Os dez passam WCAG AA (4.5:1) — mas o número que importa é o do **pior caso**, não o do fundo base.

O fundo de verdade é o gradiente do `body::before`, e no **topo da página** os dois `radial-gradient` somam. Isso clareia o fundo, e é ali que o texto secundário (`muted`) sofre. Medir só o `--bg-0` dá um número otimista: o `cappuccino` parecia 5.05:1 e no topo era **2.85:1**.

| Tema | `muted` sobre `bg-0` | `muted` no topo (pior caso) |
| :--- | :--- | :--- |
| cappuccino | 5.05 | **4.72** |
| blue | 6.15 | **4.90** |
| black | 6.08 | **4.89** |
| mocha | 7.57 | **4.91** |
| matcha | 7.71 | **4.80** |
| os outros cinco | — | acima de 4.8 |

O `cream` (texto principal) passa folgado em todos: o pior é 5.00 no cappuccino.

**A opacidade do glow é token** (`--glow-alpha` / `--glow-2-alpha`), e não valor fixo no gradiente. Num tema **claro** o brilho soma muito mais: o cappuccino precisou de `0.08/0.10` em vez de `0.14/0.16`. Só ele usa valores diferentes — nos escuros, os tokens ficam no padrão.

Como os tokens são variáveis CSS, o `Lighthouse` enxerga o fundo real. Vale lembrar que o fundo do site vive no `body::before`.

**O `body::before` tem um par de tokens só pra ele.** São dois radiais de brilho; num tema escuro o acento clareia o fundo (virando luz), mas nos temas **claros** o acento é escuro e transformaria o radial numa mancha escura. Por isso `--glow-rgb` e `--glow-2-rgb` existem separados do `--caramel` — nos claros eles são claros, nos escuros espelham o acento.

Os ícones do Lucide são monocromáticos e se adaptam via `--icon-filter` (declarado por tema): nos escuros, um `invert` deixa o ícone claro; nos claros, a cor assada escura já basta.

## Fonte e tamanho

Vivem no **`⚙` (System Settings)**, como os dois últimos cardápios:

- **Família do site** — *"how do you like it printed?"*: **Sans** (padrão), **Serif** e **Mono**. Tudo via `html[data-font="serif"]` / `html[data-font="mono"]`.
- **Tamanho do site** — *"what cup size?"*: Normal / Large / Extra large (`html[data-font-size=...]`, escala em `rem`).

As perguntas trazem o tom; as **opções continuam técnicas** (Sans/Serif/Mono), porque a pessoa precisa saber o que está escolhendo — um nome bonito que não descreve a fonte viraria charada.

**Dentro do artigo** é diferente, e de propósito: o botão `Aa` na barra troca a família (sincronizado com o site) e `A−`/`A+` ajustam só o corpo do texto (7 níveis, 75%–175%). O menu do artigo fica nos pills, não em cardápio — com um artigo aberto, o foco é o conteúdo. O tamanho do artigo é **independente** do tamanho do site, pra quem precisa de texto grande no artigo sem ampliar o chrome.

Todas as escolhas ficam salvas no **localStorage**. O corpo do artigo usa `--font-body` (segue a família escolhida), os títulos usam `--font-display`, e código/blocos usam `--font-mono` sempre.

## Acessibilidade

- **Navegação por teclado em todos os navegadores.** O Safari do macOS não alcança `<button>` pelo Tab por padrão, então todo botão tem `tabindex="0"` (ver a seção **Acessibilidade e o Safari** acima).
- Foco preso dentro da **janela da frente** (artigo, file manager, terminal, settings, notes e visualizador de imagem) — `Tab`/`Shift+Tab` não escapam.
- Tudo que está atrás vira `inert` (não focável / não anunciado) enquanto uma janela está aberta, incluindo os outros overlays.
- O foco **volta** pro lugar de origem ao fechar uma janela, e a página rola sozinha se o elemento focado estiver fora da vista. Com janelas empilhadas (imagem sobre artigo, artigo sobre finder) ele volta **um nível por vez**, na ordem inversa da abertura — ver [Pilha de foco](#pilha-de-foco).
- Itens do dock são `<button>` (não links falsos), com `aria-label`.
- **Os rótulos acompanham o idioma** (`aria-label`, `title`, `placeholder` saem do léxico de UI). Quem usa leitor de tela em português ouve em português — ver [Idiomas](#idiomas).
- `aria-live`, `prefers-reduced-motion`, e `Escape` pra fechar.
- O **chip da bebida** no hero é um `<button>` com `aria-label` (não texto clicável), e no toque ganha alvo de 44px.
- Modo fantasma (a barra do artigo esmaece após 15s parado) só age quando o **artigo** é a janela da frente.
- Temas testados em **WCAG AA** (ver [Temas → Contraste](#contraste)); há também opção de tamanho de fonte no topbar.

## Pilha de foco

Quem abre uma janela avisa a `empilharFoco()`, e quem fecha chama `devolverFoco()` (ambas em `js/windows.js`). A pilha garante que o teclado volte pro lugar certo mesmo com janelas sobrepostas.

**Por que pilha e não uma variável.** Abrir a imagem a partir de um artigo, com o artigo aberto a partir do finder, precisa lembrar de três níveis. Uma variável só guardaria o último, e fechar a imagem jogaria a pessoa pra fora do artigo.

**A ordem importa.** Quem fecha precisa ter recalculado o `inert` **antes** de devolver o foco (`syncInert()` no `main.js`; no `closeArticle`, o `notifyOverlayChange()` faz isso de forma síncrona). O motivo é que `inert` não é decorativo: **focar algo dentro de uma subárvore `inert` é ignorado em silêncio** pelo browser. Devolver o foco antes do recálculo aponta pra uma janela ainda inert, e nada acontece.

**O que conta como alvo válido** (`focavel()`):

- existe no documento — se saiu, sobe pro pai mais próximo que ainda existe (o finder é redesenhado a cada navegação, então isso acontece);
- não está dentro de `[inert]`;
- não é o `body` — focá-lo é o mesmo que perder o foco, que é justamente o que a pilha existe pra evitar.

Se a pilha acaba sem candidato, o foco **fica onde está**: forçar o `body` seria pior que não mexer.

**Detalhe do clique.** Clicar com o mouse num botão **não** o foca no Chrome — o `activeElement` que chega é o `body`. Então a origem guardada é `null`, e não há pra onde voltar; é o comportamento esperado pro mouse. Com teclado o foco é real, e a volta acontece.

## Links diretos (deep links)

Cada post e pasta tem uma URL própria via hash — dá pra compartilhar/favoritar:

- `#/` — home
- `#~/` — file manager na raiz
- `#~/readings` — file manager dentro de `readings`
- `#~/readings/fiction/meu-post.md` — abre o artigo
- `#/about` — a nota about

O caminho do hash segue a estrutura de `posts/` (com subpastas, ex.: `#~/art/photography/foto.md` ou `#~/readings/fiction/meu-post.md`).

## Idiomas

O site é **en** por padrão, com **pt** opcional. Os dois têm o mesmo peso: não é tradução, são posts **diferentes** que convivem na mesma árvore de pastas.

### Como funciona

O idioma de um post vive no frontmatter:

```markdown
---
title: Fichamento: causalidade e contrafactuais
date: 2026-09-20
lang: pt
---
```

Sem `lang:`, o post é em inglês. **Os arquivos não mudam de lugar** — o `lang` é um filtro, não uma pasta. `posts/science/education/` pode ter um post em cada idioma, e cada um aparece só no seu.

### O seletor e o link compartilhado

O seletor `EN · PT` fica no topbar, ao lado do relógio. O idioma escolhido vai pra URL:

```
https://odisseuz.github.io/CofeeOS_personalblog/?lang=pt
```

Isso é de propósito: **o link carrega o idioma junto**. Quem receber esse endereço abre em português, mesmo nunca tendo visitado o site. A precedência é `?lang=` na URL > `localStorage` > `en`. Em `en`, o parâmetro sai da URL (o padrão não precisa sujar o endereço).

### O que o idioma filtra

| Superfície | Comportamento |
| :--- | :--- |
| finder | mostra só os arquivos do idioma ativo |
| recent | idem |
| busca | idem |
| contador das pastas | conta só o idioma ativo |
| **as 5 pastas da home** | **aparecem sempre**, nos dois idiomas |

As pastas são a **estrutura do OS**, não conteúdo: uma gaveta vazia continua sendo gaveta. O que muda com o idioma é o que tem dentro dela — inclusive um post em `pt` não faz a pasta `art/` sumir de quem está em `en`.

### Sobre (about)

O about também tem duas versões, resolvidas pelo sufixo do nome:

```
posts/about.md       (en)
posts/about.pt.md    (pt)
```

O dock e o rodapé apontam pro `about` genérico; quem escolhe o arquivo é o `aboutFile()` do `js/lang.js`, conforme o idioma ativo. Diferente dos posts, aqui o idioma **está** no nome do arquivo — porque o about é aberto por um hash fixo (`#/about`) e os dois precisam coexistir na raiz de `posts/`.

### Textos da interface

O que não vem de um `.md` vive no léxico `UI` do `js/lang.js`, com o idioma ao lado do texto:

```js
const UI = {
  en: { send: 'send', … },
  pt: { send: 'enviar', … }
};
```

**No HTML estático**, o elemento declara o que ele é — e o `applyUiLang()` preenche na carga e a cada troca de idioma:

```html
<input data-i18n-placeholder="search" placeholder="search">
<button data-i18n-title="close" title="Close">…</button>
<span data-i18n="notesPreview">preview</span>
```

**No JS**, chame `t('chave')`. Pra plurais, `tfn('items')(3)` devolve a função.

Uma chave sem tradução cai no inglês em vez de ficar em branco — então dá pra acrescentar string nova sem quebrar o outro idioma.

O que **não** entra no léxico: nome de janela (`Terminal`, `Settings`, `sh`, `File manager`). São nomes de sistema, não instrução pro leitor — um macOS em português ainda diz "Terminal".

### Adicionar um idioma novo

1. `js/lang.js`: acrescente o código em `LANGS` e o rótulo em `NOMES`.
2. `index.html`: um `<button class="lang-opt" data-lang="xx">` no `#lang-switch`.
3. `build.js`: nada a fazer — o `<html lang>` sai do `data.lang`.

Os posts em `xx` aparecem assim que existirem. Nenhum outro arquivo precisa saber.

## Testes

Pra rodar **tudo** de uma vez (sintaxe, testes, build e gitignore):

```bash
./bin/coffee verify
```

Individualmente:

```bash
node .github/scripts/check_render.js          # smoke test do markdown + math (46 casos)
bash .github/scripts/check_cli.sh              # testes da CLI (40 casos)
node .github/scripts/check_imports.mjs         # imports x exports de cada módulo
python3 .github/scripts/check_manifest.py     # manifest + frontmatter
python3 .github/scripts/check_images.py       # EXIF, órfãs, nomes e referências quebradas
```

Os testes rodam no CI antes de qualquer deploy (`.github/workflows/deploy.yml`, job `validate`). O `check_cli.sh` roda cada caso numa **cópia isolada do projeto** num diretório temporário — não toca nos seus arquivos. Ele cobre `new`/`rm` (com as flags), `drafts`/`publish`, `commit`, `status`, o menu, `--lang`, a config, caminhos variantes, integridade do JSON e as checagens de imagem.

## Deploy no GitHub Pages

O deploy é estático, via GitHub Actions (`.github/workflows/deploy.yml`). O app em si não tem build (sem bundler/transpile) — é servido como está; só o `build.js` roda no CI pra gerar o HTML de SEO. O arquivo `.nojekyll` garante que o Jekyll não processe os `.md` (que têm frontmatter e seriam transformados, quebrando o `fetch`).

Pra ativar:

1. Sobe o repo pro GitHub.
2. Em **Settings → Pages**, escolhe **Source: GitHub Actions**.
3. Faz push na branch `main` (ou ajusta a branch no workflow).

O workflow roda um job `validate` antes do deploy: confere que `posts/manifest.json` bate com os arquivos em `posts/` (nenhum post órfão, nenhuma entrada apontando pra arquivo inexistente) e valida o frontmatter de cada `.md`. Se falhar, o deploy não roda.

Como o site usa só caminhos relativos, ele funciona tanto em `usuario.github.io` (raiz) quanto em `usuario.github.io/repo` (project site).

### Trocar de domínio

O domínio vive num lugar só: a variável `BASE_URL` no `.github/workflows/deploy.yml`. Ela é o único ponto de verdade — o `build.js` gera dela o `sitemap.xml`, o `robots.txt` e todas as metas de SEO (`canonical`, `og:url`, `og:image`).

```yaml
env:
  BASE_URL: https://odisseuz.github.io/${{ github.event.repository.name }}
```

Pra apontar pra outro endereço, muda **só essa linha**. Não edite o `robots.txt`: ele é gerado no build (e está no `.gitignore`). Rodando local sem `BASE_URL`, o `robots.txt` sai sem a linha do `Sitemap` — porque o padrão exige URL absoluta.

## SEO (build.js)

Os posts são carregados via `fetch` no navegador, o que os deixa invisíveis pra buscadores. O `build.js` resolve isso gerando, pra cada post, uma página HTML estática com `<title>`, meta description, Open Graph/Twitter e canonical.

Ele gera também:

- **`sitemap.xml`** e **`robots.txt`** — ambos derivados do `BASE_URL` (ver *Trocar de domínio* acima).
- **`posts/index.json`** — uma lista leve com `path`, `group`, `title` e `date` de cada post (sem o corpo). A home usa esse índice pro card de "recent" e o file manager, evitando baixar todos os `.md` no carregamento. A busca e o `grep` do terminal procuram primeiro no índice (título/grupo) e só baixam os corpos se nada casar.

Se o `index.json` não existir (ex.: rodando localmente sem build), o app cai automaticamente pro `manifest.json` + frontmatters.

Pra rodar:

```
node build.js                                          # gera posts/**/*.html + sitemap.xml + robots.txt (URLs relativas)
BASE_URL=https://usuario.github.io/repo node build.js  # URLs absolutas
```

Os `.html` gerados, o `sitemap.xml`, o `robots.txt` e o `posts/index.json` ficam no `.gitignore` e são **regenerados no CI** antes do deploy (o workflow roda `node build.js` com o `BASE_URL` correto).

## Rodar localmente

```bash
./bin/coffee serve          # http://localhost:8000
./bin/coffee serve 8080     # se a 8000 estiver ocupada
```

O servidor manda `Cache-Control: no-store`, então editar um `.js` ou `.css` e dar F5 já mostra a mudança. Isso importa: sem os headers, o navegador segura **módulos ES antigos** e você vê erros como `doesn't provide an export named X` — que parecem bug de código mas são só cache.

**Não abra o `index.html` clicando nele** (via `file://`): por segurança do navegador, `fetch` e módulos ES não funcionam assim, e a página aparece mas nada é clicável.

## Adiado de propósito

Coisas que foram consideradas, decididas e **deixadas pra depois** — com o motivo. Não é uma lista de desejos: cada item diz **quanto custa** e **o que precisa acontecer** pra valer a pena. Item sem gatilho é fantasia; com gatilho, é plano.

### Modo OS de verdade

As janelas hoje são **modais** — abrir uma torna o resto `inert`. O "modo OS" seria elas coexistindo: arrastar, sobrepor, duas abertas ao mesmo tempo.

**Custo:** alto. A base toda (focus trap, `inert`, `frontOverlay()`) assume uma janela por vez.
**Gatilho:** se o blog virar algo além de leitura — comparar dois posts, por exemplo.

### LaTeX para operações

O KaTeX já funciona pra fórmulas (ver *Markdown suportado → Matemática*). O que **não** foi resolvido é notação de operação: `\begin{cases}`, matrizes grandes, alinhamento complexo.

**Custo:** nenhum a mais — o KaTeX já suporta, é só escrever.
**Gatilho:** o primeiro post que precisar. Provavelmente inferência causal.

### DAGs e gráficos

O KaTeX **não desenha grafos**. Um DAG (setas entre variáveis) precisaria de SVG ou imagem.

**Custo:** médio — SVG à mão por post, ou uma lib de grafos (dependência nova).
**Gatilho:** quando um post precisar de um DAG que não dá pra descrever em texto.

### O notepad como app de verdade

Hoje ele é uma janela dentro do blog, com nota salva no localStorage. A ideia seria ser útil **fora** do blog: um editor markdown rápido, que baixa o `.md` e vai embora.

**Custo:** médio. O código existe (`js/notepad.js`), o que falta é o site virar um app (ou uma página própria).
**Gatilho:** se você usar o notepad e sentir falta dele fora daqui.

### Coleções e tags

Séries existem (`series`/`order` no frontmatter, ver *Como escrever um post*). **Tags** seriam outro eixo: um mesmo post pertencendo a vários recortes.

**Custo:** médio — filtro no finder, lista no índice.
**Gatilho:** quando houver posts demais pra navegar por pasta, ou quando um post pertencer a duas áreas.

### Card de "novos posts"

A home mostra o que é recente. Um card fixo de novidades seria outra coisa.

**Custo:** baixo.
**Gatilho:** provavelmente desnecessário — se a home já mostra o recente, o card seria redundante. Só vale se a home ganhar outros blocos e o recente ficar escondido.

### Highlight no artigo

Marcar um trecho do artigo e ele ficar destacado de forma persistente, ligado às notas.

Metade existe: o botão *quote* já pega a seleção e joga nas notas. O que falta é a marca visual que sobrevive ao recarregar.

**Custo:** alto, e o problema não é guardar — é reencontrar o trecho. Seleção **exata** que atravessa tags (um `**negrito**` no meio) não é texto contíguo no DOM, então não basta buscar a string no HTML: precisa caminhar pelos text nodes e casar por índice. E se o texto do post for editado depois, a âncora quebra em silêncio.

**Gatilho:** quando houver texto publicado suficiente pra reler e querer marcar — não com 3 posts. Clicar no trecho pra pular até a nota é uma segunda camada, ainda mais cara, e só vale se a primeira já estiver em uso.

### Teste da pilha de foco

A [pilha de foco](#pilha-de-foco) é a única parte do app **fora do `verify`**. Tudo o mais tem rede: o renderer tem 46 testes em Node, a CLI tem 40, os 13 passos do `verify` cobrem bash, python, imports, manifest, build e SEO.

**Custo:** médio, e o custo é a dependência. Os testes de hoje são Node puro, sem DOM; a pilha precisa de `document`, `inert` e `getComputedStyle`. Testar de verdade pede `jsdom` — e o projeto hoje não tem dependência de runtime nenhuma, o que é bom demais pra trocar por conveniência.

**Gatilho:** quando alguém for mexer na pilha de novo. Enquanto isso não acontece, a rede de proteção é a seção *Pilha de foco* acima, que documenta as duas armadilhas que já morderam uma vez: a ordem `syncInert` → `devolverFoco`, e o fato de `inert` engolir `.focus()` em silêncio.

## Licença

Licença dupla:

- **Código** (`js/`, `index.html`, `style.css`, `build.js`, etc.): [MIT](LICENSE).
- **Conteúdo** (`posts/` e `images/` — textos, arte e imagens): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — pode usar/adaptar, mas **dê crédito** (veja [`posts/LICENSE.md`](posts/LICENSE.md)).
