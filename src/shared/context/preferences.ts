import { useEffect, useSyncExternalStore } from 'react';
const subscribe = (fn: () => void) => { window.addEventListener('storage', fn); window.addEventListener('sivet-preferences', fn); return () => { window.removeEventListener('storage', fn); window.removeEventListener('sivet-preferences', fn); }; };
export function usePreference(key: string, fallback = '') {
  const value = useSyncExternalStore(subscribe, () => localStorage.getItem(key) || fallback);
  const set = (next: string) => { localStorage.setItem(key, next); window.dispatchEvent(new Event('sivet-preferences')); };
  return [value, set] as const;
}
export function useTheme() {
  const [theme, setTheme] = usePreference('sivet-theme', 'light');
  useEffect(() => { document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme; }, [theme]);
  return [theme, setTheme] as const;
}
