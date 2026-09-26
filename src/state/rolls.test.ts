import { HISTORY_LIMIT, useRolls } from './rolls';

/** Gerador fixo: devolve os valores em sequência (em [0, 1)). */
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length] ?? 0;
};
const d = (face: number, sides = 20) => (face - 1) / sides + 0.001;

beforeEach(() => useRolls.setState({ mode: 'normal', history: [] }));

describe('rolador', () => {
  it('teste de d20 com vantagem fica com o maior e volta ao normal', () => {
    useRolls.getState().setMode('vantagem');
    const r = useRolls.getState().check('Percepção', 3, seq(d(4), d(17)));
    expect(r).toMatchObject({
      dice: [4, 17],
      kept: 17,
      total: 20,
      mode: 'vantagem',
      expr: 'd20+3',
    });
    expect(useRolls.getState().mode).toBe('normal');
  });

  it('desvantagem fica com o menor; 20 e 1 naturais são marcados', () => {
    useRolls.getState().setMode('desvantagem');
    expect(useRolls.getState().check('Ataque', -1, seq(d(1), d(20)))).toMatchObject({
      kept: 1,
      total: 0,
      natural1: true,
      expr: 'd20−1',
    });
    expect(useRolls.getState().check('Ataque', 0, seq(d(20))).natural20).toBe(true);
  });

  it('expressões e histórico limitado, do mais novo para o mais antigo', () => {
    const r = useRolls.getState().rollExpr('Dano', '2d6+3', seq(d(2, 6), d(5, 6)));
    expect(r).toMatchObject({ dice: [2, 5], total: 10, expr: '2d6+3' });
    expect(() => useRolls.getState().rollExpr('x', 'banana')).toThrow();
    expect(() => useRolls.getState().rollExpr('x', '1000d6')).toThrow(/grande demais/);
    for (let i = 0; i < HISTORY_LIMIT + 5; i++) useRolls.getState().rollExpr(`r${i}`, 'd4');
    const h = useRolls.getState().history;
    expect(h).toHaveLength(HISTORY_LIMIT);
    expect(h[0]?.label).toBe(`r${HISTORY_LIMIT + 4}`);
    useRolls.getState().clear();
    expect(useRolls.getState().history).toEqual([]);
  });
});
