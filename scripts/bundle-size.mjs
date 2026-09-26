/**
 * npm run size — mede o que o navegador baixa para abrir a página inicial
 * (JS de entrada + pedaços pré-carregados + página Início + CSS), com gzip.
 * Falha se passar do limite do plano (150 kB).
 */
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const LIMIT_KB = 150;
const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'));

const files = new Set();
const visit = (key) => {
  const entry = manifest[key];
  if (!entry || files.has(entry.file)) return;
  files.add(entry.file);
  for (const css of entry.css ?? []) files.add(css);
  for (const imp of entry.imports ?? []) visit(imp);
};
visit('index.html');
visit('src/routes/HomePage.tsx');

let total = 0;
const rows = [...files].map((file) => {
  const size = gzipSync(readFileSync(`dist/${file}`)).length / 1024;
  total += size;
  return [file, size];
});
rows.sort((a, b) => b[1] - a[1]);
for (const [file, size] of rows) console.log(`${size.toFixed(1).padStart(7)} kB  ${file}`);
console.log(`${total.toFixed(1).padStart(7)} kB  TOTAL (limite ${LIMIT_KB} kB)`);
if (total > LIMIT_KB) {
  console.error(`✗ Bundle inicial passou do limite: ${total.toFixed(1)} kB > ${LIMIT_KB} kB`);
  process.exit(1);
}
console.log('✓ Bundle inicial dentro do limite');
