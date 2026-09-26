import { expect, test } from '@playwright/test';

test('fluxo completo: do zero à revisão com a ficha pronta e legal', async ({ page }) => {
  test.slow();
  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await page.getByLabel('Nome do personagem').fill('Thorin');
  const mobile = (page.viewportSize()?.width ?? 0) < 1024;
  const next = async (label: string) => {
    const before = page.url();
    if (mobile) await page.getByRole('button', { name: `Avançar para ${label}` }).click();
    else await page.getByRole('button', { name: label, exact: true }).last().click();
    await expect(page).not.toHaveURL(before);
  };

  await next('Espécie');
  await page.getByRole('button', { name: /^Anão/ }).click();
  await next('Classe');
  await page.getByRole('button', { name: /^Clérigo/ }).click();
  await next('Subclasse');
  await next('Antecedente');
  await page.getByRole('button', { name: /^Acólito/ }).click();

  // Etapa 6: o array padrão já vem distribuído pela sugestão do Clérigo.
  await next('Atributos');
  await expect(page.getByRole('heading', { name: 'Defina seus atributos' })).toBeVisible();
  await expect(page.getByLabel('Valor de Sabedoria')).toHaveValue('15');
  await page.getByLabel('+2 em', { exact: true }).selectOption({ label: 'Sabedoria' });
  await page.getByLabel('+1 em', { exact: true }).selectOption({ label: 'Carisma' });
  await expect(page.getByLabel('Total de Sabedoria')).toContainText('17');
  await expect(page.getByText('Atributos definidos. Tudo certo por aqui!')).toBeVisible();

  // Rolagem com dados animados e volta ao array padrão.
  await page.locator('label').filter({ hasText: 'Rolar dados' }).click();
  await page.getByRole('button', { name: 'Rolar 4d6 seis vezes' }).click();
  await expect(page.getByRole('img', { name: /descartado/ })).toHaveCount(6);
  await page.locator('label').filter({ hasText: 'Array padrão' }).click();
  await expect(page.getByLabel('Valor de Sabedoria')).toHaveValue('15');

  // Etapa 7: o kit recomendado resolve tudo em um toque.
  await next('Perícias, equipamento e magias');
  await expect(page.getByText(/Escolha 3 truques/)).toBeVisible();
  await page.getByRole('button', { name: 'Usar kit recomendado' }).click();
  await expect(page.getByText('Kit aplicado! Confira abaixo.')).toBeVisible();
  await expect(page.getByText('Todas as escolhas feitas. Tudo certo por aqui!')).toBeVisible();
  // Contador impede passar do limite: um quinto truque fica bloqueado.
  await expect(page.getByRole('checkbox', { name: /Luz, Truque/ })).toHaveAttribute(
    'aria-disabled',
    'true',
  );

  // Etapa 8: nome sugerido, alinhamento e gancho.
  await next('Detalhes e história');
  await page.getByRole('button', { name: /Sugerir nomes/ }).click();
  await page.getByRole('list', { name: 'Sugestões de nome' }).getByRole('button').first().click();
  await page.getByLabel('Nome do personagem').fill('Thorin');
  await page.getByRole('radio', { name: /Neutro e Bom/ }).click();
  await page.getByRole('button', { name: 'Sortear gancho' }).click();
  await expect(page.getByLabel(/Gancho de história/)).not.toHaveValue('');

  // Etapa 9: tudo pronto e resumo gerado; recarregar mantém.
  await next('Revisão');
  await page.reload();
  await expect(page.getByText('Ficha completa e dentro das regras. Boa aventura!')).toBeVisible();
  await expect(page.getByTestId('resumo')).toContainText('Thorin: Anão, Clérigo de 1º nível');
  await expect(page.getByTestId('resumo')).toContainText('Alinhamento: Neutro e Bom.');
  await expect(page.getByText('Bênção').first()).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
