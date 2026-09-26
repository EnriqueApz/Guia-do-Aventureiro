import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RouteError } from './RouteError';

function renderWith(error: Error) {
  const router = createMemoryRouter([
    {
      path: '/',
      ErrorBoundary: RouteError,
      loader: () => {
        throw error;
      },
      Component: () => null,
    },
  ]);
  render(<RouterProvider router={router} />);
}

describe('página de erro', () => {
  it('erro comum: mensagem amigável e detalhes técnicos', async () => {
    renderWith(new Error('boom'));
    expect(await screen.findByText('Um dado rolou para debaixo da mesa')).toBeInTheDocument();
    expect(screen.getByText('boom')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar ao início' })).toBeInTheDocument();
  });

  it('pedaço do site que não carregou: versão nova ou sem internet', async () => {
    renderWith(new Error('Failed to fetch dynamically imported module: /assets/x.js'));
    expect(await screen.findByText('Saiu uma versão nova do site')).toBeInTheDocument();
  });

  it('sem internet', async () => {
    const spy = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
    renderWith(new Error('Importing a module script failed.'));
    expect(await screen.findByText('Sem internet por aqui')).toBeInTheDocument();
    spy.mockRestore();
  });
});
