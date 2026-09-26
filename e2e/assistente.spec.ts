import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 740 } });

test('etapas 1–5 no celular: escolhas aparecem na ficha e sobrevivem ao recarregar', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await expect(page).toHaveURL(/\/criar\/.+\/boas-vindas$/);

  await page.getByLabel('Nome do personagem').fill('Thorin');
  await page.getByRole('button', { name: 'Avançar para Espécie' }).click();
  await expect(page.getByRole('heading', { name: 'Escolha sua espécie' })).toBeVisible();

  await page.getByRole('button', { name: /^Anão/ }).click();
  await expect(page.getByText('Espécie escolhida. Tudo certo por aqui!')).toBeVisible();

  await page.getByRole('button', { name: 'Avançar para Classe' }).click();
  await page.getByRole('button', { name: /^Clérigo/ }).click();
  await expect(page.getByRole('heading', { name: 'Como isso funciona na mesa?' })).toBeVisible();

  await page.getByRole('button', { name: 'Avançar para Subclasse' }).click();
  await expect(page.getByText(/A subclasse só entra no nível 3/)).toBeVisible();

  await page.getByRole('button', { name: 'Avançar para Antecedente' }).click();
  await page.getByRole('button', { name: /^Acólito/ }).click();
  await page.getByRole('button', { name: /Sortear ideal/ }).click();

  // Voltar não perde nada, e recarregar também não.
  await page.getByRole('button', { name: 'Voltar para Subclasse' }).click();
  await page.reload();
  await page.getByRole('button', { name: /^Ficha/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Ficha' });
  await expect(sheet.getByText('Thorin')).toBeVisible();
  await expect(sheet.getByText(/Anão · Clérigo 1 · Acólito/)).toBeVisible();
  await expect(sheet.getByText('Resistência')).toBeVisible();

  // Nada vaza para os lados em 360 px.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('o link do personagem retoma a última etapa aberta', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await page.getByRole('button', { name: 'Avançar para Espécie' }).click();
  await page.getByRole('button', { name: 'Avançar para Classe' }).click();
  await expect(page).toHaveURL(/\/classe$/);
  await page.goto('/personagens');
  await page.getByRole('link', { name: /Personagem sem nome/ }).click();
  await expect(page).toHaveURL(/\/classe$/);
});
