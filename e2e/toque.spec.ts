import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const bundle = JSON.parse(
  readFileSync(fileURLToPath(new URL('./fixtures/personagens.json', import.meta.url)), 'utf8'),
) as { characters: { id: string }[] };
const characters = Object.fromEntries(bundle.characters.map((c) => [c.id, c]));

const ROUTES = [
  '/',
  '/personagens',
  '/glossario',
  '/guia-rapido',
  '/comparar',
  '/mesa',
  '/conteudo',
  '/receber',
  '/criar/e2e-thorin/boas-vindas',
  '/criar/e2e-thorin/me-guie',
  '/criar/e2e-thorin/especie',
  '/criar/e2e-thorin/classe',
  '/criar/e2e-thorin/antecedente',
  '/criar/e2e-thorin/atributos',
  '/criar/e2e-thorin/escolhas',
  '/criar/e2e-thorin/detalhes',
  '/criar/e2e-thorin/revisao',
  '/ficha/e2e-thorin',
  '/ficha/e2e-thorin?modo=jogo',
];

/** Alvos de toque menores que 44 px (links e termos dentro de frases são a exceção do WCAG). */
async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const selector =
      'button, a[href], input:not([type="hidden"]), select, textarea, summary, [role="checkbox"], [role="radio"], [role="switch"]';
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      // Rádios/checkbox nativos escondidos: o alvo é o <label> em volta.
      const target =
        el instanceof HTMLInputElement && el.classList.contains('sr-only')
          ? (el.closest('label') ?? el)
          : el;
      const r = target.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (el.closest('[aria-hidden="true"], .sr-only')) continue;
      // Exceção "em linha" do WCAG: link ou termo no meio de um texto corrido.
      const block = target.closest('p, li, dd, dt, td, th, h1, h2, h3, h4, label, legend');
      const own = (target.textContent ?? '').trim().length;
      const inlineBox = style.display === 'inline' || style.display === 'inline-block';
      if (
        inlineBox &&
        block &&
        block !== target &&
        (block.textContent ?? '').trim().length > own + 2
      )
        continue;
      // Termos do glossário (balão de explicação) seguem o mínimo do WCAG 2.2 AA: 24 px.
      if (target.getAttribute('aria-label')?.endsWith(': ver explicação')) {
        if (r.height < 23.5 || r.width < 23.5)
          out.push(`termo "${target.textContent}" ${Math.round(r.width)}×${Math.round(r.height)}`);
        continue;
      }
      if (r.height < 43.5 || r.width < 43.5) {
        const name =
          target.getAttribute('aria-label') ??
          target.textContent?.trim().slice(0, 30) ??
          target.tagName;
        out.push(
          `${target.tagName.toLowerCase()} "${name}" ${Math.round(r.width)}×${Math.round(r.height)}`,
        );
      }
    }
    return [...new Set(out)];
  });
}

test('alvos de toque têm pelo menos 44 px', async ({ page }) => {
  test.slow();
  await page.addInitScript((chars) => {
    localStorage.setItem(
      'guia:personagens',
      JSON.stringify({ state: { characters: chars }, version: 2 }),
    );
  }, characters);
  const problems: string[] = [];
  for (const route of ROUTES) {
    await page.goto(route);
    await page.locator('main h1').first().waitFor();
    await page.waitForTimeout(300);
    for (const p of await smallTargets(page)) problems.push(`${route} · ${p}`);
  }
  expect(problems).toEqual([]);
});

test('fonte maior vale no app todo e não cria rolagem lateral', async ({ page }) => {
  test.slow();
  await page.setViewportSize({ width: 360, height: 740 });
  await page.addInitScript((chars) => {
    localStorage.setItem(
      'guia:personagens',
      JSON.stringify({ state: { characters: chars }, version: 2 }),
    );
    localStorage.setItem(
      'guia:ajustes',
      JSON.stringify({
        state: { theme: 'claro', largeText: true, reduceMotion: true },
        version: 1,
      }),
    );
  }, characters);
  for (const route of ROUTES) {
    await page.goto(route);
    await page.locator('main h1').first().waitFor();
    const { font, overflow, motion } = await page.evaluate(() => ({
      font: parseFloat(getComputedStyle(document.documentElement).fontSize),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      motion: document.documentElement.dataset.motion,
    }));
    expect({ route, font, motion }).toEqual({ route, font: 18, motion: 'reduzido' });
    expect({ route, overflow: overflow <= 0 }).toEqual({ route, overflow: true });
  }
  // Com movimento reduzido, transições e animações ficam instantâneas.
  const duration = await page.evaluate(() => {
    const el = document.querySelector('button');
    return el ? getComputedStyle(el).transitionDuration : '0s';
  });
  expect(['0s', '1e-05s', '0.00001s']).toContain(duration);
});
