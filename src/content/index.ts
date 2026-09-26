/**
 * Conteúdo de regras embutido no site: SRD 5.2 traduzido + stubs + glossário.
 * O conteúdo próprio do grupo (fase 7) é mesclado por cima deste pacote.
 */
import abilities from './srd/abilities.json';
import backgrounds from './srd/backgrounds.json';
import barbarian from './srd/classes/barbarian.json';
import bard from './srd/classes/bard.json';
import cleric from './srd/classes/cleric.json';
import druid from './srd/classes/druid.json';
import fighter from './srd/classes/fighter.json';
import monk from './srd/classes/monk.json';
import paladin from './srd/classes/paladin.json';
import ranger from './srd/classes/ranger.json';
import rogue from './srd/classes/rogue.json';
import sorcerer from './srd/classes/sorcerer.json';
import warlock from './srd/classes/warlock.json';
import wizard from './srd/classes/wizard.json';
import conditions from './srd/conditions.json';
import damageTypes from './srd/damage-types.json';
import feats from './srd/feats.json';
import items from './srd/items.json';
import languages from './srd/languages.json';
import masteries from './srd/masteries.json';
import skills from './srd/skills.json';
import species from './srd/species.json';
import spells from './srd/spells.json';
import subclasses from './srd/subclasses.json';
import weaponProperties from './srd/weapon-properties.json';
import glossary from './glossary.json';
import stubs from './stubs/stubs.json';
import type { ContentBundle } from './schema';

/**
 * Pacote bruto, como está nos arquivos. O tipo é garantido pelo `content:check`
 * e pelos testes (que validam com Zod); em produção não validamos de novo.
 */
export const rawContent = {
  abilities,
  skills,
  languages,
  conditions,
  damageTypes,
  weaponProperties,
  masteries,
  species,
  classes: [
    barbarian,
    bard,
    cleric,
    druid,
    fighter,
    monk,
    paladin,
    ranger,
    rogue,
    sorcerer,
    warlock,
    wizard,
  ],
  subclasses,
  backgrounds,
  feats,
  items,
  spells,
  glossary,
  stubs,
};

export const content = rawContent as unknown as ContentBundle;
