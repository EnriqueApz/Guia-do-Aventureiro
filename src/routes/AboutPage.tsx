import { Card } from '@/components/ui/Card';
import { usePageTitle } from '@/app/usePageTitle';
import { PageHeader } from './PageHeader';

const link = 'underline underline-offset-2 hover:text-gold';

export default function AboutPage() {
  usePageTitle('Créditos e licenças');
  return (
    <>
      <PageHeader eyebrow="Sobre" title="Créditos e licenças">
        <p>
          O Guia do Aventureiro é um projeto de fãs, feito para ajudar grupos iniciantes. Não é um
          produto oficial.
        </p>
      </PageHeader>

      <div className="prose-guia space-y-6">
        <Card>
          <h2 className="text-2xl font-semibold">Conteúdo de regras (SRD 5.2)</h2>
          <p className="mt-3">
            Este trabalho inclui material do <em>System Reference Document 5.2</em> (“SRD 5.2”) da
            Wizards of the Coast LLC, disponível em{' '}
            <a className={link} href="https://www.dndbeyond.com/srd">
              dndbeyond.com/srd
            </a>
            . O SRD 5.2 está licenciado sob a licença{' '}
            <a className={link} href="https://creativecommons.org/licenses/by/4.0/legalcode.pt">
              Creative Commons Atribuição 4.0 Internacional
            </a>
            .
          </p>
          <p className="mt-3">
            O texto foi <strong>traduzido para o português e adaptado</strong> por este projeto, com
            explicações simplificadas próprias. Este site não é oficial nem endossado pela Wizards
            of the Coast.
          </p>
          <p lang="en" className="mt-3 text-sm text-ink-muted">
            This work includes material from the System Reference Document 5.2 (“SRD 5.2”) by
            Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2 is
            licensed under the Creative Commons Attribution 4.0 International License, available at
            https://creativecommons.org/licenses/by/4.0/legalcode. Translated into Brazilian
            Portuguese and adapted.
          </p>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold">Conteúdo dos seus livros</h2>
          <p className="mt-3">
            Opções que não estão no SRD (como a maioria das subclasses e antecedentes do Livro do
            Jogador) aparecem aqui só pelo nome. Quem tiver o livro pode preencher em “Conteúdo
            próprio”. Esse conteúdo fica apenas no seu navegador e nunca é publicado pelo site.
          </p>
        </Card>

        <Card>
          <h2 className="text-2xl font-semibold">Código</h2>
          <p className="mt-3">
            O código-fonte está sob a licença MIT. Dungeons &amp; Dragons e D&amp;D são marcas da
            Wizards of the Coast LLC.
          </p>
        </Card>
      </div>
    </>
  );
}
