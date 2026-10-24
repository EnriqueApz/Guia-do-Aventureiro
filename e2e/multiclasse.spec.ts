import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 740 } });

test('multiclasse no assistente: dividir níveis, ver na ficha e desfazer', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await expect(page).toHaveURL(/boas-vindas/);
  for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Aumentar nível' }).click();
  await page.goto(page.url().replace('boas-vindas', 'classe'));
  await page.getByRole('button', { name: /^Clérigo/ }).click();

  // Seção de multiclasse: Guerreiro com 2 níveis; o Clérigo fica com 3.
  await expect(page.getByRole('heading', { name: 'Multiclasse (opcional)' })).toBeVisible();
  await page.getByLabel('Adicionar classe').selectOption('fighter');
  await page.getByRole('button', { name: 'Adicionar', exact: true }).click();
  await page.getByRole('button', { name: 'Mais níveis de Guerreiro' }).click();
  await expect(page.getByText('Clérigo 3', { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Ganha proficiência em armaduras leves.*; armas marciais/),
  ).toBeVisible();

  await page.getByRole('button', { name: /^Ficha/ }).click();
  const sheet = page.getByRole('dialog', { name: 'Ficha' });
  await expect(sheet.getByText(/Clérigo 3 \/ Guerreiro 2/)).toBeVisible();
  await expect(sheet.getByText('2d10 + 3d8')).toBeVisible();
  await page.keyboard.press('Escape');

  // As escolhas do Guerreiro aparecem na etapa de escolhas (pede antecedente antes).
  await page.goto(page.url().replace('classe', 'antecedente'));
  await page.getByRole('button', { name: /^Acólito/ }).click();
  await page.goto(page.url().replace('antecedente', 'escolhas'));
  await expect(page.getByRole('heading', { name: 'Guerreiro 2 (multiclasse)' })).toBeVisible();

  // Desfazer: tudo volta para uma classe só.
  await page.goto(page.url().replace('escolhas', 'classe'));
  await page.getByRole('button', { name: 'Tirar Guerreiro da multiclasse' }).click();
  await page.getByRole('button', { name: /^Ficha/ }).click();
  await expect(page.getByRole('dialog', { name: 'Ficha' }).getByText(/Clérigo 5/)).toBeVisible();
});

test('modo jogo: Magia de Pacto à parte e Dados de Vida de cada classe', async ({ page }) => {
  await page.goto('/personagens');
  await page
    .getByLabel('Arquivo de personagens para importar')
    .setInputFiles('e2e/fixtures/multiclasse.json');
  await expect(page.getByText('1 personagem importado.')).toBeVisible();
  await expect(page.getByText(/Bruxo 3 \/ Mago 1/)).toBeVisible();

  await page.getByRole('link', { name: 'Jogar com Morgana' }).click();
  // Mago 1 dá 2 espaços de 1º círculo; Bruxo 3 dá 2 de Pacto de 2º círculo.
  await expect(page.getByRole('heading', { name: /Magia de Pacto/ })).toBeVisible();
  await expect(page.getByText('Pacto: 2º círculo')).toBeVisible();

  // Dados de Vida: 3d8 do Bruxo + 1d6 do Mago, cada um com seu contador.
  await expect(page.getByText(/4 de 4/)).toBeVisible();
  await page.getByRole('button', { name: 'Mais Dados de Vida d6' }).click();
  await page.getByRole('button', { name: 'Mais Dados de Vida d8' }).click();
  await page.getByRole('button', { name: 'Descansar' }).click();
  await expect(page.getByText(/2 de 4/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Mais Dados de Vida d6' })).toBeDisabled();
});
