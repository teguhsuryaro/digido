import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-surface-secondary text-content-secondary hover:text-content-primary hover:bg-surface-border transition-colors flex items-center justify-center shrink-0"
      aria-label="Toggle Theme"
      title="Toggle Tema"
    >
      {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
    </button>
  );
}
