import { useNavigate } from 'react-router';
import { applyTableDefaults } from '@/model/table';
import { useCharacters } from '@/state/characters';
import { useTable } from '@/state/table';

/** Cria um rascunho de personagem e abre o assistente. */
export function useStartCharacter() {
  const navigate = useNavigate();
  const create = useCharacters((s) => s.create);
  const edit = useCharacters((s) => s.edit);
  const rules = useTable((s) => s.rules);
  return () => {
    const character = create();
    // Com uma mesa ativa, o personagem já nasce no nível e nos métodos combinados.
    if (rules) edit(character.id, (c) => applyTableDefaults(c, rules));
    navigate(`/criar/${character.id}`);
  };
}
