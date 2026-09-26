import { Copy, Share2 } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { encodeShare, siteUrl } from '@/lib/share';
import { emptyCharacter, type Character } from '@/model/character';

/** Link só leitura da ficha, com copiar e o compartilhamento do celular. */
export function ShareLink({ character }: { character: Character }) {
  const id = useId();
  const [status, setStatus] = useState('');
  // O estado de jogo (PV atuais, condições) não vai no link: quem recebe vê a ficha limpa.
  const url = useMemo(() => {
    const clean = { ...character, play: emptyCharacter(character.id, character.createdAt).play };
    return siteUrl(`/ver#d=${encodeShare(clean)}`);
  }, [character]);
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className="space-y-3 pb-2">
      <label htmlFor={id} className="block text-sm font-semibold">
        Link da ficha
      </label>
      <input
        id={id}
        readOnly
        value={url}
        onFocus={(e) => e.target.select()}
        className="min-h-11 w-full rounded-lg border border-line-strong bg-bg px-3 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url);
              setStatus('Link copiado!');
            } catch {
              setStatus('Não deu para copiar: selecione o link acima e copie à mão.');
            }
          }}
        >
          <Copy aria-hidden className="size-4" /> Copiar link
        </Button>
        {canShare && (
          <Button
            variant="secundario"
            onClick={() =>
              void navigator
                .share({ title: character.name || 'Ficha de personagem', url })
                .catch(() => undefined)
            }
          >
            <Share2 aria-hidden className="size-4" /> Enviar…
          </Button>
        )}
      </div>
      <p role="status" className="text-sm font-semibold text-forest">
        {status}
      </p>
      <p className="text-sm text-ink-muted">
        A ficha vai dentro do próprio link (não fica guardada em servidor nenhum). O estado de jogo,
        como PV atuais e condições, não é enviado.
      </p>
    </div>
  );
}
