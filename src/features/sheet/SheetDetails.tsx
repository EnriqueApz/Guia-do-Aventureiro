import { content } from '@/content';
import { Card } from '@/components/ui/Card';
import { RichText } from '@/components/ui/RichText';
import type { Character } from '@/model/character';
import type { Sheet } from '@/rules/derive';
import { formatMeters } from '@/rules/encumbrance';
import { ALIGNMENTS } from '@/features/wizard/detailsData';
import {
  ACTION_LABEL,
  damageName,
  formatBonus,
  itemName,
  joinPt,
  RECHARGE_LABEL,
} from '@/features/wizard/labels';
import { LiveSheet } from '@/features/wizard/LiveSheet';
import { GlossaryTerm } from '@/features/wizard/parts/GlossaryTerm';
import { circleLabel } from '@/features/wizard/spellLabels';

/** Ficha completa (números, ataques, magias, equipamento, características e história). */
export function SheetDetails({ character, sheet }: { character: Character; sheet: Sheet }) {
  const spellById = new Map(content.spells.map((s) => [s.id, s]));
  const allSpells = [
    ...character.spells.cantrips,
    ...(sheet.spellcasting?.alwaysPrepared ?? []),
    ...character.spells.prepared,
    ...sheet.grantedSpells.map((g) => g.spell),
  ];
  const spells = [...new Set(allSpells)]
    .map((id) => spellById.get(id))
    .filter((s) => !!s)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const alignment = ALIGNMENTS.find((a) => a.id === character.details.alignment);
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <LiveSheet character={character} sheet={sheet} />
      </Card>
      <div className="space-y-6">
        <Card className="space-y-2">
          <h4 className="text-lg font-semibold">Ataques</h4>
          <ul className="divide-y divide-line">
            {sheet.attacks.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 py-1.5">
                <span className="flex-1 font-semibold">{a.name}</span>
                <span className="num">{formatBonus(a.attackBonus)}</span>
                <span className="num text-sm text-ink-muted">
                  {a.damage} {damageName(a.damageType).toLowerCase()}
                  {a.range && ` · ${formatMeters(a.range[0])}/${formatMeters(a.range[1])}`}
                </span>
              </li>
            ))}
          </ul>
          {sheet.extraAttacks > 1 && (
            <p className="text-sm">Ataca {sheet.extraAttacks} vezes com a ação Atacar.</p>
          )}
        </Card>

        {spells.length > 0 && (
          <Card className="space-y-2">
            <h4 className="text-lg font-semibold">
              <GlossaryTerm id="magia">Magias</GlossaryTerm>
            </h4>
            <ul className="space-y-1">
              {spells.map((s) => (
                <li key={s.id}>
                  <details>
                    <summary className="min-h-9 cursor-pointer">
                      <span className="font-semibold">{s.name}</span>{' '}
                      <span className="text-xs text-ink-muted">{circleLabel(s.level)}</span>
                    </summary>
                    {s.plain && <p className="text-sm">{s.plain}</p>}
                    <RichText text={s.text} className="mt-1 text-sm text-ink-muted" />
                  </details>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="space-y-2">
          <h4 className="text-lg font-semibold">Equipamento</h4>
          {character.inventory.length ? (
            <p className="text-sm">
              {joinPt(
                character.inventory.map(
                  (i) =>
                    `${i.qty > 1 ? `${i.qty}× ` : ''}${itemName(i.id)}${i.equipped ? ' (equipado)' : ''}`,
                ),
              )}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">Nenhum item ainda.</p>
          )}
          <p className="num text-sm">{character.coins.po} PO</p>
        </Card>

        <Card className="space-y-2">
          <h4 className="text-lg font-semibold">Características em detalhe</h4>
          <ul className="space-y-1">
            {sheet.features.map((f) => (
              <li key={`${f.source}:${f.id}`}>
                <details>
                  <summary className="min-h-9 cursor-pointer">
                    <span className="font-semibold">{f.name}</span>{' '}
                    <span className="text-xs text-ink-muted">
                      {f.sourceName}
                      {f.action && f.action !== 'passiva' && ` · ${ACTION_LABEL[f.action]}`}
                      {f.uses && ` · ${f.uses.max}× ${RECHARGE_LABEL[f.uses.recharge]}`}
                    </span>
                  </summary>
                  {f.plain && <p className="text-sm">{f.plain}</p>}
                  <RichText text={f.text} className="mt-1 text-sm text-ink-muted" />
                </details>
              </li>
            ))}
            {sheet.feats.map((f) => (
              <li key={`talento:${f.feat.id}:${f.source}`}>
                <details>
                  <summary className="min-h-9 cursor-pointer">
                    <span className="font-semibold">{f.feat.name}</span>{' '}
                    <span className="text-xs text-ink-muted">Talento · {f.source}</span>
                  </summary>
                  <p className="text-sm">{f.feat.plain}</p>
                </details>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-1 text-sm">
          <h4 className="text-lg font-semibold">Quem é {character.name || 'o personagem'}</h4>
          {character.details.pronouns && <p>Pronomes: {character.details.pronouns}</p>}
          {alignment && <p>Alinhamento: {alignment.name}</p>}
          {character.details.appearance && <p>Aparência: {character.details.appearance}</p>}
          {character.details.personality.traits && (
            <p>Traço: {character.details.personality.traits}</p>
          )}
          {character.details.personality.ideals && (
            <p>Ideal: {character.details.personality.ideals}</p>
          )}
          {character.details.personality.bonds && (
            <p>Vínculo: {character.details.personality.bonds}</p>
          )}
          {character.details.personality.flaws && (
            <p>Defeito: {character.details.personality.flaws}</p>
          )}
          {character.details.backstory && <p>História: {character.details.backstory}</p>}
          {character.details.hook && <p>Gancho: {character.details.hook}</p>}
        </Card>
      </div>
    </div>
  );
}
