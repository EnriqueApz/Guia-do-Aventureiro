/**
 * Guia rápido de jogo: resumo das regras de 2024 (SRD 5.2) com palavras nossas.
 * Formato: `**negrito**` e listas com "- ", como no resto do conteúdo.
 */
export interface GuideSection {
  id: string;
  title: string;
  /** Uma frase para quem só vai ler o começo. */
  lead: string;
  body: string;
  /** Termos do glossário relacionados. */
  terms: string[];
}

export const GUIDE: GuideSection[] = [
  {
    id: 'como-se-joga',
    title: 'Como se joga',
    lead: 'O Mestre descreve a cena, você diz o que seu personagem faz, e os dados decidem quando o resultado é incerto.',
    body: `- **Fale o que você quer fazer**, não qual regra usar: "quero pular o muro" em vez de "vou rolar Atletismo".
- O Mestre decide se precisa de dado. Se não houver risco nem pressa, simplesmente dá certo.
- Quando precisa, quase sempre é um **Teste de D20**: role o d20, some um bônus e compare com um número-alvo.
- Em dúvida sobre uma regra, o Mestre decide na hora e a mesa segue. Consulte depois.`,
    terms: ['mestre', 'd20'],
  },
  {
    id: 'testes',
    title: 'Testes de D20',
    lead: 'd20 + modificador (+ proficiência, se for bom naquilo). Igualou ou passou do alvo, deu certo.',
    body: `Existem três tipos:
- **Teste de atributo**: tentar algo difícil (escalar, lembrar, convencer). O alvo é a **CD** que o Mestre define.
- **Salvaguarda**: resistir a algo ruim (veneno, explosão, magia). O alvo é a CD do efeito.
- **Jogada de ataque**: acertar alguém. O alvo é a **CA** do inimigo.

**CDs de referência:** muito fácil 5 · fácil 10 · média 15 · difícil 20 · muito difícil 25 · quase impossível 30.

**Vantagem** (a situação ajuda): role dois d20 e fique com o maior. **Desvantagem** (a situação atrapalha): fique com o menor. Várias vantagens não somam, e se tiver vantagem e desvantagem ao mesmo tempo, as duas se cancelam.`,
    terms: [
      'teste-de-atributo',
      'salvaguarda',
      'jogada-de-ataque',
      'cd',
      'vantagem',
      'desvantagem',
    ],
  },
  {
    id: 'combate',
    title: 'Combate: o turno',
    lead: 'Todo mundo rola Iniciativa; na sua vez, você se move e faz uma ação.',
    body: `- **Iniciativa**: d20 + Destreza. A ordem vai do maior para o menor. Cada rodada dura uns 6 segundos.
- **Mover**: no seu turno, ande até o seu Deslocamento (dá para dividir: andar, agir, andar).
- **Uma ação**: Atacar, Magia, Disparada, Desengajar, Esquivar, Ajudar, Esconder, Influenciar, Procurar, Estudar, Usar ou Preparar.
- **Ação Bônus**: só se alguma regra der uma.
- **Objeto**: uma interação simples de graça (abrir uma porta, sacar a espada).
- **Reação**: uma por rodada, mesmo fora do seu turno (ex.: Ataque de Oportunidade quando um inimigo sai do seu alcance).
- **Cair e levantar**: levantar de Caído gasta metade do seu movimento.`,
    terms: ['iniciativa', 'acao', 'acao-bonus', 'reacao', 'ataque-de-oportunidade', 'deslocamento'],
  },
  {
    id: 'ataque',
    title: 'Atacar e causar dano',
    lead: 'd20 + atributo + proficiência contra a CA. Acertou? Role o dano da arma + o mesmo atributo.',
    body: `- **Corpo a corpo** usa Força; **à distância** usa Destreza. Armas com **Acuidade** deixam escolher Força ou Destreza.
- **20 natural** no d20 é **Acerto Crítico**: acerta sempre e você rola os dados de dano duas vezes (o modificador entra uma vez só).
- **1 natural** erra sempre.
- **Cobertura**: meia cobertura dá +2 na CA de quem está atrás; três quartos, +5.
- Atacar à distância com um inimigo do seu lado dá Desvantagem; atacar alguém que você não vê também.
- **Maestria**: algumas classes usam o efeito especial de maestria das armas (Derrubar, Trespassar...). Está na ficha.`,
    terms: ['jogada-de-ataque', 'ca', 'acerto-critico', 'cobertura', 'maestria'],
  },
  {
    id: 'magia',
    title: 'Magias',
    lead: 'Truques são de graça; as outras magias gastam um espaço de magia do círculo certo ou maior.',
    body: `- **CD de magia** = 8 + proficiência + atributo de conjuração. É o que os alvos precisam igualar nas salvaguardas contra as suas magias.
- **Ataque de magia** = proficiência + atributo de conjuração.
- Lançar uma magia com um espaço **maior** costuma deixá-la mais forte ("em círculos maiores").
- **Concentração**: só uma magia de concentração por vez. Se sofrer dano, faça uma salvaguarda de Constituição (CD 10 ou metade do dano, o que for maior, até 30) para mantê-la.
- **Componentes**: V (falar), S (gestos) e M (material; um foco de conjuração serve para os que não têm custo).
- **Rituais**: magias com a marca Ritual podem ser lançadas levando 10 minutos a mais, sem gastar espaço, se sua classe permitir.`,
    terms: [
      'magia',
      'truque',
      'espaco-de-magia',
      'cd-de-magia',
      'ataque-de-magia',
      'concentracao',
      'componentes',
      'ritual',
    ],
  },
  {
    id: 'dano-e-morte',
    title: 'Dano, cura e 0 PV',
    lead: 'Com 0 PV você cai inconsciente e começa a rolar salvaguardas contra a morte.',
    body: `- **PV temporários** são gastos primeiro e não se somam: se ganhar mais, fica o maior valor.
- **Resistência** corta o dano daquele tipo pela metade; **Vulnerabilidade** dobra.
- **Caiu a 0 PV**: fica Inconsciente. No início de cada turno seu, role um d20 sem bônus: 10 ou mais é um sucesso, 9 ou menos é uma falha.
- **20 natural** volta com 1 PV; **1 natural** conta duas falhas. Com 3 sucessos fica estável; com 3 falhas, morre.
- Sofrer dano com 0 PV conta uma falha (duas se for crítico).
- Se o dano que sobra depois de chegar a 0 for igual ou maior que seus PV máximos, é **morte instantânea**.
- Qualquer cura acorda o personagem. Um aliado pode estabilizar com um teste de Sabedoria (Medicina) CD 10.`,
    terms: [
      'pv',
      'pv-temporarios',
      'resistencia',
      'vulnerabilidade',
      'salvaguarda-contra-a-morte',
      'inconsciente',
    ],
  },
  {
    id: 'descanso',
    title: 'Descansos',
    lead: 'Descanso curto (1 hora) gasta Dados de Vida para curar; descanso longo (8 horas) recupera quase tudo.',
    body: `- **Descanso Curto**: pelo menos 1 hora parado. Gaste quantos Dados de Vida quiser: role cada um e some a Constituição para curar. Algumas características voltam aqui (e os espaços de Magia de Pacto do Bruxo).
- **Descanso Longo**: 8 horas, com no máximo 2 de atividade leve. Recupera todos os PV, todos os Dados de Vida, espaços de magia e características, e tira 1 nível de Exaustão. Só um por dia.
- **Exaustão**: cada nível dá −2 em todos os Testes de D20 e −1,5 m de deslocamento. No 6º nível, o personagem morre.`,
    terms: ['descanso-curto', 'descanso-longo', 'dados-de-vida'],
  },
  {
    id: 'exploracao',
    title: 'Exploração',
    lead: 'Fale o que procura e onde; a Percepção passiva nota perigos sem você pedir.',
    body: `- **Percepção passiva** = 10 + seu bônus de Percepção. O Mestre usa para ver se você nota algo escondido sem rolar.
- **Luz**: na Penumbra fica difícil perceber detalhes; na Escuridão, sem Visão no Escuro, você está Cego para o que está lá.
- **Esconder-se**: saia da vista dos inimigos e faça Destreza (Furtividade). Quem te procura usa Sabedoria (Percepção).
- **Terreno Difícil**: cada 1,5 m custa 3 m de movimento.
- **Quedas**: 1d6 de dano de concussão a cada 3 m, até 20d6.
- **Trabalho em equipe**: a ação Ajudar dá Vantagem ao aliado.`,
    terms: ['iluminacao', 'obscurecido', 'terreno-dificil', 'visao-no-escuro', 'ajudar'],
  },
];
