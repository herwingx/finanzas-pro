import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

const useTheme = () => {
  // Initialize state directly from localStorage to prevent flicker on load.
  const [theme, setTheme] = useState<Theme>(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    return storedTheme || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // 1. Apply the 'dark' class based on the current theme state
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.toggle('dark', isDark);

    // 2. Save the user's preference to localStorage
    localStorage.setItem('theme', theme);

    // 3. Listen for changes in the system's preferred color scheme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        root.classList.toggle('dark', mediaQuery.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);

  }, [theme]);

  return [theme, setTheme] as const;
};

export default useTheme;