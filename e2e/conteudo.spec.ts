import { expect, test } from '@playwright/test';

test.use({ viewport: { width: 360, height: 740 } });

test('completar uma subclasse do livro e escolher no assistente', async ({ page }) => {
  await page.goto('/conteudo');
  await page.getByText(/^Subclasses \(/).click();
  await page.getByRole('button', { name: 'Completar Caminho do Fanático' }).click();
  const editor = page.getByRole('dialog');
  await expect(editor.getByLabel('Nome', { exact: true })).toHaveValue('Caminho do Fanático');
  await editor
    .getByLabel('Descrição', { exact: true })
    .fill('Fúria movida pela fé, anotada pelo grupo.');
  await editor.getByLabel('Característica 1: nome').fill('Fúria Divina');
  await editor
    .getByLabel('O que faz')
    .fill('Na Fúria, seus golpes causam dano radiante extra. Texto do grupo.');
  await editor.getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('button', { name: 'Editar Caminho do Fanático' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Completar Caminho do Fanático' })).toHaveCount(0);

  // Erro claro: nome vazio não salva (campo obrigatório) e id do SRD é recusado.
  await page.getByRole('button', { name: 'Novo antecedente' }).click();
  await page.getByRole('dialog').getByLabel('Nome', { exact: true }).fill('Soldier');
  await page.getByRole('dialog').getByRole('button', { name: 'Salvar' }).click();
  await expect(page.getByRole('alert')).toContainText('já é do SRD');
  await page.getByRole('dialog').getByRole('button', { name: 'Cancelar' }).click();

  await page.getByRole('button', { name: 'Aplicar mudanças' }).click();
  await expect(page.getByRole('button', { name: 'Aplicar mudanças' })).toHaveCount(0);

  await page.goto('/');
  await page.getByRole('button', { name: 'Criar meu personagem' }).click();
  await page.getByRole('button', { name: 'Aumentar nível' }).click();
  await page.getByRole('button', { name: 'Aumentar nível' }).click();
  await page.goto(page.url().replace('boas-vindas', 'classe'));
  await page.getByRole('button', { name: /^Bárbaro/ }).click();
  await page.goto(page.url().replace('classe', 'subclasse'));
  await page.getByRole('button', { name: /^Caminho do Fanático/ }).click();
  await expect(page.getByText('Fúria Divina').first()).toBeVisible();

  // Exportar o pacote.
  await page.goto('/conteudo');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar pacote' }).click();
  expect((await download).suggestedFilename()).toMatch(/^conteudo-proprio-/);
});
