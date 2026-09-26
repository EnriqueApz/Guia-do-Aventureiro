/**
 * Material de apoio da etapa Detalhes: nomes, alinhamentos e ganchos de história.
 * Tudo aqui é texto próprio do projeto (não vem do SRD) e não tem efeito nas regras.
 */

/** Nomes por espécie: prenomes e sobrenomes/epítetos, combinados pelo gerador. */
export const NAMES: Record<string, { first: string[]; last: string[] }> = {
  dragonborn: {
    first: [
      'Azhrak',
      'Brenna',
      'Khorsa',
      'Mirvax',
      'Ondrel',
      'Raskha',
      'Suvek',
      'Tazrith',
      'Vharna',
      'Zorrim',
    ],
    last: ['do Clã Vharzan', 'do Clã Oskar', 'Escama-de-Bronze', 'Sopro-de-Brasa', 'Asa-de-Cobre'],
  },
  dwarf: {
    first: [
      'Ambra',
      'Borrin',
      'Dunmar',
      'Etta',
      'Gorlim',
      'Helga',
      'Korrik',
      'Magna',
      'Thrain',
      'Vildra',
    ],
    last: ['Barba-de-Ferro', 'Martelo-Fundo', 'Pedraforte', 'Forjabrasa', 'Punho-de-Granito'],
  },
  elf: {
    first: [
      'Aerin',
      'Caelis',
      'Elowen',
      'Faelar',
      'Ilyra',
      'Lithien',
      'Nerion',
      'Saelis',
      'Thalion',
      'Yavanne',
    ],
    last: [
      'Folha-de-Prata',
      'Brisa-da-Aurora',
      'Canto-da-Lua',
      'Sombra-de-Salgueiro',
      'Orvalho-Estelar',
    ],
  },
  gnome: {
    first: [
      'Bibbo',
      'Dimble',
      'Fizzwick',
      'Gilda',
      'Nottle',
      'Pimsy',
      'Quibble',
      'Tansy',
      'Wimbrel',
      'Zinnia',
    ],
    last: ['Engrenagem', 'Beberrico', 'Pavio-Curto', 'Tinteiro', 'Fagulha'],
  },
  goliath: {
    first: [
      'Aruk',
      'Dorhane',
      'Kavu',
      'Malhiri',
      'Noroth',
      'Rukaya',
      'Tavoa',
      'Ulhak',
      'Varra',
      'Zeho',
    ],
    last: ['Pisa-Pedra', 'Olho-de-Gelo', 'Mão-de-Trovão', 'Sobe-Montanha', 'Coração-de-Rocha'],
  },
  halfling: {
    first: [
      'Beni',
      'Clarinha',
      'Dunstan',
      'Feliz',
      'Hortênsia',
      'Milo',
      'Nina',
      'Pip',
      'Rosinha',
      'Tobias',
    ],
    last: ['Pé-Leve', 'Morro-Verde', 'Bom-Barril', 'Folha-de-Chá', 'Cata-Vento'],
  },
  human: {
    first: ['Ana', 'Bento', 'Caio', 'Dora', 'Elisa', 'Fausto', 'Iara', 'Joaquim', 'Luna', 'Tomé'],
    last: ['da Ponte Velha', 'Ferreira', 'do Vale Frio', 'Sobral', 'da Estrada Real'],
  },
  orc: {
    first: [
      'Brakka',
      'Durza',
      'Gorun',
      'Hraka',
      'Kurn',
      'Mogra',
      'Oruk',
      'Shaga',
      'Thokk',
      'Yazra',
    ],
    last: ['Presa-Partida', 'Grito-de-Guerra', 'Punho-Rubro', 'Caminha-Longe', 'Osso-Duro'],
  },
  tiefling: {
    first: [
      'Abrasa',
      'Cinder',
      'Dameus',
      'Esperança',
      'Ixara',
      'Malkor',
      'Nerissa',
      'Ravena',
      'Silvan',
      'Zephira',
    ],
    last: ['Cinzarrubra', 'da Chama Serena', 'Olhar-de-Brasa', 'Sem-Medo', 'Cantiga-Sombria'],
  },
};

export const ALIGNMENTS: { id: string; name: string; text: string; example: string }[] = [
  {
    id: 'LB',
    name: 'Leal e Bom',
    text: 'Faz o certo seguindo regras, promessas e um código de honra.',
    example: 'A paladina que cumpre a palavra mesmo quando custa caro.',
  },
  {
    id: 'NB',
    name: 'Neutro e Bom',
    text: 'Ajuda quem precisa, sem se prender a leis nem a rebeldia.',
    example: 'O curandeiro que atende qualquer ferido, amigo ou inimigo.',
  },
  {
    id: 'CB',
    name: 'Caótico e Bom',
    text: 'Segue o coração e a liberdade para fazer o bem, mesmo quebrando regras.',
    example: 'A ladra que rouba do tirano para alimentar a vila.',
  },
  {
    id: 'LN',
    name: 'Leal e Neutro',
    text: 'A ordem, a tradição ou o dever vêm antes do bem e do mal.',
    example: 'O juiz que aplica a lei do reino, goste dela ou não.',
  },
  {
    id: 'N',
    name: 'Neutro',
    text: 'Prefere o equilíbrio ou simplesmente não toma partido.',
    example: 'A druida que protege a floresta, não as pessoas.',
  },
  {
    id: 'CN',
    name: 'Caótico e Neutro',
    text: 'Vive pela própria liberdade e pelos próprios impulsos.',
    example: 'O bardo andarilho que some quando a vida fica séria.',
  },
  {
    id: 'LM',
    name: 'Leal e Mau',
    text: 'Usa regras e hierarquia para conseguir o que quer, sem se importar com quem sofre.',
    example: 'O nobre que cobra impostos cruéis dentro da lei.',
  },
  {
    id: 'NM',
    name: 'Neutro e Mau',
    text: 'Faz o que for preciso em benefício próprio.',
    example: 'O mercenário que troca de lado pelo melhor pagamento.',
  },
  {
    id: 'CM',
    name: 'Caótico e Mau',
    text: 'Age com violência e crueldade, guiado pela raiva ou pelo prazer.',
    example: 'O saqueador que queima aldeias por diversão. (Raro em heróis!)',
  },
];

export const HOOKS: string[] = [
  'Um parente desapareceu e a última pista é um mapa rasgado que você carrega até hoje.',
  'Você deve um favor grande a alguém perigoso, e essa pessoa acabou de cobrar.',
  'Você viu algo que não devia numa noite de lua cheia e desde então tem sonhos estranhos.',
  'Seu antigo mestre foi acusado de um crime que você tem certeza de que ele não cometeu.',
  'Uma cartomante disse que seu destino está ligado ao das pessoas deste grupo.',
  'Você guarda um objeto misterioso herdado de alguém que morreu sem explicar o que era.',
  'Sua vila foi atacada e você jurou descobrir quem mandou os atacantes.',
  'Você fugiu de casa para não se casar por obrigação e alguém está atrás de você.',
  'Um velho amigo mandou uma carta pedindo socorro, com um endereço numa cidade distante.',
  'Você perdeu uma aposta e agora precisa recuperar algo que não é seu.',
  'Um ser mágico salvou sua vida e disse que um dia vai pedir algo em troca.',
  'Você quer ficar famoso o bastante para que seu nome seja cantado nas tavernas.',
];

export const APPEARANCE_PROMPTS = [
  'Altura e porte',
  'Olhos e cabelo',
  'Uma marca ou cicatriz',
  'Roupa ou acessório favorito',
  'Um jeito de falar ou mania',
];
