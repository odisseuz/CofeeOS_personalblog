# midnight coffee ☕

![deploy](https://img.shields.io/github/actions/workflow/status/odisseuz/CofeeOS_personalblog/deploy.yml?branch=main&label=deploy) ![license](https://img.shields.io/github/license/odisseuz/CofeeOS_personalblog) ![static](https://img.shields.io/badge/site-static-8b949e) ![coffee](https://img.shields.io/badge/made%20with-coffee-c98d5a)

Blog pessoal com estética "coffeeOS" — HTML/CSS/JS puro, sem bundler nem dependência (só um `build.js` leve pra gerar HTML de SEO).

## Estrutura

```
index.html
style.css
build.js        # gera HTML estático dos posts (SEO) + sitemap.xml
package.json    # "type": "module" (node roda os módulos ES)
js/
  state.js      # estado global compartilhado
  markdown.js   # renderer de markdown + frontmatter
  data.js       # manifest + lista de posts
  windows.js    # arrastar/resize/maximize/focus-trap
  routing.js    # hash routing
  finder.js     # file manager
  article.js    # artigo + notas
  theme.js      # relógio + tema + fontes
  terminal.js   # terminal
  search.js     # busca + recent
  main.js       # wiring (conecta tudo)
posts/          # conteúdo em .md + manifest.json
.github/        # CI (deploy + validação)
```

Os scripts são módulos ES (`import`/`export`) com um único ponto de entrada — `js/main.js`, carregado via `<script type="module">`. Sem bundler, sem dependência externa.

## Como escrever um post

1. Cria o arquivo em `posts/<grupo>/<subpasta>/nome-do-post.md` (grupo = `readings`, `art`, `games` ou `science`; a subpasta é opcional):

   ```markdown
   ---
   title: Título do post
   date: 2026-09-11
   ---

   conteúdo em markdown…
   ```

   - `title` vira o nome no gerenciador de arquivos e o título do artigo.
   - `date` aparece no gerenciador e no card de "recent" (use `AAAA-MM-DD` pra ordenar certo).

2. Adiciona o caminho (com a subpasta, se houver) no array certo de `posts/manifest.json`:

   ```json
   { "art": ["poetry/meu-poema.md"], "science": ["psychology/minhas-notas.md"] }
   ```

Pronto — ele aparece no file manager (com subpastas navegáveis) e no card de "recent". As subpastas são livres (`fiction/`, `poetry/`, `psychology/`, `chill-games/`…), mas precisam estar refletidas no caminho do manifest.

Se esquecer de registrar um post (ou registrar um que não existe), o CI falha no push. Ele também checa o frontmatter (título presente e não-vazio, `date` no formato `YYYY-MM-DD`, e nenhuma indentação nas chaves). Pra rodar a checagem local:

```
python3 .github/scripts/check_manifest.py
```

## Grupos, pastas e ícones

Os grupos (as "pastas" da home e do dock) são fixos: `readings`, `art`, `games`, `science`. Pra **adicionar um grupo novo** (ex.: `music`):

1. Cria `posts/music/` e registra no `manifest.json` (uma chave nova):

   ```json
   { "music": ["album-review.md"] }
   ```

2. Em `index.html`, adiciona o grupo em **dois** lugares (copiando o padrão dos que já existem):
   - **home**: um `<button class="folder" data-group="music">` com ícone, `<span class="folder-name">` e `<span class="folder-count" data-count="music">`.
   - **dock**: um `<button class="dock-item" data-group="music" aria-label="...">` com ícone e tooltip.

3. Coloca um ícone em `assets/icons/music.svg` (SVG).

4. Em `js/data.js`, adiciona o grupo no mapa `groupIcon`:

   ```js
   music: 'assets/icons/music.svg',
   ```

**Trocar o ícone** de um grupo existente: substitui o `.svg` em `assets/icons/` (mantendo o nome) ou aponta outro caminho no `groupIcon`. Os ícones atuais são SVGs estilo Papirus — dá pra baixar outros e jogar em `assets/icons/`.

**Renomear um grupo** (ex.: `science` → `philosophy`):

1. Renomeia a pasta `posts/science/` → `posts/philosophy/`.
2. No `manifest.json`, muda a chave `"science"` → `"philosophy"`.
3. No `index.html`, atualiza `data-group` (e `id`, ícone, nome, `aria-label`) nos botões da home e do dock.
4. No `js/data.js`, atualiza a chave no `groupIcon`.

**Remover um grupo:**

1. Apaga a pasta `posts/<grupo>/`.
2. Remove a chave do `manifest.json`.
3. Remove o botão `.folder` da home e o `.dock-item` do dock em `index.html`.
4. Remove a linha do `groupIcon` em `js/data.js`.

O card de "recent", o file manager, a busca e o terminal leem o `manifest.json`, então o grupo novo aparece neles automaticamente.

## Imagens

Coloca em `images/` e referencia no markdown assim:

```markdown
![descrição](images/minha-imagem.jpg)
```

Clicar numa imagem de um post abre ela num **visualizador em janela** (com o nome do arquivo na barra; arrastável, redimensionável e maximizável).

## Sobre (about)

A página `posts/about.md` tem dois comportamentos especiais: a primeira imagem vira **círculo** (foto de perfil), e no fim é injetado um **formulário de contato** (assunto + mensagem + email → `mailto`). O email de destino fica hardcoded em `js/article.js` (função `wireContactForm`).

## Markdown suportado

- títulos (`#`, `##`…), listas, citações (`>`), linha horizontal (`---`)
- **negrito**, *itálico*, ~~riscado~~, `inline code`, [links](...), imagens `![alt](url)`
- notas de rodapé `[^1]` … `[^1]: texto`
- **task lists**: `- [ ]` (pendente) e `- [x]` (feito) — checkbox visual, não editável
- **autolinks**: `<https://exemplo.com>` vira link clicável
- **escapes**: `\*literal\*` mostra os asteriscos sem aplicar itálico
- **código com linguagem**: o bloco pode declarar a linguagem (ex. `js`) e ganha `class="language-js"` — pronto pra um highlight futuro

## Notas

As notas do painel (`✎` no artigo) ficam salvas no **localStorage** do navegador — só no seu dispositivo, por artigo.

No painel de notas:
- **preview / edit** — alterna entre editar (textarea) e ver renderizado em markdown.
- menu **⋮** — **download** (baixa como `.md`), **quote** (copia a seleção do artigo como citação) e **clear** (limpa).

## Temas

Quatro temas: **dark** (o padrão, azul), **brown** (café), **all black** e **gray**. O botão no topo abre um menu (hover) com as opções, e a escolha fica salva no **localStorage**. As cores vivem como variáveis CSS — o padrão no `:root`, e os outros em `[data-theme="brown"]`, `[data-theme="black"]` e `[data-theme="gray"]`. Pra adicionar um tema, é só criar um bloco desses no `style.css` e registrar a opção no menu.

## Fonte e tamanho

- **Família**: menu `Aa` no topo alterna entre **Sans** (padrão), **Serif** e **Mono** — útil pra acessibilidade, tudo via `html[data-font="serif"]` / `html[data-font="mono"]`. Dentro do artigo, o botão `Aa` na barra da janela faz a mesma troca (sincronizado).
- **Tamanho (site)**: menu `A` alterna Normal / Large / Extra large (`html[data-font-size=...]`, escala em `rem`).
- **Tamanho (artigo)**: dentro do artigo, os botões `A−`/`A+` ajustam só o corpo do texto (7 níveis, 75%–175%).

Todas as escolhas ficam salvas no **localStorage**. O corpo do artigo usa `--font-body` (segue a família escolhida), os títulos usam `--font-display`, e código/blocos usam `--font-mono` sempre.

## Acessibilidade

- Foco preso dentro dos modais (artigo e file manager) — `Tab`/`Shift+Tab` não escapam.
- Conteúdo de trás fica `inert` (não focável / não anunciado) enquanto um modal está aberto.
- Itens do dock são `<button>` (não links falsos), com `aria-label`.
- `aria-live`, `prefers-reduced-motion`, retorno de foco ao fechar, e `Escape` pra fechar.

## Links diretos (deep links)

Cada post e pasta tem uma URL própria via hash — dá pra compartilhar/favoritar:

- `#/` — home
- `#~/` — file manager na raiz
- `#~/readings` — file manager dentro de `readings`
- `#~/readings/fiction/meu-post.md` — abre o artigo
- `#/about` — a nota about

O caminho do hash segue a estrutura de `posts/` (com subpastas, ex.: `#~/art/photography/foto.md` ou `#~/readings/fiction/meu-post.md`).

## Deploy no GitHub Pages

O deploy é estático, via GitHub Actions (`.github/workflows/deploy.yml`). O app em si não tem build (sem bundler/transpile) — é servido como está; só o `build.js` roda no CI pra gerar o HTML de SEO. O arquivo `.nojekyll` garante que o Jekyll não processe os `.md` (que têm frontmatter e seriam transformados, quebrando o `fetch`).

Pra ativar:

1. Sobe o repo pro GitHub.
2. Em **Settings → Pages**, escolhe **Source: GitHub Actions**.
3. Faz push na branch `main` (ou ajusta a branch no workflow).

O workflow roda um job `validate` antes do deploy: confere que `posts/manifest.json` bate com os arquivos em `posts/` (nenhum post órfão, nenhuma entrada apontando pra arquivo inexistente) e valida o frontmatter de cada `.md`. Se falhar, o deploy não roda.

Como o site usa só caminhos relativos, ele funciona tanto em `usuario.github.io` (raiz) quanto em `usuario.github.io/repo` (project site).

## SEO (build.js)

Os posts são carregados via `fetch` no navegador, o que os deixa invisíveis pra buscadores. O `build.js` resolve isso gerando, pra cada post, uma página HTML estática com `<title>`, meta description, Open Graph/Twitter e canonical — além de um `sitemap.xml`.

Pra rodar:

```
node build.js                                          # gera posts/**/*.html + sitemap.xml (URLs relativas)
BASE_URL=https://usuario.github.io/repo node build.js  # URLs absolutas
```

Os `.html` gerados e o `sitemap.xml` ficam no `.gitignore` e são **regenerados no CI** antes do deploy (o workflow roda `node build.js` com o `BASE_URL` correto).

## Rodar localmente

```
python3 -m http.server
```

e abre `http://localhost:8000` (o `fetch` não funciona abrindo por `file://`).

## Licença

Licença dupla:

- **Código** (`js/`, `index.html`, `style.css`, `build.js`, etc.): [MIT](LICENSE).
- **Conteúdo** (`posts/` e `images/` — textos, arte e imagens): [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — pode usar/adaptar, mas **dê crédito** (veja [`posts/LICENSE.md`](posts/LICENSE.md)).
