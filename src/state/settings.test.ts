import { resolveTheme, SETTINGS_KEY, useSettings } from './settings';

describe('ajustes', () => {
  it('resolve o tema "sistema" pela preferência do aparelho', () => {
    expect(resolveTheme('sistema', true)).toBe('escuro');
    expect(resolveTheme('sistema', false)).toBe('claro');
    expect(resolveTheme('claro', true)).toBe('claro');
    expect(resolveTheme('escuro', false)).toBe('escuro');
  });

  it('persiste as escolhas no localStorage', () => {
    useSettings.getState().setTheme('escuro');
    useSettings.getState().setLargeText(true);
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}');
    expect(saved.state).toMatchObject({ theme: 'escuro', largeText: true });
    expect(saved.version).toBe(1);
  });
});
