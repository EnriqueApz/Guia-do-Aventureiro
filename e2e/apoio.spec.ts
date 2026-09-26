import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 360, height: 740 } });

const noOverflow = async (page: Page) => {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
};

test('glossário: busca sem acento e link direto para o termo', async ({ page }) => {
  await page.goto('/glossario');
  await page.getByLabel('Buscar termo').fill('resistencia');
  await expect(page.getByRole('heading', { name: 'Resistência', exact: true })).toBeVisible();
  await page.getByLabel('Buscar termo').fill('saving throw');
  await expect(page.getByRole('article').first()).toContainText('Salvaguarda');
  await page.getByLabel('Buscar termo').fill('');
  await page.getByRole('button', { name: 'Condição', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cego', exact: true })).toBeVisible();
  await page.goto('/glossario#vantagem');
  await expect(page.locator('#vantagem')).toBeInViewport();
  await noOverflow(page);
});

test('balão de termo leva ao glossário', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await page
    .getByRole('button', { name: /^Espécie: ver explicação/ })
    .first()
    .click();
  await page.getByRole('link', { name: 'Ver no glossário' }).click();
  await expect(page).toHaveURL(/\/glossario#especie$/);
  await expect(page.locator('#especie')).toBeInViewport();
});

test('Me guie: cinco perguntas, três sugestões e aplica a escolhida', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await page.getByRole('button', { name: /^Me guie/ }).click();
  await expect(page).toHaveURL(/\/me-guie$/);
  for (const answer of [
    /^Na linha de frente/,
    /^Proteger/,
    /^O mínimo/,
    /^Força bruta/,
    /^Robusto/,
  ])
    await page.getByRole('button', { name: answer }).click();
  await expect(page.getByRole('heading', { name: 'Três sugestões para você' })).toBeVisible();
  await expect(page.getByText('Por que sugeri isso')).toHaveCount(3);
  await noOverflow(page);
  await page.getByRole('button', { name: 'Quero este' }).first().click();
  await expect(page).toHaveURL(/\/especie$/);
  await page.getByRole('button', { name: /^Ficha/ }).click();
  await expect(page.getByRole('dialog', { name: 'Ficha' })).toContainText(/Guerreiro|Bárbaro/);
});

test('comparador: duas classes lado a lado no celular', async ({ page }) => {
  await page.goto('/comparar');
  await page.getByLabel('Primeira opção').selectOption({ label: 'Guerreiro' });
  await page.getByLabel('Segunda opção').selectOption({ label: 'Mago' });
  const row = page.getByRole('row', { name: /Dado de vida/ });
  await expect(row).toContainText('d10');
  await expect(row).toContainText('d6');
  await expect(row).toContainText('diferente');
  await page.getByText('Mostrar só as diferenças').click();
  await expect(page).toHaveURL(/diferencas=1/);
  await page.locator('label').filter({ hasText: 'Espécies' }).click();
  await expect(page.getByRole('row', { name: /^Visão no Escuro/ })).toBeVisible();
  await noOverflow(page);
});
