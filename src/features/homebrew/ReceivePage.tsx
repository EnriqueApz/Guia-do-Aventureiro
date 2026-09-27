import { Check, FileUp, Smartphone } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { mergePacks, packSize, type HomebrewPack } from '@/content/homebrew';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { siteUrl } from '@/lib/share';
import { PageHeader } from '@/routes/PageHeader';
import { useHomebrew } from '@/state/homebrew';
import { readPackFile } from './readPack';

type Status =
  | { kind: 'idle' }
  | { kind: 'reading' }
  | { kind: 'ok'; pack: HomebrewPack }
  | { kind: 'error'; errors: string[] };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Página simples para o jogador instalar, no celular, o pacote que o Mestre mandou. */
export default function ReceivePage() {
  usePageTitle('Receber pacote do Mestre');
  const current = useHomebrew((s) => s.pack);
  const replace = useHomebrew((s) => s.replace);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setStatus({ kind: 'reading' });
    const read = await readPackFile(file);
    if (fileRef.current) fileRef.current.value = '';
    if (read.errors) {
      setStatus({ kind: 'error', errors: read.errors });
      return;
    }
    replace(mergePacks(current, read.pack));
    setStatus({ kind: 'ok', pack: read.pack });
  };

  return (
    <>
      <PageHeader eyebrow="Para jogadores" title="Receber pacote do Mestre">
        <p>
          O Mestre mandou um arquivo com subclasses e antecedentes? Instale aqui, uma vez só, e eles
          aparecem no assistente.
        </p>
      </PageHeader>

      {status.kind === 'ok' ? (
        <Card className="space-y-4 border-forest/50" role="status">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-forest">
            <Check aria-hidden className="size-7" /> Pacote instalado
          </h2>
          <p>
            {status.pack.name ? `“${status.pack.name}”: ` : ''}
            {[
              status.pack.subclasses.length &&
                plural(status.pack.subclasses.length, 'subclasse', 'subclasses'),
              status.pack.backgrounds.length &&
                plural(status.pack.backgrounds.length, 'antecedente', 'antecedentes'),
              status.pack.species.length &&
                plural(status.pack.species.length, 'espécie', 'espécies'),
              status.pack.feats.length && plural(status.pack.feats.length, 'talento', 'talentos'),
            ]
              .filter(Boolean)
              .join(', ')}
            .
          </p>
          <Button size="lg" onClick={() => window.location.assign(siteUrl('/'))}>
            Começar a usar
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="space-y-4">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <Smartphone aria-hidden className="size-6 text-gold" /> Passo a passo
            </h2>
            <ol className="list-decimal space-y-3 pl-6">
              <li>
                <strong>Salve o arquivo.</strong> No WhatsApp, toque no arquivo que o Mestre mandou.
                <ul className="mt-1 list-disc pl-5 text-ink-muted">
                  <li>Android: ele vai para a pasta Downloads.</li>
                  <li>
                    iPhone: toque em Compartilhar (quadrado com seta) e depois em{' '}
                    <strong>Salvar em Arquivos</strong>.
                  </li>
                </ul>
              </li>
              <li>
                <strong>Volte aqui</strong> e toque no botão abaixo.
              </li>
              <li>
                <strong>Escolha o arquivo</strong> (Downloads no Android, Arquivos no iPhone). O
                nome costuma terminar em <code>.json</code>.
              </li>
            </ol>
          </Card>

          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={status.kind === 'reading'}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp aria-hidden className="size-6" />
            {status.kind === 'reading' ? 'Instalando…' : 'Escolher o arquivo do pacote'}
          </Button>
          {/* Sem "accept": no iPhone, restringir o tipo às vezes deixa o arquivo cinza. */}
          <input
            ref={fileRef}
            type="file"
            className="sr-only"
            aria-label="Arquivo do pacote do Mestre"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />

          <div aria-live="polite">
            {status.kind === 'error' && (
              <Card className="space-y-2 border-danger/40" role="alert">
                <p className="font-semibold text-danger">Não deu para instalar este arquivo.</p>
                <ul className="list-disc pl-5 text-sm">
                  {status.errors.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
                <p className="text-sm text-ink-muted">
                  Confira se escolheu o arquivo certo, ou peça ao Mestre para mandar de novo.
                </p>
              </Card>
            )}
          </div>

          {packSize(current) > 0 && (
            <p className="text-sm text-ink-muted">
              Este aparelho já tem {plural(packSize(current), 'opção', 'opções')} de conteúdo
              próprio. O pacote novo se soma a elas (e atualiza as que tiverem o mesmo nome
              interno). Veja tudo em{' '}
              <Link
                to="/conteudo"
                className="text-ink underline decoration-seal underline-offset-2"
              >
                Conteúdo próprio
              </Link>
              .
            </p>
          )}
        </div>
      )}
    </>
  );
}
