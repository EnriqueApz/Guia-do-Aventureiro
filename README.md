# Guia do Aventureiro

Ferramenta em português do Brasil para grupos de jogadores **iniciantes** criarem
personagens de **Dungeons & Dragons 5e (regras de 2024)**: cada opção explicada em
linguagem simples, e uma ficha que se monta sozinha enquanto você escolhe.

Site estático, sem servidor: os personagens ficam salvos no navegador de cada um.

> **Status:** fase 4 de 8 (assistente de criação completo, da espécie à revisão:
> atributos, perícias, equipamento, as 339 magias do SRD em português, talentos e
> PV do nível 1 ao 20, com a ficha ao vivo). Veja o
> plano em [`docs/PLANO.md`](docs/PLANO.md), as decisões em
> [`docs/DECISIONS.md`](docs/DECISIONS.md) e o guia do conteúdo em
> [`docs/CONTEUDO.md`](docs/CONTEUDO.md).

## Rodando localmente

Requer Node.js 20.19+ (recomendado 22).

```bash
npm install
npm run dev          # abre em http://localhost:5173
```

| Comando             | O que faz                                               |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento                             |
| `npm run build`     | Checa tipos e gera o site em `dist/`                    |
| `npm run preview`   | Serve o `dist/` localmente                              |
| `npm run lint`      | ESLint (inclui regras de acessibilidade)                |
| `npm run typecheck` | TypeScript estrito                                      |
| `npm test`          | Testes unitários (Vitest)                               |
| `npm run test:e2e`  | Testes de ponta a ponta (Playwright, celular e desktop) |
| `npm run check`     | Lint + tipos + testes + build                           |

Na primeira vez, para os testes E2E: `npx playwright install chromium`.

## Publicando (GitHub Pages)

1. No GitHub, abra **Settings → Pages** e, em **Build and deployment → Source**,
   escolha **GitHub Actions** (só uma vez).
2. Cada push na branch `main` roda lint, tipos, testes e build, e publica o site em
   `https://<usuário>.github.io/<repositório>/`.
3. Para publicar manualmente: aba **Actions → Deploy (GitHub Pages) → Run workflow**.

O endereço base é calculado a partir do nome do repositório. Para testar o build
como no Pages: `BASE_PATH=/Guia-do-Aventureiro/ npm run build && npm run preview`.

## Estrutura

```
src/
  app/           casca do app: rotas, layout, ajustes (tema, fonte, movimento)
  components/ui  design system (Button, Card, Badge, Term, Drawer, ...)
  components/art SVGs (emblema, ornamentos; depois espécies e classes)
  content/       conteúdo de regras (SRD 5.2 em pt-BR), esquemas e validação
  model/         formato do personagem salvo
  rules/         motor de regras puro: atributos, PV, CA, perícias, magia, descansos
  features/      telas com lógica própria (wizard/: assistente de criação e ficha ao vivo)
  routes/        páginas simples (cada uma carregada sob demanda)
  state/         stores Zustand persistidas no localStorage
  styles/        tokens de cor, tipografia e temas
e2e/             testes Playwright
scripts/         importação e validação do conteúdo
docs/            plano, decisões, conteúdo, terminologia
```

A vitrine do design system fica em `/design` (não aparece no menu).

## Licenças

- Código: [MIT](LICENSE).
- Conteúdo de regras: material do SRD 5.2 da Wizards of the Coast LLC, sob
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode), traduzido e
  adaptado. Detalhes em [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).
- Projeto de fãs, não oficial nem endossado pela Wizards of the Coast.
