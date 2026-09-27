# Guia do Aventureiro

Ferramenta em português do Brasil para grupos de jogadores **iniciantes** criarem
personagens de **Dungeons & Dragons 5e (regras de 2024)**: cada opção explicada em
linguagem simples, e uma ficha que se monta sozinha enquanto você escolhe. Depois,
a mesma ficha vira o seu painel na mesa: PV, magias, dados e descansos no celular.

Site estático, sem servidor e sem conta: os personagens ficam salvos no navegador
de cada um, e o site funciona offline depois da primeira visita.

> **Status:** v1 completa (fases 1 a 8). Plano em [`docs/PLANO.md`](docs/PLANO.md),
> decisões em [`docs/DECISIONS.md`](docs/DECISIONS.md), guia do conteúdo em
> [`docs/CONTEUDO.md`](docs/CONTEUDO.md) e termos em
> [`docs/TERMINOLOGIA.md`](docs/TERMINOLOGIA.md).

---

## Guia para o grupo

### Para quem vai jogar

1. **Abra o site no celular** e toque em **Criar meu personagem**. Dá para
   "Adicionar à tela inicial" e usar como um app, inclusive sem internet.
2. **Não sabe o que escolher?** Toque em **Me guie**: cinco perguntas e três
   sugestões de espécie, classe e antecedente, cada uma com o porquê.
3. **Siga as 9 etapas.** Cada uma explica o que está sendo escolhido. Na etapa de
   perícias, equipamento e magias, o botão **Usar kit recomendado** resolve tudo
   em um toque (depois dá para trocar). O selo verde "Bom para iniciantes" marca
   as opções mais tranquilas.
4. **Termo desconhecido?** Palavras sublinhadas com pontilhado abrem uma
   explicação curta; o **Glossário** tem todas, com busca.
5. **Na Revisão**, o checklist "Está tudo pronto?" mostra o que falta e leva
   direto à etapa. Com tudo pronto, vá para o **Modo jogo**.
6. **Na mesa (Modo jogo)**: toque em uma perícia, salvaguarda ou ataque para rolar
   (com Vantagem ou Desvantagem); marque dano, cura, espaços de magia, recursos e
   condições; faça descanso curto e longo. Tudo fica salvo.
7. **Guarde uma cópia**: em **Personagens**, **Exportar** baixa um arquivo que
   pode ser importado em outro aparelho. **Imprimir / PDF** gera a ficha em A4.

### Para quem vai mestrar

- **Modo mesa** (`/mesa`, ou "Sou o Mestre" no início): escolha o nível inicial,
  quais espécies, classes e antecedentes estão liberados, como gerar os atributos
  e os PV, e se vale conteúdo próprio. Mande o link no grupo: quem abrir entra na
  mesa, e o assistente só deixa escolher o que você liberou.
- **Compartilhar ficha**: cada jogador pode mandar o link da própria ficha (só
  leitura) para você acompanhar ou imprimir.
- **Guia rápido** (`/guia-rapido`): testes, combate, magia, dano, morte e descanso
  em duas folhas para imprimir e deixar na mesa.
- **Pacote do Mestre**: o que o grupo completar em Conteúdo próprio pode ser
  exportado como arquivo e mandado no grupo. No celular, cada jogador toca em
  **Recebi um pacote do Mestre** (página inicial) e escolhe o arquivo.
- **Comparador** (`/comparar`): duas classes ou espécies lado a lado, para ajudar
  quem está em dúvida.

### Conteúdo dos livros

O site traz o **SRD 5.2** (a parte das regras de 2024 liberada pela Wizards of the
Coast): 9 espécies, 12 classes com uma subclasse cada, 4 antecedentes e as 339
magias. O que existe só nos livros (outras subclasses, antecedentes e o Aasimar)
aparece como "incompleto". Em **Conteúdo próprio** (`/conteudo`) o grupo completa
essas opções com as próprias anotações e troca pacotes em JSON. Escrevam com as
suas palavras: não copiem o texto dos livros.

### Privacidade

Nada vai para servidor nenhum. Personagens, ajustes, mesa e conteúdo próprio
ficam no navegador. Links de ficha e de mesa levam os dados dentro do próprio
endereço (depois do `#`), que não é enviado ao site. Limpar os dados do navegador
apaga tudo: exporte antes.

### Acessibilidade

Tema claro ou "luz de vela" (escuro), **fonte maior** e **menos animações** no
botão de ajustes (canto superior direito). Tudo funciona pelo teclado, alvos de
toque têm pelo menos 44 px e as telas são testadas com axe nos dois temas.

---

## Para desenvolver

Requer Node.js 20.19+ (recomendado 22).

```bash
npm install
npm run dev          # abre em http://localhost:5173
```

| Comando                 | O que faz                                                   |
| ----------------------- | ----------------------------------------------------------- |
| `npm run dev`           | Servidor de desenvolvimento                                 |
| `npm run build`         | Checa tipos e gera o site em `dist/` (com service worker)   |
| `npm run preview`       | Serve o `dist/` localmente                                  |
| `npm run lint`          | ESLint (inclui regras de acessibilidade)                    |
| `npm run typecheck`     | TypeScript estrito                                          |
| `npm run content:check` | Valida todo o conteúdo (esquema, ids, referências, magias)  |
| `npm test`              | Testes unitários (Vitest)                                   |
| `npm run test:coverage` | Testes com cobertura (mínimo de 95% em `src/rules`)         |
| `npm run size`          | Mede o pacote inicial (gzip) depois do build; limite 150 kB |
| `npm run test:e2e`      | Ponta a ponta (Playwright, celular e desktop), com axe      |
| `npm run check`         | Lint + tipos + conteúdo + testes + build                    |

Na primeira vez, para os testes E2E: `npx playwright install chromium`.

### Publicando (GitHub Pages)

1. No GitHub, abra **Settings → Pages** e, em **Build and deployment → Source**,
   escolha **GitHub Actions** (só uma vez).
2. Cada push na branch `main` roda lint, tipos, conteúdo, testes e build, e publica
   o site em `https://<usuário>.github.io/<repositório>/`.
3. Para publicar manualmente: aba **Actions → Deploy (GitHub Pages) → Run workflow**.

O endereço base vem do nome do repositório. Para testar o build como no Pages:
`BASE_PATH=/Guia-do-Aventureiro/ npm run build && npm run preview`.

### Estrutura

```
src/
  app/           casca: rotas, layout, ajustes, faixa da mesa, erros e carregamento
  components/ui  design system (Button, Card, Badge, Term, Drawer, Switch...)
  content/       SRD 5.2 em pt-BR (JSON), esquemas Zod, validação e conteúdo próprio
  model/         personagem salvo e edições puras (assistente, jogo, mesa, exportar)
  rules/         motor de regras puro: atributos, PV, CA, perícias, magia, descansos
  features/      telas: wizard/ (assistente), sheet/ (ficha, jogo, impressão),
                 glossary/, guided/ (Me guie), compare/, table/ (mesa),
                 homebrew/ (conteúdo próprio), quickGuide/
  routes/        páginas simples (cada uma carregada sob demanda)
  state/         stores Zustand persistidas no localStorage (chaves guia:*)
  styles/        tokens de cor, tipografia, temas e impressão
e2e/             testes Playwright (fluxos, acessibilidade, alvos de toque, offline)
scripts/         importação e validação do conteúdo, medição do pacote
docs/            plano, decisões, conteúdo, terminologia
```

A vitrine do design system fica em `/design` (não aparece no menu).

## Licenças

- Código: [MIT](LICENSE).
- Conteúdo de regras: material do SRD 5.2 da Wizards of the Coast LLC, sob
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode), traduzido e
  adaptado. Detalhes em [`LICENSE-CONTENT.md`](LICENSE-CONTENT.md).
- Projeto de fãs, não oficial nem endossado pela Wizards of the Coast.
