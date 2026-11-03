import axios from 'axios';

export interface ApiDiagnostic { time: string; requestId?: string; method: string; path: string; status?: number }
const diagnostics: ApiDiagnostic[] = [];
export const getApiDiagnostics = () => diagnostics.slice();
export function recordApiDiagnostic(method: string | undefined, url: string | undefined, status?: number, requestId?: unknown) {
  diagnostics.push({ time: new Date().toISOString(), method: (method || 'GET').toUpperCase(),
    path: new URL(url || '/', 'https://api.invalid').pathname, status,
    requestId: typeof requestId === 'string' ? requestId : undefined });
  if (diagnostics.length > 100) diagnostics.shift();
}
export function apiCause(reason: unknown): unknown {
  let current = reason;
  for (let i = 0; i < 8 && current instanceof Error && current.cause; i++) current = current.cause;
  return current;
}
export const apiStatus = (reason: unknown) => {
  const cause = apiCause(reason);
  return axios.isAxiosError(cause) ? cause.response?.status : undefined;
};
export const apiCancelled = (reason: unknown) => axios.isCancel(apiCause(reason));
export function retryDelay(header: unknown, fallback: unknown, now = Date.now()): number {
  if (typeof header === 'string' && header.trim()) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
    const date = Date.parse(header);
    if (Number.isFinite(date)) return Math.max(0, date - now);
  }
  const seconds = Number(fallback);
  return fallback != null && Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 1000;
}

let snapshot = { until: 0, waiting: 0 };
let cancellations = new AbortController();
const listeners = new Set<() => void>();
const publish = (patch: Partial<typeof snapshot>) => { snapshot = { ...snapshot, ...patch }; listeners.forEach(fn => fn()); };
export const subscribeApiPause = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
export const getApiPause = () => snapshot;
export function pauseApi(header: unknown, fallback: unknown) {
  publish({ until: Math.max(snapshot.until, Date.now() + retryDelay(header, fallback)) });
}
export function cancelApiWaits() {
  cancellations.abort();
  cancellations = new AbortController();
}
if (typeof window !== 'undefined') window.addEventListener?.('sivet-session', cancelApiWaits);
export async function waitForApi(signal?: AbortSignal) {
  if (signal?.aborted) throw new axios.CanceledError('Espera cancelada.');
  if (snapshot.until <= Date.now()) return;
  const globalSignal = cancellations.signal;
  publish({ waiting: snapshot.waiting + 1 });
  try {
    while (snapshot.until > Date.now()) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => { cleanup(); resolve(); }, Math.min(snapshot.until - Date.now(), 60000));
        const cleanup = () => { clearTimeout(timer); signal?.removeEventListener('abort', abort); globalSignal.removeEventListener('abort', abort); };
        const abort = () => { cleanup(); reject(new axios.CanceledError('Espera cancelada. Los datos del formulario se conservan.')); };
        if (signal?.aborted || globalSignal.aborted) { abort(); return; }
        signal?.addEventListener('abort', abort, { once: true });
        globalSignal.addEventListener('abort', abort, { once: true });
      });
    }
  } finally { publish({ waiting: snapshot.waiting - 1 }); }
}
