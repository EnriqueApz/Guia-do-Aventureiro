# Guia do Aventureiro — Plano de projeto

> Status: **aprovado com ajustes** (veja abaixo). Fases 1 a 3 concluídas; próxima: fase 4.

## 0. Decisões aprovadas

- **Regras de 2024**: a base é o **SRD 5.2** (CC BY 4.0), não o 5.1. Isso muda
  espécies, antecedentes, talentos de origem e de onde vêm os aumentos de atributo.
- **Terminologia**: usamos **salvaguarda** (com "teste de resistência" como sinônimo
  no glossário) e **espécie** (com "raça" como sinônimo).
- **Deploy**: GitHub Pages neste repositório.
- **Multiclasse**: fora do escopo por enquanto.
- Assumidos por padrão (sem objeção): itens mágicos fora da v1; código sob MIT.

### O que muda com as regras de 2024

- **Espécie** não dá mais aumento de atributo. Quem dá é o **antecedente**: ele lista
  três atributos e o jogador escolhe +2/+1 ou +1/+1/+1 entre eles.
- **Antecedente** dá também um **talento de origem**, 2 perícias, 1 ferramenta e
  equipamento (pacote A) ou 50 PO (pacote B).
- **Idiomas**: Comum + 2 idiomas padrão à escolha, independentemente da espécie.
- **Subclasse** é escolhida no **nível 3** em todas as classes.
- **Maestria em Armas** para classes marciais (Bárbaro, Guerreiro, Paladino,
  Patrulheiro, Ladino).
- Todas as classes conjuradoras usam o modelo de **magias preparadas** com número
  fixo por nível na tabela da classe.
- Melhoria de atributo virou o talento **Aumento no Valor de Atributo**; no nível 19
  há uma **Dádiva Épica**.
- Exaustão, condições e várias magias mudaram de texto.

**O que o SRD 5.2 tem:** 9 espécies (Anão, Draconato, Elfo, Gnomo, Golias, Halfling,
Humano, Orc, Tiefling), com linhagens/ancestralidades; 12 classes com **1 subclasse
cada**; **4 antecedentes** (Acólito, Criminoso, Sábio, Soldado); 17 talentos
(4 de origem, 2 gerais, 4 de estilo de luta, 7 dádivas épicas); 339 magias;
equipamento com maestrias; 15 condições.

**Fonte dos dados:** o projeto aberto 5e-bits/5e-database (código MIT) tem o SRD 5.2
completo em inglês e em JSON estruturado (`src/2024/en`). Importamos dele e
traduzimos. Existe também uma tradução comunitária do SRD 5.2 em pt-BR, da
Artifício RPG (CC BY 4.0), que serve como referência de terminologia. O acesso a
ela está bloqueado neste ambiente.

> As seções abaixo ainda mencionam a versão de 2014 em alguns pontos (raça,
> sub-raça, SRD 5.1). Onde houver conflito, **vale esta seção 0**. Os esquemas
> detalhados de Espécie, Antecedente e Talento de 2024 estão na seção 3.

Ferramenta web em pt-BR para grupos de novatos criarem personagens de D&D 5e
com uma ficha viva que se monta enquanto escolhem. Site estático, sem backend,
funcionando no celular e offline.

---

## 1. Stack final

| Área                  | Escolha                                                                                 | Por quê                                                                 |
| --------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Build                 | **Vite 7** + **React 19** + **TypeScript** (`strict`, `noUncheckedIndexedAccess`)       | Rápido, estático, code splitting nativo                                 |
| Estilo                | **Tailwind CSS v4** + tokens em CSS variables                                           | Tema claro/"luz de vela" trocando só variáveis                          |
| Animação              | **Motion** (antigo Framer Motion), respeitando `prefers-reduced-motion`                 | Dados rolando, cartões virando, ficha preenchendo                       |
| Rotas                 | **React Router 7** (modo biblioteca), rotas com `lazy()`                                | Code splitting por etapa/página                                         |
| Estado                | **Zustand** + `persist` (localStorage) com versão e migrações                           | Simples, sem boilerplate                                                |
| Esquema do conteúdo   | **Zod** (tipos TS inferidos do esquema)                                                 | Uma fonte de verdade para tipos, validação em runtime e `content:check` |
| UI acessível          | **Radix UI** primitives (Dialog, Popover, Tabs, Tooltip) estilizados por nós            | Teclado, foco e ARIA corretos sem parecer template                      |
| Ícones                | **Lucide** + SVGs próprios para raças/classes                                           | Leves e consistentes                                                    |
| Fontes                | Auto-hospedadas via `@fontsource` (título serifado + texto de leitura)                  | Funcionam offline                                                       |
| Compartilhar por link | **lz-string** (JSON comprimido no `#hash` da URL)                                       | Sem servidor; o hash não vai para logs                                  |
| PDF / impressão       | CSS de impressão dedicado + "Salvar como PDF" do navegador                              | Zero peso extra, fiel ao layout, funciona no celular                    |
| PWA                   | **vite-plugin-pwa** (Workbox)                                                           | Offline e "instalar na tela inicial"                                    |
| Testes                | **Vitest** (regras e store) + **Testing Library** + **Playwright** (E2E)                |                                                                         |
| Qualidade             | ESLint (flat config, typescript-eslint, jsx-a11y) + Prettier                            |                                                                         |
| Deploy                | **GitHub Pages** via GitHub Actions (CI: lint, typecheck, testes, content:check, build) | Gratuito, já está no GitHub                                             |

Scripts: `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:e2e`,
`content:check`, `content:import` (importação única do SRD em inglês).

---

## 2. Estrutura de pastas

```
.github/workflows/        ci.yml, deploy.yml
docs/                     PLANO.md, DECISIONS.md, CONTEUDO.md (como adicionar conteúdo), TERMINOLOGIA.md
e2e/                      criar-personagem.spec.ts
public/                   favicon, ícones PWA, og-image
scripts/
  content-check.ts        valida ids, referências cruzadas e campos obrigatórios
  import-srd.ts           gera rascunhos a partir do SRD 5.2 (inglês) para tradução
src/
  app/                    App, router, layout, providers, tema
  components/ui/          design system: Button, Card, Badge, Drawer, Tabs, Stepper,
                          Counter ("escolha 2 de 5"), Term (tooltip do glossário), Dice...
  components/art/         SVGs de raças, classes e ornamentos
  content/
    schema/               esquemas Zod (race.ts, class.ts, spell.ts, ...)
    srd/                  races.json, subraces.json, classes.json, subclasses.json,
                          backgrounds.json, spells.json, items.json, conditions.json,
                          feats.json, languages.json, skills.json
    stubs/                itens fora do SRD: só nome + fonte, status "stub"
    glossary.json
    names/                tabelas de nomes por raça (geradas por nós, não copiadas)
    index.ts              carrega SRD + stubs + conteúdo próprio e resolve referências
  rules/                  motor de regras PURO (sem React)
    abilities.ts proficiency.ts skills.ts saves.ts hp.ts ac.ts
    spellcasting.ts slots.ts leveling.ts encumbrance.ts attacks.ts
    pointBuy.ts dice.ts validate.ts derive.ts suggest.ts
    __tests__/
  features/
    wizard/               etapas do assistente (uma pasta e um chunk por etapa)
    sheet/                ficha viva, edição com sobrescrita, modo jogo
    guided/               questionário "Me guie" e motor de sugestões
    compare/              comparador
    glossary/             página e busca
    quick-guide/          guia rápido de jogo (imprimível)
    table/                modo mesa (código do Mestre)
    homebrew/             "Adicionar conteúdo próprio"
    roster/               lista de personagens, importar/exportar
  state/                  stores Zustand (characters, homebrew, settings) + migrações
  lib/                    share (lz-string), rng, geração de nomes, formatação pt-BR
  styles/                 tokens.css, print.css
LICENSE                   código (MIT, a confirmar)
LICENSE-CONTENT.md        atribuição CC BY 4.0 do SRD 5.2 e aviso da tradução
```

Regra de ouro: **nenhuma regra de D&D dentro de componente**. Componentes chamam
`derive(character, content)` e exibem o resultado.

---

## 3. Modelo de dados do conteúdo

Todos os arquivos em `src/content/**.json` são validados por esquemas Zod.
Abaixo, os tipos TypeScript equivalentes (resumidos).

### Tipos comuns

```ts
type Id = string; // kebab-case, único por tipo: "anao-da-colina"
type Ability = 'for' | 'des' | 'con' | 'int' | 'sab' | 'car';
type SkillId = 'acrobacia' | 'adestrar-animais' | 'arcanismo' | /* ... 18 */ 'sobrevivencia';
type Rest = 'descanso-curto' | 'descanso-longo' | 'amanhecer';

interface Source {
  kind: 'srd' | 'homebrew' | 'stub'; // stub = só o nome, aguardando preenchimento
  ref?: string; //  "SRD 5.2" ou "Livro do Jogador (preenchido pelo grupo)"
}

interface BeginnerInfo {
  rating: 'facil' | 'medio' | 'avancado';
  note: string; // "Poucas decisões por turno; ótimo para começar."
}

// Texto de regra + explicação em linguagem simples, lado a lado
interface Feature {
  id: Id;
  name: string;
  level?: number;
  text: string; // tradução fiel do SRD (markdown leve)
  plain: string; // "Em outras palavras: ..." (1–2 frases)
  uses?: { max: Formula; recharge: Rest }; // ex.: Fúria, Retomar o Fôlego
  effects?: Effect[]; // o que o motor de regras aplica automaticamente
  choices?: Choice[]; // ex.: Estilo de Luta, Especialização
}

// Efeitos mecânicos que o motor entende (lista fechada; o resto é só texto)
type Effect =
  | { type: 'ability-bonus'; ability: Ability; value: number }
  | { type: 'speed'; value: number }
  | { type: 'hp-per-level'; value: number } // Robustez Anã, Resiliência Dracônica
  | { type: 'ac-formula'; base: number; abilities: Ability[]; allowShield: boolean } // Defesa sem Armadura
  | {
      type: 'proficiency';
      kind: 'skill' | 'save' | 'armor' | 'weapon' | 'tool' | 'language';
      ids: Id[];
    }
  | { type: 'expertise'; count: number }
  | { type: 'resistance'; damageType: string }
  | { type: 'darkvision'; range: number }
  | { type: 'extra-attack'; count: number };

type Formula =
  | number
  | { per: 'level' | 'proficiency' | Ability; plus?: number; min?: number }
  | { table: number[] }; // valor por nível (índice 0 = nível 1)

type Choice =
  | { kind: 'skill'; count: number; from: SkillId[] | 'any' }
  | { kind: 'language'; count: number }
  | { kind: 'tool'; count: number; from: Id[] }
  | { kind: 'ability'; count: number; value: number; exclude?: Ability[] }
  | { kind: 'option'; count: number; options: Feature[] };
```

### Espécie e linhagem (2024)

```ts
interface Species {
  id: Id;
  name: string;
  source: Source;
  icon: string;
  summary: string; // uma frase
  description: string;
  creatureType: 'Humanoide';
  size: ('Pequeno' | 'Médio')[]; // alguns deixam escolher
  speed: number; // em metros (9 m); pés na dica
  traits: Feature[];
  lineages: Id[]; // Elfo: drow/alto/silvestre; Draconato: ancestral dracônico...
  lineageLabel?: string; // "Linhagem élfica", "Ancestral dracônico", "Legado ínfero"
  lineageRequired: boolean;
  beginner: BeginnerInfo;
  nameTableId?: Id;
}

interface Lineage {
  id: Id;
  speciesId: Id;
  name: string;
  source: Source;
  summary: string;
  traits: Feature[]; // inclui magias concedidas por nível (via effects)
  spellAbilityChoice?: Ability[]; // "Int, Sab ou Car" para magias da linhagem
  beginner?: BeginnerInfo;
}
```

### Classe

```ts
interface ClassDef {
  id: Id;
  name: string;
  source: Source;
  icon: string;
  summary: string;
  roles: ('combatente' | 'defensor' | 'curandeiro' | 'conjurador' | 'especialista' | 'suporte')[];
  beginner: BeginnerInfo;
  primaryAbilities: Ability[];
  recommendedArray: Record<Ability, number>; // usado na sugestão de atributos + "por quê"
  hitDie: 6 | 8 | 10 | 12;
  saves: [Ability, Ability];
  proficiencies: { armor: Id[]; weapons: Id[]; tools: Id[] };
  skillChoice: { count: number; from: SkillId[] };
  startingEquipment: { a: { id: Id; qty: number }[]; aGold: number; bGold: number }; // pacote A ou só PO
  beginnerKit: { equipment: Id[]; spells?: Id[]; skills?: SkillId[]; why: string };
  subclassLevel: 3;
  subclassLabel: string; // "Caminho Primitivo", "Domínio Divino"...
  featLevels: number[]; // níveis de talento geral: [4, 8, 12, 16] (+6, 14 no Guerreiro; +10 no Ladino)
  epicBoonLevel: 19;
  weaponMastery?: number[]; // quantas armas com maestria, por nível
  spellcasting?: {
    ability: Ability;
    progression: 'completa' | 'meia' | 'pacto';
    cantrips?: number[]; // por nível, 20 posições
    prepared: number[]; // magias preparadas por nível (tabela da classe)
    swap: 'descanso-longo' | 'subir-de-nivel'; // quando pode trocar as preparadas
    ritual: boolean;
    focus?: string;
    explainer: string; // conjuração explicada para novatos
  };
  levels: { level: number; features: Id[]; columns?: Record<string, string | number> }[];
  features: Feature[];
  typicalTurn: string; // "Como isso funciona na mesa?"
}

type EquipmentChoice = { options: { label: string; items: { id: Id; qty: number }[] }[] };
```

### Subclasse

```ts
interface Subclass {
  id: Id;
  classId: Id;
  name: string;
  source: Source;
  flavor: string; // o "sabor" em 2–3 frases
  features: Feature[]; // cada uma com level
  bonusSpells?: { level: number; spells: Id[] }[]; // Domínio da Vida, Juramento de Devoção...
  beginner?: BeginnerInfo;
}
```

### Antecedente

```ts
interface Background {
  id: Id;
  name: string;
  source: Source;
  summary: string;
  abilityOptions: [Ability, Ability, Ability]; // escolhe +2/+1 ou +1/+1/+1 entre estes
  originFeat: { id: Id; choice?: string }; // ex.: Iniciado em Magia (Clérigo)
  skills: [SkillId, SkillId];
  tool: Id | Extract<Choice, { kind: 'tool' }>;
  equipment: { a: { id: Id; qty: number }[]; aGold: number; bGold: 50 };
  // Sugestões de personalidade escritas por nós (o SRD 5.2 não tem tabelas):
  personality: { traits: string[]; ideals: string[]; bonds: string[]; flaws: string[] };
}
```

### Talento

```ts
interface Feat {
  id: Id;
  name: string;
  source: Source;
  category: 'origem' | 'geral' | 'estilo-de-luta' | 'dadiva-epica';
  prerequisite?: { level?: number; abilities?: Partial<Record<Ability, number>>; feature?: Id };
  repeatable: boolean;
  text: string;
  plain: string;
  abilityIncrease?: { options: Ability[]; value: 1 | 2; max: 20 | 30 };
  effects?: Effect[];
  choices?: Choice[];
}
```

### Magia

```ts
interface Spell {
  id: Id;
  name: string;
  source: Source;
  level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9; // 0 = truque
  school:
    | 'abjuracao'
    | 'adivinhacao'
    | 'conjuracao'
    | 'encantamento'
    | 'evocacao'
    | 'ilusao'
    | 'necromancia'
    | 'transmutacao';
  castingTime: string;
  range: string;
  duration: string;
  components: { v: boolean; s: boolean; m?: string };
  concentration: boolean;
  ritual: boolean;
  classes: Id[];
  resolution?: { attack?: 'corpo-a-corpo' | 'distancia'; save?: Ability };
  damage?: { dice: string; type: string; scaling?: string };
  text: string;
  higherLevels?: string;
  plain: string; // "Na prática: ..."
  tags: ('dano' | 'cura' | 'controle' | 'defesa' | 'utilidade' | 'social')[];
  beginnerFriendly: boolean;
}
```

### Item

```ts
interface Item {
  id: Id;
  name: string;
  source: Source;
  category:
    | 'arma'
    | 'armadura'
    | 'escudo'
    | 'equipamento'
    | 'ferramenta'
    | 'pacote'
    | 'foco'
    | 'municao'
    | 'montaria';
  cost: { qty: number; unit: 'pc' | 'pp' | 'pe' | 'po' | 'pl' };
  weight: number; // em kg (libras na dica)
  weapon?: {
    group: 'simples' | 'marcial';
    kind: 'corpo-a-corpo' | 'distancia';
    damage: string;
    damageType: string;
    versatile?: string;
    range?: [number, number];
    properties: Id[];
  };
  armor?: {
    type: 'leve' | 'media' | 'pesada';
    baseAC: number;
    dexCap: number | null;
    strength?: number;
    stealthDisadvantage: boolean;
  };
  contents?: { id: Id; qty: number }[]; // pacotes
  description?: string;
}
```

Também: `Condition`, `Feat`, `Language`, `Skill`, `GlossaryEntry`
(`{ id, term, aliases[], short, long, seeAlso[] }`).

### Personagem salvo (estado do usuário)

Guardamos **escolhas**, não valores calculados. A ficha é sempre derivada.

```ts
interface Character {
  id: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  level: number;
  raceId?: Id;
  subraceId?: Id;
  classId?: Id;
  subclassId?: Id;
  backgroundId?: Id;
  abilities: {
    method: 'padrao' | 'compra' | 'rolagem' | 'manual';
    base: Record<Ability, number>;
    rolls?: number[][];
  };
  choices: Record<string, Id[]>; // chave = origem da escolha, ex.: "classe:pericias"
  asi: Record<
    number,
    | { kind: 'atributos'; bonuses: Partial<Record<Ability, number>> }
    | { kind: 'talento'; featId: Id }
  >;
  hp: { method: 'media' | 'rolagem'; rolls: Record<number, number> };
  equipment: { id: Id; qty: number; equipped?: boolean }[];
  coins: Record<'pc' | 'pp' | 'pe' | 'po' | 'pl', number>;
  spells: { known: Id[]; prepared: Id[] };
  details: {
    name: string;
    pronouns?: string;
    alignment?: string;
    appearance: string;
    personality: { traits: string; ideals: string; bonds: string; flaws: string };
    backstory: string;
    hook?: string;
  };
  overrides: Record<string, number | string>; // caminho → valor ("ac", "skills.furtividade")
  play: {
    hpCurrent: number;
    hpTemp: number;
    hitDiceUsed: number;
    slotsUsed: number[];
    resourcesUsed: Record<Id, number>;
    conditions: Id[];
    deathSaves: { successes: number; failures: number };
    inspiration: boolean;
  };
  tableCode?: string;
}
```

### Código da mesa

```ts
interface TableRules {
  v: 1;
  name?: string;
  level: number;
  races?: Id[];
  classes?: Id[];
  backgrounds?: Id[]; // ausente = tudo liberado
  abilityMethods: ('padrao' | 'compra' | 'rolagem')[];
  hpMethod: 'media' | 'rolagem' | 'livre';
  allowHomebrew: boolean;
}
// URL: /mesa#m=<lz-string(JSON)>
```

---

## 4. Telas

| Rota                     | Tela                              | Descrição                                                                                                                                                                                   |
| ------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                      | Início                            | Boas-vindas, "Continuar personagem", "Criar novo", atalhos para Guia rápido e Glossário. Banner quando há código da mesa ativo.                                                             |
| `/criar/:id/:etapa`      | Assistente                        | 9 etapas com barra de progresso e voltar sem perder nada. Desktop: tela dividida com a ficha à direita. Celular: ficha numa gaveta inferior sempre acessível (puxador com nome, PV, CA).    |
| ↳ `boas-vindas`          | 1. Boas-vindas                    | O que é um personagem em 30 s; escolha entre "Já sei o que quero" e "Me guie".                                                                                                              |
| ↳ `me-guie`              | Questionário                      | 4–6 perguntas curtas → 3 combinações raça + classe, cada uma com "por que sugeri isso".                                                                                                     |
| ↳ `especie`              | 2. Espécie e linhagem             | Cartões com SVG, resumo, selo de iniciante; detalhes em painel com traços + "em outras palavras".                                                                                           |
| ↳ `classe`               | 3. Classe                         | Papel no grupo, dificuldade, atributo principal, dado de vida, "turno típico", explicação de conjuração.                                                                                    |
| ↳ `subclasse`            | 4. Subclasse                      | Nível em que é escolhida (se o nível inicial ainda não chega lá, mostra só como prévia), sabor e características por nível.                                                                 |
| ↳ `antecedente`          | 5. Antecedente                    | Perícias, ferramentas, idiomas, equipamento, característica; personalidade escolhida ou sorteada (d8/d6 animado).                                                                           |
| ↳ `atributos`            | 6. Atributos                      | Array padrão / compra de pontos (27) / 4d6 descartando o menor com dados animados; sugestão automática por classe com explicação; bônus raciais aplicados; melhorias de atributo por nível. |
| ↳ `escolhas`             | 7. Perícias, equipamento e magias | Contadores "escolha 2 de 5", validação, kit "recomendado para iniciantes", PV por nível (média ou rolagem).                                                                                 |
| ↳ `detalhes`             | 8. Detalhes e história            | Nome com gerador por raça, aparência, alinhamento explicado com exemplos, gancho opcional.                                                                                                  |
| ↳ `revisao`              | 9. Revisão                        | Ficha completa, checklist "está tudo pronto?" com links para o que falta, resumo em um parágrafo.                                                                                           |
| `/personagens`           | Meus personagens                  | Lista, duplicar, excluir (com desfazer), exportar/importar JSON.                                                                                                                            |
| `/ficha/:id`             | Ficha viva                        | Ficha completa editável; valores sobrescritos marcados; alternância **Criação ↔ Modo jogo**.                                                                                                |
| `/ficha/:id` (modo jogo) | Modo jogo                         | PV atual/temporário, espaços de magia, recursos, condições, dados de vida, salvaguardas contra a morte, descanso curto/longo, rolador de dados integrado.                                   |
| `/ficha/:id/imprimir`    | Impressão / PDF                   | Layout de ficha em A4, 2–3 páginas (ficha, magias, história).                                                                                                                               |
| `/ver#d=...`             | Ficha compartilhada               | Visualização só leitura de uma ficha recebida por link, com "Salvar uma cópia".                                                                                                             |
| `/glossario`             | Glossário                         | Busca instantânea (acentos ignorados), termos por letra, "veja também".                                                                                                                     |
| `/guia-rapido`           | Guia rápido de jogo               | Testes, ataque, dano, descanso, morte, iniciativa, exploração. Curto, ilustrado, imprimível.                                                                                                |
| `/comparar`              | Comparador                        | Duas raças ou duas classes lado a lado, diferenças destacadas.                                                                                                                              |
| `/mesa`                  | Modo mesa                         | O Mestre escolhe restrições e gera o link; jogadores que abrem o link ficam com a mesa ativa.                                                                                               |
| `/conteudo`              | Conteúdo próprio                  | Lista, editor por formulário (mesmos esquemas Zod), importar/exportar pacote JSON, completar os stubs.                                                                                      |
| `/sobre`                 | Sobre e licenças                  | Atribuição do SRD, o que é e o que não é oficial, créditos.                                                                                                                                 |
| `*`                      | 404                               | Página "Você se perdeu na masmorra" com caminho de volta.                                                                                                                                   |

Em toda parte: **Termos do glossário** sublinhados com pontilhado; toque/hover abre
explicação de uma linha. Ajustes globais: tema claro/luz de vela, fonte maior,
reduzir animações.

---

## 5. Conteúdo: tradução e atribuição do SRD

O inventário do SRD 5.2 está na seção 0.

**Fluxo de tradução**

1. `npm run content:import` baixa uma vez o SRD 5.2 estruturado (projeto
   5e-bits/5e-database, pasta `src/2024/en`) e gera rascunhos em inglês no nosso esquema. O script
   fica no repositório, mas os dados finais commitados são os JSON traduzidos.
2. Tradução para pt-BR feita por mim, em lotes, usando `docs/TERMINOLOGIA.md`:
   uma tabela fixa de termos oficiais brasileiros (Classe de Armadura, bônus de
   proficiência, espaço de magia, ação bônus, Patrulheiro, Bruxo, Draconato,
   Ladino...) para manter consistência. Uso só a **terminologia** oficial;
   não copio frases da edição brasileira.
3. Cada entrada tem `text` (tradução fiel) e `plain` (explicação simples escrita
   por nós). O `content:check` falha se faltar `plain` em opção do SRD.
4. Unidades: metros e quilos na exibição (convenção da edição brasileira), com
   pés/libras na dica.

**Fora do SRD**: `src/content/stubs/` lista apenas nomes e origem (ex.: subclasses e
antecedentes do Livro do Jogador) com `source.kind = "stub"` e **sem mecânicas**.
Eles aparecem como "Incompleto — preencha em Conteúdo próprio" e não podem ser
escolhidos até alguém preencher. O conteúdo preenchido pelo grupo fica **só no
navegador** (e em pacotes JSON que vocês trocam entre si), nunca no repositório.

**Atribuição**: `LICENSE-CONTENT.md`, página `/sobre` e rodapé com o texto exigido
pela CC-BY 4.0: material do _System Reference Document 5.2_ da Wizards of the
Coast LLC, licenciado sob CC-BY 4.0, com link para a licença, **indicando que foi
traduzido e adaptado**, e aviso de que o site não é afiliado à Wizards.

**`npm run content:check`** verifica: esquema Zod de todos os arquivos, ids únicos
e em kebab-case, referências (sub-raça → raça, subclasse → classe, magia → classes,
itens de equipamento inicial, `features` citadas em `levels`), tabelas com 20
níveis, recomendações de iniciante apontando para opções existentes, termos do
glossário sem duplicatas/aliases conflitantes.

---

## 6. Motor de regras (`src/rules`)

Funções puras, 100% testadas:

- Modificador de atributo; bônus de proficiência por nível.
- Compra de pontos (custo 27, faixa 8–15), array padrão, 4d6 descartando o menor (RNG injetável para teste).
- Aplicação de bônus raciais, escolhas (Meio-Elfo) e melhorias de atributo (teto 20).
- PV: máximo no 1º nível + média ou rolagem, + CON por nível, + efeitos (Robustez Anã, Resiliência Dracônica).
- CA: sem armadura, leve/média/pesada, escudo, Defesa sem Armadura (Bárbaro/Monge), Armadura de Mago como efeito ativo.
- Iniciativa, velocidade (inclusive penalidade de armadura pesada sem FOR).
- Perícias, salvaguardas, especialização, Versatilidade (Bardo).
- Ataques: bônus e dano por arma (acuidade, distância, versátil, arremesso).
- Conjuração: CD, ataque de magia, magias preparadas/conhecidas, truques, espaços por progressão (completa/meia/pacto), escalonamento de truques.
- Carga (capacidade e sobrecarga opcional).
- Recursos por descanso; descanso curto (dados de vida) e longo.
- `validate(character)`: lista de problemas ("escolheu 3 perícias de 2", "magia fora da lista da classe").
- `derive(character, content)`: ficha completa + origem de cada número (para a dica "de onde vem esse +5?").

---

## 7. Roadmap com critérios de aceite

Toda fase termina com: `lint`, `typecheck`, `test`, `content:check` e `build`
passando no CI, README e `docs/DECISIONS.md` atualizados, e instruções de como testar.

### Fase 1 — Fundação

Projeto Vite/React/TS estrito, Tailwind com tokens, tema claro e "luz de vela",
tipografia, componentes base, layout responsivo, rotas lazy, store persistida com
versão, CI e deploy no GitHub Pages.
**Aceite:** site publicado no Pages; troca de tema persiste; navegação por teclado
com foco visível; página de "vitrine" do design system; Lighthouse mobile ≥ 90 em
Performance e Acessibilidade.

### Fase 2 — Conteúdo SRD + esquema + motor de regras

Esquemas Zod, `content:check`, importação, tradução de raças, classes, subclasses,
antecedente, equipamento, condições, idiomas, perícias e glossário; motor de regras.
**Aceite:** `content:check` verde e falhando em casos quebrados (testado);
≥ 95% de cobertura de linhas em `src/rules`; testes com personagens-referência
calculados à mão (ex.: Anão da Colina Clérigo nível 1 e 5, Elfo Alto Mago 3,
Halfling Ladino 4).

### Fase 3 — Assistente: raça, classe, subclasse, antecedente + ficha ao vivo

**Aceite:** etapas 1–5 navegáveis, voltar sem perder dados, recarregar a página
mantém tudo; ficha lateral/gaveta atualiza na hora; funciona em 360 px de largura;
selos de iniciante e explicações simples visíveis.

### Fase 4 — Atributos, perícias, equipamento, magias (+ tradução de todas as magias)

**Aceite:** três métodos de atributos com animação; sugestão por classe com o
"por quê"; contadores e validação impedem ficha ilegal; kit iniciante aplica em um
toque; níveis 1–20 aplicam características, PV, magias e melhorias; etapas 8–9 prontas;
teste E2E Playwright do fluxo completo verde.

### Fase 5 — Apoio ao novato

Glossário (página + tooltips em toda parte), questionário "Me guie", comparador,
"turno típico", avisos de complexidade.
**Aceite:** todo termo marcado tem entrada; busca acha termos sem acento; o
questionário sempre retorna 3 sugestões válidas com justificativa; comparador
funciona no celular.

### Fase 6 — Modo jogo e vários personagens

**Aceite:** PV/temporário, espaços, recursos, condições, dados de vida e
salvaguardas contra a morte funcionam; descansos restauram o que devem (testado);
rolador com vantagem/desvantagem e histórico; duplicar, excluir com desfazer,
exportar/importar JSON com validação e mensagens de erro claras.

### Fase 7 — Exportação, compartilhamento, mesa, guia rápido, PWA

**Aceite:** impressão/PDF em A4 bonita (testada no Chrome e Safari); link de ficha
abre só leitura; link de mesa trava as opções no assistente; guia rápido
imprimível; app instalável e funcionando offline após a primeira visita;
"Conteúdo próprio" permite completar stubs e trocar pacotes.

### Fase 8 — Polimento, acessibilidade e lançamento

**Aceite:** auditoria axe sem violações sérias; alvos de toque ≥ 44 px; fonte maior
e redução de movimento em todo o app; estados de carregamento/erro revisados;
bundle inicial < 150 kB gzip; README final com guia para o grupo.

---

## 8. Fora do escopo da v1 (preparado no esquema)

Multiclasse, itens mágicos, regras variantes (talentos fora do SRD são só via
conteúdo próprio), sincronização entre dispositivos, edição colaborativa.
