import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

test.use({ viewport: { width: 360, height: 740 } });

test('impressão A4, link só leitura e salvar uma cópia', async ({ page, browser }) => {
  await page.goto('/personagens');
  await page
    .getByLabel('Arquivo de personagens para importar')
    .setInputFiles(fixture('personagens.json'));
  await page.goto('/ficha/e2e-thorin');

  // Impressão: a página tem as três partes e o PDF sai em A4.
  await page.getByRole('link', { name: 'Imprimir / PDF' }).click();
  await expect(page).toHaveURL(/\/ficha\/e2e-thorin\/imprimir$/);
  await expect(page.getByRole('region', { name: 'Página 2: magias' })).toBeVisible();
  await expect(page.getByRole('region', { name: /Página final/ })).toBeVisible();

  // Link de compartilhamento.
  await page.goto('/ficha/e2e-thorin');
  await page.getByRole('button', { name: 'Compartilhar' }).click();
  const link = await page.getByLabel('Link da ficha').inputValue();
  expect(link).toMatch(/\/ver#d=/);

  // Outra pessoa (outro navegador, sem personagens) abre o link.
  const other = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const friend = await other.newPage();
  await friend.goto(link.replace(/^https?:\/\/[^/]+/, 'http://localhost:4173'));
  await expect(friend.getByText('Ficha compartilhada · só leitura')).toBeVisible();
  await expect(friend.getByRole('heading', { name: 'Thorin', level: 1 })).toBeVisible();
  await friend.getByRole('button', { name: 'Salvar uma cópia' }).click();
  await expect(friend).toHaveURL(/\/ficha\/[^/]+$/);
  await friend.goto('/personagens');
  await expect(friend.getByRole('link', { name: /^Thorin/ })).toBeVisible();

  // Link quebrado explica o problema.
  await friend.goto('/ver#d=abc');
  await expect(friend.getByText('Não deu para abrir esta ficha')).toBeVisible();
  await other.close();
});

test('guia rápido imprimível', async ({ page }) => {
  await page.goto('/guia-rapido');
  await expect(page.getByRole('heading', { name: /Testes de D20/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Imprimir' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
