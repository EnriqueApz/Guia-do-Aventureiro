import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { ABILITIES } from '@/content/schema';
import type { Character } from '@/model/character';
import type { Sheet } from '@/rules/derive';
import { formatMeters } from '@/rules/encumbrance';
import { cn } from '@/lib/cn';
import {
  ABILITY_LABEL,
  armorList,
  damageName,
  formatBonus,
  joinPt,
  languageName,
  RECHARGE_LABEL,
  skillName,
  weaponList,
} from './labels';
import { GlossaryTerm } from './parts/GlossaryTerm';

/** Valor que "pisca" suavemente quando muda: a ficha se preenchendo. */
function Animated({ value, className }: { value: ReactNode; className?: string }) {
  return (
    <span className={cn('relative inline-block', className)}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={String(value)}
          className="inline-block"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function Stat({ label, value, hint }: { label: ReactNode; value: ReactNode; hint?: string }) {
  return (
    <div
      className="rounded-lg border border-gold-soft/60 bg-surface px-2 py-2 text-center"
      title={hint}
    >
      <p className="text-[0.68rem] font-semibold tracking-widest text-gold uppercase">{label}</p>
      <p className="num text-xl leading-tight font-semibold">
        <Animated value={value} />
      </p>
    </div>
  );
}

function Block({ title, children }: { title: ReactNode; children: ReactNode }) {
  return (
    <section className="border-t border-line pt-3">
      <h3 className="mb-2 font-display text-sm font-semibold tracking-widest text-ink-muted uppercase">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ProfDot({ on, double }: { on: boolean; double?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-block size-2.5 shrink-0 rounded-full border',
        on ? 'border-seal bg-seal' : 'border-line-strong',
        double && 'ring-2 ring-seal/40 ring-offset-1 ring-offset-surface',
      )}
    />
  );
}

export function LiveSheet({ character, sheet }: { character: Character; sheet: Sheet }) {
  const { species, lineage, classDef, subclass, background } = sheet;
  const identity = [
    lineage ? `${species?.name} (${lineage.name.replace(/ \(.*\)$/, '')})` : species?.name,
    classDef && `${classDef.name} ${sheet.level}`,
    background?.name,
  ].filter(Boolean);
  const hasAbilities =
    character.abilities.method !== 'padrao' ||
    ABILITIES.some((a) => character.abilities.base[a] !== 10);

  return (
    <div className="space-y-4 text-[0.95rem]">
      <header>
        <p className="font-display text-2xl leading-tight font-semibold">
          <Animated value={character.name || 'Sem nome ainda'} />
        </p>
        <p className="text-sm text-ink-muted">
          {identity.length ? identity.join(' · ') : 'Escolha espécie, classe e antecedente'}
          {subclass && ` · ${subclass.name}`}
        </p>
        {!classDef && (
          <p className="mt-1 text-sm text-ink-muted">
            Nível <span className="num">{sheet.level}</span>
          </p>
        )}
      </header>

      <div className="grid grid-cols-3 gap-2">
        {ABILITIES.map((a) => (
          <div key={a} className="rounded-lg border border-line bg-sunken/60 py-2 text-center">
            <p className="text-[0.68rem] font-semibold tracking-widest text-ink-muted">
              {ABILITY_LABEL[a].abbr}
            </p>
            <p className="num text-2xl leading-tight font-semibold">
              <Animated value={formatBonus(sheet.abilities[a].modifier)} />
            </p>
            <p className="num text-xs text-ink-muted">
              <Animated value={sheet.abilities[a].score} />
            </p>
          </div>
        ))}
      </div>
      {!hasAbilities && (
        <p className="-mt-2 text-xs text-ink-muted">
          Os atributos são definidos na etapa Atributos.
        </p>
      )}

      <div className="grid grid-cols-3 gap-2">
        <Stat
          label={<GlossaryTerm id="ca">CA</GlossaryTerm>}
          value={sheet.ac.value}
          hint={sheet.ac.formula}
        />
        <Stat label={<GlossaryTerm id="pv">PV</GlossaryTerm>} value={sheet.hp.max} />
        <Stat
          label={<GlossaryTerm id="deslocamento">Desloc.</GlossaryTerm>}
          value={formatMeters(sheet.speed.walk)}
        />
        <Stat
          label={<GlossaryTerm id="iniciativa">Inic.</GlossaryTerm>}
          value={formatBonus(sheet.initiative.value)}
        />
        <Stat
          label={<GlossaryTerm id="proficiencia">Prof.</GlossaryTerm>}
          value={formatBonus(sheet.proficiencyBonus)}
        />
        <Stat
          label={<GlossaryTerm id="dados-de-vida">D. Vida</GlossaryTerm>}
          value={`${sheet.hitDice.total}d${sheet.hitDice.die}`}
        />
      </div>

      <Block title={<GlossaryTerm id="salvaguarda">Salvaguardas</GlossaryTerm>}>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1">
          {ABILITIES.map((a) => (
            <li key={a} className="flex items-center gap-2">
              <ProfDot on={sheet.saves[a].proficient} />
              <span className="flex-1">{ABILITY_LABEL[a].name}</span>
              <span className="num font-semibold">{formatBonus(sheet.saves[a].bonus)}</span>
            </li>
          ))}
        </ul>
      </Block>

      <Block title={<GlossaryTerm id="pericia">Perícias</GlossaryTerm>}>
        <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {Object.values(sheet.skills).map((s) => (
            <li
              key={s.id}
              className={cn('flex items-center gap-2', !s.proficient && 'text-ink-muted')}
            >
              <ProfDot on={s.proficient} double={s.expertise} />
              <span className="flex-1">
                {skillName(s.id)}
                <span className="ml-1 text-xs text-ink-muted">
                  ({ABILITY_LABEL[s.ability].abbr})
                </span>
              </span>
              <span className="num font-semibold text-ink">{formatBonus(s.bonus)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm">
          Percepção passiva <span className="num font-semibold">{sheet.passivePerception}</span>
        </p>
      </Block>

      {(sheet.darkvision > 0 || sheet.resistances.length > 0) && (
        <Block title="Sentidos e defesas">
          {sheet.darkvision > 0 && (
            <p>
              <GlossaryTerm id="visao-no-escuro" /> {formatMeters(sheet.darkvision)}
            </p>
          )}
          {sheet.resistances.length > 0 && (
            <p>
              <GlossaryTerm id="resistencia" /> a{' '}
              {joinPt(sheet.resistances.map((d) => damageName(d).toLowerCase()))}
            </p>
          )}
        </Block>
      )}

      {sheet.spellcasting && (
        <Block title={<GlossaryTerm id="magia">Magia</GlossaryTerm>}>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-ink-muted">
                <GlossaryTerm id="cd-de-magia" />
              </dt>
              <dd className="num text-lg font-semibold">{sheet.spellcasting.saveDc}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">
                <GlossaryTerm id="ataque-de-magia" />
              </dt>
              <dd className="num text-lg font-semibold">
                {formatBonus(sheet.spellcasting.attackBonus)}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">
                <GlossaryTerm id="truque">Truques</GlossaryTerm>
              </dt>
              <dd className="num font-semibold">{sheet.spellcasting.cantrips}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">
                <GlossaryTerm id="magias-preparadas">Preparadas</GlossaryTerm>
              </dt>
              <dd className="num font-semibold">{sheet.spellcasting.prepared}</dd>
            </div>
          </dl>
          <p className="mt-2 text-sm">
            <GlossaryTerm id="espaco-de-magia">Espaços</GlossaryTerm>:{' '}
            {sheet.spellcasting.slots
              .map((n, i) => (n ? `${n}× ${i + 1}º` : null))
              .filter(Boolean)
              .join(' · ') || '—'}
            {sheet.spellcasting.pact && ' (voltam no descanso curto)'}
          </p>
        </Block>
      )}

      <Block title="Proficiências e idiomas">
        <dl className="space-y-1 text-sm">
          <div>
            <dt className="inline font-semibold">Armaduras: </dt>
            <dd className="inline">{armorList(sheet.proficiencies.armor)}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">Armas: </dt>
            <dd className="inline">{weaponList(sheet.proficiencies.weapons)}</dd>
          </div>
          {sheet.proficiencies.tools.length > 0 && (
            <div>
              <dt className="inline font-semibold">Ferramentas: </dt>
              <dd className="inline">{joinPt(sheet.proficiencies.tools.map(skillName))}</dd>
            </div>
          )}
          <div>
            <dt className="inline font-semibold">Idiomas: </dt>
            <dd className="inline">{joinPt(sheet.proficiencies.languages.map(languageName))}</dd>
          </div>
        </dl>
      </Block>

      {sheet.features.length > 0 && (
        <Block title="Características e traços">
          <ul className="space-y-1.5">
            {sheet.features.map((f) => (
              <li key={`${f.source}:${f.id}`} className="leading-snug">
                <span className="font-semibold">{f.name}</span>
                {f.uses && (
                  <span className="text-sm text-ink-muted">
                    {' '}
                    · <span className="num">{f.uses.max}</span>× {RECHARGE_LABEL[f.uses.recharge]}
                  </span>
                )}
                <span className="block text-xs text-ink-muted">{f.sourceName}</span>
              </li>
            ))}
          </ul>
          {sheet.feats.length > 0 && (
            <p className="mt-2 text-sm">
              <span className="font-semibold">
                <GlossaryTerm id="talento">Talentos</GlossaryTerm>:
              </span>{' '}
              {joinPt(sheet.feats.map((f) => f.feat.name))}
            </p>
          )}
        </Block>
      )}
    </div>
  );
}
