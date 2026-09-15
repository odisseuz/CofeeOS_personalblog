---
title: Ensinando Zotero com websites
date: 2026-09-11
lang: pt
---

Há alguns meses surgiu a oportunidade de dar uma aula curta de Zotero num evento internacional na UECE (Universidade Estadual do Ceará). Eu tinha uma regra só pra mim: me recusei a usar slides.

Este post é a história de como me preparei pra isso, e por que escolhi construir uma documentação (um tipo de website) em vez de slides.

## a preparação

O Zotero é uma ferramenta livre e de código aberto pra organizar referências, mas a aula era sobre outra coisa: *competência em informação*. Nomear as coisas, manter elas encontráveis, saber onde mora o seu material e de fato usar aquilo que você encontra.[^1]

Pesquisadores costumam não chegar lá por motivos bem concretos: não sabem que essas ferramentas existem, acham que aprender uma vai levar tempo demais, ou supõem que manter a biblioteca em dia vira um segundo emprego.[^2]

Pra contribuir um pouco com isso, comecei a olhar como as pessoas ensinavam Zotero. As universidades oferecem vários formatos: vídeos, PDFs, sites assíncronos.[^3] Mas o que eu ficava voltando era uma ideia bem freireana: o treinamento deve mirar a autonomia.[^4]

Se você entrega slides, a pessoa olha uma vez e esquece. Se entrega material pra onde ela pode voltar, ela sai com uma prática que construiu sozinha.

## documentação em vez de slides

Eu precisava de um site. Na época, eu estava decidindo entre Quarto e Astro. Fiquei sabendo do Astro por um amigo próximo, um desenvolvedor web que vem usando ele nos projetos pessoais dele e me mostrou. O Quarto é ótimo pra publicação acadêmica tradicional, mas eu acabei apostando no Starlight (o framework de documentação do Astro). Era rápido, e tinha recursos prontos que deixavam a separação do site em português, inglês e espanhol bem mais fácil.

Escrever a documentação me forçou a ser preciso e, às vezes, repetitivo sobre passos que eu normalmente faço no automático. Cheguei a instalar o Zotero em todo computador que eu encontrava só pra ver que erros aleatórios iam aparecer.

Pra dar conta da logística, escrevi um script rápido em R pra mandar email pros mais de 100 inscritos com os links e as instruções ([o script está aqui](https://github.com/odisseuz/GmailR_Sender_Simple_Script)).

Pra aula em si, a gente se apoiou na documentação e num Framapad (obrigado à Open Life Sciences e ao The Carpentries pela inspiração!). A ideia era usar o pad como um documento colaborativo, onde a gente faria os exercícios práticos junto, tipo arrastar artigos e consertar metadados ruins em tempo real.

## a aula

Apareceram umas 36 pessoas no dia, e cerca de 25 ficaram até o fim. A pergunta mais frequente não era sobre o Zotero em si. Era: *"o site vai continuar no ar?"*

Ver as pessoas copiando o Framapad pras próprias notas e perguntando sobre o site em tempo real foi muito gratificante. (Isso, aliás, me impediu de trocar meu nome de usuário no GitHub depois, só pra não quebrar os favoritos delas!)

Mas teve o lado ruim. Apesar da minha preparação pra uma oficina prática, a sessão pendeu bastante pra aula expositiva tradicional. Talvez porque eu seja novo ensinando, talvez por causa da cultura acadêmica da qual a gente fazia parte (Brasil, América Latina e África), a interatividade não aconteceu como eu planejei.

## o que ficou

Ensinar uma ferramenta foi uma experiência que me colocou no meu lugar. Você só descobre se de fato ensinou quando vê alguém tentando usar.

A leitura construtivista do ensino dessas ferramentas já existe internacionalmente,[^5] mas eu fico pensando em quanto disso precisa ser adaptado pro pesquisador brasileiro. Na minha realidade, a gente não tem um setor de apoio à pesquisa pra ajudar no processo.

Também notei que alguns pesquisadores mais velhos tiveram dificuldade de acompanhar a interface. Isso me fez pensar nessa autonomia atravessando as diferenças geracionais com a tecnologia. Como apoiar melhor esse público é um desafio que eu ainda preciso pensar com seriedade.

## o material

Se quiser ver o resultado, a documentação inteira está no ar aqui: [curso-zotero](https://odisseuz.github.io/curso-zotero/) ([código](https://github.com/odisseuz/curso-zotero)).

[^1]: Dudziak, E. A. (2003). *Information literacy: princípios, filosofia e prática.*
[^2]: Rangaswamy, B. (2021). *Researcher's perception on Zotero and Mendeley.*; Speare, M. (2018). *Graduate student use and non-use of reference and PDF management software.*
[^3]: Ramer, R. (n.d.). [Zotero: getting started.](https://libguides.colostate.edu/zotero)
[^4]: FREIRE, Paulo. Pedagogia da autonomia: saberes necessários à prática educativa. São Paulo: Paz e Terra, 1996.
[^5]: Beatty, J. F. (2016). *Zotero: a tool for constructionist learning in critical information literacy.*
