import { useNavigate } from 'react-router';
import { useCharacters } from '@/state/characters';

/** Cria um rascunho de personagem e abre o assistente. */
export function useStartCharacter() {
  const navigate = useNavigate();
  const create = useCharacters((s) => s.create);
  return () => {
    const character = create();
    navigate(`/criar/${character.id}`);
  };
}
