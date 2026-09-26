# Registro de decisões

Decisões de arquitetura e de produto, da mais recente para a mais antiga.
Formato: contexto → decisão → consequências.

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
