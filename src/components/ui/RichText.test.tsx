import { render, screen } from '@testing-library/react';
import { RichText } from './RichText';

describe('<RichText>', () => {
  it('renderiza parágrafos, listas e negrito sem interpretar HTML', () => {
    const { container } = render(
      <RichText text={'Primeiro **forte** texto.\n- item um\n- item <b>dois</b>\nFim.'} />,
    );
    expect(screen.getByText('forte').tagName).toBe('STRONG');
    expect(container.querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelectorAll('p')).toHaveLength(2);
    expect(screen.getByText(/item <b>dois<\/b>/)).toBeInTheDocument();
  });
});
