import { Download, Pencil, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { usePageTitle } from '@/app/usePageTitle';
import { homebrewAtLoad, srdContent } from '@/content';
import { packSize, type HomebrewKind } from '@/content/homebrew';
import type { Stub } from '@/content/schema';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { downloadText } from '@/lib/download';
import { PageHeader } from '@/routes/PageHeader';
import { useHomebrew } from '@/state/homebrew';
import { BackgroundEditor, SpeciesEditor, SubclassEditor } from './Editors';
import { readPackFile } from './readPack';

type Editing =
  | { kind: 'subclasses'; id?: string; preset?: { id: string; name: string; classId?: string } }
  | { kind: 'backgrounds'; id?: string; preset?: { id: string; name: string } }
  | { kind: 'species'; id?: string; preset?: { id: string; name: string } };

const KIND_LABEL: Record<Exclude<HomebrewKind, 'feats'>, string> = {
  species: 'Espécie',
  subclasses: 'Subclasse',
  backgrounds: 'Antecedente',
};
const STUB_KIND: Record<Stub['type'], Editing['kind'] | undefined> = {
  especie: 'species',
  subclasse: 'subclasses',
  antecedente: 'backgrounds',
  classe: undefined,
  talento: undefined,
};

export default function ContentPage() {
  usePageTitle('Conteúdo próprio');
  const { pack, remove, replace } = useHomebrew();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string[] } | null>(null);
  const dirty = JSON.stringify(pack) !== JSON.stringify(homebrewAtLoad);
  const done = new Set([...pack.species, ...pack.subclasses, ...pack.backgrounds].map((x) => x.id));
  const stubs = srdContent.stubs.filter((s) => STUB_KIND[s.type] && !done.has(s.id));
  const className = new Map(srdContent.classes.map((c) => [c.id, c.name]));

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const read = await readPackFile(file);
    if (read.errors) {
      setMessage({ ok: false, text: read.errors });
      return;
    }
    const next = read.pack;
    replace(next);
    setMessage({ ok: true, text: [`Pacote importado com ${packSize(next)} opções.`] });
    if (fileRef.current) fileRef.current.value = '';
  };

  const entries: { kind: Editing['kind']; id: string; name: string; detail: string }[] = [
    ...pack.species.map((x) => ({
      kind: 'species' as const,
      id: x.id,
      name: x.name,
      detail: 'Espécie',
    })),
    ...pack.subclasses.map((x) => ({
      kind: 'subclasses' as const,
      id: x.id,
      name: x.name,
      detail: `Subclasse de ${className.get(x.classId) ?? x.classId}`,
    })),
    ...pack.backgrounds.map((x) => ({
      kind: 'backgrounds' as const,
      id: x.id,
      name: x.name,
      detail: 'Antecedente',
    })),
  ];

  return (
    <>
      <PageHeader eyebrow="Do grupo" title="Conteúdo próprio">
        <p>
          O SRD não traz tudo o que está nos livros. Aqui o grupo completa o que falta com as
          próprias anotações, e isso aparece no assistente como qualquer outra opção.
        </p>
      </PageHeader>

      <Card className="mb-6 space-y-2 border-gold-soft text-sm">
        <p>
          <strong>Fica só neste navegador.</strong> Para passar para outra pessoa, exporte o pacote
          e mande o arquivo. Escreva com as suas palavras: não copie o texto dos livros.
        </p>
        <p>
          Jogador recebendo um pacote do Mestre?{' '}
          <Link
            to="/receber"
            className="font-semibold text-ink underline decoration-seal underline-offset-2"
          >
            Use a página Receber pacote
          </Link>
          , que é mais simples no celular.
        </p>
        <p className="text-ink-muted">
          O conteúdo próprio não calcula efeitos sozinho (só visão no escuro, perícias e atributos):
          o resto fica como texto na ficha.
        </p>
      </Card>

      {dirty && (
        <Card
          className="mb-6 flex flex-wrap items-center justify-between gap-3 border-seal/40 py-3"
          role="status"
        >
          <p className="font-semibold">Há mudanças que ainda não valem no assistente.</p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw aria-hidden className="size-4" /> Aplicar mudanças
          </Button>
        </Card>
      )}

      <div className="mb-6 flex flex-wrap gap-2">
        <Button onClick={() => setEditing({ kind: 'subclasses' })}>
          <Plus aria-hidden className="size-4" /> Nova subclasse
        </Button>
        <Button variant="secundario" onClick={() => setEditing({ kind: 'backgrounds' })}>
          <Plus aria-hidden className="size-4" /> Novo antecedente
        </Button>
        <Button variant="secundario" onClick={() => setEditing({ kind: 'species' })}>
          <Plus aria-hidden className="size-4" /> Nova espécie
        </Button>
        <Button variant="secundario" onClick={() => fileRef.current?.click()}>
          <Upload aria-hidden className="size-4" /> Importar pacote
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          aria-label="Pacote de conteúdo para importar"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        {packSize(pack) > 0 && (
          <Button
            variant="secundario"
            onClick={() =>
              downloadText(
                `conteudo-proprio-${new Date().toISOString().slice(0, 10)}.json`,
                JSON.stringify(pack, null, 2),
              )
            }
          >
            <Download aria-hidden className="size-4" /> Exportar pacote
          </Button>
        )}
      </div>

      <div aria-live="polite">
        {message && (
          <Card className={`mb-6 py-3 ${message.ok ? 'border-forest/40' : 'border-danger/40'}`}>
            <ul className={`list-disc pl-5 ${message.ok ? 'text-forest' : 'text-danger'}`}>
              {message.text.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <section aria-labelledby="meu" className="mb-10 space-y-3">
        <h2 id="meu" className="text-2xl font-semibold">
          Meu conteúdo
        </h2>
        {entries.length === 0 ? (
          <p className="text-ink-muted">
            Nada por aqui ainda. Comece completando uma opção abaixo.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {entries.map((e) => (
              <li key={`${e.kind}:${e.id}`}>
                <Card className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-lg font-semibold">{e.name}</p>
                    <p className="text-sm text-ink-muted">{e.detail}</p>
                  </div>
                  <Button
                    variant="fantasma"
                    size="icone"
                    aria-label={`Editar ${e.name}`}
                    onClick={() => setEditing({ kind: e.kind, id: e.id })}
                  >
                    <Pencil aria-hidden className="size-5" />
                  </Button>
                  <Button
                    variant="fantasma"
                    size="icone"
                    aria-label={`Excluir ${e.name}`}
                    onClick={() => remove(e.kind, e.id)}
                  >
                    <Trash2 aria-hidden className="size-5" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="faltam" className="space-y-3">
        <h2 id="faltam" className="text-2xl font-semibold">
          Opções dos livros para completar
        </h2>
        <p className="text-ink-muted">
          Estas aparecem no assistente como “incompletas”. Complete com as anotações do grupo para
          poder escolher.
        </p>
        {(['especie', 'antecedente', 'subclasse'] as const).map((type) => {
          const list = stubs.filter((s) => s.type === type);
          if (!list.length) return null;
          return (
            <details
              key={type}
              className="rounded-card border border-line bg-surface p-4"
              open={type !== 'subclasse'}
            >
              <summary className="min-h-11 cursor-pointer font-display text-lg font-semibold">
                {type === 'especie'
                  ? 'Espécies'
                  : type === 'antecedente'
                    ? 'Antecedentes'
                    : 'Subclasses'}{' '}
                ({list.length})
              </summary>
              <ul className="mt-2 divide-y divide-line">
                {list.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center gap-2 py-2">
                    <span className="min-w-0 flex-1">
                      {s.name}
                      <span className="block text-xs text-ink-muted">
                        {s.parentId && `${className.get(s.parentId)} · `}
                        {s.ref}
                      </span>
                    </span>
                    <Button
                      variant="secundario"
                      onClick={() => {
                        const kind = STUB_KIND[s.type];
                        if (!kind) return;
                        setEditing({
                          kind,
                          preset: {
                            id: s.id,
                            name: s.name,
                            ...(s.parentId && { classId: s.parentId }),
                          },
                        } as Editing);
                      }}
                      aria-label={`Completar ${s.name}`}
                    >
                      Completar
                    </Button>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </section>

      <Drawer
        open={!!editing}
        onOpenChange={(o) => !o && setEditing(null)}
        title={
          editing
            ? `${editing.id ? 'Editar' : 'Nova opção:'} ${KIND_LABEL[editing.kind].toLowerCase()}`
            : ''
        }
      >
        {editing?.kind === 'subclasses' && (
          <SubclassEditor
            {...(editing.id && { initial: pack.subclasses.find((x) => x.id === editing.id) })}
            {...(editing.preset && { preset: editing.preset })}
            onDone={() => setEditing(null)}
          />
        )}
        {editing?.kind === 'backgrounds' && (
          <BackgroundEditor
            {...(editing.id && { initial: pack.backgrounds.find((x) => x.id === editing.id) })}
            {...(editing.preset && { preset: editing.preset })}
            onDone={() => setEditing(null)}
          />
        )}
        {editing?.kind === 'species' && (
          <SpeciesEditor
            {...(editing.id && { initial: pack.species.find((x) => x.id === editing.id) })}
            {...(editing.preset && { preset: editing.preset })}
            onDone={() => setEditing(null)}
          />
        )}
      </Drawer>
    </>
  );
}
