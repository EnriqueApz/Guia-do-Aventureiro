# Conteúdo de regras

Como o conteúdo do Guia está organizado, como foi produzido e como mexer nele.

## Onde fica

```
src/content/
  schema.ts            formato de tudo (Zod) — tipos TypeScript saem daqui
  validate.ts          regras de consistência usadas pelo content:check
  index.ts             junta tudo num único pacote (ContentBundle)
  srd/                 SRD 5.2 traduzido
    abilities.json skills.json languages.json damage-types.json conditions.json
    weapon-properties.json masteries.json items.json
    species.json backgrounds.json feats.json subclasses.json
    classes/<id>.json  uma classe por arquivo (características, tabelas, magia)
  stubs/stubs.json     opções fora do SRD: só nome e origem
  glossary.json        glossário (termos, sinônimos, "veja também")
```

## Convenções

- **ids** em kebab-case, sem acento. Entidades do SRD usam o id do SRD em inglês
  (`dwarf`, `longsword`, `magic-initiate`); enumerações usam português
  (`for`, `furtividade`, `concussao`, `trespassar`).
- **Números** no formato do SRD: distâncias em pés e pesos em libras. A interface
  converte para metros (5 pés = 1,5 m) e quilos (1 lb = 0,5 kg). Nos **textos**,
  já escrevemos em metros.
- Cada opção tem `text` (tradução fiel) e, quando útil, `plain` (a explicação
  simples, escrita por nós). O `content:check` exige `plain` em todos os traços de
  espécie e nas características até o nível 3.
- **Efeitos** (`effects`) são a parte que o motor de regras aplica sozinho (CA sem
  armadura, visão no escuro, resistência, proficiências...). A lista é fechada:
  veja `Effect` em `schema.ts`. O que não couber fica só no texto.
- **Escolhas** (`choices`) são o que o jogador precisa decidir (perícias, estilo de
  luta, opções). No personagem, ficam em `choices` com a chave
  `<escopo>:<característica>:<escolha>` (veja `choiceKey`).

## Como foi produzido

1. `npm run content:import` converte o SRD 5.2 estruturado (projeto
   [5e-bits/5e-database](https://github.com/5e-bits/5e-database), pasta
   `src/2024/en`) para rascunhos em `content-drafts/` (fora do git).
2. A tradução e a curadoria foram feitas a partir desses rascunhos, seguindo
   [`TERMINOLOGIA.md`](TERMINOLOGIA.md).
3. Correções feitas sobre a fonte (dados que vieram errados):
   - Truques do Druida nos níveis 7–9 e 16–17 (a tabela diminuía).
   - Conteúdo do Pacote de Artista (vinha com a lista de 2014).
   - Magias do Juramento de Devoção nos níveis 3, 9 e 17 (texto da fonte truncado).
   - Equipamento inicial do Feiticeiro (a fonte trocava a lança por armadura de couro).
   - Símbolo Sagrado genérico trocado pelo Amuleto (as três formas estão nos itens).

## Validação

```bash
npm run content:check
```

Verifica esquema, ids únicos, referências entre coleções (itens do equipamento,
talentos dos antecedentes, classes das subclasses, colunas das tabelas, magias
citadas), tabelas de magia que não diminuem, sugestão de atributos usando o array
padrão, glossário sem "veja também" quebrado nem sinônimos em conflito. Enquanto as
magias não entram (fase 4), as referências a magias são checadas contra a lista de
ids da coleção de magias (`src/content/srd/spells.json`).

## O que ainda não está aqui

- **Magias** (339 no SRD 5.2): fase 4.
- **Invocações Místicas** e **opções de Metamagia**: entram junto com as magias.
- Monstros e itens mágicos: fora do escopo da v1.
