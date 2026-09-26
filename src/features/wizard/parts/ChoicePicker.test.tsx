import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ChoicePicker } from './ChoicePicker';

function Harness() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <ChoicePicker
      label="Escolha 2 perícias"
      max={2}
      selected={selected}
      options={[
        { id: 'a', label: 'Atletismo' },
        { id: 'b', label: 'Furtividade' },
        { id: 'c', label: 'Percepção' },
        { id: 'd', label: 'Religião', disabled: true, hint: 'você já tem' },
      ]}
      onToggle={(id) =>
        setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
      }
    />
  );
}

describe('<ChoicePicker>', () => {
  it('conta as escolhas e bloqueia quando chega no limite', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    expect(screen.getByText('0 de 2')).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Atletismo' }));
    await user.click(screen.getByRole('checkbox', { name: 'Furtividade' }));
    expect(screen.getByText('2 de 2')).toBeInTheDocument();
    const third = screen.getByRole('checkbox', { name: 'Percepção' });
    expect(third).toHaveAttribute('aria-disabled', 'true');
    await user.click(third);
    expect(third).toHaveAttribute('aria-checked', 'false');
    await user.click(screen.getByRole('checkbox', { name: 'Atletismo' }));
    expect(screen.getByText('1 de 2')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Religião/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });
});
