import { create } from 'zustand';
import { getStoredTheme, applyTheme } from '@/utils/theme';
import type { Theme } from '@/utils/theme';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const useThemeStore = create<ThemeState>()((set) => ({
  theme: getStoredTheme(),
  toggleTheme: () => set((state) => {
    const next = state.theme === 'light' ? 'dark' : 'light';
    applyTheme(next);
    return { theme: next };
  }),
  setTheme: (theme) => set(() => {
    applyTheme(theme);
    return { theme };
  }),
}));
