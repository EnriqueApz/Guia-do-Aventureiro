import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 740 } });

test('o Mestre gera o link e a mesa trava as opções no assistente', async ({ page, browser }) => {
  await page.goto('/mesa');
  await page.getByLabel(/Nome da mesa/).fill('Sexta');
  await page.getByLabel('Nível inicial').selectOption('3');
  // Libera só Guerreiro e Clérigo.
  for (const name of [
    'Bárbaro',
    'Bardo',
    'Druida',
    'Monge',
    'Paladino',
    'Patrulheiro',
    'Ladino',
    'Feiticeiro',
    'Bruxo',
    'Mago',
  ])
    await page.getByRole('checkbox', { name, exact: true }).click();
  await page.getByRole('checkbox', { name: 'Rolagem 4d6' }).click();
  await page.getByRole('checkbox', { name: 'Valores digitados' }).click();
  const link = await page.getByLabel('Link da mesa').inputValue();
  expect(link).toMatch(/\/mesa#m=/);

  const other = await browser.newContext({ viewport: { width: 360, height: 740 } });
  const player = await other.newPage();
  await player.goto(link.replace(/^https?:\/\/[^/]+/, 'http://localhost:4173'));
  await expect(player.getByText('Convite para a mesa “Sexta”')).toBeVisible();
  await player.getByRole('button', { name: 'Entrar na mesa' }).click();
  await expect(player.getByRole('region', { name: 'Mesa ativa' })).toContainText('Sexta · nível 3');

  await player.getByRole('button', { name: 'Criar meu personagem' }).click();
  await expect(player.getByText('A mesa “Sexta” começa no nível 3.')).toBeVisible();
  await expect(player.getByLabel('Nível inicial')).toHaveValue('3');
  await player.goto(player.url().replace('boas-vindas', 'classe'));
  await expect(player.getByRole('button', { name: /^Mago/ })).toBeDisabled();
  await expect(player.getByRole('button', { name: /^Guerreiro/ })).toBeEnabled();
  await player.goto(player.url().replace('classe', 'atributos'));
  await expect(player.locator('label').filter({ hasText: 'Rolar dados' })).toHaveCount(0);

  await player.getByRole('button', { name: 'Sair da mesa' }).click();
  await expect(player.getByRole('region', { name: 'Mesa ativa' })).toHaveCount(0);
  await other.close();
});
