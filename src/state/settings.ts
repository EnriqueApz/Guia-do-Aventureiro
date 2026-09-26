import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemePreference = 'sistema' | 'claro' | 'escuro';

export interface SettingsState {
  theme: ThemePreference;
  largeText: boolean;
  reduceMotion: boolean;
  setTheme: (theme: ThemePreference) => void;
  setLargeText: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
}

export const SETTINGS_KEY = 'guia:ajustes';

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'sistema',
      largeText: false,
      reduceMotion: false,
      setTheme: (theme) => set({ theme }),
      setLargeText: (largeText) => set({ largeText }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    { name: SETTINGS_KEY, version: 1 },
  ),
);

/** Resolve "sistema" para o tema efetivo. */
export function resolveTheme(
  pref: ThemePreference,
  systemPrefersDark: boolean,
): 'claro' | 'escuro' {
  if (pref === 'sistema') return systemPrefersDark ? 'escuro' : 'claro';
  return pref;
}
