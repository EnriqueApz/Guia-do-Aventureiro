import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { useCharacters } from '@/state/characters';
import { useSettings } from '@/state/settings';
import { routes } from './router';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

beforeEach(() => {
  useCharacters.setState({ characters: {} });
  useSettings.setState({ theme: 'claro', largeText: false, reduceMotion: false });
});

describe('aplicação', () => {
  it('mostra a página inicial com o convite para criar personagem', async () => {
    renderAt('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: /seu primeiro herói/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /criar meu personagem/i })).toBeInTheDocument();
  });

  it('cria um rascunho e abre o assistente, guardando o nome', async () => {
    const user = userEvent.setup();
    const router = renderAt('/');
    await user.click(await screen.findByRole('button', { name: /criar meu personagem/i }));
    const input = await screen.findByLabelText(/nome do personagem/i, {}, { timeout: 5000 });
    await user.type(input, 'Lira');
    const [character] = Object.values(useCharacters.getState().characters);
    expect(character?.name).toBe('Lira');
    expect(router.state.location.pathname).toBe(`/criar/${character?.id}/boas-vindas`);
  });

  it('troca para o tema "luz de vela" e aumenta a fonte', async () => {
    const user = userEvent.setup();
    renderAt('/');
    await user.click(await screen.findByRole('button', { name: /ajustes/i }));
    await user.click(screen.getByLabelText(/vela/i));
    await user.click(screen.getByRole('switch', { name: /fonte maior/i }));
    expect(document.documentElement.dataset.theme).toBe('escuro');
    expect(document.documentElement.dataset.font).toBe('grande');
  });

  it('mostra a página 404 para rotas desconhecidas', async () => {
    renderAt('/caverna-secreta');
    expect(
      await screen.findByRole('heading', { name: /você se perdeu na masmorra/i }),
    ).toBeInTheDocument();
  });

  it('exibe a atribuição do SRD no rodapé', async () => {
    renderAt('/');
    expect(await screen.findByText(/system reference document 5\.2/i)).toBeInTheDocument();
  });
});
