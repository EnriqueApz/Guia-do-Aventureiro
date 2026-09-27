import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const bundle = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/personagens.json', import.meta.url)), 'utf8'),
) as { characters: { id: string }[] };
const characters = Object.fromEntries(bundle.characters.map((c) => [c.id, c]));

/** Todas as telas, com personagens de exemplo já salvos. */
const ROUTES = [
  '/',
  '/personagens',
  '/glossario',
  '/guia-rapido',
  '/comparar',
  '/mesa',
  '/conteudo',
  '/receber',
  '/sobre',
  '/nao-existe',
  '/criar/e2e-thorin/boas-vindas',
  '/criar/e2e-thorin/me-guie',
  '/criar/e2e-thorin/especie',
  '/criar/e2e-thorin/classe',
  '/criar/e2e-thorin/subclasse',
  '/criar/e2e-thorin/antecedente',
  '/criar/e2e-thorin/atributos',
  '/criar/e2e-thorin/escolhas',
  '/criar/e2e-thorin/detalhes',
  '/criar/e2e-thorin/revisao',
  '/ficha/e2e-thorin',
  '/ficha/e2e-thorin?modo=jogo',
  '/ficha/e2e-thorin/imprimir',
];

async function seed(page: Page, theme: 'claro' | 'escuro') {
  await page.addInitScript(
    ([chars, t]) => {
      localStorage.setItem(
        'guia:personagens',
        JSON.stringify({ state: { characters: chars }, version: 2 }),
      );
      localStorage.setItem(
        'guia:ajustes',
        JSON.stringify({
          state: { theme: t, largeText: t === 'escuro', reduceMotion: true },
          version: 1,
        }),
      );
    },
    [characters, theme] as const,
  );
}

for (const theme of ['claro', 'escuro'] as const) {
  test(`axe: nenhuma violação séria no tema ${theme}`, async ({ page }) => {
    test.slow();
    await seed(page, theme);
    const problems: string[] = [];
    for (const route of ROUTES) {
      await page.goto(route);
      await page.locator('main h1').first().waitFor();
      // Espera as animações de entrada terminarem (o axe mede o contraste do que vê).
      await page.waitForTimeout(600);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      for (const v of results.violations)
        if (v.impact === 'serious' || v.impact === 'critical')
          problems.push(
            `${route} · ${v.id} (${v.impact}): ${v.nodes
              .slice(0, 3)
              .map((n) => n.target.join(' '))
              .join(' | ')}`,
          );
    }
    expect(problems).toEqual([]);
  });
}
