import { useState, useEffect } from 'react';

export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      // 768px es el breakpoint estándar de 'md' en Tailwind
      const isMobileQuery = window.matchMedia('(max-width: 768px)');
      setIsMobile(isMobileQuery.matches);
    };

    // Check inicial
    checkIsMobile();

    // Listener en resize
    window.addEventListener('resize', checkIsMobile);

    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
};
