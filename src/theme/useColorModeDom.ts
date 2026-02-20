import {useState, useCallback, useEffect} from 'react';

type ColorMode = 'light' | 'dark';

/**
 * DOM-based color mode hook — bypasses Docusaurus's ColorModeProvider context.
 * Reads/writes the `data-theme` attribute on <html> and syncs with localStorage.
 */
export function useColorModeDom(): {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
} {
  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    if (typeof document !== 'undefined') {
      return (document.documentElement.getAttribute('data-theme') as ColorMode) || 'dark';
    }
    return 'dark';
  });

  // Sync with DOM changes made by other parts of Docusaurus
  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme') as ColorMode;
    if (current && current !== colorMode) {
      setColorModeState(current);
    }

    const observer = new MutationObserver(() => {
      const next = document.documentElement.getAttribute('data-theme') as ColorMode;
      if (next) setColorModeState(next);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setColorMode = useCallback((mode: ColorMode) => {
    document.documentElement.setAttribute('data-theme', mode);
    document.documentElement.setAttribute('data-theme-choice', mode);
    setColorModeState(mode);
    try {
      localStorage.setItem('theme', mode);
    } catch {
      // localStorage might be blocked
    }
  }, []);

  return {colorMode, setColorMode};
}
