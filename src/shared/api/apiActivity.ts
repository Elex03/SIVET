import { useSyncExternalStore } from 'react';
const requests = new Map<object, { write: boolean; slow: boolean; timer: ReturnType<typeof setTimeout> }>();
const listeners = new Set<() => void>();
let state = { slow: false, saving: false };
function emit() { const pending = [...requests.values()].filter(r => r.slow); state = { slow: pending.length > 0, saving: pending.some(r => r.write) }; listeners.forEach(fn => fn()); }
export function startRequest(config: { method?: string; url?: string }) {
  finishRequest(config);
  const write = !['get','head','options'].includes((config.method || 'get').toLowerCase()) && !config.url?.startsWith('/auth/');
  const entry = { write, slow: false, timer: setTimeout(() => { entry.slow = true; emit(); }, 8000) };
  requests.set(config, entry);
}
export function finishRequest(config?: object) { if (!config) return; const entry = requests.get(config); if (entry) { clearTimeout(entry.timer); requests.delete(config); emit(); } }
const subscribe = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export function useApiActivity() { return useSyncExternalStore(subscribe, () => state); }
