// Utilitário local: captura telas para revisão visual. Uso: npm run preview e depois node scripts/screenshots.mjs <pasta>
import { chromium, devices } from '@playwright/test';
const out = process.argv[2];
const browser = await chromium.launch();
for (const [name, opts] of [
  ['celular', devices['Pixel 7']],
  ['desktop', { viewport: { width: 1280, height: 860 } }],
]) {
  for (const theme of ['claro', 'escuro']) {
    const ctx = await browser.newContext({
      ...opts,
      colorScheme: theme === 'escuro' ? 'dark' : 'light',
    });
    const page = await ctx.newPage();
    for (const path of ['/', '/design', '/personagens']) {
      await page.goto('http://localhost:4173' + path);
      await page.waitForTimeout(700);
      await page.screenshot({
        path: `${out}/${name}-${theme}${path.replace(/\//g, '_')}.png`,
        fullPage: path !== '/',
      });
    }
    await ctx.close();
  }
}
await browser.close();
