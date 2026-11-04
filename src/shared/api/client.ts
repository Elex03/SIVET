import { startRequest, finishRequest } from './apiActivity';
import { apiErrorMessage } from './apiErrors';
import axios from "axios";
import { expireSession, getTokens, saveTokens, type Tokens } from "./session";
import { pauseApi, recordApiDiagnostic, waitForApi } from './apiControl';
export const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const apiClient = axios.create({
  baseURL: apiUrl || import.meta.env.BASE_URL,
  withCredentials: true,
  timeout: 0, // Esperar la respuesta sin un corte por duración en Axios.
  headers: { "Content-Type": "application/json" },
});
const authClient = axios.create({ baseURL: apiUrl, timeout: 0 });
let renewal: Promise<void> | undefined;
authClient.interceptors.request.use(async config => { await waitForApi(config.signal as AbortSignal | undefined); startRequest(config); return config; });
authClient.interceptors.response.use(response => {
  finishRequest(response.config);
  recordApiDiagnostic(response.config.method, response.config.url, response.status, response.headers['x-request-id']);
  return response;
}, error => {
  finishRequest(error.config);
  recordApiDiagnostic(error.config?.method, error.config?.url, error.response?.status, error.response?.headers?.['x-request-id']);
  if (error.response?.status === 429) pauseApi(error.response.headers?.['retry-after'], error.response.data?.error?.retryAfterSeconds);
  return Promise.reject(error);
});
apiClient.interceptors.request.use(async (config) => {
  await waitForApi(config.signal as AbortSignal | undefined);
  if (apiUrl && getTokens() && !config.url?.startsWith("/auth/login"))
    config.headers.Authorization = `Bearer ${getTokens()!.access_token}`;
  if (config.data instanceof FormData) config.headers.delete("Content-Type");
  startRequest(config);
  return config;
});
apiClient.interceptors.response.use(
  (response) => {
    finishRequest(response.config);
  recordApiDiagnostic(response.config.method, response.config.url, response.status, response.headers['x-request-id']);
    return response;
  },
  async (error) => {
    const config = error.config as
      | (typeof error.config & { _renewed?: boolean; _rateRetries?: number })
      | undefined;
    finishRequest(config);
    recordApiDiagnostic(config?.method, config?.url, error.response?.status, error.response?.headers?.['x-request-id']);
    if (error.response?.status === 429) {
      pauseApi(error.response.headers?.['retry-after'], error.response.data?.error?.retryAfterSeconds);
      if (config && ['get', 'head'].includes(config.method || 'get') && (config._rateRetries || 0) < 2) {
        config._rateRetries = (config._rateRetries || 0) + 1;
        return apiClient.request(config);
      }
      return Promise.reject(error);
    }
    if (
      !apiUrl ||
      error.response?.status !== 401 ||
      !config ||
      config._renewed ||
      config.url?.startsWith("/auth/login") ||
      !getTokens()
    )
      return Promise.reject(error);
    config._renewed = true;
    try {
      renewal ??= authClient
        .post<{ data: Tokens }>("/auth/refresh", {
          refresh_token: getTokens()!.refresh_token,
        })
        .then((response) => saveTokens(response.data.data))
        .catch((reason) => {
          if (axios.isAxiosError(reason) && [401, 403].includes(reason.response?.status || 0)) expireSession();
          throw reason;
        })
        .finally(() => {
          renewal = undefined;
        });
      await renewal;
      return await apiClient.request(config);
    } catch (reason) {
      return Promise.reject(reason);
    }
  },
);
export async function apiData<T>(
  path: string,
  method = "GET",
  data?: unknown,
  options: { signal?: AbortSignal } = {},
): Promise<T> {
  const response = await apiClient
    .request<{ data: T }>({ url: path, method, data, signal: options.signal })
    .catch((error) => {
      if (axios.isCancel(error)) throw error;
      if (axios.isAxiosError(error) && error.response?.status === 404 && path === '/lotes/resolver')
        throw new Error('El backend aún no publica el resolver de lotes. Actualiza su despliegue antes de guardar esta recepción.', { cause: error });
      if (axios.isAxiosError(error)) throw new Error(apiErrorMessage(error), { cause: error });
      throw error;
    });
  if (response.status === 204) return undefined as T;
  if (!response.data || !("data" in response.data))
    throw new Error("La API devolvió una respuesta sin data.");
  return response.data.data;
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  try {
    const response = await apiClient.request<T>({
      url: path,
      method: options.method || "GET",
      data: options.body ? JSON.parse(String(options.body)) : undefined,
      signal: options.signal || undefined,
    });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) throw error;
    if (axios.isAxiosError(error)) throw new Error(apiErrorMessage(error), { cause: error });
    throw error;
  }
}
