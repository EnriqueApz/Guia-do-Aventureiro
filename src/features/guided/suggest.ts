/**
 * Motor do "Me guie": respostas curtas → três combinações de espécie, classe e
 * antecedente, cada uma com o porquê. Função pura e determinística.
 *
 * As afinidades abaixo são recomendações de estilo escritas por nós (não são
 * regras do jogo): elas só decidem o que sugerir primeiro.
 */
import type { Ability, ContentBundle } from '@/content/schema';

export type Approach = 'perto' | 'longe' | 'magia' | 'conversa';
export type Role = 'proteger' | 'curar' | 'dano' | 'resolver';
export type Complexity = 'pouca' | 'alguma' | 'muita';
export type Style = Ability;
export type Flavor = 'resistente' | 'agil' | 'versatil' | 'exotico';

export interface Answers {
  approach: Approach;
  role: Role;
  complexity: Complexity;
  style: Style;
  flavor: Flavor;
}

interface Option<T extends string> {
  value: T;
  label: string;
  hint: string;
}

export interface Question<K extends keyof Answers = keyof Answers> {
  id: K;
  title: string;
  options: Option<Answers[K]>[];
}

export const QUESTIONS: Question[] = [
  {
    id: 'approach',
    title: 'Numa briga, onde você quer estar?',
    options: [
      { value: 'perto', label: 'Na linha de frente', hint: 'Espada, machado ou punhos.' },
      { value: 'longe', label: 'Atirando de longe', hint: 'Arco, besta, armas de arremesso.' },
      { value: 'magia', label: 'Lançando magias', hint: 'Fogo, gelo, luz, ilusões.' },
      { value: 'conversa', label: 'Evitando a briga', hint: 'Lábia, truques e esperteza.' },
    ],
  } as Question<'approach'>,
  {
    id: 'role',
    title: 'O que você mais gosta de fazer pelo grupo?',
    options: [
      { value: 'proteger', label: 'Proteger', hint: 'Aguentar os golpes no lugar dos outros.' },
      { value: 'curar', label: 'Curar e apoiar', hint: 'Manter todo mundo de pé.' },
      { value: 'dano', label: 'Causar muito dano', hint: 'Derrubar o inimigo rápido.' },
      {
        value: 'resolver',
        label: 'Resolver problemas',
        hint: 'Abrir portas, achar pistas, negociar.',
      },
    ],
  } as Question<'role'>,
  {
    id: 'complexity',
    title: 'Quantas regras você quer acompanhar?',
    options: [
      { value: 'pouca', label: 'O mínimo', hint: 'Quero aprender jogando, sem muita lista.' },
      { value: 'alguma', label: 'Algumas', hint: 'Topo alguns recursos e magias.' },
      { value: 'muita', label: 'Muitas', hint: 'Gosto de opções e de planejar.' },
    ],
  } as Question<'complexity'>,
  {
    id: 'style',
    title: 'Qual destes combina mais com o seu herói?',
    options: [
      { value: 'for', label: 'Força bruta', hint: 'Músculos e coragem.' },
      { value: 'des', label: 'Agilidade', hint: 'Rápido, preciso e silencioso.' },
      { value: 'sab', label: 'Sabedoria', hint: 'Intuição, fé ou ligação com a natureza.' },
      { value: 'car', label: 'Carisma', hint: 'Presença, charme e força de vontade.' },
      { value: 'int', label: 'Inteligência', hint: 'Estudo, memória e raciocínio.' },
    ],
  } as Question<'style'>,
  {
    id: 'flavor',
    title: 'E o visual e o jeito do personagem?',
    options: [
      { value: 'resistente', label: 'Robusto', hint: 'Duro de derrubar.' },
      { value: 'agil', label: 'Elegante e mágico', hint: 'Sentidos aguçados, um toque de magia.' },
      { value: 'versatil', label: 'Gente como a gente', hint: 'Simples, versátil, sortudo.' },
      { value: 'exotico', label: 'Diferentão', hint: 'Escamas, chifres ou sangue de gigante.' },
    ],
  } as Question<'flavor'>,
];

/** Como cada classe costuma lutar (sugestão de estilo, não regra). */
const CLASS_APPROACH: Record<string, Approach[]> = {
  barbarian: ['perto'],
  bard: ['conversa', 'magia'],
  cleric: ['magia', 'perto'],
  druid: ['magia'],
  fighter: ['perto', 'longe'],
  monk: ['perto'],
  paladin: ['perto'],
  ranger: ['longe'],
  rogue: ['longe', 'conversa'],
  sorcerer: ['magia'],
  warlock: ['magia', 'conversa'],
  wizard: ['magia'],
};

const ROLE_MATCH: Record<Role, string[]> = {
  proteger: ['defensor'],
  curar: ['curandeiro', 'suporte'],
  dano: ['combatente', 'conjurador'],
  resolver: ['especialista', 'suporte'],
};

const ROLE_TEXT: Record<Role, string> = {
  proteger: 'protege o grupo',
  curar: 'cura e apoia os aliados',
  dano: 'causa bastante dano',
  resolver: 'resolve problemas fora do combate',
};

const APPROACH_TEXT: Record<Approach, string> = {
  perto: 'luta bem na linha de frente',
  longe: 'ataca bem de longe',
  magia: 'vive de magia',
  conversa: 'resolve muita coisa na conversa e na esperteza',
};

const RATING_TEXT = {
  facil: 'É das mais simples de jogar.',
  medio: 'Tem alguns recursos para aprender, nada assustador.',
  avancado: 'Tem muitas opções: ótima para quem gosta de planejar.',
} as const;

/** Afinidade das espécies com os estilos (sabor + traços úteis). */
const SPECIES_FLAVOR: Record<string, Flavor> = {
  dwarf: 'resistente',
  goliath: 'resistente',
  orc: 'resistente',
  elf: 'agil',
  gnome: 'agil',
  human: 'versatil',
  halfling: 'versatil',
  dragonborn: 'exotico',
  tiefling: 'exotico',
};

/** Espécies cujos traços ajudam cada jeito de lutar. */
const SPECIES_APPROACH: Record<Approach, string[]> = {
  perto: ['goliath', 'orc', 'dwarf', 'dragonborn'],
  longe: ['elf', 'halfling', 'human'],
  magia: ['tiefling', 'gnome', 'elf'],
  conversa: ['halfling', 'human', 'tiefling'],
};

/** Espécies que costumam combinar com cada classe (sabor e traços). */
const SPECIES_CLASS: Record<string, string[]> = {
  barbarian: ['orc', 'goliath'],
  bard: ['halfling', 'tiefling'],
  cleric: ['dwarf', 'human'],
  druid: ['elf', 'gnome'],
  fighter: ['human', 'dwarf'],
  monk: ['human', 'elf'],
  paladin: ['dragonborn', 'human'],
  ranger: ['elf', 'halfling'],
  rogue: ['halfling', 'elf'],
  sorcerer: ['dragonborn', 'tiefling'],
  warlock: ['tiefling', 'human'],
  wizard: ['gnome', 'elf'],
};

const ABILITY_NAME: Record<Ability, string> = {
  for: 'Força',
  des: 'Destreza',
  con: 'Constituição',
  int: 'Inteligência',
  sab: 'Sabedoria',
  car: 'Carisma',
};

export interface Suggestion {
  speciesId: string;
  classId: string;
  backgroundId: string;
  reasons: string[];
}

export function suggest(answers: Answers, content: ContentBundle): Suggestion[] {
  const maxRating = answers.complexity === 'pouca' ? 0 : answers.complexity === 'alguma' ? 1 : 2;
  const ratingValue = { facil: 0, medio: 1, avancado: 2 } as const;

  const scored = content.classes
    .map((cls) => {
      const reasons: string[] = [];
      let score = 0;
      const rating = ratingValue[cls.beginner.rating];
      // Acima do que a pessoa pediu só entra se faltar opção, e o mais simples antes.
      if (rating > maxRating) score -= 10 * (rating - maxRating);
      else if (answers.complexity === 'muita')
        score += rating; // quem gosta de regras
      else score += (maxRating - rating) * 0.5;

      if (CLASS_APPROACH[cls.id]?.includes(answers.approach)) {
        score += 4;
        reasons.push(`${cls.name} ${APPROACH_TEXT[answers.approach]}.`);
      }
      if (cls.roles.some((r) => ROLE_MATCH[answers.role].includes(r))) {
        score += 3;
        reasons.push(`No grupo, ${ROLE_TEXT[answers.role]}.`);
      }
      if (cls.primaryAbilities.includes(answers.style)) {
        score += 3;
        reasons.push(`Usa ${ABILITY_NAME[answers.style]} como atributo principal.`);
      }
      reasons.push(RATING_TEXT[cls.beginner.rating]);
      return { cls, score, reasons };
    })
    .sort((a, b) => b.score - a.score || a.cls.name.localeCompare(b.cls.name));

  return scored.slice(0, 3).map(({ cls, reasons }) => {
    const species = [...content.species]
      .map((s) => {
        let score = 0;
        if (SPECIES_FLAVOR[s.id] === answers.flavor) score += 3;
        if (SPECIES_APPROACH[answers.approach].includes(s.id)) score += 1;
        const pos = SPECIES_CLASS[cls.id]?.indexOf(s.id) ?? -1;
        if (pos >= 0) score += 2 - pos * 0.5;
        if (s.beginner.rating === 'facil' && answers.complexity !== 'muita') score += 1;
        return { s, score };
      })
      .sort((a, b) => b.score - a.score || a.s.name.localeCompare(b.s.name))[0]?.s;
    const background = [...content.backgrounds]
      .map((b) => ({
        b,
        score: cls.primaryAbilities.filter((a) => b.abilityOptions.includes(a)).length,
      }))
      .sort((a, b) => b.score - a.score || a.b.name.localeCompare(b.b.name))[0]?.b;
    const extra: string[] = [];
    if (species) extra.push(`${species.name}: ${lowerFirst(species.summary)}`);
    if (background) {
      const shared = cls.primaryAbilities.filter((a) => background.abilityOptions.includes(a));
      extra.push(
        shared.length
          ? `O antecedente ${background.name} aumenta ${shared.map((a) => ABILITY_NAME[a]).join(' e ')}, o atributo principal de ${cls.name}.`
          : `O antecedente ${background.name} combina com o estilo de ${cls.name}.`,
      );
    }
    return {
      speciesId: species?.id ?? content.species[0]?.id ?? '',
      classId: cls.id,
      backgroundId: background?.id ?? content.backgrounds[0]?.id ?? '',
      reasons: [...reasons, ...extra],
    };
  });
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}
