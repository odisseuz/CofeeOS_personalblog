# midnight coffee ☕

Blog pessoal com estética "coffeeOS" — HTML/CSS/JS puro, sem build.

## Estrutura

```
index.html
style.css
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

Os scripts carregam via `<script defer>` na ordem de dependência (estado → utilitários → módulos → wiring). Sem build, sem dependência externa.

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
   { "art": ["poetry/untitled-poem.md"], "science": ["psychology/notes.md"] }
   ```

Pronto — ele aparece no file manager (com subpastas navegáveis) e no card de "recent". As subpastas são livres (`fiction/`, `poetry/`, `psychology/`, `chill-games/`…), mas precisam estar refletidas no caminho do manifest.

Se esquecer de registrar um post (ou registrar um que não existe), o CI falha no push. Ele também checa o frontmatter (título presente e não-vazio, `date` no formato `YYYY-MM-DD`, e nenhuma indentação nas chaves). Pra rodar a checagem local:

```
python3 .github/scripts/check_manifest.py
```

## Imagens

Coloca em `images/` e referencia no markdown assim:

```markdown
![descrição](images/minha-imagem.jpg)
```

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
- `#~/readings/fiction/house-of-leaves.md` — abre o artigo
- `#/about` — a nota about

O caminho do hash segue a estrutura de `posts/` (com subpastas, ex.: `#~/art/photography/postaqui.md` ou `#~/readings/fiction/house-of-leaves.md`).

## Deploy no GitHub Pages

O deploy é estático, via GitHub Actions (`.github/workflows/deploy.yml`). Não há build — o conteúdo é servido como está. O arquivo `.nojekyll` garante que o Jekyll não processe os `.md` (que têm frontmatter e seriam transformados, quebrando o `fetch`).

Pra ativar:

1. Sobe o repo pro GitHub.
2. Em **Settings → Pages**, escolhe **Source: GitHub Actions**.
3. Faz push na branch `main` (ou ajusta a branch no workflow).

O workflow roda um job `validate` antes do deploy: confere que `posts/manifest.json` bate com os arquivos em `posts/` (nenhum post órfão, nenhuma entrada apontando pra arquivo inexistente) e valida o frontmatter de cada `.md`. Se falhar, o deploy não roda.

Como o site usa só caminhos relativos, ele funciona tanto em `usuario.github.io` (raiz) quanto em `usuario.github.io/repo` (project site).

## Rodar localmente

```
python3 -m http.server
```

e abre `http://localhost:8000` (o `fetch` não funciona abrindo por `file://`).
