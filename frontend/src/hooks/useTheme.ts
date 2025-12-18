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

    // Determine if dark mode should be active
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    // Remove both classes first to prevent conflicts
    root.classList.remove('light', 'dark');

    // Add the appropriate class
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }

    // Update theme-color meta tag and html background for iOS Safari
    const bgColor = isDark ? '#09090B' : '#F9FAFB';
    root.style.backgroundColor = bgColor;

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', bgColor);
    }

    // Save the user's preference to localStorage
    localStorage.setItem('theme', theme);

    // Listen for changes in the system's preferred color scheme
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        const systemIsDark = mediaQuery.matches;
        root.classList.remove('light', 'dark');
        root.classList.add(systemIsDark ? 'dark' : 'light');

        // Update colors for iOS Safari (status bar + overscroll)
        const systemBgColor = systemIsDark ? '#09090B' : '#F9FAFB';
        root.style.backgroundColor = systemBgColor;

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
          meta.setAttribute('content', systemBgColor);
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);

  }, [theme]);

  return [theme, setTheme] as const;
};

export default useTheme;