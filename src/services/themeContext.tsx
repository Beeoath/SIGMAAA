import React, { createContext, useContext, useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'sigma_theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        return stored;
      }
      // If user OS prefers light, or default to dark as per original design
      return 'dark';
    } catch {
      return 'dark';
    }
  });

  const applyTheme = (newTheme: ThemeMode) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  };

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Reusable Theme Toggle Button with smooth icon transition and label
 */
export const ThemeToggleButton: React.FC<{
  showLabel?: boolean;
  className?: string;
  variant?: 'pill' | 'circle' | 'dock';
}> = ({ showLabel = false, className = '', variant = 'circle' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'dock') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all cursor-pointer relative group ${
          isDark
            ? 'text-[#8E8E93] hover:text-[#FBBF24] hover:bg-white/[0.08]'
            : 'text-slate-600 hover:text-amber-500 hover:bg-slate-200/80 bg-slate-100/90'
        } ${className}`}
        title={isDark ? 'Beralih ke Mode Terang (Light Mode)' : 'Beralih ke Mode Gelap (Dark Mode)'}
        aria-label="Toggle Theme"
      >
        {isDark ? (
          <Sun className="w-5 h-5 text-[#8E8E93] group-hover:text-amber-400 group-hover:rotate-45 transition-all duration-300" />
        ) : (
          <Moon className="w-5 h-5 text-indigo-600 group-hover:-rotate-12 transition-all duration-300" />
        )}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer border select-none ${
          isDark
            ? 'bg-[#1F1F24] border-white/[0.1] text-zinc-300 hover:text-white hover:border-white/[0.2] hover:bg-[#28282E]'
            : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300 shadow-sm hover:shadow'
        } ${className}`}
        title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
      >
        {isDark ? (
          <>
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>Mode Terang</span>
          </>
        ) : (
          <>
            <Moon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Mode Gelap</span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer border ${
        isDark
          ? 'bg-white/[0.06] hover:bg-white/[0.14] border-white/[0.08] text-zinc-300 hover:text-amber-400'
          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:text-indigo-600 shadow-sm'
      } ${className}`}
      title={isDark ? 'Aktifkan Mode Terang (Light Mode)' : 'Aktifkan Mode Gelap (Dark Mode)'}
      aria-label="Toggle Theme"
    >
      {isDark ? (
        <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
      ) : (
        <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
      )}
      {showLabel && (
        <span className="ml-1.5 text-xs font-medium">
          {isDark ? 'Terang' : 'Gelap'}
        </span>
      )}
    </button>
  );
};
