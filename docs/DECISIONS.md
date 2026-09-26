# Registro de decisões

Decisões de arquitetura e de produto, da mais recente para a mais antiga.
Formato: contexto → decisão → consequências.

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
