# Registro de decisões

Decisões de arquitetura e de produto, da mais recente para a mais antiga.
Formato: contexto → decisão → consequências.

## 2026-09-27 · Site se atualiza sozinho em abas abertas

**Contexto:** com `autoUpdate`, o service worker novo assume, mas a aba já aberta
continua com o código antigo. No celular a aba fica aberta por dias, e uma rota nova
(como `/receber`) caía em "Você se perdeu na masmorra".
**Decisão:** `src/app/swUpdate.ts` recarrega a página uma vez quando uma versão nova
assume o controle (não na primeira visita). Ao voltar para a aba, o site procura
versão nova. A página 404 também procura e tem o botão "Atualizar o site".
**Consequências:** depois de um deploy, o jogador vê a versão nova no máximo ao voltar
para a aba. Nada se perde na recarga, porque o estado fica no localStorage.

## 2026-09-27 · Pacote do Mestre por arquivo (página Receber pacote)

**Contexto:** o Mestre quer passar ao grupo conteúdo que só existe nos livros. Esse
conteúdo não pode ir para o repositório (público) nem para o site. Um link da mesa com
o pacote dentro passaria de 50 mil caracteres, grande demais para o WhatsApp.
**Decisão:** o pacote viaja como arquivo, direto entre as pessoas. A página
`/receber` ("Recebi um pacote do Mestre", na página inicial) tem um botão grande e o
passo a passo para Android e iPhone. O pacote é validado (`checkPack`) e **somado** ao
conteúdo próprio do aparelho (`mergePacks`: o que chega substitui ids iguais e o
resto fica). O seletor de arquivo não restringe o tipo, porque no iPhone isso às
vezes deixa o `.json` indisponível. A importação em `/conteudo` continua substituindo
tudo, como antes.
**Consequências:** nada do livro passa pelo site. Cada jogador instala uma vez; para
atualizar, basta receber e instalar o arquivo novo.

## 2026-09-26 · Polimento: acessibilidade, toque e pacote inicial

**Contexto:** a fase 8 fecha a v1 com critérios verificáveis, não impressões.
**Decisão:**

- **axe** (`e2e/acessibilidade.spec.ts`) roda em todas as telas (incluindo as 9
  etapas, ficha, modo jogo e impressão), no tema claro e no escuro com fonte maior;
  qualquer violação séria ou crítica falha a CI. Correções: links com texto na cor
  do texto e sublinhado vermelho (o vermelho puro não tinha contraste no escuro),
  ficha de impressão sempre com cores de papel, item ativo do menu com marcador.
- **Alvos de toque** (`e2e/toque.spec.ts`): botões, links, campos, resumos e
  chips medem pelo menos 44 × 44 px. Exceções do WCAG: links no meio de uma frase
  e os termos do glossário (balão), que têm no mínimo 24 × 24 px (WCAG 2.2 AA).
  Marcadores pequenos (espaços de magia, salvaguardas contra a morte, caixas de
  magia) ganharam área de toque de 44 px com o desenho menor por dentro. No
  celular, a barra de etapas virou visual + um seletor de etapa.
- **Fonte maior e movimento reduzido** valem no app inteiro (testado em todas as
  telas): `MotionConfig` global no layout e CSS que zera animações e transições.
- **Pacote inicial** medido por `npm run size` (manifesto do Vite, gzip), com
  limite de 150 kB na CI: 123,6 kB. Para isso, a validação Zod da mesa saiu da
  página inicial e o menu de ajustes (Radix Popover) carrega logo depois.
- **Carregamento e erro**: barrinha no topo enquanto uma página carrega, tela de
  espera no primeiro acesso e página de erro que distingue "versão nova do site"
  e "sem internet" de um erro comum, sempre com "Recarregar" e "Voltar ao início".
  **Consequências:** a CI ficou mais longa (~3 min de E2E), em troca de regressões
  de acessibilidade e de tamanho aparecerem no PR.

## 2026-09-26 · Compartilhar, imprimir, mesa, conteúdo próprio e PWA

**Contexto:** sem servidor, tudo o que sai do aparelho precisa ir em arquivo ou no
próprio link.
**Decisão:**

- **Links** (`/ver#d=...` e `/mesa#m=...`) levam o JSON comprimido com lz-string no
  `#hash`, que não chega a servidor nenhum; ao abrir, tudo é validado com Zod. O
  link de ficha não leva o estado de jogo.
- **Impressão**: `/ficha/:id/imprimir` monta a ficha em A4 (números; magias;
  história e equipamento) com CSS de impressão sempre claro e margens de 12 mm. O
  guia rápido também imprime (duas folhas). Conferido gerando PDF no Chromium.
- **Mesa**: as regras (nível, opções liberadas, métodos de atributos e de PV,
  conteúdo próprio) ficam em `guia:mesa`. O assistente bloqueia o que não foi
  liberado e a validação aponta o que ficou fora (`src/model/table.ts`).
- **Conteúdo próprio**: formulários para espécies, subclasses e antecedentes (só
  texto, mais visão no escuro, perícias e atributos), salvos em `guia:conteudo` e
  mesclados sobre o SRD ao abrir o site; por isso as mudanças valem depois de
  "Aplicar mudanças" (recarrega). Completar um stub = criar a opção com o mesmo id.
  Pacotes JSON passam pelo mesmo `content:check`, e ids do SRD são recusados.
- **PWA**: vite-plugin-pwa com precache de tudo (inclusive o conteúdo com as
  magias), manifesto em pt-BR e ícones gerados do favicon.
  **Consequências:** o primeiro acesso baixa ~1,9 MB para o cache; depois o site
  funciona offline. Safari não pôde ser testado aqui: a impressão foi conferida no
  Chromium.

## 2026-09-26 · Modo jogo, rolador e vários personagens

**Contexto:** na mesa, a ficha precisa acompanhar o que acontece (PV, espaços,
condições) sem papel e sem conta de cabeça.
**Decisão:** `/ficha/:id` tem duas vistas: **Ficha** (completa, com ajustes
manuais de CA, PV máximos e Iniciativa, marcados como "ajustado à mão") e **Modo
jogo** (`?modo=jogo`). O estado de jogo fica em `character.play` e só muda por
funções puras (`src/rules/rest.ts` e `src/model/play.ts`): dano com as regras de
0 PV (cair, falha por dano, crítico conta duas, morte instantânea), cura, PV
temporários que não se somam, salvaguardas contra a morte, descansos, espaços,
recursos, condições e exaustão. O rolador guarda o modo (normal, vantagem,
desvantagem, que volta ao normal depois de cada teste) e as últimas 30 rolagens em
`guia:rolagens`; os botões de perícia, salvaguarda e ataque já descontam a
exaustão. Exportar gera um pacote `{ app, version, characters }`; importar valida
com Zod (`src/model/transfer.ts`), aceita pacote, lista ou personagem solto,
migra a versão 1, dá id novo a quem já existe e explica em português por que um
personagem não entrou.
**Consequências:** o nome do personagem na lista abre a ficha; "Editar" volta ao
assistente. A Revisão leva direto ao modo jogo quando a ficha está pronta.

## 2026-09-26 · Apoio ao novato: glossário, "Me guie" e comparador

**Contexto:** a fase 5 precisa ajudar quem nunca jogou a escolher sem ler o livro.
**Decisão:** o glossário junta os termos de regra (`glossary.json`) com as
condições, propriedades de arma e maestrias do SRD, com busca que ignora acentos e
acha pelos nomes em inglês; todo termo sublinhado tem "Ver no glossário". Um teste
varre o código e falha se algum `GlossaryTerm` apontar para um termo inexistente.
O "Me guie" (`src/features/guided/suggest.ts`) é uma função pura: cinco perguntas
geram três combinações de espécie, classe e antecedente, com o porquê. As
afinidades entre respostas e opções são recomendações de estilo nossas, não
regras; quem pede "o mínimo de regras" nunca recebe classe avançada, e o teste
cobre todas as 960 combinações de respostas. O comparador guarda a escolha na URL
(`/comparar?tipo=classes&a=fighter&b=wizard`) para poder ser compartilhado.
Opções avançadas e nível inicial alto mostram um aviso de complexidade com uma
alternativa mais simples, sem bloquear nada.
**Consequências:** o "Me guie" é uma tela fora das 9 etapas (`/criar/:id/me-guie`)
e não é salvo como última etapa.

## 2026-09-26 · Assistente completo: validação, kit e progressão até o nível 20

**Contexto:** a fase 4 precisa impedir fichas ilegais sem travar quem está
aprendendo, e funcionar em qualquer nível de 1 a 20.
**Decisão:** as escolhas (atributos, equipamento, magias, talentos por nível, PV)
são edições puras em `src/model/edits.ts`; a validação (`validateCharacter`) lista
o que falta ou está errado por etapa, e os seletores bloqueiam o que passaria do
limite (contadores "2 de 3"). O array padrão já vem distribuído pela sugestão da
classe; na rolagem, os totais vão para os atributos mais importantes da classe e o
jogador troca à vontade. O kit para iniciantes aplica, num toque, perícias sem
repetir as do antecedente, pacote de equipamento, magias do 1º nível, escolhas de
classe, idiomas e o talento de origem. Nos níveis de talento aceitamos talentos
gerais e de origem (e de estilo de luta para quem tem Estilo de Luta; dádivas no
19), como nas regras de 2024. Um teste monta todas as classes em todos os níveis
de 1 a 20 e exige zero erros.
**Consequências:** o conteúdo do SRD (com as magias) passou a ~148 kB gzip num
pedaço carregado só no assistente; a página inicial não muda. Nomes, alinhamentos
e ganchos da etapa Detalhes são texto próprio do projeto, sem efeito nas regras.

## 2026-09-26 · Assistente: etapas na URL e ficha sempre visível

**Contexto:** o grupo vai criar personagens no celular, indo e voltando entre as
etapas sem medo de perder nada.
**Decisão:** cada etapa tem sua URL (`/criar/:id/:etapa`), então o botão voltar do
navegador funciona e dá para compartilhar o link de uma etapa. Toda escolha é
salva na hora; a última etapa aberta fica em `wizardStep` e o link do personagem
retoma dali. Trocar espécie, classe ou antecedente limpa só as escolhas que
dependiam deles (`src/model/edits.ts`). A ficha fica numa coluna fixa no desktop e
numa gaveta no celular, aberta por uma barra inferior com voltar/avançar.
Nada bloqueia o avanço: cada etapa mostra o que falta, em linguagem simples.
**Consequências:** o pedaço do assistente pesa ~148 kB gzip (conteúdo do SRD + Motion),
carregado só ao entrar nele; a página inicial continua em ~128 kB. Se crescer demais
com as magias (fase 4), dividimos o conteúdo por tipo.

## 2026-09-26 · Motor de regras: ficha sempre derivada

**Contexto:** a ficha tem dezenas de números que dependem uns dos outros, e o
jogador pode mudar qualquer escolha a qualquer momento.
**Decisão:** o personagem guarda só escolhas (`src/model/character.ts`); a ficha é
calculada por `derive(personagem, conteúdo)` em `src/rules`, funções puras sem
React. Cada número traz as partes que o compõem ("de onde vem esse +5?").
Sobrescritas manuais ficam em `overrides` e aparecem sinalizadas. Personagens
salvos passaram para a versão 2 do armazenamento, com migração automática.
**Consequências:** cobertura mínima de 95% em `src/rules` exigida na CI.
Simplificações conhecidas: recursos que recuperam só _um_ uso no Descanso Curto
(Fúria, Canalizar Divindade, Forma Selvagem) são tratados como "voltam no
Descanso Longo"; o texto da característica explica a regra completa.

## 2026-09-26 · Conteúdo: ids do SRD em inglês, textos em português

**Contexto:** o conteúdo vem do SRD 5.2 estruturado em inglês e vai ser cruzado
com magias e itens em fases seguintes.
**Decisão:** entidades do SRD mantêm o id original em inglês (`longsword`,
`magic-initiate`); enumerações usam ids em português (`furtividade`, `concussao`).
Números em pés/libras como no SRD; textos já em metros/quilos.
**Consequências:** reimportar e comparar com a fonte é trivial; o usuário nunca vê
os ids.

## 2026-09-26 · Terminologia de 2024 sem tradução oficial conhecida

**Contexto:** conceitos novos (maestrias, Emanação, Sangrando, ações Influenciar e
Estudar) não têm termo oficial em pt-BR que possamos consultar daqui.
**Decisão:** propusemos termos em `docs/TERMINOLOGIA.md`, marcados como
"proposto", para o grupo ajustar.
**Consequências:** trocar um termo é editar a tabela e os JSON.

## 2026-09-26 · Fontes só com o subconjunto latino

**Contexto:** os pacotes `@fontsource-variable` importam todos os alfabetos
(grego, cirílico, vietnamita). No uso normal o navegador só baixa o necessário,
mas o PWA (fase 7) guardaria tudo offline.
**Decisão:** `src/styles/fonts.css` declara só os arquivos latinos, que cobrem o
português.
**Consequências:** cerca de 290 kB de fontes em vez de mais de 1 MB no cache offline.

## 2026-09-26 · Animações: CSS na casca, Motion só nas telas que animam

**Contexto:** a biblioteca Motion somava ~40 kB gzip à página inicial.
**Decisão:** entradas simples (página inicial) usam `@keyframes` em CSS. Motion
fica para as telas que precisam de física/gestos (dados, cartões virando, ficha),
sempre em chunks carregados sob demanda. "Menos animações" é aplicado por
`data-motion="reduzido"` no `<html>` (CSS) e, nas telas com Motion, por
`MotionConfig`.
**Consequências:** pacote inicial ~127 kB gzip (React, React Router, Radix Popover).

## 2026-09-26 · Terminologia: "salvaguarda" e "espécie"

**Contexto:** a edição brasileira usa "teste de resistência" para _saving throw_;
o grupo prefere "salvaguarda". O D&D 2024 trocou "raça" por "espécie".
**Decisão:** a interface usa **salvaguarda** e **espécie**; o glossário aceita
"teste de resistência" e "raça" como sinônimos na busca.
**Consequências:** a tabela de termos fica em `docs/TERMINOLOGIA.md` (fase 2).

## 2026-09-26 · Regras de 2024 (SRD 5.2) como base

**Contexto:** o grupo joga com as regras de 2024. O SRD 5.2 (abril de 2025) está
sob CC BY 4.0 e cobre essas regras.
**Decisão:** o conteúdo e o motor de regras seguem o SRD 5.2. Os dados de partida
vêm do projeto 5e-bits/5e-database (`src/2024/en`, JSON estruturado), traduzidos
por nós. Multiclasse fica de fora por enquanto.
**Consequências:** espécies sem aumento de atributo; antecedente dá os aumentos e
um talento de origem; subclasse sempre no nível 3; magias preparadas para todos.

## 2026-09-26 · Site estático no GitHub Pages

**Contexto:** sem backend nem banco; deploy gratuito.
**Decisão:** GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`) a
cada push na `main`. Base do site = `/<nome-do-repositório>/` (variável
`BASE_PATH` no build). Para rotas funcionarem ao recarregar, o `index.html` é
copiado para `404.html`.
**Consequências:** rotas limpas (`/personagens`) sem `#`. Dados compartilhados por
link vão no `#` da URL, que não chega ao servidor.

## 2026-09-26 · Stack

**Decisão:** Vite + React 19 + TypeScript estrito + Tailwind v4 + React Router
(rotas `lazy`) + Zustand com `persist` (chaves `guia:*` no localStorage, com versão
para migrações) + Radix UI (acessibilidade) + Vitest + Playwright.
**Consequências:** cada página é um chunk separado. Estado do usuário sempre com
número de versão (`CHARACTERS_VERSION`).
