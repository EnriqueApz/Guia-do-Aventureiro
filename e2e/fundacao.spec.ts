import { expect, test } from '@playwright/test';

test('cria um personagem, e o nome continua lá depois de recarregar', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await expect(page).toHaveURL(/\/criar\/.+/);

  const name = page.getByLabel('Nome do personagem');
  await name.fill('Lira Vento-Sul');
  await page.reload();
  await expect(page.getByLabel('Nome do personagem')).toHaveValue('Lira Vento-Sul');

  await page.goto('/personagens');
  await expect(page.getByRole('link', { name: /^Lira Vento-Sul/ })).toBeVisible();
});

test('o tema "luz de vela" persiste entre visitas', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Ajustes de leitura e tema' }).click();
  await page.getByText('Vela', { exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'escuro');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'escuro');
});

test('dá para navegar pelo teclado, com link para pular ao conteúdo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Pular para o conteúdo' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
});

test('páginas desconhecidas mostram a 404 amigável', async ({ page }) => {
  await page.goto('/caverna-secreta');
  await expect(page.getByRole('heading', { name: 'Você se perdeu na masmorra' })).toBeVisible();
});
