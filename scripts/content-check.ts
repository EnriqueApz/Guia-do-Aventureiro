/**
 * npm run content:check
 * Valida todo o conteúdo em src/content (esquema, ids, referências e regras de
 * consistência). Sai com código 1 se houver erros.
 */
import { rawContent } from '../src/content/index.ts';
import { validateContent } from '../src/content/validate.ts';

const { errors, warnings } = validateContent(rawContent);

for (const w of warnings) console.warn(`⚠ ${w}`);
for (const e of errors) console.error(`✗ ${e}`);

const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
console.log(
  `\n${errors.length ? '✗' : '✓'} conteúdo: ${count(errors.length, 'erro', 'erros')}, ${count(warnings.length, 'aviso', 'avisos')}` +
    ` · ${rawContent.species.length} espécies, ${rawContent.classes.length} classes, ${rawContent.subclasses.length} subclasses,` +
    ` ${rawContent.backgrounds.length} antecedentes, ${rawContent.feats.length} talentos, ${rawContent.items.length} itens,` +
    ` ${rawContent.spells.length} magias,` +
    ` ${rawContent.glossary.length} termos no glossário`,
);
process.exit(errors.length ? 1 : 0);
