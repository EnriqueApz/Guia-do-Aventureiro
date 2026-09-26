import { expect, test } from '@playwright/test';

test('instalável e funcionando offline depois da primeira visita', async ({ page, context }) => {
  await page.goto('/');
  // O manifesto existe e aponta os ícones.
  const manifest = await page.evaluate(async () => {
    const href = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href;
    return href ? ((await (await fetch(href)).json()) as { name: string; icons: unknown[] }) : null;
  });
  expect(manifest?.name).toBe('Guia do Aventureiro');
  expect(manifest?.icons.length).toBeGreaterThanOrEqual(2);

  // Espera o service worker assumir a página (e terminar o cache).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), { timeout: 15_000 })
    .toBe(true);

  await context.setOffline(true);
  await page.goto('/glossario');
  await expect(page.getByRole('heading', { name: 'Glossário', level: 1 })).toBeVisible();
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await expect(page.getByLabel('Nome do personagem')).toBeVisible();
  await context.setOffline(false);
});
