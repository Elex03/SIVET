import axios from "axios";
import { expireSession, getTokens, saveTokens, type Tokens } from "./session";
export const apiUrl = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
export const apiClient = axios.create({
  baseURL: apiUrl || import.meta.env.BASE_URL,
  withCredentials: true,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});
const authClient = axios.create({ baseURL: apiUrl, timeout: 15000 });
let renewal: Promise<void> | undefined;
apiClient.interceptors.request.use((config) => {
  if (apiUrl && getTokens() && !config.url?.startsWith("/auth/login"))
    config.headers.Authorization = `Bearer ${getTokens()!.access_token}`;
  if (config.data instanceof FormData) config.headers.delete("Content-Type");
  return config;
});
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as
      | (typeof error.config & { _renewed?: boolean })
      | undefined;
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
          expireSession();
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
): Promise<T> {
  const response = await apiClient
    .request<{ data: T }>({ url: path, method, data })
    .catch((error) => {
      if (axios.isAxiosError(error))
        throw new Error(
          error.response?.data?.error?.message ||
            error.response?.data?.message ||
            (error.response?.status === 429
              ? "Demasiados intentos. Espera unos minutos antes de volver a intentar."
              : "No se pudo completar la operación con la API."),
          { cause: error },
        );
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
    if (axios.isAxiosError(error))
      throw new Error(
        typeof error.response?.data?.message === "string"
          ? error.response.data.message
          : error.response
            ? `No se pudo completar la operación (${error.response.status}).`
            : "No se pudo conectar. Revisa la conexión e inténtalo de nuevo.",
        { cause: error },
      );
    throw error;
  }
}
