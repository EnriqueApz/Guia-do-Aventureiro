import { expect, test } from '@playwright/test';

test('valor digitado: dá para apagar e escrever o número inteiro', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await expect(page).toHaveURL(/boas-vindas/);
  await page.goto(page.url().replace('boas-vindas', 'atributos'));
  await page.getByText('Digitar', { exact: true }).click();

  const forca = page.getByLabel('Valor de Força');
  await forca.fill('');
  await expect(forca).toHaveValue(''); // apagar não pula para 3
  await forca.pressSequentially('12');
  await expect(forca).toHaveValue('12'); // o "1" do meio não vira 18
  await forca.blur();
  await expect(forca).toHaveValue('12');

  // Fora da faixa: corrige ao sair do campo.
  await forca.fill('25');
  await forca.blur();
  await expect(forca).toHaveValue('18');
  await forca.fill('');
  await forca.blur();
  await expect(forca).toHaveValue('18'); // campo vazio volta ao valor anterior
});
