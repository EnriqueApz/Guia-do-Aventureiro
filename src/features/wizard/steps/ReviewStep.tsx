import { CircleAlert, CircleCheck, Copy, PartyPopper } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { buttonClasses } from '@/components/ui/buttonClasses';
import { Card } from '@/components/ui/Card';
import { RichText } from '@/components/ui/RichText';
import { formatMeters } from '@/rules/encumbrance';
import { cn } from '@/lib/cn';
import { ALIGNMENTS } from '../detailsData';
import { ACTION_LABEL, damageName, formatBonus, itemName, joinPt, RECHARGE_LABEL } from '../labels';
import { LiveSheet } from '../LiveSheet';
import { GlossaryTerm } from '../parts/GlossaryTerm';
import { Section } from '../parts/Section';
import { circleLabel } from '../spellLabels';
import { StepHeader } from '../parts/StepHeader';
import { STEPS } from '../steps';
import { characterSummary } from '../summary';
import type { StepProps } from '../WizardPage';

export default function ReviewStep({ wizard, goTo }: StepProps) {
  const { character, sheet, issues } = wizard;
  const errors = issues.filter((i) => i.severity === 'erro');
  const summary = characterSummary(character, sheet, content);
  const [copied, setCopied] = useState(false);
  const ready = errors.length === 0;
  const checklist = STEPS.filter((s) => s.issueStep);
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

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="space-y-10">
      <StepHeader eyebrow="Etapa 9" title="Revisão">
        <p>Confira a ficha completa. Se algo estiver faltando, o checklist leva direto à etapa.</p>
      </StepHeader>

      <Section title="Está tudo pronto?">
        {ready ? (
          <p className="flex items-center gap-2 rounded-lg border border-forest/30 bg-forest/5 px-4 py-3 text-lg font-semibold text-forest">
            <PartyPopper aria-hidden className="size-6 shrink-0" />
            Ficha completa e dentro das regras. Boa aventura!
          </p>
        ) : (
          <p className="flex items-center gap-2 font-semibold">
            <CircleAlert aria-hidden className="size-5 text-gold" />
            Ainda {errors.length === 1 ? 'falta 1 coisa' : `faltam ${errors.length} coisas`}.
          </p>
        )}
        <ul className="divide-y divide-line rounded-card border border-line bg-surface">
          {checklist.map((s) => {
            const list = issues.filter((i) => i.step === s.issueStep);
            const errs = list.filter((i) => i.severity === 'erro');
            const ok = errs.length === 0;
            return (
              <li key={s.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                {ok ? (
                  <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-forest" />
                ) : (
                  <CircleAlert aria-hidden className="mt-0.5 size-5 shrink-0 text-gold" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {s.label}
                    <span className="sr-only">{ok ? ': pronto' : ': pendente'}</span>
                  </p>
                  {list.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm text-ink-muted">
                      {list.map((i) => (
                        <li key={i.message} className={cn(i.severity === 'erro' && 'text-ink')}>
                          {i.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {!ok && (
                  <Button variant="secundario" onClick={() => goTo(s.id)}>
                    Resolver
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title="Resumo">
        <Card className="space-y-3">
          <p className="text-lg leading-relaxed" data-testid="resumo">
            {summary}
          </p>
          <Button variant="secundario" onClick={() => void copy()}>
            <Copy aria-hidden className="size-4" /> {copied ? 'Copiado!' : 'Copiar resumo'}
          </Button>
        </Card>
      </Section>

      <Section title="Ficha completa">
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
      </Section>

      <div className="flex flex-wrap gap-3">
        <Link to="/personagens" className={buttonClasses('primario', 'lg')}>
          {ready ? 'Concluir e ver meus personagens' : 'Salvar e continuar depois'}
        </Link>
      </div>
    </div>
  );
}
