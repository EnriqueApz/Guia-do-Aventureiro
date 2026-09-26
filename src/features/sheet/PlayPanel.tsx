import {
  BedDouble,
  Dices,
  Heart,
  HeartCrack,
  Minus,
  Moon,
  Plus,
  Shield,
  Skull,
  Sparkles,
  Sun,
} from 'lucide-react';
import { useId, useState } from 'react';
import { content } from '@/content';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Segmented } from '@/components/ui/Segmented';
import { Switch } from '@/components/ui/Switch';
import { ABILITIES } from '@/content/schema';
import type { Character, PlayState } from '@/model/character';
import {
  editPlay,
  isDead,
  isStable,
  MAX_EXHAUSTION,
  setDeathSaves,
  setExhaustion,
  setHeroicInspiration,
  setResourceUsed,
  setSlotsUsed,
  toggleCondition,
} from '@/model/play';
import type { Sheet } from '@/rules/derive';
import { formatMeters } from '@/rules/encumbrance';
import {
  applyHealing,
  currentHp,
  deathSave,
  gainTempHp,
  longRest,
  shortRest,
  takeDamage,
  type DamageOutcome,
} from '@/rules/rest';
import { cn } from '@/lib/cn';
import { useRolls } from '@/state/rolls';
import {
  ABILITY_LABEL,
  damageName,
  formatBonus,
  RECHARGE_LABEL,
  skillName,
} from '@/features/wizard/labels';
import { GlossaryTerm } from '@/features/wizard/parts/GlossaryTerm';
import { RollResultLine } from './DiceRoller';
import { MODE_OPTIONS } from './rollModes';

type Edit = (fn: (c: Character) => Character) => void;

interface PlayPanelProps {
  character: Character;
  sheet: Sheet;
  edit: Edit;
}

const DAMAGE_TEXT: Record<DamageOutcome, string> = {
  ok: '',
  caiu: 'Caiu a 0 PV e está Inconsciente. No início de cada turno, role uma salvaguarda contra a morte.',
  falha: 'Dano com 0 PV conta como falha na salvaguarda contra a morte.',
  morto: 'O dano foi grande demais: o personagem morreu. Só uma magia poderosa traz de volta.',
};

export function PlayPanel({ character, sheet, edit }: PlayPanelProps) {
  const play = character.play;
  const setPlay = (fn: (p: PlayState) => PlayState) => edit((c) => editPlay(c, fn));
  const { mode, setMode, history, check, rollExpr } = useRolls();
  const last = history[0];

  return (
    <div className="space-y-6">
      <div className="sticky top-16 z-10 -mx-4 space-y-2 border-b border-line bg-bg/95 px-4 py-2 backdrop-blur-md">
        <Segmented legend="Próximo d20" options={MODE_OPTIONS} value={mode} onChange={setMode} />
        <div aria-live="polite" className="min-h-8" data-testid="ultima-rolagem">
          {last ? (
            <RollResultLine entry={last} big />
          ) : (
            <p className="text-sm text-ink-muted">Toque num bônus para rolar.</p>
          )}
        </div>
      </div>

      <HitPoints character={character} sheet={sheet} setPlay={setPlay} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox
          label={<GlossaryTerm id="ca">CA</GlossaryTerm>}
          value={sheet.ac.value}
          icon={<Shield aria-hidden className="size-4" />}
        />
        <RollBox
          label={<GlossaryTerm id="iniciativa">Iniciativa</GlossaryTerm>}
          bonus={sheet.initiative.value - sheet.d20Penalty}
          onRoll={() => check('Iniciativa', sheet.initiative.value - sheet.d20Penalty)}
          name="Iniciativa"
        />
        <StatBox
          label={<GlossaryTerm id="deslocamento">Deslocamento</GlossaryTerm>}
          value={formatMeters(sheet.speed.walk)}
        />
        <StatBox
          label={<GlossaryTerm id="proficiencia">Proficiência</GlossaryTerm>}
          value={formatBonus(sheet.proficiencyBonus)}
        />
      </div>
      {sheet.d20Penalty > 0 && (
        <p className="rounded-lg border border-gold/50 bg-gold-soft/15 px-3 py-2 text-sm">
          Exaustão {play.exhaustion}: −{sheet.d20Penalty} em todos os Testes de D20 (já descontado
          nos botões) e −{formatMeters(play.exhaustion * 5)} de deslocamento.
        </p>
      )}

      <Card className="space-y-3">
        <h2 className="text-xl font-semibold">
          <GlossaryTerm id="salvaguarda">Salvaguardas</GlossaryTerm>
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ABILITIES.map((a) => {
            const bonus = sheet.saves[a].bonus - sheet.d20Penalty;
            return (
              <RollButton
                key={a}
                label={ABILITY_LABEL[a].name}
                bonus={bonus}
                strong={sheet.saves[a].proficient}
                onRoll={() => check(`Salvaguarda de ${ABILITY_LABEL[a].name}`, bonus)}
              />
            );
          })}
        </div>
        <h2 className="pt-2 text-xl font-semibold">
          <GlossaryTerm id="pericia">Perícias</GlossaryTerm>
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.values(sheet.skills).map((s) => {
            const bonus = s.bonus - sheet.d20Penalty;
            return (
              <RollButton
                key={s.id}
                label={skillName(s.id)}
                hint={ABILITY_LABEL[s.ability].abbr}
                bonus={bonus}
                strong={s.proficient}
                onRoll={() => check(skillName(s.id), bonus)}
              />
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ABILITIES.map((a) => {
            const bonus = sheet.abilities[a].modifier - sheet.d20Penalty;
            return (
              <RollButton
                key={a}
                label={`Teste de ${ABILITY_LABEL[a].abbr}`}
                bonus={bonus}
                onRoll={() => check(`Teste de ${ABILITY_LABEL[a].name}`, bonus)}
              />
            );
          })}
        </div>
      </Card>

      <Card className="space-y-2">
        <h2 className="text-xl font-semibold">Ataques</h2>
        {sheet.extraAttacks > 1 && (
          <p className="text-sm text-ink-muted">A ação Atacar dá {sheet.extraAttacks} ataques.</p>
        )}
        <ul className="divide-y divide-line">
          {sheet.attacks.map((a) => {
            const hit = a.attackBonus - sheet.d20Penalty;
            return (
              <li key={a.id} className="flex flex-wrap items-center gap-2 py-2">
                <span className="min-w-0 flex-1 font-semibold">{a.name}</span>
                <Button
                  variant="secundario"
                  onClick={() => check(`${a.name}: ataque`, hit)}
                  aria-label={`Rolar ataque com ${a.name}`}
                >
                  <Dices aria-hidden className="size-4" />
                  <span className="num">{formatBonus(hit)}</span>
                </Button>
                <Button
                  variant="secundario"
                  onClick={() =>
                    rollExpr(`${a.name}: dano ${damageName(a.damageType).toLowerCase()}`, a.damage)
                  }
                  aria-label={`Rolar dano de ${a.name}`}
                >
                  <span className="num">{a.damage}</span>
                </Button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Resources character={character} sheet={sheet} setPlay={setPlay} />

      <Conditions play={play} setPlay={setPlay} />

      <Rests character={character} sheet={sheet} setPlay={setPlay} />
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gold-soft/60 bg-surface px-3 py-2 text-center">
      <p className="flex items-center justify-center gap-1 text-xs font-semibold tracking-widest text-gold uppercase">
        {icon}
        {label}
      </p>
      <p className="num text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RollBox({
  label,
  bonus,
  onRoll,
  name,
}: {
  label: React.ReactNode;
  bonus: number;
  onRoll: () => void;
  name: string;
}) {
  return (
    <div className="rounded-lg border border-gold-soft/60 bg-surface px-3 py-2 text-center">
      <p className="text-xs font-semibold tracking-widest text-gold uppercase">{label}</p>
      <button
        type="button"
        onClick={onRoll}
        aria-label={`Rolar ${name} (${formatBonus(bonus)})`}
        className="num inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-md px-2 text-2xl font-semibold hover:bg-sunken"
      >
        {formatBonus(bonus)} <Dices aria-hidden className="size-4 text-gold" />
      </button>
    </div>
  );
}

function RollButton({
  label,
  hint,
  bonus,
  strong,
  onRoll,
}: {
  label: string;
  hint?: string;
  bonus: number;
  strong?: boolean;
  onRoll: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRoll}
      aria-label={`Rolar ${label} (${formatBonus(bonus)})`}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-left text-sm hover:border-gold',
        strong ? 'border-seal/50 bg-seal/5 font-semibold' : 'border-line bg-surface',
      )}
    >
      <span className="min-w-0 flex-1">
        {label}
        {hint && <span className="ml-1 text-xs font-normal text-ink-muted">({hint})</span>}
      </span>
      <span className="num text-base font-semibold">{formatBonus(bonus)}</span>
    </button>
  );
}

function HitPoints({
  character,
  sheet,
  setPlay,
}: {
  character: Character;
  sheet: Sheet;
  setPlay: (fn: (p: PlayState) => PlayState) => void;
}) {
  const amountId = useId();
  const play = character.play;
  const [amount, setAmount] = useState('');
  const [critical, setCritical] = useState(false);
  const [message, setMessage] = useState('');
  const check = useRolls((s) => s.check);
  const hp = currentHp(play, sheet);
  const value = Math.max(0, Math.floor(Number(amount) || 0));
  const dead = isDead(play);
  const pct = Math.round((hp / sheet.hp.max) * 100);

  const damage = () => {
    const r = takeDamage(play, sheet, value, { critical });
    setPlay(() => r.play);
    setMessage(DAMAGE_TEXT[r.outcome]);
    setAmount('');
  };

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-semibold">
          <GlossaryTerm id="pv">Pontos de Vida</GlossaryTerm>
        </h2>
        <p className="num text-3xl font-semibold" aria-label={`PV: ${hp} de ${sheet.hp.max}`}>
          {hp}
          <span className="text-lg text-ink-muted"> / {sheet.hp.max}</span>
          {play.hpTemp > 0 && (
            <span className="ml-2 text-lg text-sky" aria-label={`${play.hpTemp} PV temporários`}>
              +{play.hpTemp}
            </span>
          )}
        </p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-sunken" aria-hidden>
        <div
          className={cn(
            'h-full rounded-full transition-[width]',
            pct > 50 ? 'bg-forest' : pct > 0 ? 'bg-gold' : 'bg-danger',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hp > 0 && hp <= sheet.hp.max / 2 && (
        <p className="text-sm text-ink-muted">
          <GlossaryTerm id="sangrando">Sangrando</GlossaryTerm>: com metade dos PV ou menos.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor={amountId} className="mb-1 block text-sm font-semibold">
            Quantidade
          </label>
          <input
            id={amountId}
            type="number"
            inputMode="numeric"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="num min-h-11 w-24 rounded-lg border border-line-strong bg-bg px-3 text-lg"
          />
        </div>
        <Button variant="perigo" disabled={!value || dead} onClick={damage}>
          <HeartCrack aria-hidden className="size-4" /> Dano
        </Button>
        <Button
          variant="secundario"
          disabled={!value || dead}
          onClick={() => {
            setPlay((p) => applyHealing(p, sheet, value));
            setMessage('');
            setAmount('');
          }}
        >
          <Heart aria-hidden className="size-4" /> Cura
        </Button>
        <Button
          variant="secundario"
          disabled={!value || dead}
          onClick={() => {
            setPlay((p) => gainTempHp(p, value));
            setAmount('');
          }}
        >
          <Plus aria-hidden className="size-4" /> PV temporários
        </Button>
      </div>
      {hp === 0 && !dead && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={critical}
            onChange={(e) => setCritical(e.target.checked)}
            className="size-5"
          />
          O golpe foi um Acerto Crítico (conta duas falhas)
        </label>
      )}
      {message && (
        <p role="status" className="rounded-lg bg-sunken/70 px-3 py-2 text-sm">
          {message}
        </p>
      )}

      {(hp === 0 || dead) && (
        <div className="space-y-2 rounded-lg border border-danger/40 bg-danger/5 p-3">
          <p className="flex items-center gap-2 font-display font-semibold">
            <Skull aria-hidden className="size-5 text-danger" />
            <GlossaryTerm id="salvaguarda-contra-a-morte">Salvaguardas contra a morte</GlossaryTerm>
          </p>
          <DeathTrack
            label="Sucessos"
            value={play.deathSaves.successes}
            onChange={(n) => setPlay((p) => setDeathSaves(p, n, p.deathSaves.failures))}
          />
          <DeathTrack
            label="Falhas"
            value={play.deathSaves.failures}
            danger
            onChange={(n) => setPlay((p) => setDeathSaves(p, p.deathSaves.successes, n))}
          />
          {dead ? (
            <p className="font-semibold text-danger">O personagem morreu.</p>
          ) : isStable(play) ? (
            <p className="font-semibold text-forest">
              Estável: não precisa mais rolar, mas continua com 0 PV.
            </p>
          ) : (
            <Button
              onClick={() => {
                const r = check('Salvaguarda contra a morte', 0);
                const res = deathSave(play, r.kept ?? r.total);
                setPlay(() => res.play);
                setMessage(
                  res.outcome === 'recuperou'
                    ? '20 natural! Volta com 1 PV e acorda.'
                    : res.outcome === 'estavel'
                      ? 'Três sucessos: estável.'
                      : res.outcome === 'morto'
                        ? 'Três falhas: o personagem morreu.'
                        : '',
                );
              }}
            >
              <Dices aria-hidden className="size-5" /> Rolar salvaguarda contra a morte
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

function DeathTrack({
  label,
  value,
  danger,
  onChange,
}: {
  label: string;
  value: number;
  danger?: boolean;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-20 text-sm">{label}</span>
      {[1, 2, 3].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${label}: ${n}`}
          aria-pressed={value >= n}
          onClick={() => onChange(value >= n ? n - 1 : n)}
          className={cn(
            'size-8 cursor-pointer rounded-full border-2',
            value >= n
              ? danger
                ? 'border-danger bg-danger'
                : 'border-forest bg-forest'
              : 'border-line-strong',
          )}
        />
      ))}
    </div>
  );
}

function Pips({
  label,
  total,
  used,
  onChange,
}: {
  label: string;
  total: number;
  used: number;
  onChange: (used: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-0 flex-1 text-sm font-semibold">{label}</span>
      <span className="num text-sm text-ink-muted">
        {total - used} de {total}
      </span>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => {
          const spent = i < used;
          return (
            <button
              key={i}
              type="button"
              aria-label={`${label}: ${spent ? 'recuperar' : 'gastar'} um`}
              aria-pressed={spent}
              onClick={() => onChange(spent ? used - 1 : used + 1)}
              className={cn(
                'size-7 cursor-pointer rounded-md border-2',
                spent ? 'border-line-strong bg-sunken' : 'border-seal bg-seal/80',
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function Resources({
  character,
  sheet,
  setPlay,
}: {
  character: Character;
  sheet: Sheet;
  setPlay: (fn: (p: PlayState) => PlayState) => void;
}) {
  const play = character.play;
  const slots = sheet.spellcasting?.slots ?? [];
  const withUses = sheet.features.filter((f) => f.uses && f.uses.max > 0);
  if (!slots.some((n) => n > 0) && !withUses.length) return null;
  return (
    <Card className="space-y-4">
      {slots.some((n) => n > 0) && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">
            <GlossaryTerm id="espaco-de-magia">Espaços de magia</GlossaryTerm>
            {sheet.spellcasting?.pact && (
              <span className="ml-2 text-sm font-normal text-ink-muted">
                (voltam no Descanso Curto)
              </span>
            )}
          </h2>
          {slots.map((total, i) =>
            total > 0 ? (
              <Pips
                key={i}
                label={`${i + 1}º círculo`}
                total={total}
                used={Math.min(total, play.slotsUsed[i] ?? 0)}
                onChange={(n) => setPlay((p) => setSlotsUsed(p, i, n, total))}
              />
            ) : null,
          )}
        </div>
      )}
      {withUses.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Recursos</h2>
          {withUses.map((f) => {
            const max = f.uses?.max ?? 0;
            return (
              <div key={f.id}>
                <Pips
                  label={f.name}
                  total={max}
                  used={Math.min(max, play.resourcesUsed[f.id] ?? 0)}
                  onChange={(n) => setPlay((p) => setResourceUsed(p, f.id, n, max))}
                />
                <p className="text-xs text-ink-muted">
                  {f.uses && RECHARGE_LABEL[f.uses.recharge]}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function Conditions({
  play,
  setPlay,
}: {
  play: PlayState;
  setPlay: (fn: (p: PlayState) => PlayState) => void;
}) {
  const active = content.conditions.filter((c) => play.conditions.includes(c.id));
  return (
    <Card className="space-y-3">
      <h2 className="text-xl font-semibold">
        <GlossaryTerm id="condicao">Condições</GlossaryTerm>
      </h2>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Condições ativas">
        {content.conditions
          .filter((c) => c.id !== 'exhaustion')
          .map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={play.conditions.includes(c.id)}
              onClick={() => setPlay((p) => toggleCondition(p, c.id))}
              className="min-h-9 cursor-pointer rounded-full border border-line-strong px-3 text-sm font-semibold aria-pressed:border-danger aria-pressed:bg-danger aria-pressed:text-on-seal"
            >
              {c.name}
            </button>
          ))}
      </div>
      {active.length > 0 && (
        <ul className="space-y-1 text-sm">
          {active.map((c) => (
            <li key={c.id}>
              <strong>{c.name}:</strong> {c.plain}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">Exaustão</span>
        <Button
          variant="secundario"
          size="icone"
          aria-label="Diminuir exaustão"
          disabled={play.exhaustion <= 0}
          onClick={() => setPlay((p) => setExhaustion(p, p.exhaustion - 1))}
        >
          <Minus aria-hidden className="size-4" />
        </Button>
        <span
          className="num w-10 text-center text-xl font-semibold"
          aria-label={`Exaustão ${play.exhaustion}`}
        >
          {play.exhaustion}
        </span>
        <Button
          variant="secundario"
          size="icone"
          aria-label="Aumentar exaustão"
          disabled={play.exhaustion >= MAX_EXHAUSTION}
          onClick={() => setPlay((p) => setExhaustion(p, p.exhaustion + 1))}
        >
          <Plus aria-hidden className="size-4" />
        </Button>
        <span className="text-sm text-ink-muted">
          Cada nível: −2 nos Testes de D20 e −1,5 m de deslocamento. No 6, o personagem morre.
        </span>
      </div>
      <Switch
        label="Inspiração Heroica"
        hint="Gaste para rolar de novo um dado qualquer."
        checked={play.heroicInspiration}
        onCheckedChange={(v) => setPlay((p) => setHeroicInspiration(p, v))}
      />
    </Card>
  );
}

function Rests({
  character,
  sheet,
  setPlay,
}: {
  character: Character;
  sheet: Sheet;
  setPlay: (fn: (p: PlayState) => PlayState) => void;
}) {
  const play = character.play;
  const rollExpr = useRolls((s) => s.rollExpr);
  const available = sheet.hitDice.total - play.hitDiceUsed;
  const [dice, setDice] = useState(0);
  const [confirmLong, setConfirmLong] = useState(false);
  const [message, setMessage] = useState('');
  const n = Math.min(dice, available);
  const con = sheet.abilities.con.modifier;

  return (
    <Card className="space-y-4">
      <h2 className="text-xl font-semibold">Descansos</h2>
      <p>
        <GlossaryTerm id="dados-de-vida">Dados de Vida</GlossaryTerm>:{' '}
        <strong className="num">
          {available} de {sheet.hitDice.total}
        </strong>{' '}
        (d{sheet.hitDice.die}
        {con ? ` ${formatBonus(con)} cada` : ''})
      </p>

      <div className="space-y-2 rounded-lg border border-line p-3">
        <p className="flex items-center gap-2 font-display font-semibold">
          <Sun aria-hidden className="size-5 text-gold" />
          <GlossaryTerm id="descanso-curto">Descanso Curto</GlossaryTerm> (1 hora)
        </p>
        <p className="text-sm text-ink-muted">
          Gaste Dados de Vida para curar e recupere o que volta no descanso curto.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secundario"
            size="icone"
            aria-label="Menos Dados de Vida"
            disabled={n <= 0}
            onClick={() => setDice(n - 1)}
          >
            <Minus aria-hidden className="size-4" />
          </Button>
          <span className="num w-24 text-center" aria-live="polite">
            {n} {n === 1 ? 'dado' : 'dados'}
          </span>
          <Button
            variant="secundario"
            size="icone"
            aria-label="Mais Dados de Vida"
            disabled={n >= available}
            onClick={() => setDice(n + 1)}
          >
            <Plus aria-hidden className="size-4" />
          </Button>
          <Button
            onClick={() => {
              const rolls = n
                ? rollExpr('Descanso curto: Dados de Vida', `${n}d${sheet.hitDice.die}`).dice
                : [];
              const before = currentHp(play, sheet);
              const next = shortRest(play, sheet, { hitDiceRolls: rolls });
              setPlay(() => next);
              setDice(0);
              setMessage(
                `Descanso curto feito${n ? `: +${currentHp(next, sheet) - before} PV` : ''}.`,
              );
            }}
          >
            <BedDouble aria-hidden className="size-5" /> Descansar
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-line p-3">
        <p className="flex items-center gap-2 font-display font-semibold">
          <Moon aria-hidden className="size-5 text-gold" />
          <GlossaryTerm id="descanso-longo">Descanso Longo</GlossaryTerm> (8 horas)
        </p>
        <p className="text-sm text-ink-muted">
          PV cheios, todos os Dados de Vida, espaços e recursos de volta, e 1 nível de Exaustão a
          menos.
        </p>
        {confirmLong ? (
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                setPlay((p) => longRest(p));
                setConfirmLong(false);
                setMessage('Descanso longo feito: tudo recuperado.');
              }}
            >
              <Sparkles aria-hidden className="size-5" /> Confirmar descanso longo
            </Button>
            <Button variant="fantasma" onClick={() => setConfirmLong(false)}>
              Cancelar
            </Button>
          </div>
        ) : (
          <Button variant="secundario" onClick={() => setConfirmLong(true)}>
            <Moon aria-hidden className="size-5" /> Descanso longo
          </Button>
        )}
      </div>
      {message && (
        <p role="status" className="font-semibold text-forest">
          {message}
        </p>
      )}
    </Card>
  );
}
