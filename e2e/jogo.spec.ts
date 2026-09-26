import { expect, test } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const fixture = (name: string) => fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

test.use({ viewport: { width: 360, height: 740 } });

test('importa, joga uma cena e descansa', async ({ page }) => {
  await page.goto('/personagens');
  await page
    .getByLabel('Arquivo de personagens para importar')
    .setInputFiles(fixture('personagens.json'));
  await expect(page.getByText('2 personagens importados.')).toBeVisible();

  // Arquivo quebrado: mensagem clara e nada é importado.
  await page
    .getByLabel('Arquivo de personagens para importar')
    .setInputFiles(fixture('quebrado.json'));
  await expect(
    page.getByText(/Personagem “Brom” não foi importado: nível: valor fora do permitido/),
  ).toBeVisible();

  await page.getByRole('link', { name: 'Jogar com Thorin' }).click();
  await expect(page).toHaveURL(/\/ficha\/e2e-thorin\?modo=jogo$/);
  const hp = page.getByLabel(/^PV: \d+ de \d+$/);
  const max = Number((await hp.getAttribute('aria-label'))?.match(/de (\d+)/)?.[1]);

  // Dano, PV temporários e cura.
  await page.getByLabel('Quantidade').fill('5');
  await page.getByRole('button', { name: 'PV temporários', exact: true }).click();
  await page.getByLabel('Quantidade').fill('8');
  await page.getByRole('button', { name: 'Dano', exact: true }).click();
  await expect(page.getByLabel(`PV: ${max - 3} de ${max}`)).toBeVisible();
  await page.getByLabel('Quantidade').fill('2');
  await page.getByRole('button', { name: 'Cura', exact: true }).click();
  await expect(page.getByLabel(`PV: ${max - 1} de ${max}`)).toBeVisible();

  // Cair a 0 e rolar salvaguarda contra a morte.
  await page.getByLabel('Quantidade').fill(String(max));
  await page.getByRole('button', { name: 'Dano', exact: true }).click();
  await expect(page.getByText(/Caiu a 0 PV/)).toBeVisible();
  await page.getByRole('button', { name: 'Rolar salvaguarda contra a morte' }).click();
  await expect(page.getByTestId('ultima-rolagem')).toContainText('Salvaguarda contra a morte');

  // Vantagem numa perícia: dois d20 no resultado.
  await page.locator('label').filter({ hasText: 'Vantagem' }).first().click();
  await page.getByRole('button', { name: /^Rolar Percepção/ }).click();
  await expect(page.getByTestId('ultima-rolagem')).toContainText('vantagem');

  // Espaços de magia, condições e exaustão.
  await page.getByRole('button', { name: '1º círculo: gastar um' }).first().click();
  await expect(page.getByRole('button', { name: '1º círculo: recuperar um' })).toHaveCount(1);
  await page.getByRole('button', { name: 'Envenenado', exact: true }).click();
  await expect(page.getByText(/Envenenado:/)).toBeVisible();
  await page.getByRole('button', { name: 'Aumentar exaustão' }).click();
  await expect(page.getByText(/Exaustão 1: −2/)).toBeVisible();

  // Descanso longo recupera PV, espaços e um nível de exaustão.
  await page.getByRole('button', { name: 'Descanso longo', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar descanso longo' }).click();
  await expect(page.getByLabel(`PV: ${max} de ${max}`)).toBeVisible();
  await expect(page.getByRole('button', { name: '1º círculo: recuperar um' })).toHaveCount(0);
  await expect(page.getByLabel('Exaustão 0')).toBeVisible();

  // Tudo persiste ao recarregar.
  await page.getByRole('button', { name: 'Envenenado', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Envenenado', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false',
  );

  // Rolador livre com histórico.
  await page.getByRole('button', { name: 'Rolador de dados' }).click();
  const roller = page.getByRole('dialog', { name: 'Rolador de dados' });
  await roller.getByLabel(/Outra rolagem/).fill('2d6+3');
  await roller.getByRole('button', { name: 'Rolar', exact: true }).click();
  await expect(roller.getByText('2d6+3', { exact: false }).first()).toBeVisible();
  await roller.getByLabel(/Outra rolagem/).fill('banana');
  await roller.getByRole('button', { name: 'Rolar', exact: true }).click();
  await expect(roller.getByRole('alert')).toContainText('inválida');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});

test('duplicar, excluir com desfazer e exportar', async ({ page }) => {
  await page.goto('/personagens');
  await page
    .getByLabel('Arquivo de personagens para importar')
    .setInputFiles(fixture('personagens.json'));
  await page.getByRole('button', { name: 'Duplicar Brom' }).click();
  await expect(page.getByText('Brom (cópia)')).toBeVisible();
  await page.getByRole('button', { name: 'Excluir Brom (cópia)' }).click();
  await expect(page.getByText('Brom (cópia) foi excluído.')).toBeVisible();
  await page.getByRole('button', { name: 'Desfazer' }).click();
  await expect(page.getByRole('link', { name: /Brom \(cópia\)/ }).first()).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar Thorin' }).click();
  expect((await download).suggestedFilename()).toMatch(/^thorin-\d{4}-\d{2}-\d{2}\.json$/);
});
