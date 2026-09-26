import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Term } from './Term';

describe('<Term>', () => {
  it('abre a explicação ao tocar e fecha com Esc', async () => {
    const user = userEvent.setup();
    render(
      <p>
        Sua{' '}
        <Term term="Classe de Armadura" definition="O número que um ataque precisa alcançar.">
          CA
        </Term>{' '}
        é 15.
      </p>,
    );
    const trigger = screen.getByRole('button', { name: /classe de armadura/i });
    await user.click(trigger);
    expect(screen.getByText(/o número que um ataque precisa alcançar/i)).toBeVisible();
    await user.keyboard('{Escape}');
    expect(screen.queryByText(/o número que um ataque precisa alcançar/i)).not.toBeInTheDocument();
  });
});
