import type { ReactNode } from 'react';
import { content } from '@/content';
import { ABILITIES } from '@/content/schema';
import type { Character } from '@/model/character';
import type { Sheet } from '@/rules/derive';
import { formatMeters } from '@/rules/encumbrance';
import { cn } from '@/lib/cn';
import { ALIGNMENTS } from '@/features/wizard/detailsData';
import {
  ABILITY_LABEL,
  armorList,
  damageName,
  formatBonus,
  itemName,
  joinPt,
  languageName,
  RECHARGE_LABEL,
  skillName,
  weaponList,
} from '@/features/wizard/labels';
import { circleLabel } from '@/features/wizard/spellLabels';

function Box({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('rounded-md border border-line-strong px-2 py-1 text-center', className)}>
      <p className="text-[7.5pt] font-semibold tracking-widest text-ink-muted uppercase">{label}</p>
      <div className="num text-[15pt] leading-tight font-semibold">{children}</div>
    </div>
  );
}

function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className="mt-3 mb-1 border-b border-line-strong font-display text-[10.5pt] font-semibold tracking-widest uppercase">
      {children}
    </h2>
  );
}

function Lines({ n }: { n: number }) {
  return (
    <div aria-hidden>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="h-5 border-b border-line" />
      ))}
    </div>
  );
}

/**
 * Ficha para imprimir em A4: página 1 com os números, página 2 com as magias
 * (se houver) e a última com história e equipamento.
 */
export function PrintSheet({ character, sheet }: { character: Character; sheet: Sheet }) {
  const spellById = new Map(content.spells.map((s) => [s.id, s]));
  const spellIds = [
    ...character.spells.cantrips,
    ...(sheet.spellcasting?.alwaysPrepared ?? []),
    ...character.spells.prepared,
    ...sheet.grantedSpells.map((g) => g.spell),
  ];
  const spells = [...new Set(spellIds)]
    .map((id) => spellById.get(id))
    .filter((s) => !!s)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const alignment = ALIGNMENTS.find((a) => a.id === character.details.alignment);
  const identity = [
    sheet.species?.name,
    sheet.classDef && `${sheet.classDef.name} ${sheet.level}`,
    sheet.subclass?.name,
    sheet.background?.name,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="print-sheet mx-auto max-w-[190mm] bg-white text-[9pt] leading-snug text-ink">
      {/* ---------------------------------------------------- página 1 */}
      <section aria-label="Página 1: números" className="break-after-page">
        <header className="flex items-end justify-between gap-4 border-b-2 border-ink pb-1">
          <div>
            <h1 className="font-display text-[20pt] leading-tight font-semibold">
              {character.name || 'Personagem sem nome'}
            </h1>
            <p>{identity}</p>
          </div>
          <p className="text-right text-[8pt] text-ink-muted">
            {alignment?.name}
            {character.details.pronouns && ` · ${character.details.pronouns}`}
            <br />
            Jogador(a): ____________________
          </p>
        </header>

        <div className="mt-3 grid grid-cols-6 gap-1.5">
          {ABILITIES.map((a) => (
            <div key={a} className="rounded-md border-2 border-ink px-1 py-1 text-center">
              <p className="text-[7.5pt] font-semibold tracking-widest uppercase">
                {ABILITY_LABEL[a].name}
              </p>
              <p className="num text-[17pt] leading-tight font-semibold">
                {formatBonus(sheet.abilities[a].modifier)}
              </p>
              <p className="num text-[8pt]">{sheet.abilities[a].score}</p>
              <p className="num text-[7.5pt] text-ink-muted">
                salv. {formatBonus(sheet.saves[a].bonus)}
                {sheet.saves[a].proficient && ' ●'}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-2 grid grid-cols-7 gap-1.5">
          <Box label="CA">{sheet.ac.value}</Box>
          <Box label="PV máx.">{sheet.hp.max}</Box>
          <Box label="PV atuais">
            <span className="text-transparent">0</span>
          </Box>
          <Box label="Iniciativa">{formatBonus(sheet.initiative.value)}</Box>
          <Box label="Desloc.">{formatMeters(sheet.speed.walk)}</Box>
          <Box label="Proficiência">{formatBonus(sheet.proficiencyBonus)}</Box>
          <Box label="Dados de vida">
            {sheet.hitDice.total}d{sheet.hitDice.die}
          </Box>
        </div>

        <div className="mt-1 grid grid-cols-[1fr_1.4fr] gap-4">
          <div>
            <Title>Perícias</Title>
            <ul className="columns-1">
              {Object.values(sheet.skills).map((s) => (
                <li key={s.id} className="flex items-baseline gap-1.5">
                  <span aria-hidden className="w-3 text-center">
                    {s.expertise ? '◆' : s.proficient ? '●' : '○'}
                  </span>
                  <span className="flex-1">
                    {skillName(s.id)}{' '}
                    <span className="text-[7.5pt] text-ink-muted">
                      ({ABILITY_LABEL[s.ability].abbr})
                    </span>
                  </span>
                  <span className="num font-semibold">{formatBonus(s.bonus)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1">
              Percepção passiva <strong className="num">{sheet.passivePerception}</strong>
            </p>
            {sheet.darkvision > 0 && <p>Visão no Escuro {formatMeters(sheet.darkvision)}</p>}
            {sheet.resistances.length > 0 && (
              <p>
                Resistência: {joinPt(sheet.resistances.map((d) => damageName(d).toLowerCase()))}
              </p>
            )}
            <Title>Proficiências</Title>
            <p>
              <strong>Armaduras:</strong> {armorList(sheet.proficiencies.armor)}
            </p>
            <p>
              <strong>Armas:</strong> {weaponList(sheet.proficiencies.weapons)}
            </p>
            {sheet.proficiencies.tools.length > 0 && (
              <p>
                <strong>Ferramentas:</strong> {joinPt(sheet.proficiencies.tools.map(skillName))}
              </p>
            )}
            <p>
              <strong>Idiomas:</strong> {joinPt(sheet.proficiencies.languages.map(languageName))}
            </p>
          </div>

          <div>
            <Title>Ataques</Title>
            <table className="w-full text-left">
              <thead className="text-[7.5pt] text-ink-muted uppercase">
                <tr>
                  <th className="font-semibold">Arma</th>
                  <th className="font-semibold">Ataque</th>
                  <th className="font-semibold">Dano</th>
                </tr>
              </thead>
              <tbody>
                {sheet.attacks.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td>{a.name}</td>
                    <td className="num">{formatBonus(a.attackBonus)}</td>
                    <td className="num">
                      {a.damage} {damageName(a.damageType).toLowerCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sheet.extraAttacks > 1 && <p>A ação Atacar dá {sheet.extraAttacks} ataques.</p>}

            <Title>Características e talentos</Title>
            <ul className="space-y-0.5">
              {sheet.features.map((f) => (
                <li key={`${f.source}:${f.id}`} className="break-inside-avoid">
                  <strong>{f.name}</strong>
                  {f.uses && (
                    <span className="text-ink-muted">
                      {' '}
                      ({f.uses.max}× {RECHARGE_LABEL[f.uses.recharge]}){' '}
                      {f.uses.max <= 10 && '☐'.repeat(f.uses.max)}
                    </span>
                  )}
                  {f.plain && <span className="text-ink-muted">: {f.plain}</span>}
                </li>
              ))}
              {sheet.feats.map((f) => (
                <li key={`t:${f.feat.id}:${f.source}`} className="break-inside-avoid">
                  <strong>{f.feat.name}</strong>
                  <span className="text-ink-muted">: {f.feat.plain}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- página 2: magias */}
      {sheet.spellcasting || spells.length ? (
        <section aria-label="Página 2: magias" className="break-after-page">
          <header className="flex items-end justify-between border-b-2 border-ink pb-1">
            <h1 className="font-display text-[16pt] font-semibold">Magias</h1>
            {sheet.spellcasting && (
              <p className="num">
                {ABILITY_LABEL[sheet.spellcasting.ability].name} · CD {sheet.spellcasting.saveDc} ·
                ataque {formatBonus(sheet.spellcasting.attackBonus)}
              </p>
            )}
          </header>
          {sheet.spellcasting && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sheet.spellcasting.slots.map((n, i) =>
                n ? (
                  <Box key={i} label={`${i + 1}º círculo`} className="min-w-20">
                    {'☐'.repeat(n)}
                  </Box>
                ) : null,
              )}
            </div>
          )}
          <table className="mt-3 w-full text-left">
            <thead className="text-[7.5pt] text-ink-muted uppercase">
              <tr>
                <th>Magia</th>
                <th>Círculo</th>
                <th>Tempo</th>
                <th>Alcance</th>
                <th>Duração</th>
              </tr>
            </thead>
            <tbody>
              {spells.map((s) => (
                <tr key={s.id} className="break-inside-avoid border-t border-line align-top">
                  <td className="py-0.5 pr-2">
                    <strong>{s.name}</strong>
                    {s.plain && <span className="block text-[8pt] text-ink-muted">{s.plain}</span>}
                  </td>
                  <td className="pr-2">{circleLabel(s.level)}</td>
                  <td className="pr-2">{s.castingTime}</td>
                  <td className="pr-2">{s.range}</td>
                  <td>
                    {s.duration}
                    {s.ritual && ' · Ritual'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : null}

      {/* ---------------------------------------------------- última página: história */}
      <section aria-label="Página final: história e equipamento">
        <header className="border-b-2 border-ink pb-1">
          <h1 className="font-display text-[16pt] font-semibold">História e equipamento</h1>
        </header>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <Title>Personalidade</Title>
            <p>
              <strong>Traço:</strong> {character.details.personality.traits}
            </p>
            <p>
              <strong>Ideal:</strong> {character.details.personality.ideals}
            </p>
            <p>
              <strong>Vínculo:</strong> {character.details.personality.bonds}
            </p>
            <p>
              <strong>Defeito:</strong> {character.details.personality.flaws}
            </p>
            <Title>Aparência</Title>
            {character.details.appearance ? <p>{character.details.appearance}</p> : <Lines n={3} />}
            <Title>História</Title>
            {character.details.backstory ? <p>{character.details.backstory}</p> : <Lines n={5} />}
            {character.details.hook && (
              <p className="mt-1">
                <strong>Gancho:</strong> {character.details.hook}
              </p>
            )}
          </div>
          <div>
            <Title>Equipamento</Title>
            <ul>
              {character.inventory.map((i) => (
                <li key={i.id}>
                  {i.qty > 1 && <span className="num">{i.qty}× </span>}
                  {itemName(i.id)}
                  {i.equipped && <span className="text-ink-muted"> (equipado)</span>}
                </li>
              ))}
            </ul>
            <p className="num mt-1">
              PC ___ · PP ___ · PE ___ · PO {character.coins.po || '___'} · PL ___
            </p>
            <Title>Anotações</Title>
            <Lines n={10} />
          </div>
        </div>
      </section>
    </div>
  );
}
