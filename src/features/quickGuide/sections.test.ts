import { content } from '@/content';
import { GUIDE } from './sections';

describe('guia rápido', () => {
  it('seções com id único e termos que existem no glossário', () => {
    const ids = new Set(content.glossary.map((g) => g.id));
    expect(new Set(GUIDE.map((s) => s.id)).size).toBe(GUIDE.length);
    for (const s of GUIDE) {
      expect(s.lead.length).toBeGreaterThan(20);
      for (const t of s.terms) expect(ids.has(t), `${s.id} → ${t}`).toBe(true);
    }
  });

  it('cobre os temas pedidos: testes, ataque, dano, descanso, morte, iniciativa e exploração', () => {
    const all = GUIDE.map((s) => `${s.title} ${s.body}`).join(' ');
    for (const word of ['Teste', 'Atacar', 'dano', 'Descanso', 'morte', 'Iniciativa', 'Exploração'])
      expect(all).toContain(word);
  });
});
