import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 740 } });

test('o jogador instala o pacote do Mestre pelo celular', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Recebi um pacote do Mestre/ }).click();
  await expect(page.getByRole('heading', { name: 'Receber pacote do Mestre' })).toBeVisible();

  // Arquivo errado: mensagem clara, nada instalado.
  await page.getByLabel('Arquivo do pacote do Mestre').setInputFiles('e2e/fixtures/quebrado.json');
  await expect(page.getByRole('alert')).toContainText('Não deu para instalar');

  await page
    .getByLabel('Arquivo do pacote do Mestre')
    .setInputFiles('e2e/fixtures/pacote-mestre.json');
  await expect(page.getByRole('status').filter({ hasText: 'Pacote instalado' })).toContainText(
    '“Mesa de teste”: 1 subclasse.',
  );
  await page.getByRole('button', { name: 'Começar a usar' }).click();

  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await page.getByRole('button', { name: 'Aumentar nível' }).click();
  await page.getByRole('button', { name: 'Aumentar nível' }).click();
  await page.goto(page.url().replace('boas-vindas', 'classe'));
  await page.getByRole('button', { name: /^Bárbaro/ }).click();
  await page.goto(page.url().replace('classe', 'subclasse'));
  await page.getByRole('button', { name: /^Caminho do Fanático/ }).click();
  await expect(page.getByText('Fúria da Fé').first()).toBeVisible();
});
