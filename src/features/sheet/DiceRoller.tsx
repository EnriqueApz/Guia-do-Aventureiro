import { Dices, Trash2 } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Segmented } from '@/components/ui/Segmented';
import { cn } from '@/lib/cn';
import { useRolls, type RollEntry } from '@/state/rolls';
import { MODE_OPTIONS } from './rollModes';

const QUICK = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
const timeFormat = new Intl.DateTimeFormat('pt-BR', { timeStyle: 'short' });

export function RollResultLine({ entry, big }: { entry: RollEntry; big?: boolean }) {
  return (
    <p className={cn('flex flex-wrap items-baseline gap-x-2', big && 'text-lg')}>
      <span className="font-semibold">{entry.label}:</span>
      <span className={cn('num font-semibold', big && 'text-3xl')}>{entry.total}</span>
      <span className="num text-sm text-ink-muted">
        {entry.expr}
        {entry.dice.length > 0 && ` · ${entry.dice.join(', ')}`}
        {entry.mode !== 'normal' && ` · ${entry.mode}`}
      </span>
      {entry.natural20 && <span className="text-sm font-semibold text-forest">20 natural!</span>}
      {entry.natural1 && <span className="text-sm font-semibold text-danger">1 natural</span>}
    </p>
  );
}

/** Rolador livre: dados rápidos, expressão e histórico. */
export function DiceRoller() {
  const exprId = useId();
  const { mode, setMode, history, check, rollExpr, clear } = useRolls();
  const [expr, setExpr] = useState('');
  const [error, setError] = useState('');

  const rollText = (text: string) => {
    try {
      if (/^d20$/i.test(text.trim())) check('d20', 0);
      else rollExpr(text.trim(), text);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="space-y-4">
      <Segmented legend="Próximo d20" options={MODE_OPTIONS} value={mode} onChange={setMode} />
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <Button key={q} variant="secundario" onClick={() => rollText(q)}>
            {q}
          </Button>
        ))}
      </div>
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (expr.trim()) rollText(expr);
        }}
      >
        <div className="min-w-0 flex-1 basis-40">
          <label htmlFor={exprId} className="mb-1 block text-sm font-semibold">
            Outra rolagem (ex.: 2d6+3)
          </label>
          <input
            id={exprId}
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            inputMode="text"
            autoComplete="off"
            className="num min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3"
          />
        </div>
        <Button type="submit">
          <Dices aria-hidden className="size-5" /> Rolar
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div aria-live="polite" className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="font-display font-semibold">Histórico</p>
          {history.length > 0 && (
            <Button variant="fantasma" onClick={clear}>
              <Trash2 aria-hidden className="size-4" /> Limpar
            </Button>
          )}
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">Nenhuma rolagem ainda.</p>
        ) : (
          <ol className="divide-y divide-line rounded-lg border border-line bg-surface">
            {history.map((r) => (
              <li key={r.id} className="flex items-start gap-2 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <RollResultLine entry={r} />
                </div>
                <time className="num shrink-0 text-xs text-ink-muted" dateTime={r.at}>
                  {timeFormat.format(new Date(r.at))}
                </time>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
