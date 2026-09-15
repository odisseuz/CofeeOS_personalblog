#!/usr/bin/env python3
"""Mensagens da CLI (pt/en).

Separado do léxico do site (js/lang.js): aquele é do navegador, este é do
terminal. O idioma vem de --lang; sem ele, do $LANG (se começar com `pt`,
português; senão inglês), como no analyze.sh do pubmed-analyzer.

Uso:
    from i18n import t, set_lang
    set_lang('pt')
    print(t('criado', rel='science/x.md'))
"""
import os

LANG = 'en'


def detecta_lang():
    """$LANG começando com `pt` → português. É o que o usuário configurou no
    sistema, então é a melhor aposta sem perguntar."""
    v = os.environ.get('LANG') or os.environ.get('LC_ALL') or os.environ.get('LC_MESSAGES') or ''
    return 'pt' if v.lower().startswith('pt') else 'en'


def set_lang(code):
    global LANG
    if code in ('pt', 'en'):
        LANG = code
        return True
    return False


MENSAGENS = {
    'pt': {
        # new
        'criado': 'criado: posts/{rel}',
        'ja_existe': 'já existe: posts/{rel}',
        'nao_e_grupo': 'aviso: "{group}" não é um grupo da home ({grupos})',
        'continuar': 'continuar? [y/N] ',
        'cancelado': 'cancelado',
        'precisa_grupo': 'comece com um grupo (ex.: science/meu-post.md)',
        'lang_invalido': '--lang aceita en ou pt (recebi: {valor})',
        'opt_desconhecida': 'opção desconhecida: {valor}',
        'rascunho_criado': '  (rascunho: não aparece no site nem entra no git)',
        'uso_new': 'uso: coffee new [--lang en|pt] [--draft] <grupo>/[subpasta/]nome.md',
        # rm
        'removido': 'removido: posts/{rel}',
        'nao_encontrei': 'não encontrei: posts/{rel}',
        'uso_rm': 'uso: coffee rm <grupo>/[subpasta/]nome.md',
        # publish
        'publicado': 'publicado: posts/{rel}',
        'registrado': 'registrado no manifest: {rel}',
        'ja_publicado': '{rel} não está marcado como draft',
        'uso_publish': 'uso: coffee publish <grupo>/[subpasta/]nome.md',
        # manifest
        'manifest_invalido': 'criei o arquivo, mas posts/manifest.json está inválido — corrija e registre manualmente',
        'manifest_falhou': 'criei o arquivo, mas falhei ao registrar no manifest — confira posts/manifest.json',
        'nao_e_git': 'não é um repositório git',
        'commit_falhou': 'o commit falhou',
        'commit_cancelado': 'cancelado',
        'nada_commitar': 'nada pra commitar',
        # drafts
        'nenhum_draft': 'nenhum draft',
        'fora_do_git': 'fora do git',
        'rastreado': 'RASTREADO (vai pro git!)',
        'draft_rastreado': 'draft rastreado pelo git: {rel}',
        # idioma
        'lang_atual': 'idioma: {valor}',
        'lang_usado': '--lang aceita pt ou en (recebi: {valor})',
        # menu
        'escolha': '  escolha (número ou letra, Enter sai): ',
        'nao_entendi': 'não entendi "{valor}".',
        'voltar': '  Enter pra voltar ',
        'proximo_passo': 'próximo passo:',
        # menu (itens)
        'menu_escrever': 'escrever um post novo',
        'menu_ver_drafts': 'ver os rascunhos ({n})',
        'menu_publicar': 'publicar um rascunho',
        'menu_ver_posts': 'ver os posts',
        'menu_sem_drafts': 'ver os rascunhos (nenhum)',
        'menu_commitar': 'commitar ({n} arquivo{s})',
        'menu_commitar_limpo': 'commitar (nada pendente)',
        'menu_servir': 'subir o servidor local',
        'menu_validar': 'validar tudo',
        'menu_ajuda': 'ajuda',
        # resumo
        'r_posts': '{n} publicado{s} · {d} rascunho{s2}',
        'r_sem_git': '(sem git)',
        'r_sujo': 'com mudanças',
        'r_limpo': 'limpo',
        'r_sem_subir': ', {n} sem subir',
        'r_sem_titulo': 'sem título',
        'r_porque_draft': 'o rascunho "{titulo}" tem {n} palavras',
        'r_porque_sujo': '{n} arquivo{s} pra commitar',
        'r_porque_ahead': '{n} commit{s} sem subir',
        'r_porque_nada': 'nada pendente — que tal escrever alguma coisa?',
        'rot_posts': 'posts',
        'rot_idiomas': 'idiomas',
        'rot_git': 'git',
        'rot_grupos': 'grupos',
        'rot_drafts': 'rascunhos:',
        'rot_proximo': 'próximo passo:',
        'rot_escolha': '  escolha (número ou letra, Enter sai): ',
        'rot_voltar': '  Enter pra voltar ',
        'rot_pergunta': 'o que você quer fazer?',
        # serve
        'porta_em_uso': 'porta {porta} em uso (tente: coffee serve 8080)',
        'servindo': 'servindo http://localhost:{porta} (Ctrl+C para parar)',
        # genérico
        'cmd_desconhecido': 'comando desconhecido: {valor} (tente: coffee help)',
    },
    'en': {
        'criado': 'created: posts/{rel}',
        'ja_existe': 'already exists: posts/{rel}',
        'nao_e_grupo': 'warning: "{group}" is not a home group ({grupos})',
        'continuar': 'continue? [y/N] ',
        'cancelado': 'cancelled',
        'precisa_grupo': 'start with a group (e.g. science/my-post.md)',
        'lang_invalido': '--lang takes en or pt (got: {valor})',
        'opt_desconhecida': 'unknown option: {valor}',
        'rascunho_criado': '  (draft: not on the site, not in git)',
        'uso_new': 'usage: coffee new [--lang en|pt] [--draft] <group>/[subfolder/]name.md',
        'removido': 'removed: posts/{rel}',
        'nao_encontrei': 'not found: posts/{rel}',
        'uso_rm': 'usage: coffee rm <group>/[subfolder/]name.md',
        'publicado': 'published: posts/{rel}',
        'registrado': 'added to manifest: {rel}',
        'ja_publicado': '{rel} is not marked as draft',
        'uso_publish': 'usage: coffee publish <group>/[subfolder/]name.md',
        'manifest_invalido': 'created the file, but posts/manifest.json is invalid — fix it and register manually',
        'manifest_falhou': 'created the file, but failed to register in the manifest — check posts/manifest.json',
        'nao_e_git': 'not a git repository',
        'commit_falhou': 'the commit failed',
        'commit_cancelado': 'cancelled',
        'nada_commitar': 'nothing to commit',
        'nenhum_draft': 'no drafts',
        'fora_do_git': 'not in git',
        'rastreado': 'TRACKED (will reach git!)',
        'draft_rastreado': 'draft tracked by git: {rel}',
        'lang_atual': 'language: {valor}',
        'lang_usado': '--lang takes pt or en (got: {valor})',
        # menu
        'escolha': '  choice (number or letter, Enter to quit): ',
        'nao_entendi': "didn't understand \"{valor}\".",
        'voltar': '  Enter to go back ',
        'proximo_passo': 'next step:',
        # menu (itens)
        'menu_escrever': 'write a new post',
        'menu_ver_drafts': 'see the drafts ({n})',
        'menu_publicar': 'publish a draft',
        'menu_ver_posts': 'see the posts',
        'menu_sem_drafts': 'see the drafts (none)',
        'menu_commitar': 'commit ({n} file{s})',
        'menu_commitar_limpo': 'commit (nothing pending)',
        'menu_servir': 'start the local server',
        'menu_validar': 'validate everything',
        'menu_ajuda': 'help',
        # resumo
        'r_posts': '{n} published · {d} draft{s2}',
        'r_sem_git': '(no git)',
        'r_sujo': 'with changes',
        'r_limpo': 'clean',
        'r_sem_subir': ', {n} not pushed',
        'r_sem_titulo': 'untitled',
        'r_porque_draft': 'the draft "{titulo}" has {n} words',
        'r_porque_sujo': '{n} file{s} to commit',
        'r_porque_ahead': '{n} commit{s} not pushed',
        'r_porque_nada': 'nothing pending — how about writing something?',
        'rot_posts': 'posts',
        'rot_idiomas': 'languages',
        'rot_git': 'git',
        'rot_grupos': 'groups',
        'rot_drafts': 'drafts:',
        'rot_proximo': 'next step:',
        'rot_escolha': '  choice (number or letter, Enter to quit): ',
        'rot_voltar': '  Enter to go back ',
        'rot_pergunta': 'what do you want to do?',
        'porta_em_uso': 'port {porta} in use (try: coffee serve 8080)',
        'servindo': 'serving http://localhost:{porta} (Ctrl+C to stop)',
        'cmd_desconhecido': 'unknown command: {valor} (try: coffee help)',
    }
}


def t(chave: str, **kw) -> str:
    """Mensagem no idioma ativo. Chave sem tradução cai no inglês (nunca vazio)."""
    bloco = MENSAGENS.get(LANG) or MENSAGENS['en']
    texto = bloco.get(chave)
    if texto is None:
        texto = MENSAGENS['en'].get(chave, chave)
    if not isinstance(texto, str):
        texto = str(texto)
    try:
        return texto.format(**kw) if kw else texto
    except (KeyError, IndexError):
        return texto
